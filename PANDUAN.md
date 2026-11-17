# Panduan Editor (untuk operator)

Panduan singkat membuat dan mengubah situs klien tanpa menyentuh kode.

## 1. Membuka editor

1. Pasang [Node.js](https://nodejs.org) (cukup sekali).
2. Klik dua kali **Mulai Editor.bat** (Windows) atau **mulai-editor.command** (Mac).
   Atau buka terminal di folder ini dan jalankan `npm start`.
3. Buka <http://localhost:4173/editor/> di browser.

Biarkan jendela terminal tetap terbuka selama mengedit. Tutup dengan `Ctrl + C`.

## 2. Mengenal layar

- **Kiri** — pengaturan, dikelompokkan per bagian halaman.
- **Kanan** — pratinjau langsung. Tombol **HP / Tablet / Desktop** di atas mengganti ukuran layar.
- **Kanan atas** — status simpan, urungkan/ulangi, **Simpan**, **Buat situs**.

Dua cara mengubah isi:

1. Isi kolom di panel kiri.
2. **Klik langsung teks di pratinjau** lalu ketik. Tekan `Enter` jika selesai.
   **Klik gambar di pratinjau** untuk menggantinya.

Perubahan baru tersimpan setelah menekan **Simpan** (`Ctrl + S`). Salah langkah? Tekan **↶**.

## 3. Membuat situs klien baru

1. Klik **+ Klien baru**.
2. Isi nama usaha, pilih contoh yang paling mirip jenis usahanya, klik **Buat klien**.
3. Kerjakan dari atas ke bawah:

| Grup | Yang perlu diisi |
| --- | --- |
| Identitas & SEO | Nama, tagline, judul halaman, deskripsi. **Kosongkan "Teks bar DEMO"** dan matikan "Sembunyikan dari mesin pencari". |
| Warna & font | Pilih palet siap pakai atau atur 4 warna sendiri, lalu gaya huruf dan sudut. |
| WhatsApp & pengumuman | Nomor WhatsApp klien dan pesan otomatis. Pastikan muncul tanda ✓ hijau. |
| Susunan bagian | Matikan bagian yang tidak diperlukan, atur urutannya. |
| Hero … Kontak | Ganti semua teks, produk, harga, foto, FAQ, alamat, jam buka. |
| Footer | Deskripsi singkat dan kredit pembuat situs. |

4. Klik **Simpan**, lalu **Buat situs**.
5. Klik **Unduh .zip** dan unggah isinya ke hosting klien.

## 4. Tips mengisi

- **Kata beraksen.** Apit kata dengan bintang: `Kopi enak, *tiap pagi.*`
- **Harga.** Ketik angka saja, `25000` otomatis menjadi `Rp 25.000`. Teks bebas juga boleh: `Mulai Rp 50rb`.
- **Tombol.** Setiap tombol bisa diarahkan ke WhatsApp, telepon, email, Google Maps, bagian lain di halaman, atau tautan apa pun. Kosongkan teksnya untuk menyembunyikan tombol.
- **Pesan WhatsApp.** `{bisnis}` diganti nama usaha, `{produk}` dan `{harga}` diganti nama dan harga produk yang diklik. Tanda `*bintang*` menjadi huruf tebal di WhatsApp.
- **Foto.** Pakai foto asli yang terang, objek di tengah. Foto otomatis diperkecil dan dikompres.
  Urutan paling penting: foto hero, lalu foto produk.
- **Galeri** paling rapi dengan 6 foto (atau kelipatannya).
- **Peta.** Isi "Nama tempat di Google Maps" persis seperti saat mencari di Google Maps.
- **Jujur.** Gunakan ulasan asli (dengan izin) dan angka yang benar. Jangan menulis klaim yang tidak bisa dibuktikan.

## 5. Sebelum diserahkan ke klien

Jendela **Buat situs** menampilkan peringatan bila ada yang terlewat:

- nomor WhatsApp belum valid,
- bar DEMO masih aktif,
- alamat situs (URL) masih kosong,
- deskripsi halaman kosong,
- ada gambar yang terlalu besar.

Coba juga sendiri: buka hasilnya di HP, ketuk setiap tombol WhatsApp, dan periksa menu.

## 6. Mengubah situs yang sudah jadi

Pilih klien di kiri atas, ubah, **Simpan**, **Buat situs**, lalu unggah ulang isi folder `dist/<klien>/`.

## 7. Cadangan dan pemindahan

- Semua data satu klien ada di folder `clients/<klien>/` (pengaturan + gambar). Salin folder itu untuk mencadangkan.
- **Lainnya → Ekspor konfigurasi** mengunduh pengaturan sebagai file `.json`.
- **Lainnya → Impor konfigurasi** memuat file tersebut ke klien yang sedang dibuka.
- **Lainnya → Batalkan semua perubahan** kembali ke versi terakhir yang disimpan.

## 8. Masalah yang sering muncul

| Masalah | Solusi |
| --- | --- |
| "Tidak terhubung ke server" | Server belum jalan. Jalankan `npm start`, buka lewat `http://localhost:4173/editor/` (bukan dengan klik dua kali file HTML). |
| "Port 4173 sedang dipakai" | Editor sudah terbuka di jendela lain, atau jalankan `PORT=5000 npm start`. |
| Gambar tidak berubah di situs | Belum menekan **Simpan** dan **Buat situs**, atau browser masih memakai versi lama (muat ulang dengan `Ctrl + Shift + R`). |
| Tombol WhatsApp membuka nomor yang salah | Periksa "Nomor WhatsApp" dan tanda ✓ hijau di bawahnya. |
| Bagian tidak muncul di menu | Isi "Label di menu navigasi" pada bagian tersebut. |
