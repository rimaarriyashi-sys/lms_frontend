# Konteks Project: NexaEdu (Frontend)

## Stack
- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4
- Backend terpisah: Go (Gin + GORM + SQLite) di http://localhost:8080

## Identitas produk
- Nama produk: NexaEdu (satu kata, N dan E kapital). JANGAN gunakan nama EduLMS atau EduLearn di mana pun.
- Logo: kotak rounded berisi huruf "NE" (putih, tebal, font Fraunces) di atas bg-brand, diikuti teks "NexaEdu" dan subteks "LMS Sekolah".
- Email kontak placeholder: info@nexaedu.id
- Tagline: platform pembelajaran terpadu untuk sekolah kejuruan

## Aturan desain (berlaku untuk SEMUA halaman)
- Warna hanya 3 keluarga: brand #986B95 (+ brand-dark #7D587A), putih (canvas #FFFFFF, surface #F8F7F9), hitam (ink #111111). JANGAN mengubah token di app/globals.css dan JANGAN menambah warna baru. Boleh pakai opacity dari token (bg-brand/10, text-ink/70). Pengecualian fungsional: merah hanya untuk aksi hapus dan pesan error.
- Tanpa emoji. Ikon SVG inline (stroke 1.7, round). Judul pakai font-[family-name:var(--font-fraunces)].
- Tailwind v4 utility classes. Responsif, aksesibel (aria-label, focus-visible), hormati prefers-reduced-motion.

## Data sekolah
- 6 jurusan: PPLG (Pengembangan Perangkat Lunak dan Game), DKV (Desain Komunikasi Visual), TJKT (Teknik Jaringan Komputer dan Komunikasi), BDR (Bisnis dan Digitalisasi Ritel), MPLB (Manajemen Perkantoran dan Layanan Bisnis), PH (Perhotelan)
- Tiap jurusan: tingkat X, XI, XII, masing-masing 2 kelas = 36 rombel. Nama kelas: "X PPLG 1", "XII TJKT 2"
- Di database, MajorName berisi kode (PPLG dst). Nama lengkap hanya ada di lib/majors.ts (frontend)

## Konvensi kode
- GET daftar: apiFetchList<T> (backend membungkus hasil dalam {"data":[...]}). POST/PUT/DELETE: apiFetch
- Field dari backend PascalCase (ID, ClassName, dst). ID user = string UUID, ID lainnya number
- Jangan mengubah backend. Jangan ubah file di luar yang disebut prompt. Saat merestyle, jangan hapus logic data/CRUD yang sudah berfungsi
- Setelah selesai: jalankan type-check dan lint

## Autentikasi
- Login: POST /api/login, body { email, password }, response { message, token, role_id }
- Tidak ada endpoint register publik, akun hanya dibuat admin
- Token disimpan di localStorage dan dikirim sebagai header Authorization: Bearer <token>
- Payload JWT berisi: id (UUID user), email, role_id, exp
- role_id: 1=Admin, 2=Guru, 3=Siswa, 4=Kurikulum, 5=Kepsek

## Endpoint per role

### Admin (role_id 1)
- CRUD /api/admin/classes (body: class_name, major_id, homeroom_teacher_id)
- CRUD /api/admin/majors (body: major_name)
- CRUD /api/admin/subjects (body: subject_name, teacher_id)
- CRUD /api/admin/schedules
- CRUD /api/admin/users (body: name, email, password, role_id, nisn_nip, nis, tempat_lahir, tanggal_lahir, jenis_kelamin, specialty, class_id)
- PUT /api/admin/students/:student_id/class
- POST /api/admin/import (upload Excel, field form "file")

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

### Kurikulum & Kepsek (role_id 4 dan 5, read-only)
- GET /api/viewer/grades, /api/viewer/assignments, /api/viewer/quizzes, /api/viewer/teachers, /api/viewer/students

### Bersama (semua role yang login)
- GET /api/subjects, /api/schedules, /api/assignments, /api/materials

## Fitur per role (untuk konten landing page)
- Admin: CRUD akun semua role, manajemen kelas dan jurusan, manajemen guru dan mata pelajaran, lihat data guru dan siswa
- Guru: CRUD kuis/soal, CRUD materi, CRUD tugas/projek, generate nilai per mapel
- Siswa: download materi, mengerjakan tugas, ujian, kuis, projek
- Kurikulum dan Kepsek: hanya melihat nilai per mapel, tugas dari guru, pembuat soal ulangan, data guru dan siswa