"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { apiFetch } from "@/lib/api";
import { clearAuth, getRoleId } from "@/lib/auth";
import type { User } from "@/types";

const navigation = [
  { label: "Dashboard", href: "/guru", icon: "dashboard" },
  { label: "Kelas & Mapel Saya", href: "/guru/teaching", icon: "class" },
  { label: "Materi", href: "/guru/materials", icon: "book" },
  { label: "Tugas & Projek", href: "/guru/assignments", icon: "assignment" },
  { label: "Kuis & Ujian", href: "/guru/quizzes", icon: "quiz" },
  { label: "Nilai", href: "/guru/grades", icon: "grade" },
  { label: "Data Siswa", href: "/guru/students", icon: "student" },
] as const;

type NavigationIconName = (typeof navigation)[number]["icon"];

function NavigationIcon({ name }: { name: NavigationIconName }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.7,
    viewBox: "0 0 24 24",
    "aria-hidden": true as const,
  };

  switch (name) {
    case "dashboard":
      return <svg {...common}><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></svg>;
    case "class":
      return <svg {...common}><path d="M4 5.5h16v14H4zM8 5.5V3.8h8v1.7M8 10h8M8 14h5" /></svg>;
    case "book":
      return <svg {...common}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21zM4 5.5v13M8 7h8M8 11h8" /></svg>;
    case "assignment":
      return <svg {...common}><path d="M8 4h8M9 3h6v3H9zM6 5H4v16h16V5h-2M8 11h8M8 15h5" /></svg>;
    case "quiz":
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M9.6 9a2.5 2.5 0 1 1 4.3 1.7c-1 .9-1.9 1.3-1.9 2.8M12 17.5v.1" /></svg>;
    case "grade":
      return <svg {...common}><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z" /></svg>;
    case "student":
      return <svg {...common}><path d="m2.5 9 9.5-5 9.5 5-9.5 5zM6 11v5c3.5 3 8.5 3 12 0v-5M21.5 9v6" /></svg>;
  }
}

function MenuIcon({ close = false }: { close?: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d={close ? "m6 6 12 12M18 6 6 18" : "M4 7h16M4 12h16M4 17h16"} />
    </svg>
  );
}

export default function GuruLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userName, setUserName] = useState("Guru");
  const [mobileMenuForPath, setMobileMenuForPath] = useState<string | null>(null);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const isMobileMenuOpen = mobileMenuForPath === pathname;

  useEffect(() => {
    if (getRoleId() !== 2) {
      router.replace("/");
      return;
    }

    let isMounted = true;

    async function loadTeacherName() {
      await Promise.resolve();
      if (!isMounted) return;
      setIsAuthorized(true);

      try {
        const response = await apiFetch<{ data: User }>("/api/me");
        if (isMounted && response.data.Name?.trim()) {
          setUserName(response.data.Name);
        }
      } catch {
        if (isMounted) setUserName("Guru");
      }
    }

    void loadTeacherName();
    return () => {
      isMounted = false;
    };
  }, [router]);

  function handleLogout() {
    clearAuth();
    router.push("/");
  }

  function toggleSidebar() {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      setIsDesktopSidebarOpen((isOpen) => !isOpen);
    } else {
      setMobileMenuForPath((currentPath) => currentPath === pathname ? null : pathname);
    }
  }

  if (!isAuthorized) return null;

  return (
    <div className="min-h-screen bg-surface text-ink">
      {isMobileMenuOpen && (
        <button
          type="button"
          aria-label="Tutup menu"
          className="fixed inset-0 z-30 bg-ink/40 lg:hidden"
          onClick={() => setMobileMenuForPath(null)}
        />
      )}
      <aside
        id="guru-sidebar"
        className={`fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col bg-brand px-5 py-6 text-white transition-transform duration-200 motion-reduce:transition-none ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} ${isDesktopSidebarOpen ? "lg:translate-x-0" : "lg:-translate-x-full"}`}
      >
        <Link href="/guru" className="mb-9 flex items-center gap-3" aria-label="NexaEdu Dashboard Guru">
          <span className="flex size-11 items-center justify-center rounded-xl bg-white/10 text-sm font-bold font-[family-name:var(--font-fraunces)]">NE</span>
          <span>
            <span className="block text-lg font-semibold leading-tight">NexaEdu</span>
            <span className="mt-1 block text-xs text-white/70">Guru</span>
          </span>
        </Link>

        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55">Menu utama</p>
        <nav aria-label="Navigasi guru" className="space-y-1">
          {navigation.map((item) => {
            const isActive = item.href === "/guru"
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuForPath(null)}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors motion-reduce:transition-none ${isActive ? "bg-white font-semibold text-brand-dark shadow-sm" : "text-white/80 hover:bg-white/10 hover:text-white"}`}
              >
                <span className="size-[18px] shrink-0"><NavigationIcon name={item.icon} /></span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-white/15 pt-5">
          <p className="truncate px-3 text-sm font-medium">{userName}</p>
          <p className="mt-1 px-3 text-xs text-white/65">Guru</p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 flex w-full items-center gap-3 rounded-lg bg-brand-dark px-3 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-dark/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none"
          >
            <svg aria-hidden="true" className="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 17l5-5-5-5M15 12H3M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
            </svg>
            Keluar
          </button>
        </div>
      </aside>

      <div className={`min-h-screen transition-[padding] duration-200 motion-reduce:transition-none ${isDesktopSidebarOpen ? "lg:pl-[260px]" : "lg:pl-0"}`}>
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-line bg-canvas px-5 sm:px-8">
          <button
            type="button"
            aria-controls="guru-sidebar"
            aria-label="Buka atau tutup sidebar"
            className="flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transition-none"
            onClick={toggleSidebar}
          >
            <span className="size-5"><MenuIcon close={isMobileMenuOpen} /></span>
          </button>
          <div className="flex items-center gap-3 sm:gap-5">
            <span aria-hidden="true" className="grid size-9 place-items-center rounded-full bg-brand/10 text-xs font-bold text-brand">
              {userName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}
            </span>
            <div className="text-right">
              <p className="max-w-36 truncate text-sm font-semibold">{userName}</p>
              <p className="text-xs text-muted">Guru</p>
            </div>
          </div>
        </header>
        <main className="px-5 py-7 sm:px-8 sm:py-9">{children}</main>
      </div>
    </div>
  );
}
