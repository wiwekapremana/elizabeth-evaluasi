# Sistem Evaluasi Instruktur Elizabeth International

Sistem Evaluasi Instruktur Elizabeth International adalah aplikasi berbasis web yang digunakan untuk membantu mahasiswa memberikan penilaian terhadap instruktur secara terstruktur, praktis, dan terdokumentasi.

Aplikasi ini dirancang untuk mempermudah proses evaluasi instruktur berdasarkan jurusan mahasiswa, kategori instruktur, serta hasil kuisioner dengan skala penilaian 1–5. Seluruh data mahasiswa, data instruktur, dan hasil evaluasi terintegrasi dengan Google Sheets melalui Google Apps Script.

## Tujuan Sistem

Sistem ini dibuat untuk:

- mempermudah mahasiswa dalam memberikan evaluasi terhadap instruktur,
- mengelompokkan instruktur berdasarkan jurusan dan kategori pengajar,
- menyimpan hasil evaluasi secara otomatis ke Google Sheets,
- membantu mahasiswa melanjutkan pengisian menggunakan NIM tanpa harus mengisi data diri kembali,
- mempermudah pengelolaan data instruktur tanpa harus mengubah kode website,
- serta menyediakan data evaluasi yang dapat digunakan sebagai bahan monitoring dan peningkatan kualitas pembelajaran.

## Alur Penggunaan

Mahasiswa memulai dengan mengisi:

- Nama
- NIM
- Jurusan

Setelah data mahasiswa disimpan, sistem akan menampilkan kategori instruktur yang tersedia, yaitu:

- Instruktur Jurusan
- Instruktur IT
- Instruktur Business
- Instruktur English

Mahasiswa memilih salah satu kategori, kemudian sistem menampilkan daftar instruktur yang sesuai.

Setelah memilih instruktur, mahasiswa akan diarahkan ke halaman kuisioner evaluasi.

Setelah kuisioner dikirim, hasil evaluasi tersimpan secara otomatis ke Google Sheets dan mahasiswa akan kembali ke daftar instruktur untuk melanjutkan evaluasi instruktur lainnya.



- **Daftar Instruktur:** tambah, edit, nonaktifkan, atau hapus instruktur. Isinya nama, kategori, bidang/mata kuliah, link foto, dan jurusan tempat instruktur tampil.
- **Penempatan Jurusan:** matriks centang instruktur × jurusan untuk mengatur banyak instruktur sekaligus. Perubahan baru tersimpan setelah klik **Simpan Perubahan**.
- **Kartu cakupan:** jumlah instruktur aktif per jurusan dan per kategori. Angka 0 ditandai merah.
- Instruktur yang sudah punya evaluasi tidak bisa dihapus, hanya bisa dinonaktifkan. Dengan begitu data evaluasinya tetap utuh.


### Struktur sheet "Instruktur"

| Kolom | Isi |
|---|---|
| ID Instruktur | ID unik. Jangan diubah karena dipakai di sheet evaluasi. |
| Nama Instruktur | Nama lengkap |
| Role | Kategori, mis. `Instruktur Jurusan`, `Instruktur IT`, `Instruktur Business`, `Instruktur English`, atau kategori baru |
| Group | Kolom lama. Hanya dipakai jika kolom Jurusan kosong. |
| Area | Bidang / mata kuliah |
| Foto | Link Google Drive atau URL gambar |
| Status | `Aktif` / `Nonaktif` |
| Jurusan | Daftar jurusan dipisah koma, atau `SEMUA` (kolom ini dibuat otomatis) |

