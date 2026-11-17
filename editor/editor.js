/*
 * Editor visual UMKM Landing.
 * - Form di panel kiri dibuat otomatis dari editor/schema.js
 * - Pratinjau kanan = template/preview.html (menerima config lewat postMessage)
 * - Simpan = PUT /api/clients/<klien> (ditulis ke clients/<klien>/config.json)
 * Tanpa framework, tanpa dependency.
 */
(function () {
  'use strict';
  var U = window.UMKM, SCHEMA = window.SCHEMA, PALETTES = window.PALETTES;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var S = { slug: null, cfg: null, saved: '', clients: [], open: null, openItems: {}, hist: [], future: [], mark: '', ready: false };

  /* ---------------- util ---------------- */
  function h(tag, attrs) {
    var el = document.createElement(tag), k, i;
    for (k in attrs || {}) {
      var v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k.indexOf('on') === 0) el.addEventListener(k.slice(2), v);
      else if (k === 'value') el.value = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (i = 2; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  }
  function append(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) return c.forEach(function (x) { append(el, x); });
    el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  function getPath(o, path) { return U.get(o, path); }
  function setPath(o, path, value) {
    var p = path.split('.');
    for (var i = 0; i < p.length - 1; i++) {
      if (o[p[i]] == null || typeof o[p[i]] !== 'object') o[p[i]] = /^\d+$/.test(p[i + 1]) ? [] : {};
      o = o[p[i]];
    }
    o[p[p.length - 1]] = value;
  }
  function clone(v) { return JSON.parse(JSON.stringify(v)); }
  function debounce(fn, ms) { var t; return function () { clearTimeout(t); t = setTimeout(fn, ms); }; }
  function kb(n) { return n >= 1048576 ? (n / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB'; }
  function toast(msg, err) {
    var t = h('div', { class: 'toast' + (err ? ' err' : ''), text: msg });
    $('#toasts').appendChild(t);
    setTimeout(function () { t.remove(); }, err ? 6000 : 3200);
  }
  function api(method, url, body, raw) {
    return fetch(url, { method: method, headers: raw || body == null ? {} : { 'Content-Type': 'application/json' }, body: raw ? body : body == null ? undefined : JSON.stringify(body) })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (d) {
          if (!r.ok) throw new Error(d.error || ('Permintaan gagal (' + r.status + ')'));
          return d;
        });
      });
  }
  function assetBase() { return '/clients/' + S.slug + '/'; }
  function assetUrl(src) {
    if (!src) return '';
    return /^(https?:|data:|blob:|\/)/i.test(src) ? src : assetBase() + src;
  }

  /* ---------------- status, riwayat, pratinjau ---------------- */
  function dirty() { return S.cfg && JSON.stringify(S.cfg) !== S.saved; }
  function updateStatus(msg, cls) {
    var st = $('#status'), d = dirty();
    st.className = 'status ' + (cls || (d ? 'dirty' : 'ok'));
    st.textContent = msg || (d ? '● Belum disimpan' : '✓ Tersimpan');
    $('#save').disabled = !d;
    $('#undo').disabled = !S.hist.length;
    $('#redo').disabled = !S.future.length;
  }
  var checkpoint = debounce(function () {
    var now = JSON.stringify(S.cfg);
    if (now === S.mark) return;
    S.hist.push(S.mark); if (S.hist.length > 60) S.hist.shift();
    S.mark = now; S.future = [];
    updateStatus();
  }, 450);
  function flushCheckpoint() {
    var now = JSON.stringify(S.cfg);
    if (now !== S.mark) { S.hist.push(S.mark); S.mark = now; S.future = []; }
  }
  function undo() {
    flushCheckpoint();
    if (!S.hist.length) return;
    S.future.push(S.mark); S.mark = S.hist.pop(); S.cfg = JSON.parse(S.mark);
    refreshAll();
  }
  function redo() {
    if (!S.future.length) return;
    S.hist.push(S.mark); S.mark = S.future.pop(); S.cfg = JSON.parse(S.mark);
    refreshAll();
  }
  function refreshAll() { drawPanel(); sendPreview(true); updateStatus(); }

  var frame = $('#preview');
  function post(m) { if (S.ready && frame.contentWindow) frame.contentWindow.postMessage(Object.assign({ source: 'umkm-editor' }, m), location.origin); }
  function sendPreview(full) {
    if (!S.ready) { // jaga-jaga bila pratinjau selesai dimuat sebelum editor siap menerima pesan "ready"
      try { if (frame.contentWindow.UMKM && frame.contentDocument.readyState === 'complete') S.ready = true; } catch (e) { /* belum siap */ }
    }
    if (S.cfg) post({ type: 'render', cfg: S.cfg, assetBase: assetBase(), full: !!full });
  }
  var schedulePreview = debounce(function () { sendPreview(false); }, 90);

  function change(path, value, opts) {
    setPath(S.cfg, path, value);
    updateStatus();
    checkpoint();
    if (!(opts && opts.silent)) schedulePreview();
  }

  /* ---------------- kolom isian ---------------- */
  function wrap(f, path, body, noLabel) {
    return h('div', { class: 'fld', 'data-path': path },
      noLabel ? null : h('label', { text: f.l }),
      body,
      f.rich ? h('div', { class: 'hint', text: 'Apit kata dengan *bintang* untuk memberi warna aksen.' }) : null,
      f.h ? h('div', { class: 'hint', text: f.h }) : null);
  }
  var F = {};

  F.text = function (f, path) {
    var warn = h('div', { class: 'warn' });
    var inp = h('input', { class: 'in', type: 'text', value: getPath(S.cfg, path) == null ? '' : getPath(S.cfg, path), placeholder: f.ph, oninput: function () { change(path, inp.value); check(); } });
    function check() {
      if (!f.wa) return;
      var n = U.waNumber(inp.value), ok = /^62[1-9]\d{7,12}$/.test(n);
      warn.style.color = ok ? 'var(--green)' : '';
      warn.textContent = !n ? 'Nomor WhatsApp belum diisi — tombol pesan tidak akan berfungsi.'
        : ok ? '✓ Tautan: wa.me/' + n : 'Periksa lagi: "' + n + '" tampaknya bukan nomor Indonesia yang valid.';
    }
    check();
    return wrap(f, path, [inp, f.wa ? warn : null]);
  };
  F.area = function (f, path) {
    var v = getPath(S.cfg, path);
    var ta = h('textarea', { rows: f.rows || 3, placeholder: f.ph, oninput: function () { change(path, ta.value); } });
    ta.value = v == null ? '' : v;
    return wrap(f, path, ta);
  };
  F.select = function (f, path) {
    var opts = f.o, cur = getPath(S.cfg, path);
    if (typeof opts === 'string') opts = Object.keys(U[opts]).map(function (k) { return [k, U[opts][k].label]; });
    var sel = h('select', { onchange: function () { change(path, f.num ? Number(sel.value) : sel.value); } },
      opts.map(function (o) { return h('option', { value: o[0], text: o[1] }); }));
    if (cur != null && cur !== '') sel.value = String(cur); else sel.selectedIndex = 0;
    if (sel.selectedIndex < 0) sel.selectedIndex = 0;
    return wrap(f, path, sel);
  };
  F.toggle = function (f, path) {
    var v = getPath(S.cfg, path), inp;
    inp = h('input', { type: 'checkbox', onchange: function () { change(path, inp.checked); } });
    inp.checked = v == null ? !!f.def : !!v;
    return h('div', { class: 'fld', 'data-path': path }, h('label', { class: 'sw' }, h('span', { text: f.l }), inp), f.h ? h('div', { class: 'hint', text: f.h }) : null);
  };
  F.color = function (f, path) {
    var v = getPath(S.cfg, path) || '#000000', pick, txt;
    function set(val, from) {
      if (!/^#[0-9a-f]{6}$/i.test(val)) return;
      if (from !== pick) pick.value = val;
      if (from !== txt) txt.value = val;
      change(path, val.toLowerCase());
      markPalette();
    }
    pick = h('input', { type: 'color', value: /^#[0-9a-f]{6}$/i.test(v) ? v : '#000000', 'aria-label': f.l, oninput: function () { set(pick.value, pick); } });
    txt = h('input', { class: 'in', type: 'text', value: v, maxlength: 7, spellcheck: 'false', oninput: function () { var x = txt.value.trim(); if (x && x[0] !== '#') x = '#' + x; set(x, txt); } });
    return wrap(f, path, h('div', { class: 'color' }, pick, txt));
  };
  function markPalette() {
    var t = S.cfg.theme || {};
    document.querySelectorAll('.pal').forEach(function (b, i) {
      var p = PALETTES[i];
      b.classList.toggle('on', !!p && ['primary', 'accent', 'background', 'text'].every(function (k) { return String(t[k]).toLowerCase() === p[k]; }));
    });
  }
  F.palette = function (f, path) {
    var box = h('div', { class: 'pals' }, PALETTES.map(function (p) {
      return h('button', { type: 'button', class: 'pal', title: p.name, onclick: function () {
        ['primary', 'accent', 'background', 'text'].forEach(function (k) { setPath(S.cfg, 'theme.' + k, p[k]); });
        change('theme.primary', p.primary);
        drawPanel();
      } }, h('i', {}, [p.background, p.primary, p.accent, p.text].map(function (c) { return h('b', { style: 'background:' + c }); })), p.name);
    }));
    setTimeout(markPalette);
    return wrap(f, path, box);
  };

  /* --- gambar: diperkecil & dikompres di browser sebelum diunggah --- */
  function processImage(file, max) {
    if (/svg|gif/i.test(file.type) || /\.(svg|gif)$/i.test(file.name)) return Promise.resolve({ blob: file, name: file.name });
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file), im = new Image();
      im.onload = function () {
        var k = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight));
        var w = Math.round(im.naturalWidth * k), ht = Math.round(im.naturalHeight * k);
        var c = document.createElement('canvas'); c.width = w; c.height = ht;
        c.getContext('2d').drawImage(im, 0, 0, w, ht);
        URL.revokeObjectURL(url);
        var base = file.name.replace(/\.[^.]+$/, '');
        c.toBlob(function (b) {
          if (b && b.type === 'image/webp') return resolve({ blob: b, name: base + '.webp', w: w, h: ht });
          c.toBlob(function (j) { j ? resolve({ blob: j, name: base + '.jpg', w: w, h: ht }) : reject(new Error('Gambar tidak bisa diproses.')); }, 'image/jpeg', 0.84);
        }, 'image/webp', 0.82);
      };
      im.onerror = function () { URL.revokeObjectURL(url); reject(new Error('File ini bukan gambar yang bisa dibaca browser.')); };
      im.src = url;
    });
  }
  function uploadImage(file, max) {
    return processImage(file, max || 1600).then(function (r) {
      return api('POST', '/api/clients/' + S.slug + '/images?name=' + encodeURIComponent(r.name), r.blob, true).then(function (d) {
        toast('Gambar tersimpan: ' + kb(file.size) + ' → ' + kb(d.bytes) + (r.w ? ' (' + r.w + '×' + r.h + ')' : ''));
        return d.path;
      });
    });
  }
  F.image = function (f, path) {
    var thumb = h('div', { class: 'img-thumb' }), pathEl = h('div', { class: 'img-path' });
    var file = h('input', { type: 'file', accept: 'image/*', hidden: true, 'data-file': path, onchange: function () {
      var fl = file.files[0]; file.value = '';
      if (!fl) return;
      thumb.textContent = 'Mengunggah…';
      uploadImage(fl, f.max).then(function (p) { change(path, p); paint(); }).catch(function (e) { toast(e.message, true); paint(); });
    } });
    function paint() {
      var v = getPath(S.cfg, path);
      thumb.style.backgroundImage = v ? 'url("' + assetUrl(v).replace(/"/g, '%22') + '")' : '';
      thumb.textContent = v ? '' : 'Belum ada gambar';
      pathEl.textContent = v || '';
      rm.hidden = !v;
    }
    var rm = h('button', { type: 'button', class: 'b b-sm b-danger', text: 'Hapus', onclick: function () { change(path, ''); paint(); } });
    var body = h('div', { class: 'img' }, thumb, h('div', {},
      h('div', { class: 'img-act' }, h('button', { type: 'button', class: 'b b-sm b-ghost', text: 'Pilih gambar…', onclick: function () { file.click(); } }), rm), pathEl), file);
    paint();
    return wrap(f, path, body);
  };

  /* --- tujuan tombol --- */
  function destControl(get, set) {
    var cur = String(get() == null ? '' : get()), kind, extra = '';
    if (cur === '' || cur === 'whatsapp') kind = 'whatsapp';
    else if (cur.indexOf('whatsapp:') === 0) { kind = 'whatsapp:'; extra = cur.slice(9); }
    else if (cur === 'tel' || cur === 'email' || cur === 'maps') kind = cur;
    else if (cur[0] === '#') kind = cur;
    else { kind = 'url'; extra = cur; }
    var inp = h('input', { class: 'in', type: 'text', value: extra, oninput: emit });
    var sel = h('select', { 'aria-label': 'Tujuan tombol', onchange: function () { sync(); emit(); } },
      h('option', { value: 'whatsapp', text: 'WhatsApp — pesan otomatis' }),
      h('option', { value: 'whatsapp:', text: 'WhatsApp — pesan khusus' }),
      h('option', { value: 'tel', text: 'Telepon' }),
      h('option', { value: 'email', text: 'Email' }),
      h('option', { value: 'maps', text: 'Google Maps (petunjuk arah)' }),
      h('optgroup', { label: 'Gulir ke bagian' }, U.SECTION_ORDER.map(function (id) { return h('option', { value: '#' + U.SECTIONS[id].anchor, text: U.SECTIONS[id].label }); })),
      h('option', { value: 'url', text: 'Tautan lain (URL)' }));
    sel.value = kind;
    if (sel.selectedIndex < 0) { sel.value = 'url'; inp.value = cur; }
    function sync() {
      var k = sel.value;
      inp.hidden = !(k === 'whatsapp:' || k === 'url');
      inp.placeholder = k === 'url' ? 'https://…' : 'Halo {bisnis}, saya mau tanya…';
    }
    function emit() { var k = sel.value; set(k === 'url' ? inp.value.trim() : k === 'whatsapp:' ? 'whatsapp:' + inp.value : k); }
    sync();
    return [sel, inp];
  }
  F.dest = function (f, path) {
    return wrap(f, path, destControl(function () { return getPath(S.cfg, path); }, function (v) { change(path, v); }));
  };
  F.cta = function (f, path) {
    var label = h('input', { class: 'in', type: 'text', value: getPath(S.cfg, path + '.label') || '', placeholder: 'Teks tombol (kosong = tombol disembunyikan)', 'aria-label': f.l + ' — teks', oninput: function () { change(path + '.label', label.value); } });
    return h('div', { class: 'fld', 'data-path': path + '.label' }, h('div', { class: 'lbl', text: f.l }),
      h('div', { class: 'cta-box' }, label, destControl(function () { return getPath(S.cfg, path + '.href'); }, function (v) { change(path + '.href', v); })));
  };
  F.icon = function (f, path) {
    var cur = getPath(S.cfg, path) || 'sparkles';
    var box = h('div', { class: 'icons' }, U.ICON_NAMES.map(function (n) {
      return h('button', { type: 'button', title: n, 'aria-label': 'Ikon ' + n, class: n === cur ? 'on' : '', html: U.icon(n), onclick: function (e) {
        box.querySelectorAll('.on').forEach(function (b) { b.classList.remove('on'); });
        e.currentTarget.classList.add('on');
        change(path, n);
      } });
    }));
    return wrap(f, path, box);
  };

  /* --- daftar item (produk, FAQ, testimoni, …) --- */
  F.list = function (f, path) {
    var box = h('div', { class: 'list' });
    function arr() { var a = getPath(S.cfg, path); if (!Array.isArray(a)) { a = []; setPath(S.cfg, path, a); } return a; }
    function commit() { change(path, arr()); draw(); }
    function draw() {
      box.innerHTML = '';
      var a = arr();
      a.forEach(function (item, i) {
        var isOpen = S.openItems[path] === i;
        var title = h('button', { type: 'button', class: 'item-t', 'aria-expanded': String(isOpen), text: label(item, i), onclick: function () { S.openItems[path] = isOpen ? -1 : i; draw(); } });
        function label(it, idx) { var t = it && f.title ? String(it[f.title] || '').replace(/\*/g, '') : ''; return t || (f.item || 'Item') + ' ' + (idx + 1); }
        var body = null;
        if (isOpen) {
          body = h('div', { class: 'item-b' }, f.fields.map(function (sf) { return field(sf, path + '.' + i + '.' + sf.k); }));
          body.addEventListener('input', function () { title.textContent = label(arr()[i], i); });
        }
        box.appendChild(h('div', { class: 'item' + (isOpen ? ' open' : '') },
          h('div', { class: 'item-h' }, title,
            h('button', { type: 'button', class: 'mini', title: 'Naikkan', 'aria-label': 'Naikkan', text: '↑', disabled: i === 0, onclick: function () { a.splice(i - 1, 0, a.splice(i, 1)[0]); S.openItems[path] = -1; commit(); } }),
            h('button', { type: 'button', class: 'mini', title: 'Turunkan', 'aria-label': 'Turunkan', text: '↓', disabled: i === a.length - 1, onclick: function () { a.splice(i + 1, 0, a.splice(i, 1)[0]); S.openItems[path] = -1; commit(); } }),
            h('button', { type: 'button', class: 'mini', title: 'Gandakan', 'aria-label': 'Gandakan', text: '⧉', disabled: !!f.max && a.length >= f.max, onclick: function () { a.splice(i + 1, 0, clone(item)); S.openItems[path] = i + 1; commit(); } }),
            h('button', { type: 'button', class: 'mini del', title: 'Hapus', 'aria-label': 'Hapus', text: '✕', onclick: function () { a.splice(i, 1); S.openItems[path] = -1; commit(); toast('Dihapus. Tekan ↶ untuk mengurungkan.'); } })),
          body));
      });
      if (!f.max || a.length < f.max) box.appendChild(h('button', { type: 'button', class: 'add', text: '+ Tambah ' + (f.item || 'item').toLowerCase(), onclick: function () { a.push(clone(f.blank || {})); S.openItems[path] = a.length - 1; commit(); } }));
    }
    draw();
    return h('div', { class: 'fld', 'data-path': path }, h('div', { class: 'lbl', text: f.l }), box, f.h ? h('div', { class: 'hint', text: f.h }) : null);
  };
  F.strings = function (f, path) {
    var box = h('div', { class: 'list' });
    function arr() { var a = getPath(S.cfg, path); if (!Array.isArray(a)) { a = []; setPath(S.cfg, path, a); } return a; }
    function draw() {
      box.innerHTML = '';
      var a = arr();
      a.forEach(function (v, i) {
        var inp = h('input', { class: 'in', type: 'text', value: v, 'aria-label': (f.item || 'Item') + ' ' + (i + 1), oninput: function () { a[i] = inp.value; change(path, a); } });
        box.appendChild(h('div', { class: 'srow', 'data-path': path + '.' + i }, inp,
          h('button', { type: 'button', class: 'mini', text: '↑', title: 'Naikkan', disabled: i === 0, onclick: function () { a.splice(i - 1, 0, a.splice(i, 1)[0]); change(path, a); draw(); } }),
          h('button', { type: 'button', class: 'mini del', text: '✕', title: 'Hapus', onclick: function () { a.splice(i, 1); change(path, a); draw(); } })));
      });
      box.appendChild(h('button', { type: 'button', class: 'add', text: '+ Tambah ' + (f.item || 'item').toLowerCase(), onclick: function () { a.push(''); change(path, a); draw(); var ins = box.querySelectorAll('input'); ins[ins.length - 1].focus(); } }));
    }
    draw();
    return h('div', { class: 'fld', 'data-path': path }, h('div', { class: 'lbl', text: f.l }), box, f.rich ? h('div', { class: 'hint', text: 'Apit kata dengan *bintang* untuk memberi warna aksen.' }) : null, f.h ? h('div', { class: 'hint', text: f.h }) : null);
  };

  /* --- susunan bagian: tampil/sembunyi & urutan --- */
  function sectionList() {
    var list = Array.isArray(S.cfg.sections) ? S.cfg.sections.filter(function (s) { return s && U.SECTIONS[s.id]; }) : [];
    U.SECTION_ORDER.forEach(function (id) { if (!list.some(function (s) { return s.id === id; })) list.push({ id: id, enabled: !!S.cfg[id] }); });
    return list;
  }
  F.sections = function (f, path) {
    var box = h('div', { class: 'list' });
    function draw() {
      box.innerHTML = '';
      var list = sectionList();
      list.forEach(function (s, i) {
        var on = s.enabled !== false, cb;
        cb = h('input', { type: 'checkbox', 'aria-label': 'Tampilkan ' + U.SECTIONS[s.id].label, onchange: function () { s.enabled = cb.checked; if (cb.checked && !S.cfg[s.id]) S.cfg[s.id] = {}; change('sections', list); draw(); drawGroupStates(); } });
        cb.checked = on;
        box.appendChild(h('div', { class: 'sec-row' + (on ? '' : ' off'), 'data-sec-row': s.id },
          h('label', { class: 'sw' }, cb), h('span', { text: U.SECTIONS[s.id].label }),
          h('button', { type: 'button', class: 'mini', text: '↑', title: 'Naikkan', 'aria-label': 'Naikkan ' + U.SECTIONS[s.id].label, disabled: i === 0, onclick: function () { list.splice(i - 1, 0, list.splice(i, 1)[0]); change('sections', list); draw(); } }),
          h('button', { type: 'button', class: 'mini', text: '↓', title: 'Turunkan', 'aria-label': 'Turunkan ' + U.SECTIONS[s.id].label, disabled: i === list.length - 1, onclick: function () { list.splice(i + 1, 0, list.splice(i, 1)[0]); change('sections', list); draw(); } }),
          h('button', { type: 'button', class: 'b b-sm b-ghost', text: 'Edit', onclick: function () { openGroup(s.id, true); } })));
      });
    }
    draw();
    return h('div', { class: 'fld', 'data-path': path }, h('div', { class: 'lbl', text: f.l }), box, f.h ? h('div', { class: 'hint', text: f.h }) : null);
  };

  function field(f, path) { return (F[f.t] || F.text)(f, path); }

  /* ---------------- panel ---------------- */
  var panel = $('#panel');
  function isOff(g) {
    if (!U.SECTIONS[g.id]) return false;
    var s = sectionList().filter(function (x) { return x.id === g.id; })[0];
    return !s || s.enabled === false;
  }
  function drawGroupStates() {
    SCHEMA.forEach(function (g) {
      var el = $('[data-grp="' + g.id + '"]', panel);
      if (!el) return;
      var off = isOff(g);
      el.classList.toggle('off', off);
      $('.grp-tag', el).hidden = !off;
    });
  }
  function drawPanel() {
    var top = panel.scrollTop;
    panel.innerHTML = '';
    panel.appendChild(h('div', { class: 'tip', html: '<b>Tips:</b> klik teks atau gambar langsung di pratinjau untuk mengubahnya. Perubahan baru tersimpan setelah menekan <b>Simpan</b>.' }));
    SCHEMA.forEach(function (g) {
      var open = S.open === g.id;
      var el = h('section', { class: 'grp' + (open ? ' open' : ''), 'data-grp': g.id },
        h('button', { type: 'button', class: 'grp-h', 'aria-expanded': String(open), onclick: function () { openGroup(open ? null : g.id, !open); } },
          h('span', { html: U.icon(g.icon) }), h('span', { text: g.title }), h('span', { class: 'grp-tag', text: 'disembunyikan', hidden: true }), h('span', { class: 'caret', text: '▶' })),
        open ? h('div', { class: 'grp-b' }, g.fields.map(function (f) { return field(f, f.k); })) : null);
      panel.appendChild(el);
    });
    drawGroupStates();
    panel.scrollTop = top;
  }
  function openGroup(id, scrollPreview) {
    S.open = id;
    drawPanel();
    if (!id) return;
    var el = $('[data-grp="' + id + '"]', panel);
    if (el) panel.scrollTo({ top: el.offsetTop - 8, behavior: 'smooth' });
    var g = SCHEMA.filter(function (x) { return x.id === id; })[0];
    if (scrollPreview && g && g.sec) post({ type: 'scroll', section: g.sec });
  }
  // buka grup + item daftar yang memuat path tertentu (dipakai saat klik di pratinjau)
  function reveal(path) {
    var g = SCHEMA.filter(function (x) { return x.fields.some(function (f) { return path === f.k || path.indexOf(f.k + '.') === 0; }); })[0];
    if (!g) return null;
    var m = path.match(/^(.*)\.(\d+)\.[^.]+$/), changed = S.open !== g.id;
    if (m && S.openItems[m[1]] !== Number(m[2])) { S.openItems[m[1]] = Number(m[2]); changed = true; }
    if (changed) { S.open = g.id; drawPanel(); }
    var el = $('[data-path="' + path + '"]', panel);
    if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    return el;
  }

  /* ---------------- pesan dari pratinjau ---------------- */
  window.addEventListener('message', function (e) {
    if (e.origin !== location.origin || !e.data || e.data.source !== 'umkm-preview') return;
    var m = e.data;
    if (m.type === 'ready') { S.ready = true; sendPreview(true); }
    if (m.type === 'edit') {
      change(m.path, m.value, { silent: true });
      var el = $('[data-path="' + m.path + '"]', panel), inp = el && $('input.in,textarea', el);
      if (inp) inp.value = m.value;
    }
    if (m.type === 'edit-done') { sendPreview(false); }
    if (m.type === 'focus') { openGroup(m.section === 'footer' ? 'footer' : m.section, false); setView('edit'); }
    if (m.type === 'pick') {
      var fld = reveal(m.path), file = fld && $('input[type=file]', fld);
      setView('edit');
      if (file) file.click();
    }
  });

  /* ---------------- klien: muat, simpan, buat ---------------- */
  function loadClients() {
    return api('GET', '/api/clients').then(function (list) {
      S.clients = list;
      var sel = $('#client'); sel.innerHTML = '';
      list.forEach(function (c) { sel.appendChild(h('option', { value: c.slug, text: c.name + (c.demo ? ' (demo)' : '') })); });
      return list;
    });
  }
  function loadClient(slug) {
    updateStatus('Memuat…', '');
    return api('GET', '/api/clients/' + slug).then(function (cfg) {
      S.slug = slug; S.cfg = cfg; S.saved = JSON.stringify(cfg); S.mark = S.saved; S.hist = []; S.future = []; S.openItems = {};
      $('#client').value = slug;
      history.replaceState(null, '', '?client=' + slug);
      document.title = 'Editor — ' + ((cfg.business && cfg.business.name) || slug);
      refreshAll();
    });
  }
  function save() {
    if (!S.cfg) return Promise.resolve();
    flushCheckpoint();
    var body = JSON.stringify(S.cfg);
    updateStatus('Menyimpan…', '');
    return fetch('/api/clients/' + S.slug, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: body })
      .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || 'Gagal menyimpan'); }); })
      .then(function () {
        S.saved = body; updateStatus();
        var c = S.clients.filter(function (x) { return x.slug === S.slug; })[0], o = $('#client option[value="' + S.slug + '"]');
        if (c && o) o.textContent = S.cfg.business.name + (S.cfg.meta && S.cfg.meta.demoNotice ? ' (demo)' : '');
      })
      .catch(function (e) { updateStatus('✕ Gagal menyimpan', 'err'); toast(e.message, true); throw e; });
  }

  var dlg = $('#dlg');
  function dialog(content) { dlg.innerHTML = ''; dlg.appendChild(content); if (!dlg.open) dlg.showModal(); }
  function closeBtn(text) { return h('button', { type: 'button', class: 'b b-ghost', text: text || 'Tutup', onclick: function () { dlg.close(); } }); }

  function newClient() {
    var name = h('input', { class: 'in', type: 'text', placeholder: 'Contoh: Toko Bunga Melati', required: true, autofocus: true });
    var from = h('select', {}, S.clients.map(function (c) { return h('option', { value: c.slug, text: c.name }); }));
    from.value = S.slug;
    var form = h('form', { method: 'dialog', onsubmit: function (e) {
      e.preventDefault();
      api('POST', '/api/clients', { name: name.value.trim(), from: from.value }).then(function (d) {
        dlg.close();
        return loadClients().then(function () { return loadClient(d.slug); }).then(function () { toast('Klien "' + name.value.trim() + '" dibuat di folder clients/' + d.slug + '/'); openGroup('identity'); });
      }).catch(function (err) { toast(err.message, true); });
    } },
      h('h2', { text: 'Klien baru' }),
      h('p', { text: 'Situs baru dibuat dengan menyalin klien yang sudah ada — pilih yang paling mirip jenis usahanya, lalu ganti isi, warna, dan fotonya.' }),
      h('div', { class: 'fld' }, h('label', { text: 'Nama usaha' }), name),
      h('div', { class: 'fld' }, h('label', { text: 'Salin dari' }), from),
      h('div', { class: 'acts' }, closeBtn('Batal'), h('button', { type: 'submit', class: 'b', text: 'Buat klien' })));
    dialog(form);
  }

  function build() {
    var btn = $('#build');
    btn.disabled = true; btn.textContent = 'Membuat…';
    (dirty() ? save() : Promise.resolve()).then(function () { return api('POST', '/api/clients/' + S.slug + '/build'); }).then(function (r) {
      var sum = function (re) { return r.files.filter(function (f) { return re.test(f.path); }).reduce(function (n, f) { return n + f.bytes; }, 0); };
      var count = function (re) { return r.files.filter(function (f) { return re.test(f.path); }).length; };
      dialog(h('div', { class: 'dlg-in' },
        h('h2', { text: 'Situs siap diunggah ✓' }),
        h('p', { html: 'File ada di folder <b>' + U.esc(r.folder) + '/</b>. Unggah seluruh isinya ke hosting mana pun (cPanel, Netlify, Vercel, Cloudflare Pages, GitHub Pages) — tidak perlu database atau server khusus.' }),
        h('div', { class: 'report' },
          h('div', {}, h('span', { text: 'Halaman (HTML + CSS + JS)' }), h('span', { text: kb(r.htmlBytes) + ' · terkompresi ' + kb(r.htmlGzip) })),
          h('div', {}, h('span', { text: 'Font (' + count(/^fonts\//) + ' file)' }), h('span', { text: kb(sum(/^fonts\//)) })),
          h('div', {}, h('span', { text: 'Gambar (' + count(/^images\//) + ' file)' }), h('span', { text: kb(sum(/^images\//)) })),
          h('div', {}, h('span', { text: 'Total' }), h('span', { text: kb(r.bytes) }))),
        r.warnings.length ? h('ul', { class: 'warns' }, r.warnings.map(function (w) { return h('li', { text: '⚠ ' + w }); })) : null,
        h('div', { class: 'acts' }, closeBtn(),
          h('a', { class: 'b b-ghost', href: r.zip, download: S.slug + '.zip', text: 'Unduh .zip' }),
          h('a', { class: 'b', href: r.url, target: '_blank', rel: 'noopener', text: 'Buka hasil' }))));
    }).catch(function (e) { toast(e.message, true); }).then(function () { btn.disabled = false; btn.textContent = 'Buat situs'; });
  }

  /* ---------------- tombol & pintasan ---------------- */
  function setView(v) {
    $('#work').setAttribute('data-view', v);
    document.querySelectorAll('.switch button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-view') === v)); });
  }
  document.querySelectorAll('.switch button').forEach(function (b) { b.addEventListener('click', function () { setView(b.getAttribute('data-view')); }); });
  document.querySelectorAll('[data-device]').forEach(function (b) {
    if (b.tagName !== 'BUTTON') return;
    b.addEventListener('click', function () {
      $('#stage').setAttribute('data-device', b.getAttribute('data-device'));
      document.querySelectorAll('button[data-device]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
    });
  });
  $('#save').addEventListener('click', function () { save().then(function () { toast('Tersimpan ke clients/' + S.slug + '/config.json'); }).catch(function () {}); });
  $('#build').addEventListener('click', build);
  $('#undo').addEventListener('click', undo);
  $('#redo').addEventListener('click', redo);
  $('#new').addEventListener('click', newClient);
  $('#client').addEventListener('change', function () {
    var next = $('#client').value;
    if (dirty() && !confirm('Ada perubahan yang belum disimpan. Pindah klien dan buang perubahan?')) { $('#client').value = S.slug; return; }
    loadClient(next).catch(function (e) { toast(e.message, true); });
  });
  function closeMore() { $('.more').removeAttribute('open'); }
  $('#open-site').addEventListener('click', function () {
    closeMore();
    (dirty() ? save() : Promise.resolve()).then(function () { window.open('/preview/' + S.slug + '/', '_blank', 'noopener'); }).catch(function () {});
  });
  $('#export').addEventListener('click', function () {
    closeMore();
    var a = h('a', { href: URL.createObjectURL(new Blob([JSON.stringify(S.cfg, null, 2) + '\n'], { type: 'application/json' })), download: S.slug + '.config.json' });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  });
  $('#import').addEventListener('click', function () { closeMore(); $('#file-json').click(); });
  $('#file-json').addEventListener('change', function () {
    var f = this.files[0]; this.value = '';
    if (!f) return;
    f.text().then(function (t) {
      var c = JSON.parse(t);
      if (!c || typeof c !== 'object' || !c.business) throw new Error('File ini bukan konfigurasi UMKM Landing.');
      flushCheckpoint();
      S.cfg = c; checkpoint(); refreshAll();
      toast('Konfigurasi diimpor. Periksa pratinjau, lalu tekan Simpan.');
    }).catch(function (e) { toast('Impor gagal: ' + e.message, true); });
  });
  $('#revert').addEventListener('click', function () {
    closeMore();
    if (!dirty()) return toast('Tidak ada perubahan yang perlu dibatalkan.');
    if (confirm('Kembalikan ke versi terakhir yang disimpan?')) { flushCheckpoint(); S.cfg = JSON.parse(S.saved); checkpoint(); refreshAll(); }
  });
  document.addEventListener('click', function (e) { if (!e.target.closest('.more')) closeMore(); });
  document.addEventListener('keydown', function (e) {
    var mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
    if (mod && k === 's') { e.preventDefault(); if (dirty()) $('#save').click(); }
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
    if (mod && k === 'z' && !typing) { e.preventDefault(); e.shiftKey ? redo() : undo(); }
  });
  window.addEventListener('beforeunload', function (e) { if (dirty()) { e.preventDefault(); e.returnValue = ''; } });

  /* ---------------- mulai ---------------- */
  loadClients().then(function (list) {
    if (!list.length) { updateStatus('Belum ada klien di folder clients/', 'err'); return; }
    var want = new URLSearchParams(location.search).get('client');
    var slug = list.some(function (c) { return c.slug === want; }) ? want : list[0].slug;
    S.open = 'identity';
    return loadClient(slug);
  }).catch(function (e) {
    updateStatus('✕ Tidak terhubung ke server', 'err');
    panel.appendChild(h('div', { class: 'tip', html: '<b>Editor perlu dijalankan lewat server lokal.</b><br>Buka terminal di folder proyek, jalankan <code>npm start</code>, lalu buka <code>http://localhost:4173/editor/</code>.<br><br>' + U.esc(e.message) }));
  });

  window.__editor = S; // untuk pengujian otomatis
})();
