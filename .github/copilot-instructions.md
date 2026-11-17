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


### Bersama (semua role yang login)
- GET /api/subjects, /api/schedules, /api/assignments, /api/materials

## Fitur per role (untuk konten landing page)
- Admin: CRUD akun semua role, manajemen kelas dan jurusan, manajemen guru dan mata pelajaran, lihat data guru dan siswa
- Guru: CRUD kuis/soal, CRUD materi, CRUD tugas/projek, generate nilai per mapel
- Siswa: download materi, mengerjakan tugas, ujian, kuis, projek
- Kurikulum dan Kepsek: hanya melihat nilai per mapel, tugas dari guru, pembuat soal ulangan, data guru dan siswa

## Area Guru dan Siswa (backend sudah direvisi, ini yang berlaku)

### Gaya respons
- Body request SELALU snake_case.
- Respons PascalCase (struct Go langsung): /api/me, /api/guru/teaching, /api/guru/students, /api/materials, /api/assignments, /api/guru/quizzes, /api/guru/quizzes/:id/questions, /api/guru/quizzes/:id/submissions, /api/guru/submissions/:id/answers, /api/subjects.
- Respons snake_case: /api/guru/assignments/:id/submissions (bagian data dan summary), nilai (generate-grades dan grades), semua /api/siswa/... kecuali yang di atas.
- Semua daftar dibungkus {"data": [...]}. Gunakan apiFetchList<T> untuk GET daftar dan apiFetch untuk lainnya.
- Tipe TypeScript Guru/Siswa ada di "@/types/learning". Tipe User, Class, Subject, Major dari "@/types". JANGAN menebak casing field.
- Next.js 16: pada halaman dinamis dengan "use client", ambil parameter dengan useParams() dari next/navigation. useSearchParams() harus dibungkus Suspense.

### Profil
- GET /api/me -> { data: User } (PascalCase). Untuk siswa: Class, Class.Major, Class.HomeroomTeacher terisi.

### File
- uploadFile(file) dan downloadFile(fileUrl, fileName) ada di lib/api.ts. Unduh WAJIB lewat downloadFile (endpoint butuh header Authorization), jangan <a href> langsung ke backend.
- Maksimal 10 MB. Ekstensi: pdf, doc, docx, ppt, pptx, xls, xlsx, txt, zip, rar, png, jpg, jpeg. Validasi di sisi klien dengan pesan jelas.

### Endpoint Guru (role 2)
- GET /api/guru/teaching (penugasan mapel+kelas), GET /api/guru/students[?class_id=]
- Materi: GET /api/materials[?class_id&subject_id]; POST /api/guru/materials {subject_id, class_id, title, description, content_url, file_name}; PUT dan DELETE /api/guru/materials/:id
- Tugas: GET /api/assignments[?class_id&subject_id]; POST /api/guru/assignments {subject_id, class_id, title, description, type: "tugas"|"projek", deadline (ISO 8601), max_score}; PUT dan DELETE /api/guru/assignments/:id; GET /api/guru/assignments/:id/submissions; PUT /api/guru/submissions/:submission_id/grade {score, feedback}; PUT /api/guru/assignments/:id/publish {published}
- Kuis: GET /api/guru/quizzes[?class_id&subject_id]; POST /api/guru/quizzes {subject_id, class_id, title, quiz_type: "kuis"|"ujian", is_timed, duration_min, start_time, end_time, result_mode: "hidden"|"after_submit"|"after_publish", show_answer_key}; PUT dan DELETE /api/guru/quizzes/:quiz_id; PUT /api/guru/quizzes/:quiz_id/publish {published}
- Soal: GET dan POST /api/guru/quizzes/:quiz_id/questions {question_text, question_type: "pilihan_ganda"|"esai", option_a..option_d, correct_option, score}; PUT dan DELETE /api/guru/questions/:question_id
- Hasil kuis: GET /api/guru/quizzes/:quiz_id/submissions; GET /api/guru/submissions/:submission_id/answers; PUT /api/guru/answers/:answer_id/grade {score, teacher_comment}
- Nilai: POST /api/guru/subjects/:subject_id/generate-grades {class_id, semester, academic_year, assignment_weight?, quiz_weight?}; GET /api/guru/subjects/:subject_id/grades?class_id&semester&academic_year

### Endpoint Siswa (role 3)
- GET /api/materials, GET /api/assignments, GET /api/subjects (otomatis hanya data kelas siswa untuk materi dan tugas)
- POST /api/siswa/submit {assignment_id, file_url, file_name, note}; GET /api/siswa/my-submissions
- GET /api/siswa/quizzes; POST /api/siswa/quizzes/:quiz_id/start; GET /api/siswa/quizzes/:quiz_id/questions; POST /api/siswa/submissions/:submission_id/submit {answers: [{question_id, selected_option?, essay_answer?}]}; GET /api/siswa/submissions/:submission_id/result; GET /api/siswa/submissions/:submission_id/review
- Siswa TIDAK punya halaman nilai akhir per mapel.

### Aturan nilai (ditegakkan backend, frontend hanya menampilkan yang dikirim)
- Nilai tugas tampil ke siswa hanya jika sudah dinilai DAN dipublikasikan guru (score_visible).
- Skor kuis: result_mode after_submit tampil setelah selesai; after_publish tampil setelah guru mempublikasikan; hidden tidak tampil (result_visible).
- Kunci jawaban hanya tampil bila correct_option ada di respons review. Jangan pernah menebak atau mengarang kunci jawaban.
- Kurikulum dan Kepsek hanya melihat (tidak ada tombol ubah).

### Komponen yang dipakai ulang
- components/admin: Modal, ConfirmDialog, PageHeader, SearchInput, EmptyState, TableSkeleton, Pagination. lib/exportPdf.ts: exportTablePdf.
- Pola halaman daftar: ikuti app/admin/classes/page.tsx (header, tombol aksi, tabel dalam card, skeleton, empty state).
- Layout area baru: ikuti app/admin/layout.tsx (sidebar bg-brand 260px, logo NE, proteksi role). Ikon tombol sidebar hanya berubah jadi X saat menu mobile terbuka.