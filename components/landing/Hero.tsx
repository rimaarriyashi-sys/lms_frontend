import LandingIcon from "@/components/landing/LandingIcon";
import Reveal from "@/components/landing/Reveal";

interface HeroProps {
  onOpenLogin: () => void;
}

const highlights = [
  "Materi dan tugas terhubung",
  "Kuis dan penilaian terarah",
  "Akses sesuai peran",
];

export default function Hero({ onOpenLogin }: HeroProps) {
  return (
    <section
      className="relative isolate overflow-hidden bg-gradient-to-br from-brand/10 via-white to-white"
      id="beranda"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.16]"
        style={{
          backgroundImage:
            "radial-gradient(#986B95 0.8px, transparent 0.8px)",
          backgroundSize: "19px 19px",
          maskImage:
            "linear-gradient(to bottom right, black, transparent 78%)",
        }}
      />
      <Reveal className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-16 pt-14 sm:px-8 sm:pb-20 sm:pt-20 lg:grid-cols-[1fr_1fr] lg:gap-12 lg:py-24">
        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-brand shadow-sm">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-brand" />
            Platform pembelajaran untuk sekolah kejuruan
          </span>
          <h1 className="mt-6 max-w-[640px] font-[family-name:var(--font-fraunces)] text-[42px] leading-[1.08] font-medium text-ink sm:text-[54px] lg:text-[60px]">
            Pembelajaran vokasi,
            <br className="hidden sm:block" />
            <span className="text-brand">dalam satu ekosistem.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
            NexaEdu adalah platform pembelajaran terpadu untuk sekolah kejuruan,
            menyatukan materi, tugas, kuis, dan pemantauan akademik.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              onClick={onOpenLogin}
              type="button"
            >
              Masuk ke NexaEdu
              <span aria-hidden="true">→</span>
            </button>
            <a
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-line bg-white/70 px-5 py-3 text-sm font-semibold text-ink transition hover:border-brand/40 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              href="#fitur"
            >
              Lihat Fitur
            </a>
          </div>
          <ul className="mt-7 flex flex-col gap-3 text-sm text-ink/75 sm:flex-row sm:flex-wrap sm:gap-x-5 sm:gap-y-2">
            {highlights.map((highlight) => (
              <li className="inline-flex items-center gap-2" key={highlight}>
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-brand/10 text-brand">
                  <LandingIcon className="size-3.5" name="check" />
                </span>
                {highlight}
              </li>
            ))}
          </ul>
        </div>

        <div
          aria-label="Ilustrasi dashboard NexaEdu"
          className="relative mx-auto aspect-[1.08/1] min-h-[320px] w-full max-w-[590px] sm:min-h-[400px]"
          role="img"
        >
          <div className="absolute inset-[6%_5%_6%_5%] flex overflow-hidden rounded-2xl border border-line bg-white shadow-[0_26px_70px_-34px_rgba(17,17,17,0.35)] sm:inset-[5%_6%_6%_6%] sm:rounded-3xl">
            <aside
              aria-hidden="true"
              className="flex w-10 shrink-0 flex-col items-center gap-5 bg-brand px-2 py-4 sm:w-14 sm:gap-6 sm:py-5"
            >
              <span className="grid size-6 place-items-center rounded-md bg-white/20 font-[family-name:var(--font-fraunces)] text-xs font-bold text-white sm:size-7">
                NE
              </span>
              <span className="h-5 w-full rounded-md bg-white/35" />
              <span className="h-5 w-full rounded-md bg-white/15" />
              <span className="h-5 w-full rounded-md bg-white/15" />
              <span className="mt-auto h-5 w-full rounded-md bg-white/15" />
            </aside>
            <div className="min-w-0 flex-1 p-3 sm:p-5">
              <div className="flex items-center justify-between gap-2 border-b border-line pb-3 sm:pb-4">
                <div>
                  <p className="text-[8px] font-medium uppercase tracking-[0.12em] text-muted sm:text-[10px]">
                    Ruang belajar
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-ink sm:text-sm">
                    Ringkasan pembelajaran
                  </p>
                </div>
                <span className="size-6 rounded-full border border-brand/20 bg-brand/10 sm:size-8" />
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 sm:mt-4 sm:gap-3">
                {[
                  ["Materi", "Tersusun"],
                  ["Tugas", "Terpantau"],
                  ["Nilai", "Per mapel"],
                ].map(([label, detail]) => (
                  <div
                    className="rounded-lg border border-line bg-surface/70 p-2 sm:rounded-xl sm:p-3"
                    key={label}
                  >
                    <p className="text-[8px] text-muted sm:text-[10px]">{label}</p>
                    <p className="mt-1 truncate text-[9px] font-semibold text-ink sm:text-xs">
                      {detail}
                    </p>
                    <span className="mt-2 block h-1 w-4/5 rounded-full bg-brand/25" />
                  </div>
                ))}
              </div>

              <div className="mt-3 rounded-lg border border-line p-2.5 sm:mt-4 sm:rounded-xl sm:p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-semibold text-ink sm:text-xs">
                    Aktivitas belajar
                  </p>
                  <span className="h-1.5 w-10 rounded-full bg-brand/15 sm:w-14" />
                </div>
                <div className="mt-3 flex h-[76px] items-end gap-2 border-b border-line px-1 sm:h-[112px] sm:gap-3 sm:px-2">
                  {[38, 60, 46, 76, 55, 88, 67].map((height, index) => (
                    <span
                      aria-hidden="true"
                      className={`flex-1 rounded-t-sm ${index === 5 ? "bg-brand" : "bg-brand/25"}`}
                      key={index}
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="h-1.5 w-12 rounded-full bg-line sm:w-16" />
                  <span className="h-1.5 w-8 rounded-full bg-line sm:w-12" />
                  <span className="h-1.5 w-10 rounded-full bg-line sm:w-14" />
                  <span className="h-1.5 w-7 rounded-full bg-line sm:w-10" />
                </div>
              </div>

              <div className="mt-3 hidden items-center gap-2 rounded-lg bg-surface p-2.5 sm:flex">
                <span className="grid size-7 place-items-center rounded-md bg-brand/10 text-brand">
                  <LandingIcon className="size-4" name="tasks" />
                </span>
                <span className="h-2 w-24 rounded-full bg-ink/10" />
                <span className="ml-auto h-2 w-12 rounded-full bg-brand/25" />
              </div>
            </div>
          </div>

          <div className="absolute right-0 top-[12%] rounded-xl border border-line bg-white px-3.5 py-3 shadow-[0_14px_40px_-20px_rgba(17,17,17,0.35)] sm:right-0 sm:top-[13%] sm:rounded-2xl sm:px-5 sm:py-4">
            <p className="text-[10px] font-medium text-muted sm:text-xs">
              Lingkungan belajar
            </p>
            <p className="mt-1 font-[family-name:var(--font-fraunces)] text-lg font-semibold leading-tight text-ink sm:text-2xl">
              36 rombel aktif
            </p>
          </div>
          <div className="absolute bottom-[8%] left-0 rounded-xl border border-line bg-white px-3.5 py-3 shadow-[0_14px_40px_-20px_rgba(17,17,17,0.35)] sm:bottom-[8%] sm:rounded-2xl sm:px-5 sm:py-4">
            <p className="text-[10px] font-medium text-muted sm:text-xs">
              Pilihan keahlian
            </p>
            <p className="mt-1 font-[family-name:var(--font-fraunces)] text-lg font-semibold leading-tight text-ink sm:text-2xl">
              6 jurusan
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}