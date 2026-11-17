#!/usr/bin/env node
'use strict';
/*
 * Uji cepat tanpa browser & tanpa dependency (npm test):
 * renderer, tautan WhatsApp, format harga, keamanan input, dan build semua klien.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');
const L = require('./lib');
const U = L.renderer();

let n = 0, failed = 0;
function t(name, fn) {
  n++;
  try { fn(); console.log('  ✓ ' + name); } catch (e) { failed++; console.log('  ✗ ' + name + '\n      ' + String(e.message).split('\n')[0]); }
}
const base = () => JSON.parse(JSON.stringify(L.readConfig('kopi-lentera')));
const html = (cfg, o) => U.renderDocument(cfg, Object.assign({ css: '', js: '' }, o));

console.log('\nFormat & tautan');
t('nomor WhatsApp dinormalkan ke format 62…', () => {
  assert.strictEqual(U.waNumber('0812-3456-7890'), '6281234567890');
  assert.strictEqual(U.waNumber('+62 812 3456 7890'), '6281234567890');
  assert.strictEqual(U.waNumber('812 3456 7890'), '6281234567890');
  assert.strictEqual(U.waNumber('6281234567890'), '6281234567890');
});
t('tautan WhatsApp memuat pesan ter-encode & nama usaha', () => {
  const c = base(); c.whatsapp.number = '081234567890'; c.whatsapp.message = 'Halo {bisnis}, mau pesan & tanya?';
  const u = U.waLink(c);
  assert.ok(u.startsWith('https://wa.me/6281234567890?text='));
  assert.strictEqual(decodeURIComponent(u.split('?text=')[1]), 'Halo Kopi Lentera, mau pesan & tanya?');
});
t('harga: angka → Rp 25.000, teks bebas dibiarkan', () => {
  assert.strictEqual(U.formatPrice(25000), 'Rp 25.000');
  assert.strictEqual(U.formatPrice('1250000'), 'Rp 1.250.000');
  assert.strictEqual(U.formatPrice('18.000'), 'Rp 18.000');
  assert.strictEqual(U.formatPrice('Mulai Rp 50rb'), 'Mulai Rp 50rb');
  assert.strictEqual(U.formatPrice(''), '');
});
t('tujuan tombol: whatsapp / tel / email / maps / #bagian / URL', () => {
  const c = base(); c.whatsapp.number = '081234567890'; c.contact.phone = '(0274) 123456'; c.contact.email = 'a@b.id';
  assert.ok(U.resolveHref(c, 'whatsapp').wa);
  assert.ok(decodeURIComponent(U.resolveHref(c, 'whatsapp:Tanya {produk}', { produk: 'Kopi' }).url).endsWith('Tanya Kopi'));
  assert.strictEqual(U.resolveHref(c, 'tel').url, 'tel:+62274123456');
  assert.strictEqual(U.resolveHref(c, 'email').url, 'mailto:a@b.id');
  assert.ok(U.resolveHref(c, 'maps').url.startsWith('https://www.google.com/maps/search/'));
  assert.strictEqual(U.resolveHref(c, '#produk').url, '#produk');
  assert.strictEqual(U.resolveHref(c, 'instagram.com/abc').url, 'https://instagram.com/abc');
});

console.log('\nRenderer');
t('ketiga demo ter-render lengkap dengan <h1>, <title>, JSON-LD', () => {
  for (const c of L.listClients()) {
    const h = html(L.readConfig(c.slug));
    assert.ok(h.startsWith('<!doctype html><html lang="id">'), c.slug);
    assert.strictEqual(h.split('<h1').length - 1, 1, c.slug + ': jumlah h1');
    assert.ok(/<title>[^<]+<\/title>/.test(h) && h.includes('application/ld+json') && h.includes('name="description"'), c.slug);
  }
});
t('bagian yang dimatikan hilang dari halaman DAN menu', () => {
  const c = base(); c.sections.find((s) => s.id === 'gallery').enabled = false;
  const h = html(c);
  assert.ok(!h.includes('id="galeri"') && !h.includes('href="#galeri"'));
  assert.ok(h.includes('id="produk"'));
});
t('urutan bagian mengikuti config.sections', () => {
  const c = base(); c.sections.reverse();
  const h = html(c);
  assert.ok(h.indexOf('id="kontak"') < h.indexOf('id="produk"') && h.indexOf('id="produk"') < h.indexOf('id="beranda"'));
});
t('config minimal (hanya nama + WhatsApp) tetap ter-render tanpa error', () => {
  const h = html({ business: { name: 'Toko Baru' }, whatsapp: { number: '0812000111' }, hero: { title: 'Halo' } });
  assert.ok(h.includes('Toko Baru') && h.includes('<h1'));
});
t('gambar kosong diganti pola otomatis (tidak ada gambar rusak)', () => {
  const c = base(); c.hero.image = ''; c.products.items.forEach((p) => { p.image = ''; });
  const h = html(c);
  assert.ok(h.includes('class="ph') && !/<img[^>]+src=""/.test(h));
});
t('teks berbahaya di-escape; tautan javascript: ditolak', () => {
  const c = base();
  c.hero.title = '<script>alert(1)</script> *aman*'; c.business.name = 'A"><img src=x onerror=alert(1)>';
  c.nav.cta.href = 'javascript:alert(1)'; c.gallery.cta.href = 'data:text/html,<script>1</script>';
  const body = U.renderBody(c);
  assert.ok(!/<script/i.test(body) && !/<img src=x/i.test(body) && !/href="javascript:/i.test(body) && !/href="data:/i.test(body));
  assert.ok(body.includes('<em class="hl">aman</em>'));
});
t('tema: warna teks tombol & aksen otomatis tetap terbaca', () => {
  const light = U.themeVars({ theme: { primary: '#ffe14d', accent: '#111111', background: '#ffffff', text: '#111111' } });
  assert.strictEqual(light['--on-primary'], '#16110d'); // tombol kuning → teks gelap
  assert.notStrictEqual(light['--primary-text'], '#ffe14d'); // kuning di atas putih digelapkan
  const dark = U.themeVars({ theme: { primary: '#d9a441', accent: '#c2452d', background: '#151413', text: '#f3efe8' } });
  assert.strictEqual(dark['--on-primary'], '#16110d');
  assert.ok(U.themeVars({ theme: { primary: 'bukan-warna' } })['--primary'].startsWith('#'));
});
t('font: hanya file yang dipakai tema yang disertakan', () => {
  assert.deepStrictEqual(U.fontFiles({ theme: { fonts: 'modern' } }), ['plus-jakarta-sans.woff2']);
  assert.deepStrictEqual(U.fontFiles({ theme: { fonts: 'sistem' } }), []);
  assert.strictEqual(U.fontFiles({ theme: { fonts: 'hangat' } }).length, 3);
  for (const k of Object.keys(U.FONTS)) assert.ok(fs.existsSync(path.join(L.TEMPLATE, 'fonts', U.FONTS[k].file)), k);
});
t('semua ikon yang dipakai demo tersedia', () => {
  for (const c of L.listClients()) {
    const cfg = L.readConfig(c.slug);
    const used = [].concat(cfg.benefits.items, cfg.hero.badges || []).map((x) => x.icon).filter(Boolean);
    used.forEach((i) => assert.ok(U.ICON_NAMES.includes(i), c.slug + ': ikon "' + i + '" tidak ada'));
  }
});

console.log('\nBuild & klien');
t('slug: hanya huruf kecil, angka, tanda hubung; path traversal ditolak', () => {
  assert.strictEqual(L.slugify('Toko Bunga Mélati #1!'), 'toko-bunga-melati-1');
  assert.throws(() => L.clientDir('../etc'));
  assert.throws(() => L.clientDir('a/b'));
});
t('unggah gambar: nama dirapikan, ekstensi asing ditolak', () => {
  assert.throws(() => L.saveImage('kopi-lentera', 'virus.exe', Buffer.from('x')));
  assert.throws(() => L.saveImage('kopi-lentera', 'a.html', Buffer.from('x')));
});
for (const c of L.listClients()) {
  t('build ' + c.slug + ': index.html + font + gambar + zip', () => {
    const r = L.buildClient(c.slug);
    const h = fs.readFileSync(path.join(r.out, 'index.html'), 'utf8');
    assert.ok(h.includes('<style>') && h.includes('UMKMSite') && !/<link rel="stylesheet"/.test(h), 'CSS/JS harus inline');
    for (const m of h.matchAll(/(?:src|href)="((?:images|fonts)\/[^"]+)"/g)) assert.ok(fs.existsSync(path.join(r.out, m[1])), 'file hilang: ' + m[1]);
    assert.ok(r.files.every((f) => !f.path.includes('..')));
    assert.ok(fs.statSync(r.zip).size > 1000);
    assert.ok(r.htmlGzip < 30 * 1024, 'HTML gzip ' + r.htmlGzip);
  });
}
t('klien baru = salinan klien lama dengan nama baru', () => {
  const slug = 'uji-' + process.pid;
  try {
    const cfg = L.createClient(slug, { from: 'seruni-skin', name: 'Uji Coba' });
    assert.strictEqual(cfg.business.name, 'Uji Coba');
    assert.ok(fs.existsSync(path.join(L.CLIENTS, slug, 'images', 'hero.svg')));
    assert.throws(() => L.createClient(slug, { from: 'seruni-skin' }), /sudah ada/);
  } finally { fs.rmSync(path.join(L.CLIENTS, slug), { recursive: true, force: true }); }
});
t('zip yang dihasilkan valid (dibaca ulang dari central directory)', () => {
  const z = L.makeZip([{ name: 'a.txt', data: 'halo '.repeat(200) }, { name: 'dir/b.bin', data: Buffer.from([1, 2, 3]) }]);
  const eocd = z.length - 22;
  assert.strictEqual(z.readUInt32LE(eocd), 0x06054b50);
  assert.strictEqual(z.readUInt16LE(eocd + 10), 2);
  assert.strictEqual(z.readUInt32LE(z.readUInt32LE(eocd + 16)), 0x02014b50);
  const tmp = path.join(os.tmpdir(), 'umkm-zip-' + process.pid + '.zip');
  fs.writeFileSync(tmp, z);
  try {
    const out = require('child_process').execFileSync('unzip', ['-t', tmp], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    assert.ok(/No errors detected/.test(out));
  } catch (e) { if (e.code !== 'ENOENT') throw e; /* unzip tidak terpasang: lewati verifikasi eksternal */ } finally { fs.rmSync(tmp, { force: true }); }
});

console.log('\n' + (failed ? '✗ ' + failed + ' gagal' : '✓ Semua lulus') + ' — ' + (n - failed) + '/' + n + '\n');
process.exit(failed ? 1 : 0);
