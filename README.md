# Website Evaluasi Instruktur - Elizabeth International

Saya sudah menyesuaikan website dengan:
- logo Elizabeth International,
- warna bernuansa merah dan oranye mengikuti logo,
- istilah **instruktur**,
- daftar jurusan yang Anda minta,
- dan struktur data instruktur yang mudah diubah.

## Jurusan yang digunakan
1. Food & Beverage Service
2. Bar & Mixology
3. Culinary
4. Pastry & Bakery
5. Room Division
6. Front Office
7. Hotel Digital Marketing

## Pembagian data instruktur
Konfigurasi saat ini:

- **Food & Beverage Service** dan **Bar & Mixology** memakai data instruktur yang sama.
- **Culinary** dan **Pastry & Bakery** memakai data instruktur yang sama.
- **Front Office** dan **Hotel Digital Marketing** memakai data instruktur yang sama.
- **Room Division** memiliki data instruktur sendiri.

Di tiap jurusan / group, website akan menampilkan card instruktur:
- Instruktur Jurusan
- Instruktur IT
- Instruktur Business
- Instruktur English

---

# Cara menambah data instruktur per jurusan

Semua data ada di file **`config.js`**.

## 1) Mapping jurusan ke group
Lihat bagian ini:

```js
const MAJOR_TO_POOL = {
  "Food & Beverage Service": "fnb_bar",
  "Bar & Mixology": "fnb_bar",
  "Culinary": "culinary_pastry",
  "Pastry & Bakery": "culinary_pastry",
  "Room Division": "room_division",
  "Front Office": "fo_digmar",
  "Hotel Digital Marketing": "fo_digmar"
};
```

Artinya:
- dua jurusan bisa memakai data instruktur yang sama,
- cukup diarahkan ke pool yang sama.

## 2) Menambah instruktur di dalam group
Masih di file **`config.js`**, lihat bagian:

```js
const LECTURER_POOLS = {
  fnb_bar: [
    {
      id: "FNB-JUR-01",
      name: "Instruktur F&B / Bar 1",
      role: "Instruktur Jurusan",
      area: "Food & Beverage Service / Bar & Mixology",
      photo: "https://alamat-foto-anda.jpg"
    }
  ]
};
```

Kalau Anda mau tambah instruktur, cukup tambahkan objek baru di array tersebut.

Contoh:

```js
{
  id: "FNB-JUR-02",
  name: "Bapak/Ibu Nama Instruktur Baru",
  role: "Instruktur Jurusan",
  area: "Food & Beverage Service / Bar & Mixology",
  photo: "https://alamat-foto-anda.jpg"
}
```

### Keterangan field:
- `id` = kode unik instruktur
- `name` = nama instruktur
- `role` = kategori card, misalnya:
  - `Instruktur Jurusan`
  - `Instruktur IT`
  - `Instruktur Business`
  - `Instruktur English`
- `area` = bidang / kelompok pengajar
- `photo` = link foto

---

# Jika ingin menambah jurusan baru
1. Tambahkan nama jurusan ke array `MAJORS`.
2. Tambahkan mapping-nya ke `MAJOR_TO_POOL`.
3. Siapkan data instruktur di `LECTURER_POOLS`.

---

# Integrasi Google Sheets

## File backend
Gunakan file:
- `google-apps-script.gs`

## Langkah
1. Buat Google Sheet baru.
2. Buka **Extensions > Apps Script**.
3. Hapus script default.
4. Tempel isi file `google-apps-script.gs`.
5. Klik **Deploy > New deployment**.
6. Pilih **Web app**.
7. Salin URL `/exec`.
8. Tempel ke file `config.js`:

```js
const GOOGLE_SCRIPT_URL = "URL_WEB_APP_ANDA";
```

## Tab yang akan dibuat
Script akan membuat:
- `Mahasiswa`
- `Evaluasi Instruktur`

---

# Struktur file
- `index.html`
- `style.css`
- `config.js`
- `app.js`
- `google-apps-script.gs`
- `logo-elizabeth.png`

---

# Catatan
Foto instruktur saat ini masih contoh. Anda bisa menggantinya dengan foto asli instruktur kampus Anda pada file `config.js`.


---

# Update tampilan kategori instruktur

Versi terbaru menggunakan alur:

1. Mahasiswa memilih jurusan.
2. Sistem menampilkan **kategori instruktur**:
   - Instruktur Jurusan
   - Instruktur IT
   - Instruktur Business
   - Instruktur English
3. Mahasiswa klik salah satu kategori.
4. Baru setelah itu sistem menampilkan **daftar instruktur** pada kategori tersebut.
5. Klik instruktur untuk membuka kuisioner.

Header website juga sudah diubah menjadi **putih** supaya logo Elizabeth International tetap jelas dan tidak bertabrakan dengan background merah.


## Perbaikan V3
- Dropdown jurusan sekarang memiliki data langsung di HTML, sehingga tidak kosong jika JavaScript terlambat termuat.
- `config.js` tetap menjadi sumber utama daftar jurusan.
- Card `Instruktur Jurusan` sekarang menampilkan nama jurusan aktif, misalnya `Instruktur Culinary`.
- Nama `Food & Baverage Service` mengikuti penulisan jurusan yang diberikan.


---

# Update V4 — Instruktur IT, Business, English Global

Mulai versi V4:

- `LECTURER_POOLS` hanya untuk **Instruktur Jurusan**.
- `GLOBAL_INSTRUCTORS` untuk **Instruktur IT**, **Instruktur Business**, dan **Instruktur English**.
- Data pada `GLOBAL_INSTRUCTORS` otomatis tampil di **semua jurusan**.

## Contoh: tambah instruktur English kedua

```js
{
  id: "GLOBAL-ENG-02",
  name: "Nama Instruktur English Kedua",
  role: "Instruktur English",
  area: "English Communication",
  photo: "https://alamat-foto.jpg"
}
```

Cukup tambahkan ke `GLOBAL_INSTRUCTORS`. Tidak perlu menyalinnya ke F&B, Culinary,
Room Division, Front Office, dan jurusan lain.

## Penting tentang ID

Setiap instruktur wajib memiliki `id` unik. Setelah pengumpulan evaluasi dimulai,
sebaiknya jangan mengganti `id`, karena ID tersebut dipakai untuk menentukan
apakah mahasiswa sudah mengevaluasi instruktur tersebut.


---

# Update V5 — Perbaikan "Lanjutkan Pengisian"

Versi V5 memperbaiki proses pencarian NIM:

- Pencarian NIM sekarang memakai `POST`, sama seperti penyimpanan data.
- NIM dibaca menggunakan `getDisplayValues()` agar angka/NIM yang tampil di Google Sheets dibaca sebagai teks.
- Spasi di awal/akhir NIM otomatis dihapus.
- Pesan error dibuat lebih jelas jika:
  - sheet `Mahasiswa` belum ada,
  - sheet belum memiliki data,
  - atau NIM memang tidak ditemukan.

## PENTING setelah mengganti `google-apps-script.gs`

Apps Script wajib di-deploy ulang:

1. Buka Apps Script.
2. `Deploy > Manage deployments`.
3. Klik ikon Edit (pensil).
4. Pada Version pilih `New version`.
5. Klik `Deploy`.

Tidak cukup hanya menekan Save pada Apps Script. Web App lama tetap menjalankan versi deployment sebelumnya sampai Anda membuat versi deployment baru.


---

# Update V6 — Fallback Pencarian NIM + Diagnostik

Jika proses `Lanjutkan Pengisian` gagal:

1. Website mencoba `POST action=lookupStudent`.
2. Jika POST gagal, website otomatis mencoba `GET action=lookupStudent`.
3. Jika keduanya gagal, alert menampilkan detail error.

## Cara menguji endpoint secara langsung

Gunakan URL Web App yang sama dengan `GOOGLE_SCRIPT_URL`.

### Tes endpoint
Buka di browser:

`URL_WEB_APP_ANDA`

Seharusnya menghasilkan JSON dan bukan halaman login/error.

### Tes NIM
Buka:

`URL_WEB_APP_ANDA?action=lookupStudent&nim=1111`

Ganti `1111` dengan NIM yang ada di sheet `Mahasiswa`.

Jika berhasil, hasilnya kurang lebih:

```json
{
  "ok": true,
  "found": true,
  "student": {
    "nim": "1111",
    "name": "Nama Mahasiswa",
    "major": "Culinary"
  },
  "completedLecturerIds": []
}
```

## Jika Apps Script baru saja diedit

WAJIB:

`Deploy > Manage deployments > Edit > New version > Deploy`

Menekan Save saja tidak memperbarui kode yang dijalankan URL `/exec`.


---

# Update V7 — Fix Horizontal Scroll pada Form Kuisioner

Horizontal scroll pada halaman kuisioner berasal dari radio input rating yang ikut memakai `width:100%` dari style input umum, sementara radio tersebut diposisikan absolute.

Perbaikannya:
- radio rating dibuat hanya `1px x 1px` dan tetap terhubung ke label 1–5,
- container rating diberi `position:relative`,
- ditambahkan perlindungan `overflow-x:hidden` pada halaman.

Tampilan dan fungsi rating tetap sama.


---

# Update V8 — Data Instruktur Langsung dari Google Sheets

Mulai versi V8, data instruktur tidak perlu lagi ditulis di `config.js`.

Gunakan tab Google Sheets:

`Instruktur`

Website memakai tiga tab:

1. `Mahasiswa`
2. `Instruktur`
3. `Evaluasi Instruktur`

## Struktur tab Instruktur

Urutan kolom harus:

| ID Instruktur | Nama Instruktur | Role | Group | Area | Foto | Status |
| --- | --- | --- | --- | --- | --- | --- |

Tab `Instruktur` akan dibuat otomatis jika belum tersedia.

## Role

Gunakan salah satu:

- `Instruktur Jurusan`
- `Instruktur IT`
- `Instruktur Business`
- `Instruktur English`

## Group

Gunakan:

- `fnb_bar`
- `culinary_pastry`
- `room_division`
- `fo_digmar`
- `GLOBAL`

`GLOBAL` otomatis tampil di seluruh jurusan dan cocok untuk IT, Business, dan English.

## Contoh

```text
GLOBAL-ENG-01 | Ms. A | Instruktur English | GLOBAL | English Communication | https://foto.jpg | Aktif
```

Jika ada 5 instruktur English, cukup masukkan 5 baris seperti ini. Tidak perlu edit website.

## Status

- `Aktif` = tampil
- `Nonaktif` = disembunyikan
- kosong = dianggap Aktif

## Input banyak data

Paket ini menyertakan:

`template-instruktur.csv`

Anda bisa membukanya di Excel atau Google Sheets, isi banyak data sekaligus, lalu copy-paste ke tab `Instruktur`.

## Setelah mengubah Apps Script

Wajib deploy ulang:

`Deploy > Manage deployments > Edit > New version > Deploy`

Tidak cukup hanya Save.

## Tes endpoint

Buka:

`URL_WEB_APP_ANDA?action=getInstructors`

Jika benar, hasilnya berupa JSON daftar instruktur aktif.


---

# Update V9 — Link Foto Google Drive Otomatis

Kolom `Foto` pada tab `Instruktur` sekarang boleh berisi link share Google Drive biasa.

Contoh:

```text
https://drive.google.com/file/d/FILE_ID/view?usp=sharing
```

Apps Script otomatis mengubahnya menjadi URL thumbnail yang cocok untuk `<img>`.

Format yang didukung:

```text
https://drive.google.com/file/d/FILE_ID/view?usp=sharing
https://drive.google.com/open?id=FILE_ID
https://drive.google.com/uc?id=FILE_ID
https://drive.google.com/thumbnail?id=FILE_ID&sz=w1000
```

Agar foto tampil untuk semua mahasiswa:
1. Buka file foto di Google Drive.
2. `Share`.
3. `General access` = `Anyone with the link`.
4. Permission = `Viewer`.
5. Copy link dan paste langsung ke kolom `Foto`.

Website tetap dapat dipakai saat di-deploy ke Vercel atau subdomain:

```text
https://kusioner.kampuselizabeth.com
```

Jika foto gagal dimuat, card memakai gambar placeholder otomatis.

Setelah mengganti `google-apps-script.gs`, deploy ulang:

`Deploy > Manage deployments > Edit > New version > Deploy`

Tes:

```text
URL_WEB_APP_ANDA?action=getInstructors
```

Pada hasil JSON, field `photo` untuk link Drive akan berubah menjadi:

```text
https://drive.google.com/thumbnail?id=FILE_ID&sz=w1200
```


---

# Update V10 — Kuisioner 2026

Kuisioner sekarang menggunakan 9 aspek dengan skala poin 1–5:

1. Penguasaan Materi
2. Kejelasan Penyampaian Materi
3. Metode & Media Pembelajaran
4. Keterlibatan & Interaksi dengan Mahasiswa
5. Relevansi dengan Dunia Industri
6. Pengelolaan Kelas & Waktu
7. Profesionalisme & Kedisiplinan
8. Respons & Feedback kepada Mahasiswa
9. Evaluasi & Dukungan terhadap Perkembangan Mahasiswa

Setiap aspek memiliki deskripsi yang tampil langsung pada form.

Bagian komentar diubah menjadi:

`Kritik dan Saran`

dan keterangan kritik/saran menyesuaikan area instruktur yang sedang dievaluasi.

## Sheet hasil baru

Karena jumlah pertanyaan berubah dari 5 menjadi 9, hasil V10 disimpan di tab baru:

`Evaluasi Instruktur 2026`

Tujuannya agar data evaluasi versi sebelumnya tidak bergeser atau salah kolom.

Tab lama `Evaluasi Instruktur` tidak dihapus dan dapat tetap dipakai sebagai arsip.

## Setelah mengganti Apps Script

Lakukan:

`Deploy > Manage deployments > Edit > New version > Deploy`
