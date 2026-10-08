"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { clearAuth, getRoleId } from "@/lib/auth";

const navigation = [
  { label: "Dashboard", href: "/admin", icon: "dashboard" },
  { label: "Manajemen Akun", href: "/admin/users", icon: "users" },
  { label: "Kelas", href: "/admin/classes", icon: "class" },
  { label: "Jurusan", href: "/admin/majors", icon: "major" },
  { label: "Mata Pelajaran", href: "/admin/subjects", icon: "book" },
  { label: "Data Guru", href: "/admin/teachers", icon: "teacher" },
  { label: "Data Siswa", href: "/admin/students", icon: "student" },
] as const;

function readUserName(): string {
  const storedName = localStorage.getItem("name") ?? localStorage.getItem("user_name");
  if (storedName) return storedName;

  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    try {
      const user: unknown = JSON.parse(storedUser);
      if (typeof user === "object" && user !== null) {
        const name = "Name" in user ? user.Name : "name" in user ? user.name : null;
        if (typeof name === "string" && name.trim()) return name;
      }
    } catch {
      return "Administrator";
    }
  }

  return "Administrator";
}

function NavigationIcon({ name }: { name: (typeof navigation)[number]["icon"] }) {
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
    case "users":
      return <svg {...common}><circle cx="9" cy="8" r="3" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 5.5a3 3 0 0 1 0 5.8M17 14a5 5 0 0 1 3.5 5" /></svg>;
    case "class":
      return <svg {...common}><path d="M4 5.5h16v14H4zM8 5.5V3.8h8v1.7M8 10h8M8 14h5" /></svg>;
    case "major":
      return <svg {...common}><path d="M4 20V8l8-4 8 4v12M2.5 20h19M8 10v2M12 10v2M16 10v2M8 15v2M12 15v2M16 15v2" /></svg>;
    case "book":
      return <svg {...common}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21zM4 5.5v13M8 7h8M8 11h8" /></svg>;
    case "teacher":
      return <svg {...common}><circle cx="10" cy="8" r="3" /><path d="M4 20a6 6 0 0 1 12 0M17 8h4M19 6v4M17 15l2 2 3-4" /></svg>;
    case "student":
      return <svg {...common}><path d="m2.5 9 9.5-5 9.5 5-9.5 5zM6 11v5c3.5 3 8.5 3 12 0v-5M21.5 9v6" /></svg>;
  }
}

function BellIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>;
}

function MenuIcon({ close = false }: { close?: boolean }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d={close ? "m6 6 12 12M18 6 6 18" : "M4 7h16M4 12h16M4 17h16"} /></svg>;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userName, setUserName] = useState("Administrator");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (getRoleId() !== 1) {
      router.replace("/");
      return;
    }

    void Promise.resolve().then(() => {
      setUserName(readUserName());
      setIsAuthorized(true);
    });
  }, [router]);

  function handleLogout() {
    clearAuth();
    router.push("/");
  }

  if (!isAuthorized) return null;

  return (
    <div className="min-h-screen bg-surface text-ink">
      {isMobileMenuOpen && <button type="button" aria-label="Tutup menu" className="fixed inset-0 z-30 bg-ink/40 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col bg-brand px-5 py-6 text-white transition-transform duration-200 lg:translate-x-0 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <Link href="/admin" className="mb-9 flex items-center gap-3" aria-label="EduLMS Dashboard Admin">
          <span className="flex size-11 items-center justify-center rounded-xl bg-white/10 text-2xl font-semibold font-[family-name:var(--font-fraunces)]">e</span>
          <span>
            <span className="block text-lg font-semibold leading-tight">EduLMS</span>
            <span className="mt-1 block text-xs text-white/70">Administrator</span>
          </span>
        </Link>

        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55">Menu utama</p>
        <nav aria-label="Navigasi admin" className="space-y-1">
          {navigation.map((item) => {
            const isActive = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)} aria-current={isActive ? "page" : undefined} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${isActive ? "bg-white text-brand-dark font-semibold shadow-sm" : "text-white/80 hover:bg-white/10 hover:text-white"}`}>
                <span className="size-[18px] shrink-0"><NavigationIcon name={item.icon} /></span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-white/15 pt-5">
          <p className="truncate px-3 text-sm font-medium">{userName}</p>
          <p className="mt-1 px-3 text-xs text-white/65">Administrator</p>
          <button type="button" onClick={handleLogout} className="mt-4 flex w-full items-center gap-3 rounded-lg border border-white/20 px-3 py-2.5 text-sm text-white/85 transition-colors hover:bg-white/10 hover:text-white">
            <svg aria-hidden="true" className="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M10 17l5-5-5-5M15 12H3M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></svg>
            Keluar
          </button>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-[260px]">
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-line bg-canvas px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <button type="button" aria-label={isMobileMenuOpen ? "Tutup menu" : "Buka menu"} className="flex size-9 items-center justify-center rounded-lg text-muted hover:bg-surface lg:hidden" onClick={() => setIsMobileMenuOpen((open) => !open)}>
              <span className="size-5"><MenuIcon close={isMobileMenuOpen} /></span>
            </button>
            <h1 className="text-lg font-semibold font-[family-name:var(--font-fraunces)] sm:text-xl">Dashboard Admin</h1>
          </div>
          <div className="flex items-center gap-3 sm:gap-5">
            <button type="button" aria-label="Notifikasi" className="relative flex size-9 items-center justify-center rounded-full text-muted hover:bg-surface">
              <span className="size-5"><BellIcon /></span>
              <span className="absolute right-2 top-2 size-1.5 rounded-full bg-brand" />
            </button>
            <span className="hidden h-8 border-l border-line sm:block" />
            <div className="text-right">
              <p className="max-w-36 truncate text-sm font-semibold">{userName}</p>
              <p className="text-xs text-muted">Administrator</p>
            </div>
          </div>
        </header>
        <main className="px-5 py-7 sm:px-8 sm:py-9">{children}</main>
      </div>
    </div>
  );
}