#!/usr/bin/env node
'use strict';
/*
 * Server lokal: editor visual + pratinjau + API simpan.
 *   npm start            -> http://localhost:4173
 *   PORT=5000 npm start  -> ganti port
 * Hanya untuk komputer sendiri (bind ke 127.0.0.1). Situs klien yang
 * di-hosting adalah file statis di dist/<klien>/ — tanpa server ini.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const L = require('./lib');

const PORT = Number(process.env.PORT) || 4173;
const HOST = process.env.HOST || '127.0.0.1';
const MAX_BODY = 12 * 1024 * 1024;
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.gif': 'image/gif', '.avif': 'image/avif', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml', '.zip': 'application/zip', '.md': 'text/plain; charset=utf-8'
};
const STATIC_DIRS = ['editor', 'template', 'clients', 'dist'];

function send(res, status, body, type, extra) {
  res.writeHead(status, Object.assign({ 'Content-Type': type || 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }, extra));
  res.end(body);
}
function json(res, status, data) { send(res, status, JSON.stringify(data), MIME['.json']); }
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0;
    req.on('data', (c) => { size += c.length; if (size > MAX_BODY) { reject(Object.assign(new Error('File terlalu besar (maksimal 12 MB).'), { status: 413 })); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function api(req, res, url) {
  const parts = url.pathname.split('/').filter(Boolean).slice(1); // buang "api"
  const m = req.method;
  // tolak permintaan tulis dari situs lain (perlindungan CSRF untuk server lokal)
  if (m !== 'GET') {
    const origin = req.headers.origin;
    if (origin && new URL(origin).host !== req.headers.host) return json(res, 403, { error: 'Origin tidak diizinkan.' });
  }
  if (parts[0] !== 'clients') return json(res, 404, { error: 'Tidak ditemukan.' });
  const slug = parts[1], sub = parts[2];

  if (!slug) {
    if (m === 'GET') return json(res, 200, L.listClients());
    if (m === 'POST') {
      const b = JSON.parse((await readBody(req)).toString('utf8') || '{}');
      const s = L.slugify(b.slug || b.name);
      if (!s) return json(res, 400, { error: 'Nama klien wajib diisi.' });
      L.createClient(s, { from: b.from, name: b.name });
      return json(res, 201, { slug: s });
    }
  } else if (!sub) {
    if (m === 'GET') return json(res, 200, L.readConfig(slug));
    if (m === 'PUT') {
      if (!fs.existsSync(L.clientDir(slug))) return json(res, 404, { error: 'Klien tidak ditemukan.' });
      L.writeConfig(slug, JSON.parse((await readBody(req)).toString('utf8')));
      return json(res, 200, { ok: true, savedAt: new Date().toISOString() });
    }
  } else if (sub === 'images' && m === 'POST') {
    L.readConfig(slug);
    const buf = await readBody(req);
    if (!buf.length) return json(res, 400, { error: 'File kosong.' });
    return json(res, 201, { path: L.saveImage(slug, url.searchParams.get('name'), buf), bytes: buf.length });
  } else if (sub === 'build' && m === 'POST') {
    const r = L.buildClient(slug);
    return json(res, 200, { ok: true, url: '/dist/' + slug + '/', zip: '/dist/' + slug + '.zip', files: r.files, bytes: r.bytes, htmlBytes: r.htmlBytes, htmlGzip: r.htmlGzip, critical: r.critical, warnings: r.warnings, folder: path.relative(L.ROOT, r.out) });
  }
  return json(res, 405, { error: 'Metode tidak didukung.' });
}

function preview(res, slug) {
  const U = L.renderer();
  const html = U.renderDocument(L.readConfig(slug), {
    assetBase: '/clients/' + slug + '/', fontBase: '/template/fonts/',
    cssHref: ['/template/styles.css'], jsSrc: ['/template/site.js']
  });
  send(res, 200, html, MIME['.html']);
}

function serveStatic(req, res, pathname) {
  let rel;
  try { rel = decodeURIComponent(pathname).replace(/^\/+/, ''); } catch (e) { return send(res, 400, 'URL tidak valid'); }
  if (!STATIC_DIRS.includes(rel.split('/')[0])) return send(res, 404, 'Tidak ditemukan');
  let file = path.resolve(L.ROOT, rel);
  if (file !== L.ROOT && !file.startsWith(L.ROOT + path.sep)) return send(res, 403, 'Dilarang');
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    if (!pathname.endsWith('/')) return send(res, 302, '', undefined, { Location: pathname + '/' });
    file = path.join(file, 'index.html');
  }
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return send(res, 404, 'Tidak ditemukan');
  const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
  const head = { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
  // teks & SVG dikirim ter-gzip, seperti di hosting sungguhan
  if (/^(text\/|image\/svg|application\/(json|xml))/.test(type) && /\bgzip\b/.test(req.headers['accept-encoding'] || '')) {
    const body = zlib.gzipSync(fs.readFileSync(file));
    res.writeHead(200, Object.assign(head, { 'Content-Encoding': 'gzip', 'Content-Length': body.length, Vary: 'Accept-Encoding' }));
    return res.end(req.method === 'HEAD' ? undefined : body);
  }
  res.writeHead(200, Object.assign(head, { 'Content-Length': fs.statSync(file).size }));
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
    const p = url.pathname;
    if (p === '/') return send(res, 302, '', undefined, { Location: '/editor/' });
    if (p === '/favicon.ico') return send(res, 204, '');
    if (p.startsWith('/api/')) return await api(req, res, url);
    const pm = p.match(/^\/preview\/([^/]+)\/?$/);
    if (pm) return p.endsWith('/') ? preview(res, pm[1]) : send(res, 302, '', undefined, { Location: p + '/' });
    return serveStatic(req, res, p);
  } catch (e) {
    const status = e.status || (e instanceof SyntaxError ? 400 : 500);
    if (status >= 500) console.error(e);
    json(res, status, { error: e.message || 'Terjadi kesalahan.' });
  }
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') console.error('Port ' + PORT + ' sedang dipakai. Jalankan dengan port lain, mis.: PORT=5000 npm start');
  else console.error(e);
  process.exit(1);
});
server.listen(PORT, HOST, () => {
  const base = 'http://localhost:' + PORT;
  console.log('\n  UMKM Landing — editor lokal\n');
  console.log('  Editor     ' + base + '/editor/');
  for (const c of L.listClients()) console.log('  Pratinjau  ' + base + '/preview/' + c.slug + '/   (' + c.name + ')');
  console.log('\n  Tekan Ctrl+C untuk berhenti.\n');
});
