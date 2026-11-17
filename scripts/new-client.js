#!/usr/bin/env node
'use strict';
/*
 * Membuat klien baru dengan menyalin klien yang sudah ada.
 *   npm run new -- "Toko Bunga Melati"                      (menyalin demo kopi-lentera)
 *   npm run new -- "Toko Bunga Melati" --from pangkas-rapi  (menyalin demo lain)
 *   npm run new -- "Toko Bunga Melati" --slug bunga-melati  (nama folder sendiri)
 */
const L = require('./lib');

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf('--' + k); return i >= 0 ? args.splice(i, 2)[1] : undefined; };
const from = opt('from'), slugArg = opt('slug'), name = args.join(' ').trim();

if (!name) {
  console.error('Pemakaian: npm run new -- "Nama Usaha" [--from <klien-sumber>] [--slug <nama-folder>]\n');
  console.error('Klien yang bisa disalin: ' + L.listClients().map((c) => c.slug).join(', '));
  process.exit(1);
}
try {
  const slug = L.slugify(slugArg || name);
  L.createClient(slug, { from, name });
  console.log('\n✓ Klien baru dibuat: clients/' + slug + '/');
  console.log('  1. npm start');
  console.log('  2. Buka http://localhost:' + (process.env.PORT || 4173) + '/editor/?client=' + slug);
  console.log('  3. Ganti teks, warna, foto, nomor WhatsApp — lalu klik "Buat situs".\n');
} catch (e) {
  console.error('✗ ' + e.message);
  process.exit(1);
}
