interface FooterProps {
  onOpenLogin: () => void;
}

const links = [
  { label: "Fitur", href: "#fitur" },
  { label: "Jurusan", href: "#jurusan" },
  { label: "Peran", href: "#peran" },
  { label: "Tentang", href: "#tentang" },
  { label: "FAQ", href: "#faq" },
];

export default function Footer({ onOpenLogin }: FooterProps) {
  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.3fr_0.8fr_0.9fr] md:gap-12 md:py-14">
        <div>
          <a
            aria-label="NexaEdu, kembali ke beranda"
            className="inline-flex items-center gap-3"
            href="#beranda"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-brand font-[family-name:var(--font-fraunces)] text-sm font-bold text-white">
              NE
            </span>
            <span>
              <span className="block font-[family-name:var(--font-fraunces)] text-xl font-semibold leading-none">
                NexaEdu
              </span>
              <span className="mt-1 block text-[10px] text-white/60">
                LMS Sekolah
              </span>
            </span>
          </a>
          <p className="mt-5 max-w-sm text-sm leading-6 text-white/70">
            Platform pembelajaran terpadu untuk sekolah kejuruan.
          </p>
        </div>

        <nav aria-label="Navigasi footer">
          <h2 className="text-sm font-semibold">Jelajahi</h2>
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm text-white/70">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  className="transition-colors hover:text-white focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
                  href={link.href}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-semibold">Akses & Kontak</h2>
          <button
            className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            onClick={onOpenLogin}
            type="button"
          >
            Masuk ke NexaEdu
            <span aria-hidden="true">→</span>
          </button>
          <a
            className="mt-4 block w-fit text-sm text-white/70 transition-colors hover:text-white focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            href="mailto:info@nexaedu.id"
          >
            info@nexaedu.id
          </a>
        </div>
      </div>

      <div className="border-t border-white/15">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-xs text-white/55 sm:px-8 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 NexaEdu. Semua hak dilindungi.</span>
          <a
            className="w-fit transition-colors hover:text-white focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            href="#beranda"
          >
            Kembali ke atas ↑
          </a>
        </div>
      </div>
    </footer>
  );
}