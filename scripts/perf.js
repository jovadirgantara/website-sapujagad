#!/usr/bin/env node
'use strict';
/*
 * Ukur kecepatan muat hasil build di "HP kelas menengah + 4G lambat" (npm run perf).
 * Butuh Playwright (opsional): npm i -D playwright && npx playwright install chromium
 * Jalankan `npm run build` dulu. Angka ini pengukuran lab di komputer Anda —
 * berguna untuk membandingkan sebelum/sesudah, bukan pengganti data pengunjung asli.
 */
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const L = require('./lib');

let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { console.log('Playwright belum terpasang — lewati. Pasang: npm i -D playwright && npx playwright install chromium'); process.exit(0); }

const PORT = 4198, BASE = 'http://127.0.0.1:' + PORT;
const want = process.argv.slice(2);
const slugs = (want.length ? want : L.listClients().map((c) => c.slug)).filter((s) => fs.existsSync(path.join(L.DIST, s, 'index.html')));
if (!slugs.length) { console.error('Belum ada hasil build. Jalankan: npm run build'); process.exit(1); }

(async () => {
  const server = spawn(process.execPath, [path.join(__dirname, 'dev.js')], { env: Object.assign({}, process.env, { PORT: String(PORT) }), stdio: 'ignore' });
  for (let i = 0; i < 40; i++) { try { await fetch(BASE + '/api/clients'); break; } catch (e) { await new Promise((r) => setTimeout(r, 100)); } }
  const browser = await chromium.launch();
  console.log('\nProfil uji: layar 360×740, CPU diperlambat 4×, jaringan 1,6 Mbps / latensi 150 ms (setara "Slow 4G")\n');
  console.log('klien'.padEnd(16) + 'FCP'.padStart(8) + 'LCP'.padStart(8) + 'CLS'.padStart(8) + 'TBT'.padStart(8) + 'muatan awal'.padStart(22) + 'seluruh halaman'.padStart(18) + '  elemen LCP');
  try {
    for (const slug of slugs) {
      const ctx = await browser.newContext({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
      const page = await ctx.newPage();
      const cdp = await ctx.newCDPSession(page);
      await cdp.send('Network.enable');
      await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8 });
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      let bytes = 0, reqs = 0;
      cdp.on('Network.loadingFinished', (e) => { bytes += e.encodedDataLength; reqs++; });
      await page.addInitScript(() => {
        window.__m = { lcp: 0, cls: 0, tbt: 0, el: '' };
        new PerformanceObserver((l) => { for (const e of l.getEntries()) { window.__m.lcp = e.startTime; window.__m.el = e.element ? (e.element.tagName.toLowerCase() + (e.element.className ? '.' + String(e.element.className).split(' ')[0] : '')) : ''; } }).observe({ type: 'largest-contentful-paint', buffered: true });
        new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__m.cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
        new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__m.tbt += Math.max(0, e.duration - 50); }).observe({ type: 'longtask', buffered: true });
      });
      await page.goto(BASE + '/dist/' + slug + '/', { waitUntil: 'networkidle' });
      await page.waitForTimeout(600);
      const m = await page.evaluate(() => Object.assign({ fcp: (performance.getEntriesByName('first-contentful-paint')[0] || {}).startTime || 0, dom: document.querySelectorAll('*').length }, window.__m));
      const first = { bytes, reqs };
      await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 400) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); } });
      await page.waitForLoadState('networkidle');
      const cls = await page.evaluate(() => window.__m.cls);
      const s = (ms) => (ms / 1000).toFixed(2) + ' s';
      console.log(slug.padEnd(16) + s(m.fcp).padStart(8) + s(m.lcp).padStart(8) + cls.toFixed(3).padStart(8) + (Math.round(m.tbt) + ' ms').padStart(8) +
        (first.reqs + ' file, ' + L.kb(first.bytes)).padStart(22) + (reqs + ' file, ' + L.kb(bytes)).padStart(18) + '  ' + m.el);
      await ctx.close();
    }
  } finally { await browser.close(); server.kill(); }
  console.log('\nPatokan Core Web Vitals "baik": LCP ≤ 2,5 s · CLS ≤ 0,1 · TBT ≤ 200 ms\n');
})();
