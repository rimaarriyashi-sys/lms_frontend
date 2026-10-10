"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import EmptyState from "@/components/admin/EmptyState";
import { apiFetchList } from "@/lib/api";
import { getTokenPayload } from "@/lib/auth";
import type { Class, Major, Subject, User } from "@/types";

interface DashboardSubject extends Subject {
  CreatedAt?: string;
}

interface DashboardData {
  users: User[];
  classes: Class[];
  subjects: DashboardSubject[];
  majors: Major[];
}

type DashboardSource = keyof DashboardData;
type DashboardIconName =
  | "teachers"
  | "students"
  | "classes"
  | "subjects"
  | "majors"
  | "account"
  | "classAdd"
  | "subjectAdd"
  | "import";

interface ActivityItem {
  id: string;
  title: string;
  detail: string;
  createdAt: string;
  href: string;
  icon: DashboardIconName;
}

const emptyData: DashboardData = {
  users: [],
  classes: [],
  subjects: [],
  majors: [],
};

function DashboardIcon({ name }: { name: DashboardIconName }) {
  const paths: Record<DashboardIconName, string[]> = {
    teachers: [
      "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
      "M2.5 21a6.5 6.5 0 0 1 13 0M16 8h5M18.5 5.5v5",
    ],
    students: [
      "m2.5 9 9.5-5 9.5 5-9.5 5z",
      "M6 11v5c3.5 3 8.5 3 12 0v-5M21.5 9v6",
    ],
    classes: ["M4 5h16v15H4z", "M8 5V3h8v2M8 10h8M8 14h5"],
    subjects: [
      "M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z",
      "M4 17a2.5 2.5 0 0 1 2.5-2.5H20M8 7h7M8 10h7",
    ],
    majors: [
      "M4 20V8l8-4 8 4v12M2.5 20h19",
      "M8 10v2M12 10v2M16 10v2M8 15v2M12 15v2M16 15v2",
    ],
    account: [
      "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
      "M4 21a8 8 0 0 1 16 0",
    ],
    classAdd: ["M4 5h16v15H4z", "M8 5V3h8v2M12 9v7M8.5 12.5h7"],
    subjectAdd: [
      "M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z",
      "M4 17a2.5 2.5 0 0 1 2.5-2.5H20M12 6v5M9.5 8.5h5",
    ],
    import: ["M12 15V3M8 7l4-4 4 4", "M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"],
  };

  return (
    <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24">
      {paths[name].map((path) => (
        <path
          d={path}
          key={path}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.7"
        />
      ))}
    </svg>
  );
}

function StatSkeleton() {
  return (
    <span
      aria-label="Memuat statistik"
      className="block h-8 w-16 animate-pulse rounded bg-line sm:h-9"
      role="status"
    />
  );
}

function formatActivityDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function AdminDashboardContent() {
  const [data, setData] = useState<DashboardData>(emptyData);
  const [adminName, setAdminName] = useState("Administrator");
  const [isLoading, setIsLoading] = useState(true);
  const [unavailableSources, setUnavailableSources] = useState<DashboardSource[]>([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      const [usersResult, classesResult, subjectsResult, majorsResult] =
        await Promise.allSettled([
          apiFetchList<User>("/api/admin/users"),
          apiFetchList<Class>("/api/admin/classes"),
          apiFetchList<DashboardSubject>("/api/subjects"),
          apiFetchList<Major>("/api/admin/majors"),
        ]);

      if (!isMounted) return;

      const failures: string[] = [];
      const unavailable: DashboardSource[] = [];
      const users = usersResult.status === "fulfilled" ? usersResult.value : [];
      const classes = classesResult.status === "fulfilled" ? classesResult.value : [];
      const subjects = subjectsResult.status === "fulfilled" ? subjectsResult.value : [];
      const majors = majorsResult.status === "fulfilled" ? majorsResult.value : [];

      if (usersResult.status === "rejected") {
        failures.push("akun");
        unavailable.push("users");
      }
      if (classesResult.status === "rejected") {
        failures.push("kelas");
        unavailable.push("classes");
      }
      if (subjectsResult.status === "rejected") {
        failures.push("mata pelajaran");
        unavailable.push("subjects");
      }
      if (majorsResult.status === "rejected") {
        failures.push("jurusan");
        unavailable.push("majors");
      }

      setData({ users, classes, subjects, majors });
      setUnavailableSources(unavailable);
      const tokenId = getTokenPayload()?.id;
      const currentAdmin = users.find((user) => user.ID === tokenId);
      setAdminName(currentAdmin?.Name?.trim() || "Administrator");
      setLoadError(
        failures.length > 0
          ? `Sebagian data ${failures.join(", ")} belum dapat dimuat.`
          : "",
      );
      setIsLoading(false);
    }

    void loadDashboard();
    return () => {
      isMounted = false;
    };
  }, []);

  const isAvailable = (...sources: DashboardSource[]) =>
    sources.every((source) => !unavailableSources.includes(source));
  const teachers = data.users.filter((user) => user.RoleID === 2);
  const students = data.users.filter((user) => user.RoleID === 3);
  const recentActivities: ActivityItem[] = [
    ...data.users.flatMap((user) => user.CreatedAt
      ? [{
          id: `user-${user.ID}`,
          title: "Akun pengguna ditambahkan",
          detail: `${user.Name} · ${user.Email}`,
          createdAt: user.CreatedAt,
          href: "/admin/users",
          icon: "account" as const,
        }]
      : []),
    ...data.classes.flatMap((schoolClass) => schoolClass.CreatedAt
      ? [{
          id: `class-${schoolClass.ID}`,
          title: "Kelas ditambahkan",
          detail: schoolClass.ClassName,
          createdAt: schoolClass.CreatedAt,
          href: "/admin/classes",
          icon: "classAdd" as const,
        }]
      : []),
    ...data.subjects.flatMap((subject) => subject.CreatedAt
      ? [{
          id: `subject-${subject.ID}`,
          title: "Mata pelajaran ditambahkan",
          detail: subject.SubjectName,
          createdAt: subject.CreatedAt,
          href: "/admin/subjects",
          icon: "subjectAdd" as const,
        }]
      : []),
    ...data.majors.flatMap((major) => major.CreatedAt
      ? [{
          id: `major-${major.ID}`,
          title: "Jurusan ditambahkan",
          detail: major.MajorName,
          createdAt: major.CreatedAt,
          href: "/admin/majors",
          icon: "majors" as const,
        }]
      : []),
  ]
    .filter((activity) => !Number.isNaN(new Date(activity.createdAt).getTime()))
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, 5);

  const dataSummary = [
    {
      label: "Total pengguna",
      value: isAvailable("users") ? data.users.length : null,
      icon: "account" as const,
    },
    {
      label: "Guru",
      value: isAvailable("users") ? teachers.length : null,
      icon: "teachers" as const,
    },
    {
      label: "Siswa",
      value: isAvailable("users") ? students.length : null,
      icon: "students" as const,
    },
    {
      label: "Kelas",
      value: isAvailable("classes") ? data.classes.length : null,
      icon: "classes" as const,
    },
    {
      label: "Mata pelajaran",
      value: isAvailable("subjects") ? data.subjects.length : null,
      icon: "subjects" as const,
    },
    {
      label: "Jurusan",
      value: isAvailable("majors") ? data.majors.length : null,
      icon: "majors" as const,
    },
  ];

  const statistics: {
    label: string;
    value: number | null;
    icon: DashboardIconName;
  }[] = [
    { label: "Total Guru", value: isAvailable("users") ? teachers.length : null, icon: "teachers" },
    { label: "Total Siswa", value: isAvailable("users") ? students.length : null, icon: "students" },
    { label: "Total Kelas", value: isAvailable("classes") ? data.classes.length : null, icon: "classes" },
    { label: "Mata Pelajaran", value: isAvailable("subjects") ? data.subjects.length : null, icon: "subjects" },
    { label: "Jurusan", value: isAvailable("majors") ? data.majors.length : null, icon: "majors" },
  ];

  const quickActions: { label: string; href: string; icon: DashboardIconName }[] = [
    { label: "Tambah Akun", href: "/admin/users", icon: "account" },
    { label: "Kelas & Wali Kelas", href: "/admin/classes", icon: "classAdd" },
    { label: "Tambah Mata Pelajaran", href: "/admin/subjects", icon: "subjectAdd" },
    { label: "Import Data Excel", href: "/admin/users", icon: "import" },
  ];

  return (
    <div className="mx-auto max-w-[1440px]">
      <section className="mb-6 grid gap-6 rounded-xl bg-brand-dark px-5 py-6 text-white sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-7 sm:py-7">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
            Ringkasan sekolah
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-fraunces)] text-2xl leading-tight font-medium sm:text-3xl">
            Selamat datang kembali, {adminName}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">
            Kelola data akademik dan pantau ekosistem pembelajaran sekolah dalam
            satu ruang.
          </p>
        </div>
        <div className="flex items-center gap-3 border-t border-white/20 pt-4 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
          <span className="grid size-10 place-items-center rounded-lg bg-white/10">
            <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24">
              <rect x="3.5" y="5" width="17" height="16" rx="2" stroke="currentColor" strokeWidth="1.7" />
              <path d="M7.5 3v4M16.5 3v4M3.5 10h17" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
            </svg>
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/65">
              Tahun ajaran
            </p>
            <p className="mt-0.5 font-[family-name:var(--font-fraunces)] text-xl font-semibold">
              2026/2027
            </p>
          </div>
        </div>
      </section>

      {loadError && (
        <p className="mb-5 rounded-lg border border-brand/20 bg-brand/5 px-4 py-3 text-sm text-muted" role="status">
          {loadError} Ringkasan menampilkan sumber data yang berhasil dimuat.
        </p>
      )}

      <section
        aria-label="Statistik sekolah"
        className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5 xl:gap-4"
      >
        {statistics.map((statistic) => (
          <article className="group min-w-0 rounded-lg border border-line border-t-2 border-t-brand bg-canvas p-4 transition-shadow hover:shadow-[0_10px_30px_-22px_rgba(17,17,17,0.35)] sm:p-5" key={statistic.label}>
            <span className="mb-4 grid size-10 place-items-center rounded-lg bg-brand/10 text-brand">
              <DashboardIcon name={statistic.icon} />
            </span>
            {isLoading ? (
              <StatSkeleton />
            ) : (
              <p className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold tabular-nums text-ink sm:text-3xl">
                {statistic.value === null ? "—" : statistic.value.toLocaleString("id-ID")}
              </p>
            )}
            <p className="mt-1 text-xs leading-5 text-muted sm:text-sm">{statistic.label}</p>
          </article>
        ))}
      </section>

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <section className="min-w-0 rounded-lg border border-line bg-canvas p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-[family-name:var(--font-fraunces)] text-xl font-semibold text-ink">
                Aktivitas Terbaru
              </h2>
              <p className="mt-1 text-sm text-muted">
                Perubahan data yang tercatat di NexaEdu.
              </p>
            </div>
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
              <DashboardIcon name="classes" />
            </span>
          </div>
          {isLoading ? (
            <div aria-label="Memuat aktivitas terbaru" className="space-y-4" role="status">
              {Array.from({ length: 5 }, (_, index) => (
                <div className="flex items-center gap-3" key={index}>
                  <span className="size-9 animate-pulse rounded-lg bg-line" />
                  <span className="h-4 flex-1 animate-pulse rounded bg-line" />
                  <span className="h-3 w-20 animate-pulse rounded bg-line" />
                </div>
              ))}
            </div>
          ) : unavailableSources.length === 4 ? (
            <EmptyState
              description="Data aktivitas belum dapat dimuat. Coba muat ulang halaman."
              icon={<DashboardIcon name="classes" />}
              title="Aktivitas tidak tersedia"
            />
          ) : recentActivities.length === 0 ? (
            <EmptyState
              description="Belum ada perubahan data dengan waktu pencatatan untuk ditampilkan."
              icon={<DashboardIcon name="classes" />}
              title="Belum ada aktivitas terbaru"
            />
          ) : (
            <ul className="divide-y divide-line">
              {recentActivities.map((activity) => (
                <li className="flex items-center gap-3 py-3 first:pt-0 last:pb-0" key={activity.id}>
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
                    <DashboardIcon name={activity.icon} />
                  </span>
                  <Link
                    className="min-w-0 flex-1 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                    href={activity.href}
                  >
                    <span className="block truncate text-sm font-medium text-ink">
                      {activity.title}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted">
                      {activity.detail}
                    </span>
                  </Link>
                  <time className="shrink-0 text-right text-[10px] leading-4 text-muted sm:text-xs">
                    {formatActivityDate(activity.createdAt)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-5">
          <section className="rounded-lg border border-line bg-canvas p-5 sm:p-6">
            <div className="mb-4">
              <h2 className="font-[family-name:var(--font-fraunces)] text-xl font-semibold text-ink">
                Ringkasan
              </h2>
              <p className="mt-1 text-sm text-muted">Gambaran singkat data sekolah saat ini.</p>
            </div>
            {isLoading ? (
              <div aria-label="Memuat ringkasan" className="space-y-4" role="status">
                {Array.from({ length: 6 }, (_, index) => (
                  <div className="flex items-center gap-3" key={index}>
                    <span className="size-9 animate-pulse rounded-lg bg-line" />
                    <span className="h-4 flex-1 animate-pulse rounded bg-line" />
                    <span className="h-5 w-10 animate-pulse rounded bg-line" />
                  </div>
                ))}
              </div>
            ) : (
              <dl className="divide-y divide-line">
                {dataSummary.map((item) => (
                  <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0" key={item.label}>
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
                      <DashboardIcon name={item.icon} />
                    </span>
                    <dt className="min-w-0 flex-1 text-sm text-ink">{item.label}</dt>
                    <dd className="text-right text-sm font-semibold tabular-nums text-ink">
                      {item.value === null ? "—" : item.value.toLocaleString("id-ID")}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </section>

          <section className="rounded-lg border border-line bg-canvas p-5 sm:p-6">
            <h2 className="font-[family-name:var(--font-fraunces)] text-xl font-semibold text-ink">
              Aksi Cepat
            </h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              {quickActions.map((action) => (
                <Link
                  className="group flex min-h-11 min-w-0 items-center gap-3 rounded-lg border border-line px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:border-brand/40 hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  href={action.href}
                  key={action.label}
                >
                  <span className="shrink-0 text-brand"><DashboardIcon name={action.icon} /></span>
                  <span className="min-w-0 flex-1">{action.label}</span>
                  <svg aria-hidden="true" className="size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" fill="none" viewBox="0 0 24 24">
                    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
                  </svg>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}