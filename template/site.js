/*!
 * UMKM Landing — runtime kecil untuk halaman (±3 KB, tanpa dependency).
 * Semua interaksi memakai event delegation, jadi tetap bekerja walau
 * isi halaman diganti (pratinjau editor).
 */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  function $(s, el) { return (el || d).querySelector(s); }
  function $$(s, el) { return Array.prototype.slice.call((el || d).querySelectorAll(s)); }

  /* --- menu mobile --- */
  function setMenu(open) {
    var nav = $('[data-nav]'), b = $('[data-nav-toggle]');
    if (!nav || !b) return;
    nav.classList.toggle('is-open', open);
    b.setAttribute('aria-expanded', String(open));
    b.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
  }

  /* --- lightbox galeri --- */
  var lb, lbItems = [], lbIndex = 0;
  function lbShow(i) {
    lbIndex = (i + lbItems.length) % lbItems.length;
    var a = lbItems[lbIndex], im = $('img', lb);
    im.src = a.getAttribute('href');
    im.alt = a.getAttribute('data-caption') || '';
    $('p', lb).textContent = a.getAttribute('data-caption') || '';
  }
  function lbOpen(a) {
    if (!lb) {
      lb = d.createElement('dialog');
      lb.className = 'lb';
      lb.setAttribute('aria-label', 'Galeri foto');
      lb.innerHTML = '<img alt=""><p></p>' +
        '<button type="button" class="lb-x" aria-label="Tutup">✕</button>' +
        '<button type="button" class="lb-prev" aria-label="Sebelumnya">‹</button>' +
        '<button type="button" class="lb-next" aria-label="Berikutnya">›</button>';
      d.body.appendChild(lb);
      lb.addEventListener('click', function (e) {
        if (e.target.closest('.lb-prev')) lbShow(lbIndex - 1);
        else if (e.target.closest('.lb-next')) lbShow(lbIndex + 1);
        else if (e.target.tagName !== 'IMG') lb.close();
      });
      lb.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft') lbShow(lbIndex - 1);
        if (e.key === 'ArrowRight') lbShow(lbIndex + 1);
      });
    }
    lbItems = $$('[data-lightbox]');
    lbShow(lbItems.indexOf(a));
    if (lb.showModal) lb.showModal(); else lb.setAttribute('open', '');
  }

  d.addEventListener('click', function (e) {
    var t = e.target, el;

    if (t.closest('[data-nav-toggle]')) { setMenu(!$('[data-nav]').classList.contains('is-open')); return; }
    if (t.closest('.nav-links a')) setMenu(false);

    // filter kategori produk
    if ((el = t.closest('[data-filter]'))) {
      var cat = el.getAttribute('data-filter'), sec = el.closest('section');
      $$('[data-filter]', sec).forEach(function (b) {
        var on = b === el;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', String(on));
      });
      $$('[data-cat]', sec).forEach(function (card) {
        card.hidden = !!cat && card.getAttribute('data-cat') !== cat;
        card.classList.add('in');
      });
      return;
    }

    if ((el = t.closest('[data-lightbox]'))) { e.preventDefault(); lbOpen(el); return; }

    // peta dimuat hanya saat diminta (hemat data & cepat)
    if ((el = t.closest('[data-map]'))) {
      var f = d.createElement('iframe');
      f.src = el.getAttribute('data-map');
      f.title = el.getAttribute('data-title') || 'Peta';
      f.loading = 'lazy';
      f.referrerPolicy = 'no-referrer-when-downgrade';
      f.setAttribute('allowfullscreen', '');
      el.parentNode.replaceChild(f, el);
    }
  });

  d.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* --- form -> WhatsApp --- */
  d.addEventListener('submit', function (e) {
    var form = e.target.closest('[data-wa-form]');
    if (!form) return;
    e.preventDefault();
    var lines = [form.getAttribute('data-intro') || ''];
    $$('[data-f]', form).forEach(function (f) { if (f.value.trim()) lines.push(f.getAttribute('data-f') + ': ' + f.value.trim()); });
    var msg = $('[name=text]', form);
    if (msg && msg.value.trim()) lines.push('', msg.value.trim());
    var url = form.getAttribute('action') + '?text=' + encodeURIComponent(lines.join('\n').trim());
    var w = window.open(url, '_blank', 'noopener');
    if (!w) location.href = url;
  });

  /* --- efek scroll: bayangan nav, tombol melayang, menu aktif --- */
  var ticking = false;
  function onScroll() {
    ticking = false;
    var y = window.scrollY || root.scrollTop, nav = $('[data-nav]'), fab = $('[data-fab]');
    if (nav) nav.classList.toggle('is-stuck', y > 8);
    if (fab) fab.classList.toggle('is-on', y > 480);
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

  var spy, reveal;
  function refresh() {
    onScroll();
    if (!('IntersectionObserver' in window)) return;

    if (spy) spy.disconnect();
    var links = {};
    $$('.nav-links a[href^="#"]').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
    spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        Object.keys(links).forEach(function (id) { links[id].classList.toggle('is-active', id === en.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach(function (s) { spy.observe(s); });

    if (reveal) reveal.disconnect();
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    reveal = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); reveal.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    var vh = window.innerHeight;
    $$('[data-rv]').forEach(function (el) {
      // yang sudah terlihat saat halaman dibuka tidak disembunyikan (tanpa kedip)
      if (el.classList.contains('rv') || el.getBoundingClientRect().top < vh) return;
      el.classList.add('rv');
      reveal.observe(el);
    });
  }

  window.UMKMSite = { refresh: refresh };
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', refresh); else refresh();
})();
