"use client";

import { useState } from "react";
import LoginModal, { type LoginRole } from "@/components/LoginModal";

const features = [
  {
    icon: "📚",
    title: "Manajemen Materi",
    description: "Susun dan bagikan materi belajar dalam satu ruang yang mudah diakses.",
  },
  {
    icon: "🧩",
    title: "Tugas & Projek",
    description: "Berikan tugas, kumpulkan hasil, dan ikuti progres belajar siswa.",
  },
  {
    icon: "✍️",
    title: "Ujian Online",
    description: "Buat kuis dan ujian digital untuk pengalaman evaluasi yang praktis.",
  },
  {
    icon: "📈",
    title: "Generate Nilai",
    description: "Rangkum hasil belajar menjadi nilai yang siap ditinjau.",
  },
  {
    icon: "🧑‍🤝‍🧑",
    title: "Manajemen 5 Role",
    description: "Hubungkan Admin, Guru, Siswa, Kurikulum, dan Kepsek dalam satu platform.",
  },
  {
    icon: "🔎",
    title: "Monitoring & Laporan",
    description: "Pantau aktivitas dan perkembangan akademik dengan lebih terarah.",
  },
];

const roles: { id: LoginRole; name: string; description: string }[] = [
  { id: "admin", name: "Admin", description: "Kelola data dan kebutuhan sekolah." },
  { id: "guru", name: "Guru", description: "Atur materi, tugas, ujian, dan penilaian." },
  { id: "siswa", name: "Siswa", description: "Belajar, mengerjakan tugas, dan melihat nilai." },
  { id: "kurikulum", name: "Kurikulum", description: "Pantau kegiatan dan capaian akademik." },
  { id: "kepsek", name: "Kepsek", description: "Tinjau gambaran pembelajaran sekolah." },
];

export default function Home() {
  const [isLoginOpen, setLoginOpen] = useState(false);
  const [initialRole, setInitialRole] = useState<LoginRole | undefined>();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[74px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <a aria-label="EduLMS, beranda" className="flex items-center gap-2.5" href="#beranda">
            <span className="grid size-10 place-items-center rounded-xl bg-brand text-xl font-bold text-white">e</span>
            <span className="font-[family-name:var(--font-fraunces)] text-[22px] font-semibold text-ink">EduLMS</span>
          </a>
          <nav aria-label="Navigasi utama" className="hidden items-center gap-9 text-sm font-medium text-ink/75 md:flex">
            <a className="transition hover:text-brand" href="#fitur">Fitur</a>
            <a className="transition hover:text-brand" href="#statistik">Statistik</a>
            <a className="transition hover:text-brand" href="#tentang">Tentang Kami</a>
          </nav>
          <button
            className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            onClick={() => {
              setLoginOpen(true);
              setInitialRole(undefined);
            }}
            type="button"
          >
            Masuk
          </button>
        </div>
      </header>

      <main>
        <section className="overflow-hidden" id="beranda">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1fr_0.95fr] lg:gap-16 lg:py-24">
            <div className="relative z-10">
              <span className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/5 px-3.5 py-1.5 text-xs font-semibold text-brand">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-brand" />
                Satu platform untuk sekolah yang terus bertumbuh
              </span>
              <h1 className="mt-6 max-w-[660px] font-[family-name:var(--font-fraunces)] text-[46px] leading-[1.08] font-medium text-ink sm:text-[60px]">
                Belajar lebih terarah,
                <br />
                <span className="text-brand">bertumbuh bersama.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
                EduLMS menyatukan materi, tugas, ujian, dan pemantauan akademik agar seluruh ekosistem sekolah dapat bergerak lebih mudah.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button
                  className="rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  onClick={() => {
                    setLoginOpen(true);
                    setInitialRole(undefined);
                  }}
                  type="button"
                >
                  Masuk ke EduLMS <span aria-hidden="true" className="ml-2">→</span>
                </button>
                <a className="rounded-lg border border-line px-6 py-3 text-sm font-semibold text-ink transition hover:border-brand/40 hover:bg-surface" href="#fitur">
                  Jelajahi Fitur
                </a>
              </div>
            </div>

            <div aria-label="Ilustrasi platform EduLMS" className="relative mx-auto aspect-[1.08/1] w-full max-w-[570px]">
              <div className="absolute inset-[5%_4%_7%_8%] overflow-hidden rounded-[32px] bg-[linear-gradient(145deg,#986B95_0%,#7D587A_54%,#523B51_100%)]">
                <div aria-hidden="true" className="absolute inset-0 opacity-25" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "23px 23px" }} />
                <div className="absolute left-[12%] top-[14%] h-[66%] w-[76%] rounded-t-[20px] border border-white/40 bg-white/15 p-4 shadow-2xl backdrop-blur-sm sm:p-6">
                  <div className="flex items-center justify-between border-b border-white/20 pb-4">
                    <div className="flex items-center gap-2"><span className="size-7 rounded-lg bg-white/80" /><span className="h-2 w-20 rounded-full bg-white/70" /></div>
                    <span className="size-6 rounded-full bg-white/35" />
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-2.5">
                    <span className="h-16 rounded-lg bg-white/25 sm:h-20" />
                    <span className="h-16 rounded-lg bg-white/40 sm:h-20" />
                    <span className="h-16 rounded-lg bg-white/20 sm:h-20" />
                  </div>
                  <div className="mt-4 flex h-[38%] items-end gap-2 rounded-xl bg-white/15 px-4 pb-3">
                    <span className="h-[38%] flex-1 rounded-t-md bg-white/45" />
                    <span className="h-[64%] flex-1 rounded-t-md bg-white/65" />
                    <span className="h-[48%] flex-1 rounded-t-md bg-white/50" />
                    <span className="h-[82%] flex-1 rounded-t-md bg-white/80" />
                    <span className="h-[60%] flex-1 rounded-t-md bg-white/55" />
                    <span className="h-[92%] flex-1 rounded-t-md bg-white/90" />
                  </div>
                </div>
                <div aria-hidden="true" className="absolute bottom-0 left-0 h-1/4 w-full bg-black/10" />
              </div>
              <div className="absolute right-0 top-[15%] rounded-xl border border-line bg-white px-4 py-3.5 shadow-[0_14px_40px_-18px_rgba(17,17,17,0.35)] sm:px-5">
                <p className="text-[11px] font-medium text-muted">Aktivitas belajar</p>
                <p className="mt-1 text-xl font-bold text-ink">1.240<span className="text-brand">+</span></p>
                <p className="text-xs text-muted">siswa aktif</p>
              </div>
              <div className="absolute bottom-[10%] left-0 rounded-xl border border-line bg-white px-4 py-3.5 shadow-[0_14px_40px_-18px_rgba(17,17,17,0.35)] sm:px-5">
                <p className="text-[11px] font-medium text-muted">Keterlibatan kelas</p>
                <p className="mt-1 text-xl font-bold text-ink">92<span className="text-brand">%</span></p>
                <div className="mt-2 h-1.5 w-28 overflow-hidden rounded-full bg-surface"><div className="h-full w-[92%] rounded-full bg-brand" /></div>
              </div>
            </div>
          </div>
        </section>

        <section aria-label="Statistik EduLMS" className="bg-brand-dark text-white" id="statistik">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-9 px-5 py-12 sm:px-8 md:grid-cols-4 md:py-14">
            {[
              ["1.240+", "Siswa Aktif"],
              ["84", "Guru Terdaftar"],
              ["32", "Mata Pelajaran"],
              ["48", "Kelas Aktif"],
            ].map(([value, label]) => (
              <div className="text-center" key={label}>
                <p className="font-[family-name:var(--font-fraunces)] text-4xl font-semibold sm:text-5xl">{value}</p>
                <p className="mt-2 text-sm text-white/75">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-surface/70" id="fitur">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
            <div className="max-w-2xl">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Fitur EduLMS</span>
              <h2 className="mt-3 font-[family-name:var(--font-fraunces)] text-4xl leading-tight font-medium text-ink sm:text-[46px]">Semua kebutuhan belajar, dalam satu tempat.</h2>
              <p className="mt-4 text-base leading-7 text-muted">Perangkat yang saling terhubung untuk membantu kegiatan belajar mengajar berjalan lebih lancar.</p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <article className="rounded-xl border border-line bg-white p-6 transition hover:border-brand/35" key={feature.title}>
                  <span aria-hidden="true" className="grid size-12 place-items-center rounded-xl bg-brand/10 text-2xl">{feature.icon}</span>
                  <h3 className="mt-5 text-lg font-semibold text-ink">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="peran">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Satu ekosistem</span>
              <h2 className="mt-3 font-[family-name:var(--font-fraunces)] text-4xl leading-tight font-medium text-ink sm:text-[46px]">Terhubung untuk setiap peran.</h2>
              <p className="mt-4 text-base leading-7 text-muted">Setiap anggota sekolah mendapat ruang yang sesuai untuk mendukung proses pendidikan.</p>
            </div>
            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {roles.map((role, index) => (
                <article className="flex min-h-[210px] flex-col rounded-xl border border-line p-5" key={role.id}>
                  <span aria-hidden="true" className="grid size-10 place-items-center rounded-full bg-brand/10 font-[family-name:var(--font-fraunces)] text-lg font-semibold text-brand">0{index + 1}</span>
                  <h3 className="mt-5 text-lg font-semibold text-ink">{role.name}</h3>
                  <p className="mt-1 flex-1 text-sm leading-5 text-muted">{role.description}</p>
                  <button
                    className="mt-5 self-start text-xs font-bold text-brand transition hover:text-brand-dark"
                    onClick={() => {
                      setLoginOpen(true);
                      setInitialRole(role.id);
                    }}
                    type="button"
                  >
                    Masuk sebagai {role.name} <span aria-hidden="true">→</span>
                  </button>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-line bg-surface/70" id="tentang">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-20 sm:px-8 sm:py-24 md:grid-cols-[0.8fr_1.2fr] md:gap-16">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Tentang EduLMS</span>
              <h2 className="mt-3 font-[family-name:var(--font-fraunces)] text-4xl leading-tight font-medium text-ink">Dirancang untuk Ekosistem Pendidikan Modern</h2>
            </div>
            <div className="space-y-5 text-base leading-7 text-muted">
              <p>EduLMS membantu sekolah menyatukan berbagai kegiatan akademik ke dalam alur digital yang lebih tertata. Materi, tugas, ujian, dan hasil belajar dapat dikelola dalam satu platform yang mudah digunakan.</p>
              <p>Dengan ruang yang terhubung untuk setiap peran, guru dapat fokus mendampingi pembelajaran, siswa lebih mudah mengikuti prosesnya, dan sekolah memperoleh gambaran akademik yang lebih menyeluruh.</p>
            </div>
          </div>
        </section>

        <section className="bg-brand-dark text-white">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-7 px-5 py-14 sm:px-8 md:flex-row md:items-center md:py-16">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/70">Mulai langkah berikutnya</p>
              <h2 className="mt-3 max-w-2xl font-[family-name:var(--font-fraunces)] text-3xl leading-tight font-medium sm:text-4xl">Wujudkan pengalaman belajar yang lebih terhubung.</h2>
            </div>
            <button
              className="shrink-0 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-brand-dark transition hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              onClick={() => {
                setLoginOpen(true);
                setInitialRole(undefined);
              }}
              type="button"
            >
              Masuk ke EduLMS <span aria-hidden="true" className="ml-2">→</span>
            </button>
          </div>
        </section>
      </main>

      <footer className="bg-ink text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.5fr_1fr_1fr] md:gap-14">
          <div>
            <a className="inline-flex items-center gap-2.5" href="#beranda">
              <span className="grid size-9 place-items-center rounded-lg bg-brand text-lg font-bold">e</span>
              <span className="font-[family-name:var(--font-fraunces)] text-xl font-semibold">EduLMS</span>
            </a>
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/65">Platform pembelajaran digital untuk menghubungkan siswa, guru, dan seluruh ekosistem sekolah.</p>
          </div>
          <div>
            <h2 className="text-sm font-semibold">Jelajahi</h2>
            <ul className="mt-4 space-y-3 text-sm text-white/65">
              <li><a className="transition hover:text-white" href="#fitur">Fitur</a></li>
              <li><a className="transition hover:text-white" href="#statistik">Statistik</a></li>
              <li><a className="transition hover:text-white" href="#tentang">Tentang Kami</a></li>
            </ul>
          </div>
          <div>
            <h2 className="text-sm font-semibold">Akses</h2>
            <ul className="mt-4 space-y-3 text-sm text-white/65">
              <li><button className="transition hover:text-white" onClick={() => { setLoginOpen(true); setInitialRole(undefined); }} type="button">Masuk ke EduLMS</button></li>
              <li><a className="transition hover:text-white" href="#peran">Peran Pengguna</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/15">
          <div className="mx-auto max-w-7xl px-5 py-5 text-xs text-white/55 sm:px-8">© 2026 EduLMS. Semua hak dilindungi.</div>
        </div>
      </footer>

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setLoginOpen(false)}
        initialRole={initialRole}
      />
    </>
  );
}