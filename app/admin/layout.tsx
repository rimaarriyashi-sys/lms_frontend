"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { apiFetchList } from "@/lib/api";
import { clearAuth, getRoleId, getTokenPayload } from "@/lib/auth";
import type { User } from "@/types";

const navigation = [
  { label: "Dashboard", href: "/admin", icon: "dashboard" },
  { label: "Manajemen Akun", href: "/admin/users", icon: "users" },
  {
    label: "Kelas & Jurusan",
    icon: "class",
    children: [
      { label: "Kelas", href: "/admin/classes", icon: "class" },
      { label: "Jurusan", href: "/admin/majors", icon: "major" },
    ],
  },
  {
    label: "Guru & Mata Pelajaran",
    icon: "teacher",
    children: [
      { label: "Mata Pelajaran", href: "/admin/subjects", icon: "book" },
      { label: "Data Guru", href: "/admin/teachers", icon: "teacher" },
    ],
  },
  { label: "Data Siswa", href: "/admin/students", icon: "student" },
] as const;

type NavigationIconName =
  | "dashboard"
  | "users"
  | "class"
  | "major"
  | "book"
  | "teacher"
  | "student";

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

function MenuIcon({ close = false }: { close?: boolean }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d={close ? "m6 6 12 12M18 6 6 18" : "M4 7h16M4 12h16M4 17h16"} /></svg>;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userName, setUserName] = useState("Administrator");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (getRoleId() !== 1) {
      router.replace("/");
      return;
    }

    let isMounted = true;
    async function loadAdminName() {
      await Promise.resolve();
      if (!isMounted) return;
      setIsAuthorized(true);

      const payload = getTokenPayload();
      if (payload?.id) {
        try {
          const users = await apiFetchList<User>("/api/admin/users");
          const currentUser = users.find((user) => user.ID === payload.id);
          if (currentUser?.Name?.trim() && isMounted) {
            setUserName(currentUser.Name);
          }
        } catch {
        }
      }

    }

    void loadAdminName();
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
      setIsMobileMenuOpen((isOpen) => !isOpen);
    }
  }

  if (!isAuthorized) return null;

  return (
    <div className="min-h-screen bg-surface text-ink">
      {isMobileMenuOpen && <button type="button" aria-label="Tutup menu" className="fixed inset-0 z-30 bg-ink/40 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />}
      <aside id="admin-sidebar" className={`fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col bg-brand px-5 py-6 text-white transition-transform duration-200 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} ${isDesktopSidebarOpen ? "lg:translate-x-0" : "lg:-translate-x-full"}`}>
        <Link href="/admin" className="mb-9 flex items-center gap-3" aria-label="NexaEdu Dashboard Admin">
          <span className="flex size-11 items-center justify-center rounded-xl bg-white/10 text-sm font-bold font-[family-name:var(--font-fraunces)]">NE</span>
          <span>
            <span className="block text-lg font-semibold leading-tight">NexaEdu</span>
            <span className="mt-1 block text-xs text-white/70">Administrator</span>
          </span>
        </Link>

        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55">Menu utama</p>
        <nav aria-label="Navigasi admin" className="space-y-1">
          {navigation.map((item) => {
            if ("children" in item) {
              const activeChild = item.children.some((child) => pathname.startsWith(child.href));
              const groupId = `admin-group-${item.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
              const isExpanded = expandedGroups[item.label] ?? activeChild;

              return (
                <div key={item.label}>
                  <button
                    aria-controls={groupId}
                    aria-expanded={isExpanded}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${activeChild ? "bg-white/15 font-semibold text-white" : "text-white/80 hover:bg-white/10 hover:text-white"}`}
                    onClick={() => setExpandedGroups((current) => ({ ...current, [item.label]: !isExpanded }))}
                    type="button"
                  >
                    <span className="size-[18px] shrink-0"><NavigationIcon name={item.icon} /></span>
                    <span className="min-w-0 flex-1">{item.label}</span>
                    <svg aria-hidden="true" className={`size-4 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24">
                      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
                    </svg>
                  </button>
                  {isExpanded && (
                    <div className="ml-4 mt-1 space-y-1 border-l border-white/20 pl-3" id={groupId}>
                      {item.children.map((child) => {
                        const isActive = pathname.startsWith(child.href);
                        return (
                          <Link
                            aria-current={isActive ? "page" : undefined}
                            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${isActive ? "bg-white text-brand-dark font-semibold shadow-sm" : "text-white/75 hover:bg-white/10 hover:text-white"}`}
                            href={child.href}
                            key={child.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <span className="size-4 shrink-0"><NavigationIcon name={child.icon} /></span>
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

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
          <button type="button" onClick={handleLogout} className="mt-4 flex w-full items-center gap-3 rounded-lg bg-brand-dark px-3 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-dark/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
            <svg aria-hidden="true" className="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M10 17l5-5-5-5M15 12H3M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></svg>
            Keluar
          </button>
        </div>
      </aside>

      <div className={`min-h-screen transition-[padding] duration-200 ${isDesktopSidebarOpen ? "lg:pl-[260px]" : "lg:pl-0"}`}>
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-line bg-canvas px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <button type="button" aria-controls="admin-sidebar" aria-label="Buka atau tutup sidebar" className="flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand" onClick={toggleSidebar}>
              <span className="size-5"><MenuIcon close={isMobileMenuOpen || !isDesktopSidebarOpen} /></span>
            </button>
          </div>
          <div className="flex items-center gap-3 sm:gap-5">
            <span aria-hidden="true" className="grid size-9 place-items-center rounded-full bg-brand/10 text-xs font-bold text-brand">
              {userName
                .trim()
                .split(/\s+/)
                .slice(0, 2)
                .map((part) => part[0])
                .join("")
                .toUpperCase()}
            </span>
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