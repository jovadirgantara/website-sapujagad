#!/usr/bin/env node
'use strict';
/*
 * Uji otomatis di browser sungguhan (npm run qa).
 * Butuh Playwright (opsional, TIDAK diperlukan untuk memakai template):
 *   npm i -D playwright && npx playwright install chromium
 * Semua pengujian dijalankan pada klien sementara "qa-temp" yang dihapus lagi di akhir.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { spawn } = require('child_process');
const L = require('./lib');

let chromium;
try { ({ chromium } = require('playwright')); } catch (e) {
  console.log('Playwright belum terpasang — uji browser dilewati.\nPasang dengan: npm i -D playwright && npx playwright install chromium');
  process.exit(0);
}

const PORT = 4199, BASE = 'http://127.0.0.1:' + PORT, SLUG = 'qa-temp';
const SOURCE = process.argv[2] || 'kopi-lentera';
const results = [];
let failed = 0;
function ok(name, cond, detail) {
  results.push({ name, pass: !!cond });
  if (!cond) failed++;
  console.log((cond ? '  ✓ ' : '  ✗ ') + name + (detail && !cond ? '  →  ' + detail : ''));
}
const section = (t) => console.log('\n' + t);

// PNG uji (tanpa dependency): gradasi + derau supaya ukurannya besar seperti foto kamera
function makePng(w, h) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  let s = 1234567;
  for (let y = 0; y < h; y++) {
    const o = y * (w * 3 + 1); raw[o] = 0;
    for (let x = 0; x < w; x++) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      const nz = (s >> 16) & 63;
      raw[o + 1 + x * 3] = (x * 255 / w + nz) & 255; raw[o + 2 + x * 3] = (y * 255 / h + nz) & 255; raw[o + 3 + x * 3] = (180 + nz) & 255;
    }
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]), crc = Buffer.alloc(4); crc.writeUInt32BE(L.crc32(td));
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 1 })), chunk('IEND', Buffer.alloc(0))]);
}

function cleanup() {
  fs.rmSync(path.join(L.CLIENTS, SLUG), { recursive: true, force: true });
  fs.rmSync(path.join(L.CLIENTS, 'qa-temp-dua'), { recursive: true, force: true });
  fs.rmSync(path.join(L.DIST, SLUG), { recursive: true, force: true });
  fs.rmSync(path.join(L.DIST, SLUG + '.zip'), { force: true });
}

(async () => {
  cleanup();
  L.createClient(SLUG, { from: SOURCE });
  const server = spawn(process.execPath, [path.join(__dirname, 'dev.js')], { env: Object.assign({}, process.env, { PORT: String(PORT) }), stdio: 'ignore' });
  for (let i = 0; i < 40; i++) { try { await fetch(BASE + '/api/clients'); break; } catch (e) { await new Promise((r) => setTimeout(r, 100)); } }
  const browser = await chromium.launch();
  const watch = (page, bag) => {
    page.on('console', (m) => { if (m.type() === 'error') bag.push(m.text()); });
    page.on('pageerror', (e) => bag.push('pageerror: ' + e.message));
    page.on('requestfailed', (r) => { if (!/google\.com|gstatic/.test(r.url())) bag.push('gagal dimuat: ' + r.url()); });
    page.on('response', (r) => { if (r.status() >= 400) bag.push(r.status() + ' ' + r.url()); });
  };
  const cfg0 = L.readConfig(SLUG);
  const waNum = L.renderer().waNumber(cfg0.whatsapp.number);

  try {
    /* ================= HALAMAN: DESKTOP ================= */
    section('Halaman — desktop 1366 px (' + SOURCE + ')');
    let errs = [];
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 800 } });
    await ctx.route(/google\.com\/maps/, (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<p>peta</p>' }));
    await ctx.addInitScript(() => { window.__opened = []; window.open = (u) => { window.__opened.push(String(u)); return { closed: false }; }; });
    const page = await ctx.newPage(); watch(page, errs);
    await page.goto(BASE + '/preview/' + SLUG + '/', { waitUntil: 'networkidle' });
    const lazy = await page.evaluate(() => [...document.images].filter((i) => i.loading === 'lazy').length);
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += 500) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); }
      // paksa gambar lazy yang belum sempat dimuat, supaya setiap URL gambar benar-benar teruji
      await Promise.all([...document.images].map((i) => i.complete && i.naturalWidth ? null : new Promise((r) => { i.onload = i.onerror = r; i.loading = 'eager'; })));
      scrollTo(0, 0);
    });
    await page.waitForLoadState('networkidle');
    ok('gambar di bawah layar memakai lazy-loading (' + lazy + ')', lazy >= 1);
    ok('tanpa error console / file gagal dimuat', errs.length === 0, errs.join(' | '));
    ok('tidak ada scroll horizontal', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    ok('tepat satu <h1> dan atribut lang terisi', await page.evaluate(() => document.querySelectorAll('h1').length === 1 && !!document.documentElement.lang));
    ok('meta SEO: title, description, og:title, JSON-LD', await page.evaluate(() => !!document.title && !!document.querySelector('meta[name=description]') && !!document.querySelector('meta[property="og:title"]') && !!JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent).name));
    const imgs = await page.evaluate(() => [...document.images].map((i) => ({ src: i.getAttribute('src'), ok: i.complete && i.naturalWidth > 0, alt: i.hasAttribute('alt'), dims: i.hasAttribute('width') && i.hasAttribute('height') })));
    ok('semua gambar termuat (' + imgs.length + ')', imgs.every((i) => i.ok), imgs.filter((i) => !i.ok).map((i) => i.src).join(', '));
    ok('semua gambar punya alt + width/height', imgs.every((i) => i.alt && i.dims));
    ok('semua tombol/tautan punya nama yang terbaca', await page.evaluate(() => [...document.querySelectorAll('a,button')].every((e) => (e.innerText || '').trim() || e.getAttribute('aria-label'))));

    const nav = await page.evaluate(() => [...document.querySelectorAll('.nav-links a[href^="#"]')].map((a) => a.getAttribute('href')));
    ok('setiap tautan navigasi punya bagian tujuan (' + nav.length + ')', nav.length > 0 && await page.evaluate((l) => l.every((h) => document.querySelector(h)), nav));
    let navOk = true;
    for (const href of nav) {
      await page.click('.nav-links a[href="' + href + '"]');
      await page.waitForFunction((h) => Math.abs(document.querySelector(h).getBoundingClientRect().top - 88) < 6, href, { timeout: 4000 }).catch(() => { navOk = false; });
    }
    ok('klik navigasi menggulir tepat ke bagiannya', navOk);
    ok('menu aktif mengikuti posisi scroll', await page.evaluate(() => document.querySelectorAll('.nav-links a.is-active').length === 1));
    const others = await page.evaluate(() => [...document.querySelectorAll('main a[href^="#"], footer a[href^="#"], .announce a[href^="#"]')].map((a) => a.getAttribute('href')).filter((h) => h !== '#top' && !document.querySelector(h)));
    ok('tidak ada tautan #anchor yang putus', others.length === 0, others.join(', '));

    section('WhatsApp & kontak');
    const was = await page.evaluate(() => [...document.querySelectorAll('a[data-wa]')].map((a) => ({ href: a.href, target: a.target, rel: a.rel, text: a.innerText.trim() })));
    ok('semua tombol WhatsApp → wa.me/' + waNum + ' dengan pesan (' + was.length + ')', was.length > 3 && was.every((w) => w.href.startsWith('https://wa.me/' + waNum + '?text=') && w.target === '_blank' && /noopener/.test(w.rel)), JSON.stringify(was.filter((w) => !w.href.startsWith('https://wa.me/' + waNum + '?text='))[0]));
    const firstProduct = cfg0.products.items[0];
    const prodWa = await page.evaluate(() => { const a = document.querySelector('[data-products] a[data-wa]'); return a ? decodeURIComponent(a.href.split('?text=')[1]) : ''; });
    ok('pesan tombol produk memuat nama produk', prodWa.includes(firstProduct.name), prodWa);
    ok('{bisnis} pada pesan diganti nama usaha', was.every((w) => !decodeURIComponent(w.href).includes('{bisnis}')) && decodeURIComponent(was[0].href).includes(cfg0.business.name));
    ok('tombol melayang muncul setelah scroll', await page.evaluate(async () => { scrollTo(0, 1200); await new Promise((r) => setTimeout(r, 300)); return document.querySelector('[data-fab]').classList.contains('is-on'); }));
    ok('tautan tel: dan mailto: valid', await page.evaluate(() => [...document.querySelectorAll('a[href^="tel:"]')].every((a) => /^tel:\+62\d+$/.test(a.getAttribute('href'))) && [...document.querySelectorAll('a[href^="mailto:"]')].every((a) => /^mailto:\S+@\S+$/.test(a.getAttribute('href')))));
    if (await page.$('[data-wa-form]')) {
      await page.fill('[data-wa-form] input[data-f]', 'Budi Uji');
      await page.fill('[data-wa-form] textarea', '2 es kopi susu & 1 croissant');
      await page.click('[data-wa-form] button[type=submit]');
      const sent = decodeURIComponent((await page.evaluate(() => window.__opened[0] || '')));
      ok('form pesan cepat membuka WhatsApp dengan isi form', sent.startsWith('https://wa.me/' + waNum + '?text=') && sent.includes('Nama: Budi Uji') && sent.includes('2 es kopi susu & 1 croissant'), sent);
    }

    section('Komponen interaktif');
    const cats = await page.$$eval('[data-filter]', (b) => b.map((x) => x.getAttribute('data-filter')).filter(Boolean));
    if (cats.length) {
      await page.click('[data-filter="' + cats[0] + '"]');
      ok('filter kategori hanya menampilkan produk kategorinya', await page.evaluate((c) => [...document.querySelectorAll('[data-cat]')].every((el) => (el.getAttribute('data-cat') === c) === !el.hidden) && document.querySelectorAll('[data-cat]:not([hidden])').length > 0, cats[0]));
      await page.click('[data-filter=""]');
      ok('filter "Semua" menampilkan semua produk lagi', await page.evaluate(() => document.querySelectorAll('[data-cat][hidden]').length === 0));
    }
    if (await page.$('details.qa:nth-of-type(2)')) {
      await page.click('details.qa:nth-of-type(2) summary');
      ok('FAQ bisa dibuka-tutup', await page.evaluate(() => document.querySelector('details.qa:nth-of-type(2)').open));
    }
    if (await page.$('[data-lightbox]')) {
      await page.click('[data-lightbox]');
      ok('galeri: lightbox terbuka', await page.evaluate(() => { const d = document.querySelector('dialog.lb'); return !!d && d.open && !!d.querySelector('img').getAttribute('src'); }));
      await page.keyboard.press('ArrowRight'); await page.keyboard.press('Escape');
      ok('galeri: Esc menutup lightbox', await page.evaluate(() => !document.querySelector('dialog.lb').open));
    }
    if (await page.$('[data-map]')) {
      ok('peta TIDAK dimuat sebelum diminta', await page.evaluate(() => !document.querySelector('.map iframe')));
      await page.click('[data-map] button');
      ok('klik "Tampilkan peta" memuat Google Maps', await page.evaluate(() => { const f = document.querySelector('.map iframe'); return !!f && /google\.com\/maps/.test(f.src); }));
    }
    await ctx.close();

    /* ================= HALAMAN: HP ================= */
    section('Halaman — HP 360 px');
    errs = [];
    const mctx = await browser.newContext({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true });
    const m = await mctx.newPage(); watch(m, errs);
    await m.goto(BASE + '/preview/' + SLUG + '/', { waitUntil: 'networkidle' });
    await m.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 500) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 30)); } scrollTo(0, 0); });
    ok('tanpa error console', errs.length === 0, errs.join(' | '));
    ok('tidak ada scroll horizontal di 360 px', await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth), String(await m.evaluate(() => document.documentElement.scrollWidth)));
    const wide = await m.evaluate(() => [...document.querySelectorAll('main *, header *, footer *')].filter((e) => { if (!(e instanceof HTMLElement)) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.right > innerWidth + 1 && !e.closest('.quotes') && getComputedStyle(e).position !== 'fixed'; }).slice(0, 4).map((e) => e.className || e.tagName));
    ok('tidak ada elemen yang keluar dari layar', wide.length === 0, wide.join(', '));
    ok('menu tersembunyi & tombol burger terlihat', await m.evaluate(() => getComputedStyle(document.querySelector('.nav-links')).display === 'none' && getComputedStyle(document.querySelector('.burger')).display !== 'none'));
    await m.click('[data-nav-toggle]');
    ok('burger membuka menu (aria-expanded=true)', await m.evaluate(() => getComputedStyle(document.querySelector('.nav-links')).display !== 'none' && document.querySelector('[data-nav-toggle]').getAttribute('aria-expanded') === 'true'));
    await m.click('.nav-links li:nth-child(2) a');
    await m.waitForTimeout(900);
    ok('memilih menu menutup panel & menggulir ke bagian', await m.evaluate(() => { const h = document.querySelector('.nav-links li:nth-child(2) a').getAttribute('href'); return getComputedStyle(document.querySelector('.nav-links')).display === 'none' && Math.abs(document.querySelector(h).getBoundingClientRect().top - 88) < 40; }));
    const small = await m.evaluate(() => [...document.querySelectorAll('a.btn,button.btn,.pill,.burger')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height < 40; }).length);
    ok('tombol cukup besar untuk jari (≥ 40 px)', small === 0, small + ' tombol terlalu kecil');
    await mctx.close();

    /* ================= EDITOR ================= */
    section('Editor visual');
    errs = [];
    const ectx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
    const e = await ectx.newPage(); watch(e, errs);
    await e.goto(BASE + '/editor/?client=' + SLUG, { waitUntil: 'networkidle' });
    const fr = e.frameLocator('#preview');
    await fr.locator('h1').waitFor({ timeout: 8000 });
    const state = (p) => e.evaluate((pp) => window.UMKM.get(window.__editor.cfg, pp), p);
    ok('editor & pratinjau termuat', (await fr.locator('h1').innerText()).length > 0);

    // 1. edit teks lewat form
    await e.click('[data-grp="hero"] .grp-h');
    await e.fill('[data-path="hero.title"] textarea', 'Judul *baru* dari uji');
    await fr.locator('h1:has-text("Judul baru dari uji")').waitFor({ timeout: 3000 }).then(() => ok('edit teks di form → pratinjau berubah', true)).catch(() => ok('edit teks di form → pratinjau berubah', false));
    ok('*kata* menjadi aksen', (await fr.locator('h1 em.hl').innerText().catch(() => '')) === 'baru');
    ok('status berubah menjadi "belum disimpan"', (await e.innerText('#status')).includes('Belum disimpan') && !(await e.isDisabled('#save')));

    // 2. edit langsung di pratinjau
    const sub = fr.locator('[data-e="hero.subtitle"]');
    await sub.click();
    await e.keyboard.press('ControlOrMeta+a');
    await e.keyboard.type('Diketik langsung di pratinjau.');
    await fr.locator('[data-e="hero.eyebrow"]').click({ position: { x: 5, y: 5 } }).catch(() => {});
    await e.keyboard.press('Escape');
    ok('edit langsung di pratinjau → tersimpan ke state', (await state('hero.subtitle')) === 'Diketik langsung di pratinjau.', String(await state('hero.subtitle')));
    ok('…dan kolom form ikut berubah', (await e.inputValue('[data-path="hero.subtitle"] textarea')) === 'Diketik langsung di pratinjau.');

    // 3. warna & font
    await e.click('[data-grp="theme"] .grp-h');
    await e.fill('[data-path="theme.primary"] input.in', '#0b6e4f');
    await e.waitForTimeout(250);
    ok('ganti warna utama → variabel CSS pratinjau berubah', (await fr.locator('html').evaluate((el) => getComputedStyle(el).getPropertyValue('--primary').trim())) === '#0b6e4f');
    await e.selectOption('[data-path="theme.fonts"] select', 'tegas');
    await e.waitForTimeout(250);
    ok('ganti gaya huruf → font judul berubah', /Bricolage/.test(await fr.locator('h1').evaluate((el) => getComputedStyle(el).fontFamily)));
    await e.click('.pal[title="Samudra"]');
    await e.waitForTimeout(250);
    ok('palet siap pakai mengganti 4 warna sekaligus', (await state('theme.primary')) === '#1b4b8f' && (await state('theme.background')) === '#f5f8fc');

    // 4. sembunyikan & urutkan bagian
    await e.click('[data-grp="sections"] .grp-h');
    const orderBefore = await fr.locator('main section').evaluateAll((s) => s.map((x) => x.id));
    await e.click('[data-sec-row="faq"] button[title="Naikkan"]');
    await e.waitForTimeout(300);
    const orderAfter = await fr.locator('main section').evaluateAll((s) => s.map((x) => x.id));
    ok('ubah urutan bagian → urutan di halaman berubah', orderAfter.indexOf('faq') === orderBefore.indexOf('faq') - 1, orderAfter.join(','));

    const hadSection = await fr.locator('#testimoni').count();
    await e.click('[data-sec-row="testimonials"] input[type=checkbox]');
    await e.waitForTimeout(300);
    ok('sembunyikan Testimoni → hilang dari halaman & menu', hadSection === 1 && (await fr.locator('#testimoni').count()) === 0 && (await fr.locator('.nav-links a[href="#testimoni"]').count()) === 0);
    // 5. produk: tambah, harga, hapus
    await e.click('[data-grp="products"] .grp-h');
    const nProd = (await state('products.items')).length;
    await e.click('[data-path="products.items"] .add');
    await e.fill('[data-path="products.items.' + nProd + '.name"] input', 'Produk Uji QA');
    await e.fill('[data-path="products.items.' + nProd + '.price"] input', '99000');
    await e.waitForTimeout(300);
    const cardText = await fr.locator('[data-products] > li').last().innerText();
    ok('tambah produk + harga 99000 → tampil "Rp 99.000"', cardText.includes('Produk Uji QA') && /Rp\s99\.000/.test(cardText), cardText);
    ok('tombol pesan produk baru memuat namanya', decodeURIComponent(await fr.locator('[data-products] > li').last().locator('a[data-wa]').getAttribute('href')).includes('Produk Uji QA'));

    // 6. WhatsApp
    await e.click('[data-grp="whatsapp"] .grp-h');
    await e.fill('[data-path="whatsapp.number"] input', '0812-3456-7890');
    await e.waitForTimeout(300);
    const hrefs = await fr.locator('a[data-wa]').evaluateAll((a) => a.map((x) => x.getAttribute('href')));
    ok('ganti nomor 0812-3456-7890 → semua tombol ke wa.me/6281234567890', hrefs.length > 3 && hrefs.every((x) => x.startsWith('https://wa.me/6281234567890')));
    await e.fill('[data-path="whatsapp.message"] textarea', 'Halo {bisnis}, pesan uji');
    await e.waitForTimeout(300);
    ok('ganti pesan otomatis → tautan ikut berubah', decodeURIComponent(await fr.locator('.nav a[data-wa]').first().getAttribute('href')).endsWith('pesan uji'));

    // 7. ganti gambar (unggah file besar → dikompres otomatis)
    await e.click('[data-grp="hero"] .grp-h');
    const png = makePng(2600, 1800);
    const oldImg = await state('hero.image');
    await e.setInputFiles('input[data-file="hero.image"]', { name: 'Foto Kamera Besar.png', mimeType: 'image/png', buffer: png });
    await e.waitForFunction((o) => window.UMKM.get(window.__editor.cfg, 'hero.image') !== o, oldImg, { timeout: 15000 });
    const newImg = await state('hero.image');
    const saved = path.join(L.CLIENTS, SLUG, newImg);
    const savedSize = fs.existsSync(saved) ? fs.statSync(saved).size : 0;
    ok('unggah gambar → file tersimpan di clients/' + SLUG + '/' + newImg, /^images\/foto-kamera-besar\.(webp|jpg)$/.test(newImg) && savedSize > 0, newImg);
    ok('gambar dikompres otomatis (' + L.kb(png.length) + ' → ' + L.kb(savedSize) + ')', savedSize > 0 && savedSize < png.length / 3);
    await fr.locator('img.hero-img[src$="' + newImg + '"]').waitFor({ timeout: 5000 }).catch(() => {});
    const heroNat = await fr.locator('img.hero-img').evaluate(async (i) => { if (!i.complete) await new Promise((r) => { i.onload = i.onerror = r; }); return [i.getAttribute('src'), i.naturalWidth]; });
    ok('pratinjau memakai gambar baru (maks. 1600 px)', heroNat[0].endsWith(newImg) && heroNat[1] === 1600, heroNat.join(' '));
    const [chooser] = await Promise.all([e.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null), fr.locator('[data-img="about.image"]').click()]);
    ok('klik gambar di pratinjau membuka pemilih file', !!chooser);
    if (chooser) {
      const before = await state('about.image');
      await chooser.setFiles({ name: 'tentang.png', mimeType: 'image/png', buffer: makePng(900, 900) });
      await e.waitForFunction((o) => window.UMKM.get(window.__editor.cfg, 'about.image') !== o, before, { timeout: 15000 });
      ok('…dan gambar "Tentang" terganti', /^images\/tentang\./.test(await state('about.image')));
    }

    // 8. urungkan
    await e.click('[data-grp="footer"] .grp-h');
    await e.fill('[data-path="footer.text"] textarea', 'TEKS SEMENTARA');
    await e.waitForTimeout(700);
    await e.click('#undo');
    ok('Urungkan mengembalikan perubahan terakhir', (await state('footer.text')) !== 'TEKS SEMENTARA');

    // 9. simpan → file config.json
    await e.click('#save');
    await e.waitForFunction(() => document.querySelector('#status').textContent.includes('Tersimpan'), null, { timeout: 5000 });
    const disk = L.readConfig(SLUG);
    ok('Simpan menulis clients/' + SLUG + '/config.json', disk.hero.title === 'Judul *baru* dari uji' && disk.whatsapp.number === '0812-3456-7890' && disk.hero.image === newImg && disk.products.items.length === nProd + 1 && disk.sections.find((s) => s.id === 'testimonials').enabled === false);
    await e.reload({ waitUntil: 'networkidle' });
    await fr.locator('h1').waitFor();
    ok('setelah dimuat ulang, perubahan tetap ada', (await fr.locator('h1').innerText()).replace(/\s+/g, ' ').includes('Judul baru dari uji') && (await e.innerText('#status')).includes('Tersimpan'));

    // 10. ekspor
    await e.click('.more summary');
    const [dl] = await Promise.all([e.waitForEvent('download', { timeout: 5000 }).catch(() => null), e.click('#export')]);
    let exported = null;
    if (dl) { try { exported = JSON.parse(fs.readFileSync(await dl.path(), 'utf8')); } catch (err) { /* dicatat di bawah */ } }
    ok('ekspor konfigurasi menghasilkan file .json yang valid', !!exported && exported.hero.title === 'Judul *baru* dari uji');

    // 11. pratinjau HP di editor
    await e.click('button[data-device="mobile"]');
    await e.waitForTimeout(500);
    ok('pratinjau HP: lebar 390 px & menu menjadi burger', (await e.locator('#preview').evaluate((f) => f.clientWidth)) === 390 && (await fr.locator('.burger').evaluate((b) => getComputedStyle(b).display)) !== 'none');
    await e.click('button[data-device="desktop"]');

    // 12. buat situs (build) dari editor
    await e.click('#build');
    await e.locator('#dlg[open] .report').waitFor({ timeout: 15000 });
    const out = path.join(L.DIST, SLUG);
    ok('Buat situs → dist/' + SLUG + '/index.html + .zip', fs.existsSync(path.join(out, 'index.html')) && fs.existsSync(path.join(L.DIST, SLUG + '.zip')) && fs.existsSync(path.join(out, newImg)));
    await e.click('#dlg .b-ghost');

    // 13. klien baru lewat dialog
    await e.click('#new');
    await e.fill('#dlg input.in', 'QA Temp Dua');
    await e.click('#dlg button[type=submit]');
    await e.waitForFunction(() => window.__editor.slug === 'qa-temp-dua', null, { timeout: 8000 }).catch(() => {});
    ok('klien baru dibuat dari salinan & langsung terbuka', fs.existsSync(path.join(L.CLIENTS, 'qa-temp-dua', 'config.json')) && (await state('business.name')) === 'QA Temp Dua');
    ok('editor tanpa error console', errs.length === 0, errs.join(' | '));
    await ectx.close();

    /* ================= HASIL BUILD ================= */
    section('Hasil build (file statis dist/' + SLUG + '/)');
    errs = [];
    const bctx = await browser.newContext({ viewport: { width: 390, height: 800 }, isMobile: true });
    const bp = await bctx.newPage(); watch(bp, errs);
    const reqs = [];
    bp.on('response', async (r) => { try { reqs.push({ url: r.url(), bytes: (await r.body()).length }); } catch (err) { /* abaikan */ } });
    await bp.goto(BASE + '/dist/' + SLUG + '/', { waitUntil: 'networkidle' });
    ok('halaman build terbuka tanpa error', errs.length === 0 && (await bp.locator('h1').innerText()).length > 0, errs.join(' | '));
    ok('hanya memuat file sendiri (tanpa CDN / pihak ketiga)', reqs.every((r) => r.url.startsWith(BASE)), reqs.filter((r) => !r.url.startsWith(BASE)).map((r) => r.url).join(', '));
    ok('CSS & JS sudah menyatu di HTML (tanpa permintaan .css/.js)', reqs.every((r) => !/\.(css|js)(\?|$)/.test(r.url)));
    ok('bagian yang disembunyikan tidak ikut di-build', (await bp.locator('#testimoni').count()) === 0);
    ok('perubahan editor terbawa ke build', (await bp.locator('h1').innerText()).replace(/\s+/g, ' ').includes('Judul baru dari uji') && (await bp.locator('a[data-wa]').first().getAttribute('href')).startsWith('https://wa.me/6281234567890'));
    const first = reqs.reduce((n, r) => n + r.bytes, 0);
    console.log('    ↳ muatan awal di HP: ' + reqs.length + ' permintaan, ' + L.kb(first) + ' (gambar di bawah layar dimuat belakangan)');
    await bctx.close();
  } catch (err) {
    failed++;
    console.error('\n  ✗ Pengujian terhenti: ' + (err.stack || err.message));
  } finally {
    await browser.close();
    server.kill();
    cleanup();
  }
  console.log('\n' + (failed ? '✗ ' + failed + ' gagal' : '✓ Semua lulus') + ' — ' + results.filter((r) => r.pass).length + '/' + results.length + ' pemeriksaan\n');
  process.exit(failed ? 1 : 0);
})();
