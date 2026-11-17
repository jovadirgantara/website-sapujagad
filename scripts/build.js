#!/usr/bin/env node
'use strict';
/*
 * Build situs statis siap unggah.
 *   npm run build                 -> semua klien
 *   npm run build -- kopi-lentera -> satu klien
 * Hasil: dist/<klien>/ (index.html + fonts/ + images/) dan dist/<klien>.zip
 */
const path = require('path');
const L = require('./lib');

const args = process.argv.slice(2);
const slugs = args.length ? args : L.listClients().map((c) => c.slug);
if (!slugs.length) { console.error('Belum ada klien di folder clients/.'); process.exit(1); }

let failed = false;
for (const slug of slugs) {
  try {
    const r = L.buildClient(slug);
    const img = r.files.filter((f) => f.path.startsWith('images/'));
    console.log('\n✓ ' + slug + '  →  ' + path.relative(process.cwd(), r.out) + '/   (+ ' + path.relative(process.cwd(), r.zip) + ')');
    console.log('  index.html   ' + L.kb(r.htmlBytes).padStart(9) + '   (gzip ' + L.kb(r.htmlGzip) + ', CSS & JS sudah termasuk)');
    console.log('  font         ' + L.kb(r.files.filter((f) => f.path.startsWith('fonts/')).reduce((n, f) => n + f.bytes, 0)).padStart(9) + '   (' + r.files.filter((f) => f.path.startsWith('fonts/')).length + ' file)');
    console.log('  gambar       ' + L.kb(img.reduce((n, f) => n + f.bytes, 0)).padStart(9) + '   (' + img.length + ' file)');
    console.log('  total        ' + L.kb(r.bytes).padStart(9));
    const big = img.slice().sort((a, b) => b.bytes - a.bytes).slice(0, 3).filter((f) => f.bytes > 80 * 1024);
    if (big.length) console.log('  terbesar     ' + big.map((f) => f.path + ' ' + L.kb(f.bytes)).join(', '));
    for (const w of r.warnings) console.log('  ! ' + w);
  } catch (e) {
    failed = true;
    console.error('\n✗ ' + slug + ': ' + e.message);
  }
}
console.log('');
process.exit(failed ? 1 : 0);
