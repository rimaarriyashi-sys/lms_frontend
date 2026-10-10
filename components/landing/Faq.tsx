import Reveal from "@/components/landing/Reveal";

const questions = [
  {
    question: "Apa itu NexaEdu?",
    answer:
      "NexaEdu adalah platform pembelajaran terpadu untuk sekolah kejuruan yang menyatukan materi, tugas, kuis, ujian, dan pemantauan akademik.",
  },
  {
    question: "Siapa saja yang dapat menggunakan NexaEdu?",
    answer:
      "NexaEdu menyediakan akses untuk lima peran: Admin, Guru, Siswa, Kurikulum, dan Kepala Sekolah. Setiap peran memiliki akses sesuai tugasnya.",
  },
  {
    question: "Apakah saya bisa membuat akun sendiri?",
    answer:
      "Tidak ada pendaftaran publik. Akun pengguna dibuat dan dikelola oleh Admin sekolah.",
  },
  {
    question: "Jurusan dan tingkat kelas apa yang didukung?",
    answer:
      "NexaEdu mendukung PPLG, DKV, TJKT, BDR, MPLB, dan PH. Setiap jurusan memiliki tingkat X, XI, dan XII, dengan dua kelas pada tiap tingkat.",
  },
  {
    question: "Bagaimana siswa mengakses materi dan tugas?",
    answer:
      "Setelah masuk menggunakan akun sekolah, siswa dapat mengakses materi, mengikuti kuis atau ujian, mengumpulkan tugas dan projek, serta melihat nilai yang tersedia.",
  },
  {
    question: "Siapa yang dapat melihat nilai siswa?",
    answer:
      "Guru dapat mengelola penilaian. Siswa dapat melihat nilai miliknya, sedangkan Kurikulum dan Kepala Sekolah dapat meninjau data nilai secara baca-saja.",
  },
];

export default function Faq() {
  return (
    <section className="scroll-mt-24 bg-white" id="faq">
      <Reveal className="mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16 lg:py-24">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
            Pertanyaan umum
          </span>
          <h2 className="mt-3 font-[family-name:var(--font-fraunces)] text-3xl leading-tight font-medium text-ink sm:text-4xl">
            Ada yang ingin diketahui?
          </h2>
          <p className="mt-4 text-sm leading-6 text-muted sm:text-base sm:leading-7">
            Informasi singkat tentang akses dan kegiatan belajar di NexaEdu.
          </p>
        </div>

        <div className="divide-y divide-line border-y border-line">
          {questions.map((item) => (
            <details className="group py-4 sm:py-5" key={item.question}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-ink marker:hidden focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand sm:text-base [&::-webkit-details-marker]:hidden">
                {item.question}
                <svg
                  aria-hidden="true"
                  className="size-4 shrink-0 text-brand transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="m6 9 6 6 6-6"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                  />
                </svg>
              </summary>
              <p className="max-w-2xl pt-3 pr-7 text-sm leading-6 text-muted">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </Reveal>
    </section>
  );
}