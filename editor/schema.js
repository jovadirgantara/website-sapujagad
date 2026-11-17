/*
 * Skema form editor. Setiap baris = satu kolom isian di panel kiri.
 * Menambah kolom baru cukup di sini (dan pakai nilainya di template/render.js).
 *
 *   k : path di config.json        t : jenis kolom (text, area, color, select, toggle,
 *   l : label                          image, cta, dest, icon, list, strings, palette, sections)
 *   h : petunjuk kecil di bawah    rich : boleh memakai *kata aksen*
 */
(function () {
  'use strict';
  var RICH = 'Apit kata dengan *bintang* untuk memberi warna aksen.';
  var head = function (key, extra) {
    return [
      { k: key + '.navLabel', t: 'text', l: 'Label di menu navigasi', h: 'Kosongkan agar bagian ini tidak muncul di menu.' },
      { k: key + '.eyebrow', t: 'text', l: 'Label kecil di atas judul' },
      { k: key + '.title', t: 'area', l: 'Judul', rich: true, rows: 2 }
    ].concat(extra === false ? [] : [{ k: key + '.subtitle', t: 'area', l: 'Deskripsi singkat', rows: 2 }]);
  };

  window.PALETTES = [
    { name: 'Terakota', primary: '#b8451f', accent: '#efb949', background: '#fbf6ee', text: '#2a1d15' },
    { name: 'Hutan', primary: '#1f5c43', accent: '#f0b84c', background: '#f7f5ee', text: '#17231d' },
    { name: 'Samudra', primary: '#1b4b8f', accent: '#ffb454', background: '#f5f8fc', text: '#0f1b2d' },
    { name: 'Mawar', primary: '#b0456b', accent: '#f6c9b8', background: '#fdf6f4', text: '#2b1a20' },
    { name: 'Sage', primary: '#5c7253', accent: '#e9c6a5', background: '#f8f6f0', text: '#232a21' },
    { name: 'Jeruk', primary: '#e2570c', accent: '#ffd23f', background: '#fffdf5', text: '#1c1917' },
    { name: 'Ungu', primary: '#5b3df5', accent: '#c6f432', background: '#f8f7ff', text: '#14112b' },
    { name: 'Arang & Emas', primary: '#d9a441', accent: '#c2452d', background: '#151413', text: '#f3efe8' }
  ];

  var CHANNELS = [['whatsapp', 'WhatsApp'], ['telepon', 'Telepon'], ['email', 'Email'], ['instagram', 'Instagram'], ['tiktok', 'TikTok'], ['facebook', 'Facebook'], ['youtube', 'YouTube'], ['shopee', 'Shopee'], ['tokopedia', 'Tokopedia'], ['marketplace', 'Marketplace lain'], ['website', 'Website'], ['lainnya', 'Tautan lain']];

  window.SCHEMA = [
    {
      id: 'identity', title: 'Identitas & SEO', icon: 'home', sec: 'top', fields: [
        { k: 'business.name', t: 'text', l: 'Nama usaha' },
        { k: 'business.tagline', t: 'text', l: 'Tagline singkat' },
        { k: 'business.logo', t: 'image', l: 'Logo', max: 400, h: 'Opsional. Tanpa logo, huruf pertama nama usaha dipakai sebagai tanda.' },
        { k: 'business.hideName', t: 'toggle', l: 'Sembunyikan teks nama di samping logo', def: false },
        { k: 'meta.title', t: 'text', l: 'Judul halaman (tab browser & Google)', h: 'Idealnya 50–60 karakter, sebutkan jenis usaha dan kota.' },
        { k: 'meta.description', t: 'area', l: 'Deskripsi untuk Google & pratinjau tautan', rows: 3, h: 'Idealnya 120–160 karakter.' },
        { k: 'meta.url', t: 'text', l: 'Alamat situs setelah online', ph: 'https://namausaha.com/' },
        { k: 'meta.ogImage', t: 'image', l: 'Gambar saat tautan dibagikan (WhatsApp/Facebook)', max: 1200, h: 'Opsional, ukuran ideal 1200×630. Perlu "Alamat situs" terisi.' },
        { k: 'meta.noindex', t: 'toggle', l: 'Sembunyikan dari mesin pencari', def: false, h: 'Aktifkan untuk situs demo/percobaan.' },
        { k: 'meta.gaId', t: 'text', l: 'ID Google Analytics 4 (opsional)', ph: 'G-XXXXXXXXXX', h: 'Hanya aktif di situs hasil "Buat situs", tidak di pratinjau.' },
        { k: 'meta.pixelId', t: 'text', l: 'ID Meta Pixel (opsional)', ph: '123456789012345', h: 'Angka saja.' },
        { k: 'meta.demoNotice', t: 'text', l: 'Teks bar DEMO di paling atas', h: 'Kosongkan untuk situs klien sungguhan.' },
        { k: 'business.schemaType', t: 'select', l: 'Jenis usaha (data untuk Google)', o: [['LocalBusiness', 'Usaha lokal (umum)'], ['CafeOrCoffeeShop', 'Kafe / kedai kopi'], ['Restaurant', 'Restoran / rumah makan'], ['Bakery', 'Toko roti & kue'], ['FoodEstablishment', 'Kuliner lainnya'], ['ClothingStore', 'Toko pakaian'], ['BeautySalon', 'Salon kecantikan'], ['HairSalon', 'Barbershop / salon rambut'], ['HealthAndBeautyBusiness', 'Kecantikan & perawatan'], ['Store', 'Toko / ritel'], ['HomeAndConstructionBusiness', 'Jasa rumah & bangunan'], ['AutoRepair', 'Bengkel'], ['ProfessionalService', 'Jasa profesional / digital']] }
      ]
    },
    {
      id: 'theme', title: 'Warna & font', icon: 'sparkles', sec: 'top', fields: [
        { k: 'theme', t: 'palette', l: 'Palet siap pakai' },
        { k: 'theme.primary', t: 'color', l: 'Warna utama (tombol & aksen)' },
        { k: 'theme.accent', t: 'color', l: 'Warna aksen kedua' },
        { k: 'theme.background', t: 'color', l: 'Warna latar', h: 'Latar gelap otomatis menyesuaikan warna kartu dan garis.' },
        { k: 'theme.text', t: 'color', l: 'Warna teks' },
        { k: 'theme.fonts', t: 'select', l: 'Gaya huruf', o: 'FONT_PAIRS' },
        { k: 'theme.radius', t: 'select', l: 'Sudut elemen', o: 'RADII' }
      ]
    },
    {
      id: 'whatsapp', title: 'WhatsApp & pengumuman', icon: 'message', sec: 'top', fields: [
        { k: 'whatsapp.number', t: 'text', l: 'Nomor WhatsApp', ph: '0812 3456 7890', h: 'Boleh diawali 0, 62, atau +62 — otomatis disesuaikan.', wa: true },
        { k: 'whatsapp.message', t: 'area', l: 'Pesan otomatis (tombol umum)', rows: 2, h: '{bisnis} diganti dengan nama usaha.' },
        { k: 'whatsapp.productMessage', t: 'area', l: 'Pesan otomatis (tombol di produk)', rows: 2, h: 'Gunakan {produk} dan {harga}. Tanda *bintang* menjadi huruf tebal di WhatsApp.' },
        { k: 'whatsapp.floating', t: 'toggle', l: 'Tombol WhatsApp melayang', def: true },
        { k: 'whatsapp.floatingLabel', t: 'text', l: 'Teks tombol melayang' },
        { k: 'nav.cta', t: 'cta', l: 'Tombol di navigasi' },
        { k: 'announcement.enabled', t: 'toggle', l: 'Bar pengumuman / promo', def: true },
        { k: 'announcement.text', t: 'text', l: 'Teks pengumuman', rich: true },
        { k: 'announcement.href', t: 'dest', l: 'Saat pengumuman diklik' }
      ]
    },
    {
      id: 'sections', title: 'Susunan bagian', icon: 'package', fields: [
        { k: 'sections', t: 'sections', l: 'Tampilkan, sembunyikan, atau ubah urutan', h: 'Bagian yang disembunyikan otomatis hilang dari menu navigasi.' }
      ]
    },
    {
      id: 'hero', title: 'Hero (bagian atas)', icon: 'star', sec: 'hero', fields: [
        { k: 'hero.layout', t: 'select', l: 'Tata letak', o: [['split', 'Teks kiri, gambar kanan'], ['center', 'Teks di tengah, gambar lebar'], ['cover', 'Foto penuh dengan teks di atasnya']] },
        { k: 'hero.imageShape', t: 'select', l: 'Bentuk gambar', o: [['lengkung', 'Lengkung (arch)'], ['kotak', 'Persegi membulat']], h: 'Berlaku untuk tata letak "teks kiri, gambar kanan".' },
        { k: 'hero.eyebrow', t: 'text', l: 'Label kecil' },
        { k: 'hero.title', t: 'area', l: 'Judul utama', rich: true, rows: 2 },
        { k: 'hero.subtitle', t: 'area', l: 'Deskripsi', rows: 3 },
        { k: 'hero.primaryCta', t: 'cta', l: 'Tombol utama' },
        { k: 'hero.secondaryCta', t: 'cta', l: 'Tombol kedua' },
        { k: 'hero.image', t: 'image', l: 'Gambar utama', max: 1600 },
        { k: 'hero.imageAlt', t: 'text', l: 'Deskripsi gambar (aksesibilitas & SEO)' },
        { k: 'hero.rating', t: 'select', l: 'Bintang di bawah tombol', o: [[0, 'Tanpa bintang'], [5, '★★★★★'], [4, '★★★★☆']], num: true },
        { k: 'hero.note', t: 'text', l: 'Teks di bawah tombol', h: 'Gunakan hanya angka yang benar-benar bisa dibuktikan.' },
        { k: 'hero.badges', t: 'list', l: 'Kartu info melayang (maks. 2)', item: 'Kartu', title: 'title', max: 2, blank: { icon: 'clock', title: 'Judul', text: 'Keterangan' }, fields: [{ k: 'icon', t: 'icon', l: 'Ikon' }, { k: 'title', t: 'text', l: 'Judul' }, { k: 'text', t: 'text', l: 'Keterangan' }] },
        { k: 'hero.sticker', t: 'text', l: 'Teks stiker melingkar', h: 'Sekitar 30–40 karakter. Kosongkan untuk menyembunyikan.' },
        { k: 'hero.stickerIcon', t: 'icon', l: 'Ikon stiker' }
      ]
    },
    {
      id: 'trust', title: 'Angka & kepercayaan', icon: 'award', sec: 'trust', fields: [
        { k: 'trust.items', t: 'list', l: 'Sorotan', item: 'Sorotan', title: 'value', max: 4, blank: { value: '100+', label: 'Keterangan angka' }, fields: [{ k: 'value', t: 'text', l: 'Angka / nilai' }, { k: 'label', t: 'text', l: 'Keterangan' }] },
        { k: 'trust.note', t: 'text', l: 'Catatan kecil di bawah', h: 'Jangan menulis klaim yang tidak bisa dibuktikan.' }
      ]
    },
    {
      id: 'about', title: 'Tentang usaha', icon: 'heart', sec: 'about', fields: [
        { k: 'about.navLabel', t: 'text', l: 'Label di menu navigasi', h: 'Kosongkan agar tidak muncul di menu.' },
        { k: 'about.eyebrow', t: 'text', l: 'Label kecil di atas judul' },
        { k: 'about.title', t: 'area', l: 'Judul', rich: true, rows: 2 },
        { k: 'about.text', t: 'area', l: 'Cerita singkat', rows: 5 },
        { k: 'about.points', t: 'strings', l: 'Poin keunikan (USP)', item: 'Poin', rich: true },
        { k: 'about.image', t: 'image', l: 'Gambar utama', max: 1400 },
        { k: 'about.imageAlt', t: 'text', l: 'Deskripsi gambar utama' },
        { k: 'about.image2', t: 'image', l: 'Gambar kecil (opsional)', max: 800 },
        { k: 'about.badgeValue', t: 'text', l: 'Lencana bulat — teks besar', h: 'Contoh: 2020, 10+, 100%. Kosongkan untuk menyembunyikan.' },
        { k: 'about.badgeLabel', t: 'text', l: 'Lencana bulat — teks kecil' },
        { k: 'about.ownerName', t: 'text', l: 'Nama pemilik' },
        { k: 'about.ownerRole', t: 'text', l: 'Peran / keterangan' },
        { k: 'about.cta', t: 'cta', l: 'Tombol' }
      ]
    },
    {
      id: 'products', title: 'Produk / layanan', icon: 'shopping-bag', sec: 'products', fields: head('products').concat([
        { k: 'products.layout', t: 'select', l: 'Tampilan', o: [['kartu', 'Kartu dengan gambar'], ['daftar', 'Daftar harga (tanpa gambar)']] },
        { k: 'products.items', t: 'list', l: 'Daftar produk / layanan', item: 'Produk', title: 'name', blank: { name: 'Produk baru', category: '', description: '', price: '', oldPrice: '', unit: '', badge: '', image: '' }, fields: [
          { k: 'name', t: 'text', l: 'Nama' },
          { k: 'price', t: 'text', l: 'Harga', ph: '25000', h: 'Angka saja (25000) → otomatis menjadi Rp 25.000. Teks bebas juga boleh: "Mulai Rp 50rb".' },
          { k: 'description', t: 'area', l: 'Deskripsi singkat', rows: 2 },
          { k: 'image', t: 'image', l: 'Foto', max: 1000 },
          { k: 'category', t: 'text', l: 'Kategori', h: 'Produk dengan kategori sama dikelompokkan pada filter.' },
          { k: 'badge', t: 'text', l: 'Label (mis. Terlaris, Baru, Promo)' },
          { k: 'oldPrice', t: 'text', l: 'Harga coret (opsional)' },
          { k: 'unit', t: 'text', l: 'Satuan (opsional)', ph: '/ box' }
        ] },
        { k: 'products.showFilter', t: 'toggle', l: 'Tampilkan filter kategori', def: true },
        { k: 'products.allLabel', t: 'text', l: 'Teks tombol filter "semua"' },
        { k: 'products.showButton', t: 'toggle', l: 'Tombol pesan di setiap produk', def: true },
        { k: 'products.buttonLabel', t: 'text', l: 'Teks tombol pesan', h: 'Contoh: Pesan, Booking, Tanya, Beli.' },
        { k: 'products.note', t: 'area', l: 'Catatan di bawah daftar', rows: 2 },
        { k: 'products.cta', t: 'cta', l: 'Tombol di bawah daftar' }
      ])
    },
    {
      id: 'benefits', title: 'Keunggulan', icon: 'thumbs-up', sec: 'benefits', fields: head('benefits').concat([
        { k: 'benefits.items', t: 'list', l: 'Daftar keunggulan', item: 'Keunggulan', title: 'title', blank: { icon: 'sparkles', title: 'Keunggulan baru', text: '' }, fields: [{ k: 'icon', t: 'icon', l: 'Ikon' }, { k: 'title', t: 'text', l: 'Judul' }, { k: 'text', t: 'area', l: 'Penjelasan', rows: 2 }] }
      ])
    },
    {
      id: 'gallery', title: 'Galeri', icon: 'camera', sec: 'gallery', fields: head('gallery').concat([
        { k: 'gallery.items', t: 'list', l: 'Foto', item: 'Foto', title: 'caption', blank: { image: '', caption: '' }, fields: [{ k: 'image', t: 'image', l: 'Foto', max: 1400 }, { k: 'caption', t: 'text', l: 'Keterangan foto' }], h: 'Susunan paling rapi dengan 6 foto (atau kelipatannya).' },
        { k: 'gallery.cta', t: 'cta', l: 'Tombol di bawah galeri' }
      ])
    },
    {
      id: 'testimonials', title: 'Testimoni', icon: 'smile', sec: 'testimonials', fields: head('testimonials').concat([
        { k: 'testimonials.items', t: 'list', l: 'Ulasan pelanggan', item: 'Ulasan', title: 'name', blank: { quote: 'Tulis ulasan pelanggan di sini.', name: 'Nama pelanggan', role: '', rating: 5 }, fields: [
          { k: 'quote', t: 'area', l: 'Isi ulasan', rows: 3, rich: true }, { k: 'name', t: 'text', l: 'Nama' }, { k: 'role', t: 'text', l: 'Keterangan (pekerjaan, kota, dsb.)' },
          { k: 'rating', t: 'select', l: 'Bintang', o: [[5, '★★★★★'], [4, '★★★★☆'], [3, '★★★☆☆']], num: true }
        ], h: 'Gunakan hanya ulasan asli dengan izin pelanggan.' },
        { k: 'testimonials.ratingValue', t: 'text', l: 'Angka rating besar', h: 'Contoh: 4,9. Kosongkan untuk menyembunyikan.' },
        { k: 'testimonials.ratingLabel', t: 'text', l: 'Keterangan rating' },
        { k: 'testimonials.note', t: 'text', l: 'Catatan kecil di bawah' }
      ])
    },
    {
      id: 'faq', title: 'FAQ', icon: 'message', sec: 'faq', fields: head('faq').concat([
        { k: 'faq.items', t: 'list', l: 'Pertanyaan & jawaban', item: 'Pertanyaan', title: 'q', blank: { q: 'Pertanyaan baru?', a: 'Jawaban.' }, fields: [{ k: 'q', t: 'text', l: 'Pertanyaan' }, { k: 'a', t: 'area', l: 'Jawaban', rows: 3, rich: true }] },
        { k: 'faq.helpTitle', t: 'text', l: 'Kotak bantuan — judul' },
        { k: 'faq.helpText', t: 'area', l: 'Kotak bantuan — teks', rows: 2 },
        { k: 'faq.cta', t: 'cta', l: 'Kotak bantuan — tombol' }
      ])
    },
    {
      id: 'location', title: 'Lokasi & jam buka', icon: 'map-pin', sec: 'location', fields: head('location').concat([
        { k: 'location.address', t: 'area', l: 'Alamat', rows: 2 },
        { k: 'location.addressNote', t: 'text', l: 'Catatan alamat (patokan, parkir)' },
        { k: 'location.hours', t: 'list', l: 'Jam buka', item: 'Baris', title: 'days', blank: { days: 'Senin – Jumat', time: '09.00 – 17.00' }, fields: [{ k: 'days', t: 'text', l: 'Hari' }, { k: 'time', t: 'text', l: 'Jam' }] },
        { k: 'location.hoursNote', t: 'text', l: 'Catatan jam buka' },
        { k: 'location.showMap', t: 'toggle', l: 'Tampilkan peta', def: true, h: 'Peta baru dimuat saat pengunjung menekan tombol, jadi halaman tetap ringan.' },
        { k: 'location.mapQuery', t: 'text', l: 'Nama tempat / alamat di Google Maps', h: 'Tulis seperti saat mencari di Google Maps. Kosong = memakai nama usaha + alamat.' },
        { k: 'location.mapsUrl', t: 'text', l: 'Tautan Google Maps (opsional)', ph: 'https://maps.app.goo.gl/…', h: 'Dipakai tombol "Petunjuk arah".' },
        { k: 'location.mapEmbedUrl', t: 'text', l: 'Tautan embed peta (opsional, lanjutan)', ph: 'https://www.google.com/maps/embed?pb=…' },
        { k: 'location.cta', t: 'cta', l: 'Tombol utama' },
        { k: 'location.secondaryCta', t: 'cta', l: 'Tombol kedua' }
      ])
    },
    {
      id: 'contact', title: 'Kontak', icon: 'phone', sec: 'contact', fields: head('contact').concat([
        { k: 'contact.cta', t: 'cta', l: 'Tombol utama' },
        { k: 'contact.phone', t: 'text', l: 'Nomor telepon', h: 'Dipakai tombol "Telepon". Kosong = memakai nomor WhatsApp.' },
        { k: 'contact.email', t: 'text', l: 'Email' },
        { k: 'contact.channels', t: 'list', l: 'Saluran kontak & media sosial', item: 'Saluran', title: 'label', blank: { type: 'instagram', label: '@namausaha', url: 'https://instagram.com/' }, fields: [
          { k: 'type', t: 'select', l: 'Jenis', o: CHANNELS }, { k: 'label', t: 'text', l: 'Teks yang ditampilkan' },
          { k: 'url', t: 'text', l: 'Tautan', ph: 'https://…', h: 'Untuk WhatsApp, Telepon, dan Email boleh dikosongkan.' }
        ] },
        { k: 'contact.form.enabled', t: 'toggle', l: 'Form pesan cepat (terkirim ke WhatsApp)', def: true },
        { k: 'contact.form.title', t: 'text', l: 'Form — judul' },
        { k: 'contact.form.intro', t: 'text', l: 'Form — kalimat pembuka pesan', h: 'Muncul di baris pertama pesan WhatsApp.' },
        { k: 'contact.form.optionLabel', t: 'text', l: 'Form — label pilihan' },
        { k: 'contact.form.options', t: 'strings', l: 'Form — daftar pilihan', item: 'Pilihan' },
        { k: 'contact.form.messageLabel', t: 'text', l: 'Form — label kolom pesan' },
        { k: 'contact.form.messagePlaceholder', t: 'text', l: 'Form — contoh isi pesan' },
        { k: 'contact.form.submitLabel', t: 'text', l: 'Form — teks tombol' },
        { k: 'contact.form.note', t: 'text', l: 'Form — catatan kecil' }
      ])
    },
    {
      id: 'footer', title: 'Footer', icon: 'tag', sec: 'footer', fields: [
        { k: 'footer.text', t: 'area', l: 'Deskripsi singkat', rows: 2 },
        { k: 'business.legalName', t: 'text', l: 'Nama pada hak cipta', h: 'Kosong = memakai nama usaha.' },
        { k: 'footer.copyright', t: 'text', l: 'Teks hak cipta' },
        { k: 'footer.links', t: 'list', l: 'Tautan tambahan', item: 'Tautan', title: 'label', blank: { label: 'Tautan', href: 'https://' }, fields: [{ k: 'label', t: 'text', l: 'Teks' }, { k: 'href', t: 'dest', l: 'Tujuan' }] },
        { k: 'footer.credit', t: 'text', l: 'Kredit pembuat situs', ph: 'Dibuat oleh Studio Anda' },
        { k: 'footer.creditUrl', t: 'text', l: 'Tautan kredit', ph: 'https://…' }
      ]
    }
  ];
})();
