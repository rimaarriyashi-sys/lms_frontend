"use client";

import { useState } from "react";

interface HeaderProps {
  onOpenLogin: () => void;
}

const navigation = [
  { label: "Fitur", href: "#fitur" },
  { label: "Jurusan", href: "#jurusan" },
  { label: "Peran", href: "#peran" },
  { label: "Tentang", href: "#tentang" },
  { label: "FAQ", href: "#faq" },
];

export default function Header({ onOpenLogin }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function handleNavigation() {
    setIsMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-line/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
        <a
          aria-label="NexaEdu, beranda"
          className="flex items-center gap-2.5"
          href="#beranda"
          onClick={handleNavigation}
        >
          <span className="grid size-10 place-items-center rounded-xl bg-brand font-[family-name:var(--font-fraunces)] text-sm font-bold text-white">
            NE
          </span>
          <span>
            <span className="block font-[family-name:var(--font-fraunces)] text-[21px] font-semibold leading-none text-ink">
              NexaEdu
            </span>
            <span className="mt-1 block text-[10px] leading-none text-muted">
              LMS Sekolah
            </span>
          </span>
        </a>

        <nav
          aria-label="Navigasi utama"
          className="hidden items-center gap-8 text-sm font-medium text-ink/75 lg:flex"
        >
          {navigation.map((item) => (
            <a
              className="transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
              href={item.href}
              key={item.label}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            className="hidden rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:inline-flex"
            onClick={onOpenLogin}
            type="button"
          >
            Masuk
          </button>
          <button
            aria-controls="mobile-navigation"
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? "Tutup menu" : "Buka menu"}
            className="grid size-10 place-items-center rounded-lg border border-line text-ink transition hover:border-brand/40 hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand lg:hidden"
            onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
            type="button"
          >
            <svg
              aria-hidden="true"
              className="size-5"
              fill="none"
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
                <path
                  d="m6 6 12 12M18 6 6 18"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="1.8"
                />
              ) : (
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="1.8"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <nav
          aria-label="Navigasi seluler"
          className="border-t border-line bg-white px-5 py-4 lg:hidden"
          id="mobile-navigation"
        >
          <div className="mx-auto grid max-w-7xl gap-1 sm:px-3">
            {navigation.map((item) => (
              <a
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-surface hover:text-brand focus-visible:outline-2 focus-visible:outline-brand"
                href={item.href}
                key={item.label}
                onClick={handleNavigation}
              >
                {item.label}
              </a>
            ))}
            <button
              className="mt-2 rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:hidden"
              onClick={() => {
                handleNavigation();
                onOpenLogin();
              }}
              type="button"
            >
              Masuk
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}