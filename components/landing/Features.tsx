import LandingIcon, {
  type LandingIconName,
} from "@/components/landing/LandingIcon";
import Reveal from "@/components/landing/Reveal";

const features: {
  icon: LandingIconName;
  title: string;
  description: string;
}[] = [
  {
    icon: "book",
    title: "Manajemen Materi",
    description:
      "Susun dan bagikan bahan ajar dalam satu ruang yang mudah diakses siswa.",
  },
  {
    icon: "tasks",
    title: "Tugas & Projek",
    description:
      "Berikan tugas, terima hasil pekerjaan, dan tinjau progres pembelajaran.",
  },
  {
    icon: "quiz",
    title: "Kuis & Ujian Online",
    description:
      "Siapkan evaluasi digital dan kelola pengerjaan kuis dengan lebih teratur.",
  },
  {
    icon: "grades",
    title: "Generate Nilai per Mapel",
    description:
      "Rangkum capaian siswa menjadi nilai yang siap ditinjau per mata pelajaran.",
  },
  {
    icon: "roles",
    title: "Akses 5 Peran",
    description:
      "Sediakan ruang yang sesuai untuk Admin, Guru, Siswa, Kurikulum, dan Kepsek.",
  },
  {
    icon: "reports",
    title: "Pemantauan & Laporan",
    description:
      "Bantu sekolah meninjau aktivitas dan hasil belajar dalam satu alur.",
  },
];

export default function Features() {
  return (
    <section className="scroll-mt-24 bg-surface/70" id="fitur">
      <Reveal className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
            Fitur pembelajaran
          </span>
          <h2 className="mt-3 font-[family-name:var(--font-fraunces)] text-3xl leading-tight font-medium text-ink sm:text-4xl lg:text-[46px]">
            Kegiatan belajar dalam satu alur.
          </h2>
          <p className="mt-4 text-sm leading-6 text-muted sm:text-base sm:leading-7">
            Perangkat yang saling terhubung untuk membantu proses belajar
            mengajar berjalan lebih terarah.
          </p>
        </div>

        <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3 lg:gap-4">
          {features.map((feature) => (
            <article
              className="rounded-2xl border border-line bg-white p-5 transition duration-200 hover:-translate-y-1 hover:border-brand/40 motion-reduce:transform-none motion-reduce:transition-none sm:p-6"
              key={feature.title}
            >
              <span className="grid size-11 place-items-center rounded-xl bg-brand/10 text-brand">
                <LandingIcon name={feature.icon} />
              </span>
              <h3 className="mt-4 text-base font-semibold text-ink sm:text-lg">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </Reveal>
    </section>
  );
}