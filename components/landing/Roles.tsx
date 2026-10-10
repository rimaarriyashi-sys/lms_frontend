"use client";

import type { LoginRole } from "@/components/LoginModal";
import Reveal from "@/components/landing/Reveal";

interface RolesProps {
  onOpenLogin: (role?: LoginRole) => void;
}

const roles: {
  id: LoginRole;
  name: string;
  description: string;
  permissions: string;
}[] = [
  {
    id: "admin",
    name: "Admin",
    description: "Mengelola akun dan kebutuhan data sekolah.",
    permissions: "Akun, kelas, jurusan, guru, mata pelajaran, dan jadwal.",
  },
  {
    id: "guru",
    name: "Guru",
    description: "Menyiapkan kegiatan dan memantau hasil belajar.",
    permissions: "Materi, tugas, kuis, penilaian, dan nilai per mapel.",
  },
  {
    id: "siswa",
    name: "Siswa",
    description: "Mengikuti pembelajaran dan melihat hasil belajar.",
    permissions: "Materi, tugas, projek, kuis, ujian, dan nilai.",
  },
  {
    id: "kurikulum",
    name: "Kurikulum",
    description: "Meninjau informasi akademik sekolah.",
    permissions: "Nilai, tugas, kuis, serta data guru dan siswa.",
  },
  {
    id: "kepsek",
    name: "Kepala Sekolah",
    description: "Melihat gambaran kegiatan akademik.",
    permissions: "Nilai, tugas, kuis, serta data guru dan siswa.",
  },
];

export default function Roles({ onOpenLogin }: RolesProps) {
  return (
    <section className="scroll-mt-24 bg-white" id="peran">
      <Reveal className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
            Ruang sesuai tanggung jawab
          </span>
          <h2 className="mt-3 font-[family-name:var(--font-fraunces)] text-3xl leading-tight font-medium text-ink sm:text-4xl lg:text-[46px]">
            Satu platform, lima peran.
          </h2>
          <p className="mt-4 text-sm leading-6 text-muted sm:text-base sm:leading-7">
            Setiap warga sekolah mendapat akses yang mendukung tugasnya dalam
            proses belajar.
          </p>
        </div>

        <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3 lg:gap-4 xl:grid-cols-5">
          {roles.map((role, index) => (
            <article
              className="flex min-h-[250px] flex-col rounded-2xl border border-line bg-white p-5 transition-colors hover:border-brand/40 sm:p-6"
              key={role.id}
            >
              <span className="grid size-10 place-items-center rounded-full bg-brand/10 font-[family-name:var(--font-fraunces)] text-sm font-semibold text-brand">
                0{index + 1}
              </span>
              <h3 className="mt-4 text-base font-semibold text-ink sm:text-lg">
                {role.name}
              </h3>
              <p className="mt-2 text-sm leading-5 text-muted">
                {role.description}
              </p>
              <p className="mt-4 flex-1 border-t border-line pt-3 text-xs leading-5 text-ink/70">
                {role.permissions}
              </p>
              <button
                className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-lg bg-brand/10 px-3.5 text-xs font-semibold text-brand transition-colors hover:bg-brand hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                onClick={() => onOpenLogin(role.id)}
                type="button"
              >
                Masuk sebagai {role.name}
                <span aria-hidden="true">→</span>
              </button>
            </article>
          ))}
        </div>
      </Reveal>
    </section>
  );
}