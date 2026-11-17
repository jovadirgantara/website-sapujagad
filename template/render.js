/*!
 * UMKM Landing — renderer
 * Satu fungsi murni: config (JSON) -> HTML. Dipakai di tiga tempat:
 *   1. scripts/build.js   (Node)  -> menghasilkan dist/<klien>/index.html
 *   2. scripts/dev.js     (Node)  -> pratinjau /preview/<klien>/
 *   3. editor (browser)           -> pratinjau langsung saat mengedit
 * Tidak ada dependency. Jangan menaruh data bisnis di file ini —
 * semua konten berasal dari clients/<klien>/config.json.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.UMKM = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ------------------------------------------------------------------ *
   * Konstanta
   * ------------------------------------------------------------------ */

  // key section -> anchor (id di halaman) + label default untuk editor
  var SECTIONS = {
    hero: { anchor: 'beranda', label: 'Hero (bagian atas)' },
    trust: { anchor: 'sorotan', label: 'Angka & kepercayaan' },
    about: { anchor: 'tentang', label: 'Tentang usaha' },
    products: { anchor: 'produk', label: 'Produk / layanan' },
    benefits: { anchor: 'keunggulan', label: 'Keunggulan' },
    gallery: { anchor: 'galeri', label: 'Galeri' },
    testimonials: { anchor: 'testimoni', label: 'Testimoni' },
    faq: { anchor: 'faq', label: 'FAQ' },
    location: { anchor: 'lokasi', label: 'Lokasi & jam buka' },
    contact: { anchor: 'kontak', label: 'Kontak' }
  };
  var SECTION_ORDER = Object.keys(SECTIONS);

  var FONTS = {
    jakarta: { family: 'Plus Jakarta Sans', file: 'plus-jakarta-sans.woff2', weight: '200 800' },
    fraunces: { family: 'Fraunces', file: 'fraunces.woff2', weight: '100 900', italic: 'fraunces-italic.woff2' },
    bricolage: { family: 'Bricolage Grotesque', file: 'bricolage-grotesque.woff2', weight: '200 800' },
    instrument: { family: 'Instrument Serif', file: 'instrument-serif.woff2', weight: '400', italic: 'instrument-serif-italic.woff2' },
    outfit: { family: 'Outfit', file: 'outfit.woff2', weight: '100 900' }
  };
  var SANS_FALLBACK = 'system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
  var SERIF_FALLBACK = 'Georgia,"Times New Roman",serif';

  var FONT_PAIRS = {
    hangat: { label: 'Hangat — serif klasik + sans', head: 'fraunces', body: 'jakarta', weight: 600, track: '-0.025em', hl: 'italic', serif: true },
    modern: { label: 'Modern — sans bersih', head: 'jakarta', body: 'jakarta', weight: 800, track: '-0.04em', hl: 'mark' },
    tegas: { label: 'Tegas — grotesk berkarakter', head: 'bricolage', body: 'jakarta', weight: 700, track: '-0.035em', hl: 'mark' },
    elegan: { label: 'Elegan — serif tipis', head: 'instrument', body: 'jakarta', weight: 400, track: '-0.015em', hl: 'italic', serif: true, scale: 1.12 },
    ramah: { label: 'Ramah — bulat & santai', head: 'outfit', body: 'outfit', weight: 700, track: '-0.025em', hl: 'mark' },
    sistem: { label: 'Sistem — tanpa unduh font (paling ringan)', head: null, body: null, weight: 800, track: '-0.03em', hl: 'mark' }
  };

  var RADII = {
    bulat: { label: 'Bulat', lg: '28px', md: '18px', sm: '12px', btn: '999px' },
    sedang: { label: 'Sedang', lg: '16px', md: '12px', sm: '8px', btn: '12px' },
    tegas: { label: 'Tegas / kotak', lg: '4px', md: '3px', sm: '2px', btn: '4px' }
  };

  /* ------------------------------------------------------------------ *
   * Ikon (stroke 24x24). Nama ikon dipakai di config: "icon": "truck"
   * ------------------------------------------------------------------ */
  var ICONS = {
    check: '<polyline points="20 6 9 17 4 12"/>',
    'arrow-right': '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
    'arrow-up-right': '<line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>',
    menu: '<line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    'chevron-left': '<polyline points="15 18 9 12 15 6"/>',
    'chevron-right': '<polyline points="9 18 15 12 9 6"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    mail: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/>',
    'map-pin': '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    navigation: '<polygon points="3 11 22 2 13 21 11 13 3 11"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>',
    award: '<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>',
    zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    sparkles: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/><path d="M5 3v4M3 5h4M19 17v4M17 19h4"/>',
    leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
    droplet: '<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>',
    truck: '<rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
    package: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
    'shopping-bag': '<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>',
    tag: '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',
    percent: '<line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
    wallet: '<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
    gift: '<polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    smile: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>',
    'thumbs-up': '<path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>',
    message: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
    home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    coffee: '<path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>',
    utensils: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
    scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/>',
    shirt: '<path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>',
    tool: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
    globe: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    instagram: '<rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>',
    facebook: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
    tiktok: '<path d="M9 12a4 4 0 1 0 4 4V3a5 5 0 0 0 5 5"/>',
    youtube: '<path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>'
  };
  // ikon "isi" (fill, bukan stroke)
  var ICONS_FILLED = {
    whatsapp: '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>',
    'star-fill': '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>'
  };
  ICONS_FILLED.quote = '<path d="M4 17.5c0-4.6 1.7-8.2 5.2-10.9l1.5 1.7C8.9 9.9 7.9 11.5 7.6 13H10v6H4zm10 0c0-4.6 1.7-8.2 5.2-10.9l1.5 1.7c-1.8 1.6-2.8 3.2-3.1 4.7H20v6h-6z"/>';

  function icon(name, cls) {
    var c = 'ic' + (cls ? ' ' + cls : '');
    if (ICONS_FILLED[name]) {
      return '<svg class="' + c + '" viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">' + ICONS_FILLED[name] + '</svg>';
    }
    var d = ICONS[name] || ICONS.sparkles;
    return '<svg class="' + c + '" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
  }

  /* ------------------------------------------------------------------ *
   * Util
   * ------------------------------------------------------------------ */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  // teks dengan *kata aksen* dan baris baru
  function rich(s) {
    return esc(s).replace(/\*([^*\n]+)\*/g, '<em class="hl">$1</em>').replace(/\n/g, '<br>');
  }
  function plain(s) { return String(s == null ? '' : s).replace(/\*/g, ''); }
  function get(o, path) {
    var parts = String(path).split('.');
    for (var i = 0; i < parts.length; i++) { if (o == null) return undefined; o = o[parts[i]]; }
    return o;
  }
  function arr(v) { return Array.isArray(v) ? v : []; }
  function obj(v) { return v && typeof v === 'object' ? v : {}; }

  function safeUrl(u) {
    u = String(u || '').trim();
    if (!u) return '';
    if (/^(https?:|mailto:|tel:|#|\/|\.\/|\.\.\/)/i.test(u)) return u;
    if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return ''; // skema lain (javascript:, data:, ...) ditolak
    if (/^[\w-]+(\.[\w-]+)+/.test(u)) return 'https://' + u; // "instagram.com/abc"
    return u;
  }

  /* --- warna --- */
  function hexToRgb(h) {
    h = String(h || '').trim().replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    if (!/^[0-9a-f]{6}$/i.test(h)) return null;
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function rgbToHex(c) {
    return '#' + c.map(function (v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); }).join('');
  }
  function color(h, fallback) { return hexToRgb(h) ? rgbToHex(hexToRgb(h)) : fallback; }
  function mix(a, b, t) { // t=0 -> a, t=1 -> b
    var x = hexToRgb(a), y = hexToRgb(b);
    return rgbToHex([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t]);
  }
  function lum(h) {
    var c = hexToRgb(h).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function onColor(bg) { return contrast(bg, '#ffffff') >= 3.6 ? '#ffffff' : '#16110d'; }
  // geser warna ke arah `toward` sampai kontras terhadap `bg` cukup
  function readable(c, bg, toward, min) {
    var out = c, i = 0;
    while (contrast(out, bg) < min && i < 12) { out = mix(out, toward, 0.14); i++; }
    return out;
  }

  /* --- format --- */
  function formatPrice(v) {
    if (v == null || v === '') return '';
    var s = String(v).trim();
    if (/^\d[\d.]*$/.test(s)) { // angka polos: 18000 atau 18.000
      return 'Rp\u00a0' + s.replace(/\./g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
    return s; // teks bebas: "Mulai Rp 50rb", "Hubungi kami"
  }
  function waNumber(n) {
    n = String(n || '').replace(/\D/g, '');
    if (n.indexOf('0') === 0) n = '62' + n.slice(1);
    else if (n.indexOf('8') === 0) n = '62' + n;
    return n;
  }
  function fill(t, cfg, vars) {
    vars = vars || {};
    return String(t || '').replace(/\{(\w+)\}/g, function (m, k) {
      if (k === 'bisnis') return obj(cfg.business).name || '';
      return vars[k] != null ? vars[k] : m;
    });
  }
  function waLink(cfg, message, vars) {
    var wa = obj(cfg.whatsapp);
    var text = fill(message == null ? wa.message : message, cfg, vars);
    return 'https://wa.me/' + waNumber(wa.number) + (text ? '?text=' + encodeURIComponent(text) : '');
  }

  /* --- tujuan tombol (CTA) ---
   * "whatsapp"            -> chat WA dengan pesan default
   * "whatsapp:Halo ..."   -> chat WA dengan pesan khusus
   * "tel" / "email" / "maps"
   * "#produk"             -> scroll ke bagian
   * "https://..."         -> tautan biasa
   */
  function resolveHref(cfg, href, vars) {
    var h = String(href == null ? '' : href).trim();
    if (h === '' || h === 'whatsapp') return { url: waLink(cfg, null, vars), ext: true, wa: true };
    if (h.indexOf('whatsapp:') === 0) return { url: waLink(cfg, h.slice(9), vars), ext: true, wa: true };
    var contact = obj(cfg.contact), loc = obj(cfg.location);
    if (h === 'tel') return { url: 'tel:+' + waNumber(contact.phone || obj(cfg.whatsapp).number), tel: true };
    if (h === 'email') return { url: 'mailto:' + (contact.email || '') };
    if (h === 'maps') return { url: mapsUrl(cfg), ext: true };
    var u = safeUrl(h);
    return { url: u || '#', ext: /^https?:/i.test(u) };
  }
  function mapsUrl(cfg) {
    var loc = obj(cfg.location);
    if (loc.mapsUrl) return safeUrl(loc.mapsUrl);
    var q = loc.mapQuery || [obj(cfg.business).name, loc.address].filter(Boolean).join(', ');
    return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);
  }

  /* ------------------------------------------------------------------ *
   * Tema: config.theme -> CSS variables (+ @font-face)
   * ------------------------------------------------------------------ */
  function fontPair(cfg) { return FONT_PAIRS[obj(cfg.theme).fonts] || FONT_PAIRS.modern; }

  function themeVars(cfg) {
    var t = obj(cfg.theme);
    var bg = color(t.background, '#fbf7f0');
    var ink = color(t.text, '#231913');
    var primary = color(t.primary, '#b8451f');
    var accent = color(t.accent, '#e9b44c');
    var dark = lum(bg) < 0.25;
    var pair = fontPair(cfg);
    var rad = RADII[t.radius] || RADII.bulat;
    var deep = dark ? mix(bg, '#000000', 0.45) : mix(primary, '#120d0a', 0.8);
    var headFont = pair.head ? '"' + FONTS[pair.head].family + '",' : '';
    var bodyFont = pair.body ? '"' + FONTS[pair.body].family + '",' : '';
    return {
      '--bg': bg,
      '--surface': dark ? mix(bg, '#ffffff', 0.07) : mix(bg, '#ffffff', 0.72),
      '--tint': dark ? mix(bg, primary, 0.1) : mix(bg, primary, 0.07),
      '--ink': ink,
      '--muted': mix(ink, bg, 0.36),
      '--line': mix(ink, bg, dark ? 0.84 : 0.88),
      '--primary': primary,
      '--primary-hover': mix(primary, dark ? '#ffffff' : '#000000', 0.14),
      '--primary-text': readable(primary, bg, dark ? '#ffffff' : '#000000', 4.2),
      '--on-primary': onColor(primary),
      '--primary-soft': mix(bg, primary, dark ? 0.2 : 0.11),
      '--accent': accent,
      '--on-accent': onColor(accent),
      '--accent-soft': mix(bg, accent, dark ? 0.3 : 0.42),
      '--deep': deep,
      '--on-deep': '#ffffff',
      '--on-deep-muted': mix('#ffffff', deep, 0.32),
      '--deep-line': mix('#ffffff', deep, 0.86),
      // warna sorot di atas latar gelap: pilih yang paling kontras antara aksen & warna utama
      '--deep-accent': readable(contrast(accent, deep) >= contrast(primary, deep) ? accent : primary, deep, '#ffffff', 4.5),
      '--font-head': headFont + (pair.serif ? SERIF_FALLBACK : SANS_FALLBACK),
      '--font-body': bodyFont + SANS_FALLBACK,
      '--head-weight': String(pair.weight),
      '--head-track': pair.track,
      '--head-scale': String(pair.scale || 1),
      '--r-lg': rad.lg, '--r-md': rad.md, '--r-sm': rad.sm, '--r-btn': rad.btn,
      '--shadow': dark ? '0 18px 40px -18px rgba(0,0,0,.7)' : '0 18px 40px -20px ' + mix(ink, primary, 0.3) + '55'
    };
  }
  function usedFonts(cfg) {
    var pair = fontPair(cfg), out = [];
    [pair.head, pair.body].forEach(function (k) { if (k && out.indexOf(k) < 0) out.push(k); });
    return out;
  }
  function fontFiles(cfg) {
    var pair = fontPair(cfg), files = [];
    usedFonts(cfg).forEach(function (k) {
      files.push(FONTS[k].file);
      if (FONTS[k].italic && k === pair.head && pair.hl === 'italic') files.push(FONTS[k].italic);
    });
    return files;
  }
  function themeCss(cfg, fontBase) {
    fontBase = fontBase == null ? 'fonts/' : fontBase;
    var pair = fontPair(cfg), css = '';
    usedFonts(cfg).forEach(function (k) {
      var f = FONTS[k];
      css += '@font-face{font-family:"' + f.family + '";font-style:normal;font-weight:' + f.weight + ';font-display:swap;src:url(' + fontBase + f.file + ') format("woff2")}';
      if (f.italic && k === pair.head && pair.hl === 'italic') {
        css += '@font-face{font-family:"' + f.family + '";font-style:italic;font-weight:' + f.weight + ';font-display:swap;src:url(' + fontBase + f.italic + ') format("woff2")}';
      }
    });
    var v = themeVars(cfg);
    css += ':root{' + Object.keys(v).map(function (k) { return k + ':' + v[k]; }).join(';') + '}';
    return css;
  }

  /* ------------------------------------------------------------------ *
   * Blok pembangun (komponen kecil)
   * ------------------------------------------------------------------ */
  // elemen teks yang bisa diedit langsung di pratinjau (data-e = path di config)
  function T(c, tag, cls, path, opts) {
    var v = get(c.cfg, path);
    if (v == null || v === '') return '';
    opts = opts || {};
    return '<' + tag + (cls ? ' class="' + cls + '"' : '') + (c.edit ? ' data-e="' + path + '"' : '') + (opts.attrs || '') + '>' +
      (opts.plain ? esc(v) : rich(v)) + '</' + tag + '>';
  }
  function rv(c, delay) { return c.edit ? '' : ' data-rv' + (delay ? ' style="--d:' + delay + '"' : ''); }

  function asset(c, src) {
    src = String(src || '').trim();
    if (!src) return '';
    if (/^(https?:|data:image\/|blob:|\/)/i.test(src)) return src;
    if (/^[a-z][a-z0-9+.-]*:/i.test(src)) return '';
    return c.assetBase + src.replace(/^\.\//, '');
  }

  // gambar pengganti otomatis (pola geometris berwarna tema) bila foto belum diisi
  function hash(s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function placeholder(seed, w, h, cls) {
    var r = hash(seed || 'x');
    function rnd() { r = Math.imul(r ^ (r >>> 15), 2246822507) >>> 0; r = Math.imul(r ^ (r >>> 13), 3266489909) >>> 0; r = (r ^ (r >>> 16)) >>> 0; return r / 4294967296; }
    var W = 400, H = Math.round(400 * h / w), cols = ['var(--primary)', 'var(--accent)', 'var(--deep)', 'var(--bg)'];
    var s = '<svg class="ph ' + (cls || '') + '" viewBox="0 0 ' + W + ' ' + H + '" width="' + w + '" height="' + h + '" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Gambar contoh"><rect width="' + W + '" height="' + H + '" fill="var(--primary-soft)"/>';
    var n = 3 + Math.floor(rnd() * 2), u = Math.min(W, H);
    for (var i = 0; i < n; i++) {
      var k = Math.floor(rnd() * 5), col = cols[(i + Math.floor(rnd() * 4)) % 4];
      var x = Math.round(rnd() * W), y = Math.round(rnd() * H), z = Math.round(u * (0.22 + rnd() * 0.3));
      var op = col === 'var(--bg)' ? 0.9 : (0.55 + rnd() * 0.4).toFixed(2);
      if (k === 0) s += '<circle cx="' + x + '" cy="' + y + '" r="' + z + '" fill="' + col + '" opacity="' + op + '"/>';
      else if (k === 1) s += '<path d="M' + (x - z) + ' ' + y + 'a' + z + ' ' + z + ' 0 0 1 ' + (2 * z) + ' 0z" fill="' + col + '" opacity="' + op + '"/>';
      else if (k === 2) s += '<rect x="' + (x - z / 2) + '" y="' + (y - z / 2) + '" width="' + z + '" height="' + z + '" rx="' + Math.round(z * 0.22) + '" fill="' + col + '" opacity="' + op + '"/>';
      else if (k === 3) s += '<circle cx="' + x + '" cy="' + y + '" r="' + Math.round(z * 0.8) + '" fill="none" stroke="' + col + '" stroke-width="' + Math.round(z * 0.22) + '" opacity="' + op + '"/>';
      else s += '<path d="M' + x + ' ' + y + 'h' + z + 'a' + z + ' ' + z + ' 0 0 1 -' + z + ' ' + z + 'z" fill="' + col + '" opacity="' + op + '"/>';
    }
    return s + '</svg>';
  }

  function img(c, src, alt, o) {
    o = o || {};
    var url = asset(c, src), editAttr = c.edit && o.path ? ' data-img="' + o.path + '"' : '';
    if (!url) {
      var ph = placeholder((o.path || '') + (alt || ''), o.w || 800, o.h || 600, o.cls);
      return editAttr ? ph.replace('<svg ', '<svg' + editAttr + ' ') : ph;
    }
    return '<img' + (o.cls ? ' class="' + o.cls + '"' : '') + ' src="' + esc(url) + '" alt="' + esc(alt || '') + '" width="' + (o.w || 800) + '" height="' + (o.h || 600) + '"' +
      (o.eager ? ' fetchpriority="high" decoding="async"' : ' loading="lazy" decoding="async"') + editAttr + '>';
  }

  function btn(c, cta, cls, path, vars) {
    cta = obj(cta);
    if (!cta.label) return '';
    var r = resolveHref(c.cfg, cta.href, vars);
    return '<a class="btn ' + (cls || '') + '" href="' + esc(r.url) + '"' + (r.ext ? ' target="_blank" rel="noopener"' : '') + (r.wa ? ' data-wa' : '') + '>' +
      (r.wa ? icon('whatsapp') : r.tel ? icon('phone') : '') +
      '<span' + (c.edit && path ? ' data-e="' + path + '.label"' : '') + '>' + esc(cta.label) + '</span>' +
      (!r.wa && !r.tel ? icon(r.ext ? 'arrow-up-right' : 'arrow-right', 'ic-go') : '') + '</a>';
  }

  function stars(n) {
    n = Math.max(0, Math.min(5, Math.round(Number(n) || 5)));
    var s = '<span class="stars" role="img" aria-label="' + n + ' dari 5 bintang">';
    for (var i = 0; i < 5; i++) s += icon('star-fill', i < n ? '' : 'off');
    return s + '</span>';
  }

  function secHead(c, key, cls) {
    var h = T(c, 'p', 'eyebrow', key + '.eyebrow', { plain: true }) + T(c, 'h2', 'sec-title', key + '.title') + T(c, 'p', 'sec-sub', key + '.subtitle');
    return h ? '<div class="sec-head ' + (cls || '') + '"' + rv(c) + '>' + h + '</div>' : '';
  }
  function open(c, key, cls) {
    return '<section id="' + SECTIONS[key].anchor + '" class="sec sec-' + key + ' ' + (cls || '') + '" data-sec="' + key + '">';
  }

  /* ------------------------------------------------------------------ *
   * Section
   * ------------------------------------------------------------------ */
  var R = {};

  R.hero = function (c) {
    var h = obj(c.cfg.hero), layout = ({ split: 1, cover: 1, center: 1 })[h.layout] ? h.layout : 'split';
    var shape = h.imageShape === 'kotak' ? 'kotak' : 'lengkung';
    var badges = arr(h.badges).slice(0, 2).map(function (b, i) {
      if (!b || (!b.title && !b.text)) return '';
      return '<div class="hero-badge hero-badge-' + (i + 1) + '"><span class="hero-badge-ic">' + icon(b.icon || 'sparkles') + '</span><span>' +
        T(c, 'strong', '', 'hero.badges.' + i + '.title', { plain: true }) + T(c, 'small', '', 'hero.badges.' + i + '.text', { plain: true }) + '</span></div>';
    }).join('');
    var sticker = h.sticker ? '<div class="hero-sticker" aria-hidden="true"><svg viewBox="0 0 120 120"><defs><path id="st" d="M60 60m-44 0a44 44 0 1 1 88 0a44 44 0 1 1-88 0"/></defs>' +
      '<circle cx="60" cy="60" r="60" fill="var(--accent)"/><text fill="var(--on-accent)" font-size="12.5" font-weight="700" letter-spacing="2.2"><textPath href="#st" textLength="270">' + esc(String(h.sticker).toUpperCase()) + '</textPath></text>' +
      '<g transform="translate(46 46) scale(1.17)" fill="none" stroke="var(--on-accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[h.stickerIcon] || ICONS.sparkles) + '</g></svg></div>' : '';
    var note = h.note ? '<p class="hero-note">' + (h.rating ? stars(h.rating) : '') + T(c, 'span', '', 'hero.note', { plain: true }) + '</p>' : '';
    var text = '<div class="hero-text">' +
      T(c, 'p', 'chip', 'hero.eyebrow', { plain: true }) +
      T(c, 'h1', 'hero-title', 'hero.title') +
      T(c, 'p', 'hero-lead', 'hero.subtitle') +
      '<div class="btn-row">' + btn(c, h.primaryCta, 'btn-lg', 'hero.primaryCta') + btn(c, h.secondaryCta, 'btn-lg btn-ghost', 'hero.secondaryCta') + '</div>' +
      note + '</div>';
    var w = layout === 'split' ? 960 : 1600, hh = layout === 'split' ? 1200 : 1000;
    var visual = '<div class="hero-visual hero-' + shape + '">' +
      '<div class="hero-frame">' + img(c, h.image, h.imageAlt || obj(c.cfg.business).name, { w: w, h: hh, eager: true, cls: 'hero-img', path: 'hero.image' }) + '</div>' +
      (layout === 'cover' ? '' : badges + sticker) + '</div>';
    return open(c, 'hero', 'hero-' + layout) + '<div class="wrap hero-grid">' + text + visual + '</div></section>';
  };

  R.trust = function (c) {
    var t = obj(c.cfg.trust), items = arr(t.items).filter(function (x) { return x && (x.value || x.label); });
    if (!items.length) return '';
    return open(c, 'trust') + '<div class="wrap">' +
      '<dl class="stats" style="--n:' + items.length + '"' + rv(c) + '>' + arr(t.items).map(function (x, i) {
        if (!x || (!x.value && !x.label)) return '';
        return '<div class="stat">' + T(c, 'dt', 'stat-label', 'trust.items.' + i + '.label', { plain: true }) + T(c, 'dd', 'stat-value', 'trust.items.' + i + '.value', { plain: true }) + '</div>';
      }).join('') + '</dl>' + T(c, 'p', 'fineprint center', 'trust.note', { plain: true }) + '</div></section>';
  };

  R.about = function (c) {
    var a = obj(c.cfg.about), name = obj(c.cfg.business).name;
    var points = arr(a.points).map(function (p, i) {
      return p ? '<li>' + icon('check') + T(c, 'span', '', 'about.points.' + i) + '</li>' : '';
    }).join('');
    var sign = a.ownerName ? '<div class="about-sign"><span class="avatar">' + esc(String(a.ownerName).trim().charAt(0).toUpperCase()) + '</span><span>' +
      T(c, 'strong', '', 'about.ownerName', { plain: true }) + T(c, 'small', '', 'about.ownerRole', { plain: true }) + '</span></div>' : '';
    return open(c, 'about') + '<div class="wrap about-grid">' +
      '<div class="about-media"' + rv(c) + '>' +
      '<div class="about-main">' + img(c, a.image, a.imageAlt || 'Tentang ' + name, { w: 1000, h: 1100, path: 'about.image' }) + '</div>' +
      (a.image2 || c.edit ? '<div class="about-side">' + img(c, a.image2, a.image2Alt || name, { w: 520, h: 520, path: 'about.image2' }) + '</div>' : '') +
      (a.badgeValue ? '<div class="about-badge">' + T(c, 'strong', '', 'about.badgeValue', { plain: true }) + T(c, 'span', '', 'about.badgeLabel', { plain: true }) + '</div>' : '') +
      '</div>' +
      '<div class="about-text"' + rv(c, 1) + '>' +
      T(c, 'p', 'eyebrow', 'about.eyebrow', { plain: true }) + T(c, 'h2', 'sec-title', 'about.title') + T(c, 'p', 'prose', 'about.text') +
      (points ? '<ul class="checks">' + points + '</ul>' : '') +
      '<div class="about-foot">' + sign + btn(c, a.cta, 'btn-ghost', 'about.cta') + '</div>' +
      '</div></div></section>';
  };

  R.products = function (c) {
    var p = obj(c.cfg.products), items = arr(p.items), wa = obj(c.cfg.whatsapp);
    var layout = p.layout === 'daftar' ? 'daftar' : 'kartu';
    var cats = [];
    items.forEach(function (it) { if (it && it.category && cats.indexOf(it.category) < 0) cats.push(it.category); });
    var filter = cats.length > 1 && p.showFilter !== false ? '<div class="filter" role="group" aria-label="Filter kategori"><button type="button" class="pill is-on" data-filter="" aria-pressed="true">' + esc(p.allLabel || 'Semua') + '</button>' +
      cats.map(function (k) { return '<button type="button" class="pill" data-filter="' + esc(k) + '" aria-pressed="false">' + esc(k) + '</button>'; }).join('') + '</div>' : '';
    var cards = items.map(function (it, i) {
      if (!it || !it.name) return '';
      var base = 'products.items.' + i;
      var msg = it.message || wa.productMessage || 'Halo {bisnis}, saya tertarik dengan {produk}.';
      var order = p.showButton === false ? '' : btn(c, { label: p.buttonLabel || 'Pesan', href: it.href || ('whatsapp:' + msg) }, 'btn-sm', null, { produk: it.name, harga: formatPrice(it.price) });
      var price = it.price !== '' && it.price != null ? '<p class="price">' + (it.oldPrice ? '<s>' + esc(formatPrice(it.oldPrice)) + '</s>' : '') +
        '<strong' + (c.edit ? ' data-e="' + base + '.price"' : '') + '>' + esc(formatPrice(it.price)) + '</strong>' + (it.unit ? '<small>' + esc(it.unit) + '</small>' : '') + '</p>' : '';
      if (layout === 'daftar') {
        return '<li class="row" data-cat="' + esc(it.category || '') + '"' + rv(c, i % 2) + '><div class="row-main"><h3>' + T(c, 'span', '', base + '.name', { plain: true }) +
          (it.badge ? '<span class="badge">' + esc(it.badge) + '</span>' : '') + '</h3>' + T(c, 'p', '', base + '.description') + '</div><span class="row-dots" aria-hidden="true"></span>' + price + order + '</li>';
      }
      return '<li class="card" data-cat="' + esc(it.category || '') + '"' + rv(c, i % 3) + '>' +
        '<div class="card-media">' + img(c, it.image, it.name, { w: 800, h: 640, path: base + '.image' }) + (it.badge ? '<span class="badge">' + esc(it.badge) + '</span>' : '') + '</div>' +
        '<div class="card-body">' + T(c, 'h3', 'card-title', base + '.name', { plain: true }) + T(c, 'p', 'card-desc', base + '.description') +
        '<div class="card-foot">' + price + order + '</div></div></li>';
    }).join('');
    return open(c, 'products') + '<div class="wrap">' +
      '<div class="sec-top">' + secHead(c, 'products') + filter + '</div>' +
      '<ul class="' + (layout === 'daftar' ? 'rows' : 'cards') + '" data-products>' + cards + '</ul>' +
      (p.note || obj(p.cta).label ? '<div class="sec-more"' + rv(c) + '>' + T(c, 'p', '', 'products.note') + btn(c, p.cta, 'btn-ghost', 'products.cta') + '</div>' : '') +
      '</div></section>';
  };

  R.benefits = function (c) {
    var b = obj(c.cfg.benefits);
    var items = arr(b.items).map(function (it, i) {
      if (!it || !it.title) return '';
      return '<li class="benefit"' + rv(c, i % 3) + '><span class="benefit-ic">' + icon(it.icon || 'sparkles') + '</span>' +
        T(c, 'h3', '', 'benefits.items.' + i + '.title', { plain: true }) + T(c, 'p', '', 'benefits.items.' + i + '.text') + '</li>';
    }).join('');
    return open(c, 'benefits', 'on-deep') + '<div class="wrap">' + secHead(c, 'benefits', 'split') + '<ul class="benefits">' + items + '</ul></div></section>';
  };

  R.gallery = function (c) {
    var g = obj(c.cfg.gallery);
    var items = arr(g.items).map(function (it, i) {
      if (!it) return '';
      var url = asset(c, it.image);
      var inner = img(c, it.image, it.caption || 'Galeri ' + (i + 1), { w: 900, h: 900, path: 'gallery.items.' + i + '.image' }) +
        (it.caption ? '<span class="g-cap">' + esc(it.caption) + '</span>' : '');
      return url && !c.edit
        ? '<li class="g-item"' + rv(c, i % 4) + '><a href="' + esc(url) + '" data-lightbox data-caption="' + esc(it.caption || '') + '">' + inner + '</a></li>'
        : '<li class="g-item"><div>' + inner + '</div></li>';
    }).join('');
    return open(c, 'gallery') + '<div class="wrap">' + secHead(c, 'gallery', 'center') + '<ul class="gallery">' + items + '</ul>' +
      (obj(g.cta).label ? '<div class="sec-more center"' + rv(c) + '>' + btn(c, g.cta, 'btn-ghost', 'gallery.cta') + '</div>' : '') + '</div></section>';
  };

  R.testimonials = function (c) {
    var t = obj(c.cfg.testimonials);
    var items = arr(t.items).map(function (it, i) {
      if (!it || !it.quote) return '';
      var base = 'testimonials.items.' + i;
      return '<li class="quote"' + rv(c, i % 3) + '><figure>' + stars(it.rating == null ? 5 : it.rating) +
        '<blockquote>' + T(c, 'p', '', base + '.quote') + '</blockquote>' +
        '<figcaption><span class="avatar">' + esc(String(it.name || '?').trim().charAt(0).toUpperCase()) + '</span><span>' +
        T(c, 'strong', '', base + '.name', { plain: true }) + T(c, 'small', '', base + '.role', { plain: true }) + '</span></figcaption></figure></li>';
    }).join('');
    var summary = t.ratingValue ? '<div class="rating"' + rv(c) + '><strong>' + esc(t.ratingValue) + '</strong><span>' + stars(5) + T(c, 'small', '', 'testimonials.ratingLabel', { plain: true }) + '</span></div>' : '';
    return open(c, 'testimonials', 'on-tint') + '<div class="wrap"><div class="sec-top">' + secHead(c, 'testimonials') + summary + '</div>' +
      '<ul class="quotes">' + items + '</ul>' + T(c, 'p', 'fineprint', 'testimonials.note', { plain: true }) + '</div></section>';
  };

  R.faq = function (c) {
    var f = obj(c.cfg.faq);
    var items = arr(f.items).map(function (it, i) {
      if (!it || !it.q) return '';
      return '<details class="qa"' + (i === 0 ? ' open' : '') + '><summary>' + T(c, 'span', '', 'faq.items.' + i + '.q', { plain: true }) + '<span class="qa-ic">' + icon('plus') + '</span></summary>' +
        '<div class="qa-body">' + T(c, 'p', '', 'faq.items.' + i + '.a') + '</div></details>';
    }).join('');
    var help = f.helpTitle || obj(f.cta).label ? '<div class="faq-help">' + T(c, 'strong', '', 'faq.helpTitle', { plain: true }) + T(c, 'p', '', 'faq.helpText') + btn(c, f.cta, 'btn-sm', 'faq.cta') + '</div>' : '';
    return open(c, 'faq') + '<div class="wrap faq-grid"><div class="faq-side"' + rv(c) + '>' +
      T(c, 'p', 'eyebrow', 'faq.eyebrow', { plain: true }) + T(c, 'h2', 'sec-title', 'faq.title') + T(c, 'p', 'sec-sub', 'faq.subtitle') + help +
      '</div><div class="faq-list"' + rv(c, 1) + '>' + items + '</div></div></section>';
  };

  R.location = function (c) {
    var l = obj(c.cfg.location), name = obj(c.cfg.business).name;
    var hours = arr(l.hours).map(function (h, i) {
      if (!h || (!h.days && !h.time)) return '';
      return '<div class="hour"><dt' + (c.edit ? ' data-e="location.hours.' + i + '.days"' : '') + '>' + esc(h.days) + '</dt><dd' + (c.edit ? ' data-e="location.hours.' + i + '.time"' : '') + '>' + esc(h.time) + '</dd></div>';
    }).join('');
    var q = l.mapQuery || [name, l.address].filter(Boolean).join(', ');
    var embed = l.mapEmbedUrl && /^https:\/\//i.test(l.mapEmbedUrl) ? l.mapEmbedUrl : 'https://www.google.com/maps?q=' + encodeURIComponent(q) + '&output=embed';
    var map = l.showMap === false ? '' :
      '<div class="map"' + rv(c, 1) + '><div class="map-face" data-map="' + esc(embed) + '" data-title="Peta lokasi ' + esc(name) + '">' +
      '<svg class="map-art" viewBox="0 0 600 420" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="600" height="420" fill="var(--primary-soft)"/>' +
      '<g fill="none" stroke="var(--bg)" stroke-width="16" stroke-linecap="round"><path d="M-20 120h200l90 80h350"/><path d="M180-20v140M270 200v240M430-20v220l60 240"/><path d="M-20 300h290M430 200l190-90"/></g>' +
      '<g fill="var(--accent-soft)"><rect x="40" y="150" width="110" height="120" rx="14"/><rect x="300" y="40" width="100" height="130" rx="14"/><rect x="310" y="240" width="110" height="140" rx="14"/><rect x="500" y="230" width="120" height="90" rx="14"/><rect x="30" y="20" width="120" height="70" rx="14"/></g></svg>' +
      '<span class="map-pin">' + icon('map-pin') + '</span>' +
      '<button type="button" class="btn btn-sm">' + icon('map-pin') + '<span>' + esc(l.mapButtonLabel || 'Tampilkan peta') + '</span></button></div></div>';
    return open(c, 'location') + '<div class="wrap">' + secHead(c, 'location') + '<div class="loc-grid' + (map ? '' : ' no-map') + '">' +
      '<div class="loc-card"' + rv(c) + '>' +
      (l.address ? '<div class="loc-block"><span class="loc-ic">' + icon('map-pin') + '</span><div><h3>' + esc(l.addressLabel || 'Alamat') + '</h3>' + T(c, 'p', '', 'location.address') + T(c, 'p', 'fineprint', 'location.addressNote') + '</div></div>' : '') +
      (hours ? '<div class="loc-block"><span class="loc-ic">' + icon('clock') + '</span><div><h3>' + esc(l.hoursLabel || 'Jam buka') + '</h3><dl class="hours">' + hours + '</dl>' + T(c, 'p', 'fineprint', 'location.hoursNote') + '</div></div>' : '') +
      '<div class="btn-row">' + btn(c, l.cta, '', 'location.cta') + btn(c, l.secondaryCta, 'btn-ghost', 'location.secondaryCta') + '</div>' +
      '</div>' + map + '</div></div></section>';
  };

  var CHANNEL_ICONS = { whatsapp: 'whatsapp', telepon: 'phone', email: 'mail', instagram: 'instagram', tiktok: 'tiktok', facebook: 'facebook', youtube: 'youtube', shopee: 'shopping-bag', tokopedia: 'shopping-bag', marketplace: 'shopping-bag', website: 'globe', lainnya: 'arrow-up-right' };
  var CHANNEL_NAMES = { whatsapp: 'WhatsApp', telepon: 'Telepon', email: 'Email', instagram: 'Instagram', tiktok: 'TikTok', facebook: 'Facebook', youtube: 'YouTube', shopee: 'Shopee', tokopedia: 'Tokopedia', marketplace: 'Marketplace', website: 'Website', lainnya: 'Tautan' };
  function channelLinks(c, withText) {
    return arr(obj(c.cfg.contact).channels).map(function (ch, i) {
      if (!ch || !ch.type) return '';
      var href = ch.url;
      if (!href) href = ch.type === 'whatsapp' ? 'whatsapp' : ch.type === 'telepon' ? 'tel' : ch.type === 'email' ? 'email' : '';
      if (!href) return '';
      var r = resolveHref(c.cfg, href), nm = CHANNEL_NAMES[ch.type] || 'Tautan';
      return '<li><a href="' + esc(r.url) + '"' + (r.ext ? ' target="_blank" rel="noopener"' : '') + (withText ? '' : ' aria-label="' + esc(nm + (ch.label ? ': ' + ch.label : '')) + '"') + '>' +
        '<span class="ch-ic">' + icon(CHANNEL_ICONS[ch.type] || 'arrow-up-right') + '</span>' +
        (withText ? '<span><small>' + esc(nm) + '</small><strong' + (c.edit ? ' data-e="contact.channels.' + i + '.label"' : '') + '>' + esc(ch.label || nm) + '</strong></span>' : '') + '</a></li>';
    }).join('');
  }

  R.contact = function (c) {
    var k = obj(c.cfg.contact), f = obj(k.form), wa = obj(c.cfg.whatsapp);
    var options = arr(f.options).filter(Boolean);
    var form = f.enabled === false ? '' :
      '<form class="wa-form" action="https://wa.me/' + waNumber(wa.number) + '" method="get" target="_blank" data-wa-form data-intro="' + esc(fill(f.intro || 'Halo {bisnis}, saya ingin bertanya.', c.cfg)) + '">' +
      T(c, 'h3', '', 'contact.form.title', { plain: true }) +
      '<label><span>' + esc(f.nameLabel || 'Nama') + '</span><input type="text" data-f="Nama" autocomplete="name" placeholder="' + esc(f.namePlaceholder || 'Nama Anda') + '" required></label>' +
      (options.length ? '<label><span>' + esc(f.optionLabel || 'Keperluan') + '</span><select data-f="' + esc(f.optionLabel || 'Keperluan') + '">' + options.map(function (o) { return '<option>' + esc(o) + '</option>'; }).join('') + '</select></label>' : '') +
      '<label><span>' + esc(f.messageLabel || 'Pesan') + '</span><textarea name="text" rows="3" placeholder="' + esc(f.messagePlaceholder || 'Tulis pesan Anda…') + '" required></textarea></label>' +
      '<button type="submit" class="btn btn-block">' + icon('whatsapp') + '<span>' + esc(f.submitLabel || 'Kirim via WhatsApp') + '</span></button>' +
      T(c, 'p', 'fineprint', 'contact.form.note', { plain: true }) + '</form>';
    var list = channelLinks(c, true);
    return open(c, 'contact') + '<div class="wrap"><div class="cta-panel' + (form ? '' : ' no-form') + '"' + rv(c) + '>' +
      '<div class="cta-text">' + T(c, 'p', 'eyebrow', 'contact.eyebrow', { plain: true }) + T(c, 'h2', 'sec-title', 'contact.title') + T(c, 'p', 'sec-sub', 'contact.subtitle') +
      '<div class="btn-row">' + btn(c, k.cta, 'btn-lg btn-light', 'contact.cta') + '</div>' +
      (list ? '<ul class="channels">' + list + '</ul>' : '') + '</div>' + form + '</div></div></section>';
  };

  /* ------------------------------------------------------------------ *
   * Kerangka: navigasi, footer, tombol melayang
   * ------------------------------------------------------------------ */
  function activeSections(cfg) {
    var list = arr(cfg.sections).filter(function (s) { return s && SECTIONS[s.id]; });
    if (!list.length) list = SECTION_ORDER.map(function (id) { return { id: id, enabled: true }; });
    return list.filter(function (s) { return s.enabled !== false && cfg[s.id]; }).map(function (s) { return s.id; });
  }
  function navItems(cfg) {
    return activeSections(cfg).filter(function (id) { return cfg[id].navLabel; }).map(function (id) { return { id: id, href: '#' + SECTIONS[id].anchor, label: cfg[id].navLabel }; });
  }
  function brand(c, cls) {
    var b = obj(c.cfg.business), logo = asset(c, b.logo);
    return '<a class="brand ' + (cls || '') + '" href="#top" aria-label="' + esc(b.name) + ' — beranda">' +
      (logo ? '<img src="' + esc(logo) + '" alt="" width="40" height="40"' + (c.edit ? ' data-img="business.logo"' : '') + '>' : '<span class="brand-mark" aria-hidden="true">' + esc(String(b.name || 'U').trim().charAt(0).toUpperCase()) + '</span>') +
      (b.hideName && logo ? '' : '<span class="brand-name">' + esc(b.name) + '</span>') + '</a>';
  }

  function renderHeader(c) {
    var cfg = c.cfg, a = obj(cfg.announcement), out = '';
    if (obj(cfg.meta).demoNotice) out += '<div class="demo-bar" role="note"><b>DEMO</b><span' + (c.edit ? ' data-e="meta.demoNotice"' : '') + '>' + esc(cfg.meta.demoNotice) + '</span></div>';
    if (a.enabled !== false && a.text) {
      var r = a.href ? resolveHref(cfg, a.href) : null;
      out += '<div class="announce">' + (r ? '<a href="' + esc(r.url) + '"' + (r.ext ? ' target="_blank" rel="noopener"' : '') + '>' : '<span>') +
        '<span' + (c.edit ? ' data-e="announcement.text"' : '') + '>' + rich(a.text) + '</span>' + (r ? icon('arrow-right') + '</a>' : '</span>') + '</div>';
    }
    var links = navItems(cfg).map(function (n) { return '<li><a href="' + n.href + '">' + esc(n.label) + '</a></li>'; }).join('');
    out += '<header class="nav" data-nav><div class="wrap nav-in">' + brand(c) +
      '<nav class="nav-links" id="menu" aria-label="Navigasi utama"><ul>' + links + '</ul>' + btn(c, obj(cfg.nav).cta, 'btn-sm nav-cta-m') + '</nav>' +
      '<div class="nav-right">' + btn(c, obj(cfg.nav).cta, 'btn-sm nav-cta', 'nav.cta') +
      '<button type="button" class="burger" data-nav-toggle aria-controls="menu" aria-expanded="false" aria-label="Buka menu">' + icon('menu', 'i-open') + icon('x', 'i-close') + '</button></div>' +
      '</div></header>';
    return out;
  }

  function renderFooter(c) {
    var cfg = c.cfg, f = obj(cfg.footer), b = obj(cfg.business), loc = obj(cfg.location);
    var links = navItems(cfg).map(function (n) { return '<li><a href="' + n.href + '">' + esc(n.label) + '</a></li>'; }).join('');
    var extra = arr(f.links).map(function (l) { return l && l.label ? '<li><a href="' + esc(resolveHref(cfg, l.href).url) + '">' + esc(l.label) + '</a></li>' : ''; }).join('');
    var social = channelLinks(c, false);
    var hours = arr(loc.hours).map(function (h) { return h && h.days ? '<li>' + esc(h.days) + ' · ' + esc(h.time) + '</li>' : ''; }).join('');
    return '<footer class="footer on-deep" data-sec="footer"><div class="wrap">' +
      '<div class="footer-grid"><div class="footer-brand">' + brand(c) + T(c, 'p', '', 'footer.text') + (social ? '<ul class="social">' + social + '</ul>' : '') + '</div>' +
      (links ? '<div><h3>' + esc(f.menuLabel || 'Jelajahi') + '</h3><ul class="footer-nav">' + links + extra + '</ul></div>' : '') +
      (loc.address || hours ? '<div><h3>' + esc(f.visitLabel || 'Kunjungi') + '</h3><ul>' + (loc.address ? '<li>' + rich(loc.address) + '</li>' : '') + hours + '</ul></div>' : '') +
      '</div><div class="footer-bottom"><p>© ' + c.year + ' ' + esc(b.legalName || b.name) + '. ' + esc(f.copyright || 'Hak cipta dilindungi.') + '</p>' +
      (f.credit ? '<p>' + (f.creditUrl ? '<a href="' + esc(safeUrl(f.creditUrl)) + '" target="_blank" rel="noopener">' + esc(f.credit) + '</a>' : esc(f.credit)) + '</p>' : '') +
      '</div></div></footer>';
  }

  function renderFloat(c) {
    var wa = obj(c.cfg.whatsapp);
    if (wa.floating === false || !wa.number) return '';
    return '<a class="fab" href="' + esc(waLink(c.cfg)) + '" target="_blank" rel="noopener" data-fab data-wa aria-label="' + esc(wa.floatingLabel || 'Chat WhatsApp') + '">' +
      icon('whatsapp') + '<span>' + esc(wa.floatingLabel || 'Chat WhatsApp') + '</span></a>';
  }

  /* ------------------------------------------------------------------ *
   * API publik
   * ------------------------------------------------------------------ */
  function context(cfg, opts) {
    opts = opts || {};
    return { cfg: cfg || {}, assetBase: opts.assetBase || '', edit: !!opts.edit, year: opts.year || new Date().getFullYear() };
  }

  // -> [{id, html}] : dipakai editor untuk hanya memperbarui bagian yang berubah
  function renderParts(cfg, opts) {
    var c = context(cfg, opts), parts = [{ id: 'header', html: renderHeader(c) }];
    var main = activeSections(c.cfg).map(function (id) {
      var html = '';
      try { html = R[id](c); } catch (e) { html = c.edit ? '<section class="sec"><div class="wrap"><p>Bagian "' + id + '" gagal ditampilkan: ' + esc(e.message) + '</p></div></section>' : ''; }
      return { id: id, html: html };
    });
    return parts.concat(main, [{ id: 'footer', html: renderFooter(c) }, { id: 'float', html: renderFloat(c) }]);
  }

  function renderBody(cfg, opts) {
    var parts = renderParts(cfg, opts), head = parts[0].html, foot = parts[parts.length - 2].html, fl = parts[parts.length - 1].html;
    return '<a class="skip" href="#main">Langsung ke konten</a><div id="top"></div>' + head +
      '<main id="main">' + parts.slice(1, -2).map(function (p) { return p.html; }).join('') + '</main>' + foot + fl;
  }

  function favicon(cfg) {
    var b = obj(cfg.business), v = themeVars(cfg);
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="' + v['--primary'] + '"/><text x="32" y="44" font-family="Georgia,serif" font-size="36" font-weight="700" text-anchor="middle" fill="' + v['--on-primary'] + '">' +
      esc(String(b.name || 'U').trim().charAt(0).toUpperCase()) + '</text></svg>';
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
  }

  function jsonLd(cfg, c) {
    var b = obj(cfg.business), m = obj(cfg.meta), l = obj(cfg.location), k = obj(cfg.contact);
    var d = { '@context': 'https://schema.org', '@type': b.schemaType || 'LocalBusiness', name: b.name };
    if (m.description) d.description = m.description;
    if (m.url) d.url = m.url;
    if (l.address) d.address = plain(l.address).replace(/\n/g, ', ');
    var tel = waNumber(k.phone || obj(cfg.whatsapp).number);
    if (tel) d.telephone = '+' + tel;
    var image = m.ogImage || obj(cfg.hero).image;
    if (image && m.url && !/^data:/.test(image)) d.image = /^https?:/.test(image) ? image : m.url.replace(/\/?$/, '/') + image;
    return JSON.stringify(d).replace(/</g, '\\u003c');
  }

  // dokumen HTML lengkap (hasil build)
  function renderDocument(cfg, opts) {
    opts = opts || {};
    var c = context(cfg, opts), m = obj(cfg.meta), b = obj(cfg.business), v = themeVars(cfg), pair = fontPair(cfg);
    var fontBase = opts.fontBase == null ? 'fonts/' : opts.fontBase;
    var title = m.title || [b.name, b.tagline].filter(Boolean).join(' — ');
    var og = m.ogImage || obj(cfg.hero).image || '';
    var ogUrl = og && !/^data:/.test(og) ? (/^https?:/.test(og) ? og : (m.url ? m.url.replace(/\/?$/, '/') + og : '')) : '';
    var heroImg = asset(c, obj(cfg.hero).image);
    var head = '<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>' + esc(title) + '</title>' +
      (m.description ? '<meta name="description" content="' + esc(m.description) + '">' : '') +
      (m.noindex ? '<meta name="robots" content="noindex">' : '') +
      (m.url ? '<link rel="canonical" href="' + esc(m.url) + '">' : '') +
      '<meta name="theme-color" content="' + v['--bg'] + '">' +
      '<meta property="og:type" content="website"><meta property="og:locale" content="id_ID">' +
      '<meta property="og:title" content="' + esc(title) + '">' +
      (m.description ? '<meta property="og:description" content="' + esc(m.description) + '">' : '') +
      (m.url ? '<meta property="og:url" content="' + esc(m.url) + '">' : '') +
      (ogUrl ? '<meta property="og:image" content="' + esc(ogUrl) + '"><meta name="twitter:card" content="summary_large_image">' : '') +
      '<link rel="icon" href="' + esc(b.favicon ? asset(c, b.favicon) : favicon(cfg)) + '">' +
      fontFiles(cfg).slice(0, 2).map(function (f) { return '<link rel="preload" as="font" type="font/woff2" href="' + fontBase + f + '" crossorigin>'; }).join('') +
      (heroImg && !/^data:/.test(heroImg) ? '<link rel="preload" as="image" href="' + esc(heroImg) + '" fetchpriority="high">' : '') +
      '<style id="theme">' + themeCss(cfg, fontBase) + '</style>' +
      (opts.css ? '<style>' + opts.css + '</style>' : '') +
      arr(opts.cssHref).map(function (h) { return '<link rel="stylesheet" href="' + esc(h) + '">'; }).join('') +
      '<script type="application/ld+json">' + jsonLd(cfg, c) + '</script>' + tracking(m);
    return '<!doctype html><html lang="' + esc(m.lang || 'id') + '"><head>' + head + '</head><body class="' + bodyClass(cfg) + '">' + sprite(renderBody(cfg, opts)) +
      (opts.js ? '<script>' + opts.js + '</script>' : '') +
      arr(opts.jsSrc).map(function (s) { return '<script src="' + esc(s) + '" defer></script>'; }).join('') + '</body></html>';
  }
  // Google Analytics 4 & Meta Pixel (opsional). ID divalidasi ketat agar aman disisipkan.
  function tracking(m) {
    var out = '', ga = String(m.gaId || '').trim(), px = String(m.pixelId || '').trim();
    if (/^G-[A-Z0-9]{4,20}$/.test(ga)) out += '<script async src="https://www.googletagmanager.com/gtag/js?id=' + ga + '"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag("js",new Date());gtag("config","' + ga + '")</script>';
    if (/^\d{8,20}$/.test(px)) out += '<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version="2.0";n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,"script","https://connect.facebook.net/en_US/fbevents.js");fbq("init","' + px + '");fbq("track","PageView")</script>';
    return out;
  }
  function bodyClass(cfg) { return 'hl-' + fontPair(cfg).hl; }
  // Ikon yang dipakai berkali-kali (WhatsApp, bintang) ditulis sekali sebagai <symbol>
  // lalu dirujuk dengan <use> — menghemat ±20 KB HTML pada halaman build.
  function sprite(html) {
    var defs = '';
    ['whatsapp', 'star-fill'].forEach(function (name) {
      var d = ICONS_FILLED[name];
      if (html.split(d).length - 1 < 3) return;
      html = html.split(d).join('<use href="#i-' + name + '"/>');
      defs += '<symbol id="i-' + name + '" viewBox="0 0 24 24">' + d + '</symbol>';
    });
    return defs ? '<svg width="0" height="0" style="position:absolute" aria-hidden="true">' + defs + '</svg>' + html : html;
  }

  return {
    SECTIONS: SECTIONS, SECTION_ORDER: SECTION_ORDER, FONTS: FONTS, FONT_PAIRS: FONT_PAIRS, RADII: RADII,
    ICON_NAMES: Object.keys(ICONS).filter(function (k) { return ['menu', 'x', 'plus', 'chevron-left', 'chevron-right', 'arrow-right', 'arrow-up-right'].indexOf(k) < 0; }),
    CHANNEL_NAMES: CHANNEL_NAMES,
    icon: icon, esc: esc, get: get,
    formatPrice: formatPrice, waNumber: waNumber, waLink: waLink, resolveHref: resolveHref,
    themeVars: themeVars, themeCss: themeCss, fontFiles: fontFiles, bodyClass: bodyClass,
    activeSections: activeSections, renderParts: renderParts, renderBody: renderBody, renderDocument: renderDocument
  };
});
