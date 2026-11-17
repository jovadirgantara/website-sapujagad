'use strict';
/* Fungsi bersama untuk dev server, build, dan pembuatan klien baru. Tanpa dependency. */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.resolve(__dirname, '..');
const CLIENTS = path.join(ROOT, 'clients');
const TEMPLATE = path.join(ROOT, 'template');
const DIST = path.join(ROOT, 'dist');
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,60}$/;

function renderer() {
  // dimuat ulang tiap dipanggil supaya perubahan template langsung terlihat saat dev
  const p = path.join(TEMPLATE, 'render.js');
  delete require.cache[require.resolve(p)];
  return require(p);
}

function slugify(s) {
  return String(s || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}
function assertSlug(slug) {
  if (!SLUG_RE.test(slug)) throw Object.assign(new Error('Nama folder klien tidak valid: "' + slug + '" (gunakan huruf kecil, angka, dan tanda hubung).'), { status: 400 });
  return slug;
}
function clientDir(slug) { return path.join(CLIENTS, assertSlug(slug)); }

function listClients() {
  if (!fs.existsSync(CLIENTS)) return [];
  return fs.readdirSync(CLIENTS, { withFileTypes: true })
    .filter((d) => d.isDirectory() && SLUG_RE.test(d.name) && fs.existsSync(path.join(CLIENTS, d.name, 'config.json')))
    .map((d) => {
      let name = d.name, demo = false;
      try { const c = readConfig(d.name); name = (c.business && c.business.name) || d.name; demo = !!(c.meta && c.meta.demoNotice); } catch (e) { /* config rusak tetap ditampilkan */ }
      return { slug: d.name, name, demo };
    })
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

function readConfig(slug) {
  const file = path.join(clientDir(slug), 'config.json');
  if (!fs.existsSync(file)) throw Object.assign(new Error('Klien "' + slug + '" tidak ditemukan.'), { status: 404 });
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (e) { throw Object.assign(new Error('config.json klien "' + slug + '" bukan JSON yang valid: ' + e.message), { status: 500 }); }
}

function writeConfig(slug, cfg) {
  if (!cfg || typeof cfg !== 'object' || Array.isArray(cfg) || !cfg.business) throw Object.assign(new Error('Konfigurasi tidak valid (bagian "business" wajib ada).'), { status: 400 });
  const dir = clientDir(slug);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'config.json');
  // tulis ke file sementara dulu supaya config lama tidak rusak bila proses terhenti
  fs.writeFileSync(file + '.tmp', JSON.stringify(cfg, null, 2) + '\n');
  fs.renameSync(file + '.tmp', file);
}

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, e.name), b = path.join(to, e.name);
    if (e.isDirectory()) copyDir(a, b); else if (e.isFile()) fs.copyFileSync(a, b);
  }
}

function createClient(slug, opts) {
  opts = opts || {};
  const dir = clientDir(slug);
  if (fs.existsSync(dir)) throw Object.assign(new Error('Folder klien "' + slug + '" sudah ada.'), { status: 409 });
  const from = opts.from || 'kopi-lentera';
  const src = clientDir(from);
  if (!fs.existsSync(path.join(src, 'config.json'))) throw Object.assign(new Error('Klien sumber "' + from + '" tidak ditemukan.'), { status: 404 });
  copyDir(src, dir);
  const cfg = readConfig(slug);
  if (opts.name) {
    const old = cfg.business.name;
    cfg.business.name = opts.name;
    cfg.business.legalName = '';
    cfg.meta = cfg.meta || {};
    cfg.meta.title = String(cfg.meta.title || '').split(old).join(opts.name).replace(/\s*\(Demo\)\s*$/i, '');
  }
  writeConfig(slug, cfg);
  return cfg;
}

const IMAGE_EXT = new Set(['.webp', '.jpg', '.jpeg', '.png', '.svg', '.gif', '.avif']);
function saveImage(slug, name, buf) {
  const ext = path.extname(String(name || '')).toLowerCase();
  if (!IMAGE_EXT.has(ext)) throw Object.assign(new Error('Jenis file tidak didukung. Gunakan JPG, PNG, WebP, SVG, GIF, atau AVIF.'), { status: 400 });
  const base = slugify(path.basename(String(name), ext)) || 'gambar';
  const dir = path.join(clientDir(slug), 'images');
  fs.mkdirSync(dir, { recursive: true });
  let file = base + ext, i = 2;
  while (fs.existsSync(path.join(dir, file))) file = base + '-' + i++ + ext;
  fs.writeFileSync(path.join(dir, file), buf);
  return 'images/' + file;
}

/* ---------- build ---------- */
function minifyCss(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s*\n\s*/g, '').replace(/\s{2,}/g, ' ').trim();
}

// semua file lokal yang dirujuk config (gambar, logo, favicon)
function referencedFiles(cfg, dir) {
  const out = new Set();
  (function walk(v) {
    if (typeof v === 'string') {
      if (v && v.length < 300 && !/^([a-z][a-z0-9+.-]*:|#|\/)/i.test(v) && /\.[a-z0-9]{2,5}$/i.test(v)) {
        const abs = path.resolve(dir, v);
        if (abs.startsWith(dir + path.sep) && fs.existsSync(abs) && fs.statSync(abs).isFile()) out.add(path.relative(dir, abs));
      }
    } else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  })(cfg);
  return [...out];
}

function buildClient(slug) {
  const U = renderer();
  const cfg = readConfig(slug);
  const dir = clientDir(slug);
  const out = path.join(DIST, slug);
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });

  const css = minifyCss(fs.readFileSync(path.join(TEMPLATE, 'styles.css'), 'utf8'));
  const js = fs.readFileSync(path.join(TEMPLATE, 'site.js'), 'utf8').replace(/\/\*![\s\S]*?\*\//, '').trim();
  const html = U.renderDocument(cfg, { css, js, assetBase: '', fontBase: 'fonts/' });
  const files = [];
  const put = (rel, data) => {
    const abs = path.join(out, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, data);
    files.push({ path: rel.split(path.sep).join('/'), bytes: Buffer.byteLength(data) });
  };
  put('index.html', html);
  for (const f of U.fontFiles(cfg)) put(path.join('fonts', f), fs.readFileSync(path.join(TEMPLATE, 'fonts', f)));
  for (const rel of referencedFiles(cfg, dir)) put(rel, fs.readFileSync(path.join(dir, rel)));
  const url = cfg.meta && cfg.meta.url ? String(cfg.meta.url).replace(/\/?$/, '/') : '';
  if (url && !cfg.meta.noindex) {
    put('robots.txt', 'User-agent: *\nAllow: /\nSitemap: ' + url + 'sitemap.xml\n');
    put('sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>' + url + '</loc></url></urlset>\n');
  }

  const warnings = [];
  const wa = U.waNumber(cfg.whatsapp && cfg.whatsapp.number);
  if (!/^62[1-9]\d{7,12}$/.test(wa)) warnings.push('Nomor WhatsApp "' + ((cfg.whatsapp && cfg.whatsapp.number) || '') + '" tampaknya bukan nomor Indonesia yang valid.');
  if (cfg.meta && cfg.meta.demoNotice) warnings.push('Bar DEMO masih aktif (meta.demoNotice). Kosongkan sebelum situs dipakai klien.');
  if (!url) warnings.push('meta.url kosong: canonical, og:image, dan sitemap tidak dibuat.');
  if (!(cfg.meta && cfg.meta.description)) warnings.push('meta.description kosong (penting untuk Google & pratinjau tautan).');
  for (const f of files) if (/\.(jpe?g|png|webp|gif|avif)$/i.test(f.path) && f.bytes > 350 * 1024) warnings.push('Gambar besar: ' + f.path + ' (' + kb(f.bytes) + '). Unggah ulang lewat editor agar dikompres otomatis.');

  const zip = path.join(DIST, slug + '.zip');
  fs.writeFileSync(zip, makeZip(files.map((f) => ({ name: f.path, data: fs.readFileSync(path.join(out, f.path)) }))));

  const bytes = files.reduce((n, f) => n + f.bytes, 0);
  const critical = files.filter((f) => f.path === 'index.html' || f.path.startsWith('fonts/')).reduce((n, f) => n + f.bytes, 0);
  return { slug, out, zip, files, bytes, htmlBytes: files[0].bytes, htmlGzip: zlib.gzipSync(html).length, critical, warnings };
}
function kb(n) { return (n / 1024).toFixed(n < 10240 ? 1 : 0) + ' KB'; }

/* ---------- ZIP (deflate) sederhana, tanpa dependency ---------- */
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(buf) { let c = 0xffffffff; for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function makeZip(entries) {
  const local = [], central = [];
  let offset = 0;
  for (const e of entries) {
    const name = Buffer.from(e.name, 'utf8'), raw = Buffer.isBuffer(e.data) ? e.data : Buffer.from(e.data);
    const def = zlib.deflateRawSync(raw, { level: 9 });
    const useDef = def.length < raw.length, data = useDef ? def : raw, crc = crc32(raw);
    const h = Buffer.alloc(30);
    h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(0x0800, 6); h.writeUInt16LE(useDef ? 8 : 0, 8);
    h.writeUInt16LE(0, 10); h.writeUInt16LE(0x21, 12); h.writeUInt32LE(crc, 14); h.writeUInt32LE(data.length, 18); h.writeUInt32LE(raw.length, 22);
    h.writeUInt16LE(name.length, 26); h.writeUInt16LE(0, 28);
    local.push(h, name, data);
    const c = Buffer.alloc(46);
    c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(0x0800, 8); c.writeUInt16LE(useDef ? 8 : 0, 10);
    c.writeUInt16LE(0, 12); c.writeUInt16LE(0x21, 14); c.writeUInt32LE(crc, 16); c.writeUInt32LE(data.length, 20); c.writeUInt32LE(raw.length, 24);
    c.writeUInt16LE(name.length, 28); c.writeUInt32LE(offset, 42);
    central.push(c, name);
    offset += 30 + name.length + data.length;
  }
  const cd = Buffer.concat(central), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, cd, end]);
}

module.exports = { crc32, ROOT, CLIENTS, TEMPLATE, DIST, renderer, slugify, assertSlug, clientDir, listClients, readConfig, writeConfig, createClient, saveImage, buildClient, kb, makeZip };
