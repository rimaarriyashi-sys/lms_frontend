import Reveal from "@/components/landing/Reveal";

const facts = [
  { value: "6", label: "program keahlian" },
  { value: "36", label: "rombongan belajar" },
  { value: "5", label: "peran pengguna" },
];

export default function About() {
  return (
    <section className="scroll-mt-24 border-y border-line bg-surface/70" id="tentang">
      <Reveal className="mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:px-8 sm:py-20 md:grid-cols-[0.9fr_1.1fr] md:gap-14 lg:py-24">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
            Tentang NexaEdu
          </span>
          <h2 className="mt-3 font-[family-name:var(--font-fraunces)] text-3xl leading-tight font-medium text-ink sm:text-4xl lg:text-[46px]">
            Pembelajaran kejuruan yang lebih terhubung.
          </h2>
        </div>

        <div>
          <div className="space-y-4 text-sm leading-7 text-muted sm:text-base">
            <p>
              NexaEdu adalah platform pembelajaran terpadu untuk sekolah
              kejuruan. Materi, tugas, kuis, ujian, dan penilaian tersedia dalam
              satu ekosistem yang menghubungkan aktivitas belajar.
            </p>
            <p>
              Guru mengelola kegiatan belajar, siswa mengikuti pembelajaran,
              sementara Admin, Kurikulum, dan Kepala Sekolah memiliki akses
              sesuai tanggung jawab masing-masing.
            </p>
          </div>

          <dl className="mt-7 grid grid-cols-3 divide-x divide-line border-y border-line py-5">
            {facts.map((fact) => (
              <div className="px-2 first:pl-0 sm:px-4" key={fact.label}>
                <dt className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-brand sm:text-3xl">
                  {fact.value}
                </dt>
                <dd className="mt-1 text-[10px] leading-4 text-muted sm:text-xs">
                  {fact.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </Reveal>
    </section>
  );
}