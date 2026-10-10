import Reveal from "@/components/landing/Reveal";
import { MAJORS } from "@/lib/majors";

export default function Majors() {
  return (
    <section className="scroll-mt-24 bg-white" id="jurusan">
      <Reveal className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
            Pilihan program keahlian
          </span>
          <h2 className="mt-3 font-[family-name:var(--font-fraunces)] text-3xl leading-tight font-medium text-ink sm:text-4xl lg:text-[46px]">
            Enam Jurusan, Satu Ekosistem
          </h2>
          <p className="mt-4 text-sm leading-6 text-muted sm:text-base sm:leading-7">
            Ruang pembelajaran terhubung untuk setiap bidang keahlian.
          </p>
        </div>

        <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3 lg:gap-4">
          {MAJORS.map((major) => (
            <article
              className="flex min-h-[222px] flex-col rounded-2xl border border-line bg-white p-5 transition-colors hover:border-brand/40 sm:p-6"
              key={major.code}
            >
              <span className="inline-flex self-start rounded-md bg-brand px-2.5 py-1 font-mono text-xs font-bold text-white">
                {major.code}
              </span>
              <h3 className="mt-4 text-base font-semibold leading-6 text-ink sm:text-lg">
                {major.name}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-muted">
                {major.description}
              </p>
              <p className="mt-5 border-t border-line pt-3 text-xs font-medium text-muted">
                Kelas X, XI, XII <span aria-hidden="true">·</span> 6 rombel
              </p>
            </article>
          ))}
        </div>
      </Reveal>
    </section>
  );
}