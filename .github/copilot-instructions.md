# Konteks Project: EduLearn LMS Frontend

## Stack
- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4
- Backend terpisah: Go (Gin + GORM + SQLite), jalan di http://localhost:8080

## Design tokens
- Warna utama: `brand` (#986B95) — dipakai untuk logo, tombol utama, aksen, background gelap pada section penekanan
- Warna lain: putih (bg utama), hitam/near-black (teks utama)
- Background section terang: putih atau abu sangat muda (#F8F7F9)
- Jangan gunakan warna biru/navy sama sekali

## Autentikasi
- Login: POST /api/login, body `{ email, password }`, response `{ message, token, role_id }`
- Tidak ada endpoint register publik — akun hanya dibuat admin
- Simpan token di localStorage, kirim di setiap request sebagai header `Authorization: Bearer <token>`
- role_id: 1=Admin, 2=Guru, 3=Siswa, 4=Kurikulum, 5=Kepsek

## Endpoint utama per role

### Admin (role_id 1)
- CRUD /api/admin/classes, /api/admin/majors, /api/admin/subjects, /api/admin/schedules
- CRUD /api/admin/users (body: name, email, password, role_id, class_id opsional)
- PUT /api/admin/students/:student_id/class
- POST /api/admin/import (upload file Excel, field form "file")

### Guru (role_id 2)
- CRUD /api/guru/quizzes, /api/guru/quizzes/:quiz_id/questions
- GET /api/guru/quizzes/:quiz_id/submissions, GET /api/guru/submissions/:submission_id/answers
- PUT /api/guru/answers/:answer_id/grade (nilai esai)
- CRUD /api/guru/materials, CRUD /api/guru/assignments
- PUT /api/guru/submissions/:submission_id/grade (nilai tugas)
- POST /api/guru/subjects/:subject_id/generate-grades, GET /api/guru/subjects/:subject_id/grades

### Siswa (role_id 3)
- GET /api/siswa/quizzes, GET /api/siswa/quizzes/:quiz_id/questions
- POST /api/siswa/quizzes/:quiz_id/start, POST /api/siswa/submissions/:submission_id/submit
- GET /api/siswa/submissions/:submission_id/result
- POST /api/siswa/submit (body: assignment_id, file_url)
- GET /api/siswa/grades

### Kurikulum & Kepsek (role_id 4 & 5) — akses sama, read-only
- GET /api/viewer/grades, /api/viewer/assignments, /api/viewer/quizzes, /api/viewer/teachers, /api/viewer/students

### Shared (semua role login)
- GET /api/subjects, /api/schedules, /api/assignments, /api/materials

## Catatan penting
- Field dari backend pakai PascalCase di beberapa response (misal "ID", "ClassName") karena struct Go — cek response asli dulu sebelum assume casing.
- Semua endpoint di atas (kecuali /api/login) butuh header Authorization Bearer token.

## Referensi desain landing page
Landing page terdiri dari 8 section berurutan:
1. Header — logo + nav (Fitur, Statistik, Tentang Kami) + tombol "Masuk"
2. Hero — badge pill, judul 2 baris (hitam + brand), deskripsi, 2 tombol CTA, foto + kartu statistik melayang
3. Statistik — background gelap (brand), 4 angka besar berjajar horizontal
4. Fitur — label + judul + 6 kartu grid (ikon bulat warna-warni, judul, deskripsi)
5. 5 Peran Terintegrasi — label + judul + 5 kartu role (Admin, Guru, Siswa, Kurikulum, Kepsek), masing-masing ada tombol "Masuk sebagai [Role]"
6. Tentang Kami — konten penjelasan platform (bukan testimoni)
7. CTA penutup — background gelap (brand), judul ajakan + 1 tombol
8. Footer — background gelap, logo+deskripsi+sosmed, 2 kolom link, copyright bar

## Modal Login (dipicu tombol "Masuk" di header DAN tombol "Masuk sebagai [Role]")
Modal 2 tahap:
- Tahap 1: daftar 5 role (ikon, nama, deskripsi, chevron), klik salah satu lanjut ke tahap 2
- Tahap 2: judul "Masuk — [Role]", kotak info role terpilih, field Email + Password, tombol "← Ganti Peran" (balik ke tahap 1) dan "Masuk →" (submit ke POST /api/login)
Kalau tombol "Masuk sebagai [Role]" langsung diklik dari section 5 Peran, modal langsung buka di tahap 2 (skip tahap 1).

## Dashboard Admin
Layout: sidebar kiri (background brand) + topbar atas + area konten.
Sidebar: logo+nama produk+role di atas, menu (Dashboard, Manajemen Akun, Kelas, Jurusan, Mata Pelajaran, Data Guru, Data Siswa), info user + tombol Keluar di bawah.
Topbar: judul halaman, ikon notifikasi, nama+role user.
Konten dashboard: 4 kartu statistik (Total Guru, Total Siswa, Total Kelas, Mata Pelajaran), section Aktivitas Terbaru, section Aksi Cepat, section Ringkasan dengan progress bar.