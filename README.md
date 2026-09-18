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
