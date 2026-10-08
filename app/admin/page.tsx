"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetchList } from "@/lib/api";
import type { Class, Subject, User } from "@/types";

interface DashboardCounts {
  teachers: number;
  students: number;
  classes: number;
  subjects: number;
}

const activities = [
  { text: "Akun guru baru ditambahkan", time: "Baru saja", icon: "user" },
  { text: "Data kelas diperbarui", time: "15 menit lalu", icon: "class" },
  { text: "Mata pelajaran baru dibuat", time: "1 jam lalu", icon: "book" },
  { text: "Akun siswa berhasil diimpor", time: "3 jam lalu", icon: "student" },
  { text: "Jurusan diperbarui", time: "Kemarin", icon: "major" },
] as const;

const shortcuts = [
  { label: "Tambah Akun Pengguna", href: "/admin/users", icon: "user" },
  { label: "Tambah Kelas Baru", href: "/admin/classes", icon: "class" },
  { label: "Assign Guru ke Mapel", href: "/admin/subjects", icon: "book" },
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

function DashboardIcon({ name }: { name: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, strokeWidth: 1.7, viewBox: "0 0 24 24", "aria-hidden": true as const };

  switch (name) {
    case "users":
    case "user":
      return <svg {...common}><circle cx="9" cy="8" r="3" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0M17 8h4M19 6v4M17 16h4M19 14v4" /></svg>;
    case "class":
      return <svg {...common}><path d="M4 5.5h16v14H4zM8 5.5V3.8h8v1.7M8 10h8M8 14h5" /></svg>;
    case "book":
      return <svg {...common}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21zM4 5.5v13M8 7h8M8 11h8" /></svg>;
    case "student":
      return <svg {...common}><path d="m2.5 9 9.5-5 9.5 5-9.5 5zM6 11v5c3.5 3 8.5 3 12 0v-5M21.5 9v6" /></svg>;
    default:
      return <svg {...common}><path d="M4 20V8l8-4 8 4v12M2.5 20h19M8 10v2M12 10v2M16 10v2M8 15v2M12 15v2M16 15v2" /></svg>;
  }
}

function LoadingValue() {
  return <span className="inline-block h-8 w-16 animate-pulse rounded bg-line" aria-label="Memuat" />;
}

export default function AdminDashboardPage() {
  const [userName, setUserName] = useState("Administrator");
  const [counts, setCounts] = useState<DashboardCounts>({ teachers: 0, students: 0, classes: 0, subjects: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [hasFetchError, setHasFetchError] = useState(false);

  useEffect(() => {
    void Promise.resolve().then(() => setUserName(readUserName()));

    async function loadDashboard() {
      const [usersResult, classesResult, subjectsResult] = await Promise.allSettled([
        apiFetchList<User>("/api/admin/users"),
        apiFetchList<Class>("/api/admin/classes"),
        apiFetchList<Subject>("/api/subjects"),
      ]);

      let fetchFailed = false;
      setCounts({
        teachers: usersResult.status === "fulfilled"
          ? usersResult.value.filter((user) => user.RoleID === 2).length
          : (fetchFailed = true, 0),
        students: usersResult.status === "fulfilled"
          ? usersResult.value.filter((user) => user.RoleID === 3).length
          : (fetchFailed = true, 0),
        classes: classesResult.status === "fulfilled"
          ? classesResult.value.length
          : (fetchFailed = true, 0),
        subjects: subjectsResult.status === "fulfilled"
          ? subjectsResult.value.length
          : (fetchFailed = true, 0),
      });
      setHasFetchError(fetchFailed);
      setIsLoading(false);
    }

    void loadDashboard();
  }, []);

  const statistics = [
    { label: "Total Guru", value: counts.teachers, icon: "users" },
    { label: "Total Siswa", value: counts.students, icon: "student" },
    { label: "Total Kelas", value: counts.classes, icon: "class" },
    { label: "Mata Pelajaran", value: counts.subjects, icon: "book" },
  ];

  return (
    <div className="mx-auto max-w-[1440px]">
      <section className="mb-7">
        <p className="mb-1 text-sm font-medium text-brand">Ringkasan sekolah</p>
        <h2 className="text-2xl font-semibold tracking-normal font-[family-name:var(--font-fraunces)] sm:text-3xl">Selamat datang kembali, {userName}</h2>
        <p className="mt-2 text-sm text-muted">Pantau aktivitas dan data akademik sekolah dari satu tempat.</p>
      </section>

      {hasFetchError && <p role="status" className="mb-5 rounded-lg border border-line bg-canvas px-4 py-3 text-sm text-muted">Sebagian data belum dapat dimuat. Coba muat ulang halaman.</p>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.9fr)]">
        <div className="space-y-6">
          <section aria-label="Statistik sekolah" className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {statistics.map((statistic) => (
              <article key={statistic.label} className="min-w-0 rounded-xl border border-line bg-canvas p-4 shadow-[0_2px_10px_rgba(17,17,17,0.04)] sm:p-5">
                <span className="mb-4 flex size-10 items-center justify-center rounded-full bg-brand/10 text-brand">
                  <span className="size-5"><DashboardIcon name={statistic.icon} /></span>
                </span>
                <p className="text-2xl font-semibold tabular-nums font-[family-name:var(--font-fraunces)] sm:text-3xl">{isLoading ? <LoadingValue /> : statistic.value.toLocaleString("id-ID")}</p>
                <p className="mt-1 text-xs leading-5 text-muted sm:text-sm">{statistic.label}</p>
              </article>
            ))}
          </section>

          <section className="rounded-xl border border-line bg-canvas p-5 shadow-[0_2px_10px_rgba(17,17,17,0.04)] sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold font-[family-name:var(--font-fraunces)]">Aktivitas Terbaru</h3>
                <p className="mt-1 text-sm text-muted">Catatan aktivitas administrasi</p>
              </div>
              <span className="hidden rounded-full bg-surface px-3 py-1 text-xs text-muted sm:inline-flex">5 aktivitas</span>
            </div>
            <ul className="divide-y divide-line">
              {activities.map((activity) => (
                <li key={activity.text} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand"><span className="size-[18px]"><DashboardIcon name={activity.icon} /></span></span>
                  <p className="min-w-0 flex-1 text-sm font-medium">{activity.text}</p>
                  <time className="shrink-0 text-xs text-muted">{activity.time}</time>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-line bg-canvas p-5 shadow-[0_2px_10px_rgba(17,17,17,0.04)] sm:p-6">
            <h3 className="text-lg font-semibold font-[family-name:var(--font-fraunces)]">Aksi Cepat</h3>
            <div className="mt-4 space-y-2">
              {shortcuts.map((shortcut) => (
                <Link key={shortcut.href} href={shortcut.href} className="group flex min-h-11 items-center gap-3 rounded-lg border border-line px-3 py-2.5 text-sm font-medium transition-colors hover:border-brand/40 hover:bg-surface">
                  <span className="size-[18px] shrink-0 text-brand"><DashboardIcon name={shortcut.icon} /></span>
                  <span className="min-w-0 flex-1">{shortcut.label}</span>
                  <svg aria-hidden="true" className="size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </Link>
              ))}
              <button type="button" disabled className="flex min-h-11 w-full items-center gap-3 rounded-lg border border-line px-3 py-2.5 text-left text-sm font-medium text-muted/70" aria-disabled="true">
                <span className="size-[18px] shrink-0"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M7 3h7l5 5v13H7zM14 3v6h5M10 14h6M10 18h6" /></svg></span>
                <span className="min-w-0 flex-1">Export Laporan</span>
                <span className="text-[10px] font-medium uppercase tracking-normal">Segera</span>
              </button>
            </div>
          </section>

          <section className="rounded-xl border border-line bg-canvas p-5 shadow-[0_2px_10px_rgba(17,17,17,0.04)] sm:p-6">
            <div className="mb-5">
              <h3 className="text-lg font-semibold font-[family-name:var(--font-fraunces)]">Ringkasan</h3>
              <p className="mt-1 text-sm text-muted">Total anggota terdaftar</p>
            </div>
            <div className="space-y-5">
              {[{ label: "Guru Aktif", value: counts.teachers }, { label: "Siswa Aktif", value: counts.students }].map((item) => (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium">{item.label}</span>
                    <span className="tabular-nums text-muted">{isLoading ? "Memuat" : `${item.value.toLocaleString("id-ID")} / ${item.value.toLocaleString("id-ID")}`}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface" role="progressbar" aria-label={item.label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={isLoading ? 0 : 100}>
                    <div className={`h-full rounded-full bg-brand transition-[width] duration-500 ${isLoading ? "w-1/3 animate-pulse" : "w-full"}`} />
                  </div>
                  <p className="mt-1.5 text-right text-xs text-muted">{isLoading ? "Memuat data" : "100% terdaftar"}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}