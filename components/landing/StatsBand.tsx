import Reveal from "@/components/landing/Reveal";

const statistics = [
  { value: "6", label: "Jurusan" },
  { value: "36", label: "Rombel" },
  { value: "5", label: "Peran Pengguna" },
  { value: "1", label: "Platform Terpadu" },
];

export default function StatsBand() {
  return (
    <section
      aria-label="Ringkasan ekosistem sekolah"
      className="bg-brand-dark text-white"
      id="statistik"
    >
      <Reveal className="mx-auto grid max-w-7xl grid-cols-2 gap-y-8 px-5 py-10 sm:px-8 sm:py-12 lg:grid-cols-4 lg:gap-4 lg:py-14">
        {statistics.map((statistic) => (
          <div className="text-center" key={statistic.label}>
            <p className="font-[family-name:var(--font-fraunces)] text-4xl font-semibold sm:text-5xl">
              {statistic.value}
            </p>
            <p className="mt-2 text-xs text-white/75 sm:text-sm">
              {statistic.label}
            </p>
          </div>
        ))}
      </Reveal>
    </section>
  );
}