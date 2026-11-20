"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch, apiFetchList } from "@/lib/api";
import type { User } from "@/types";
import type {
  AssignmentItem,
  QuizAttempt,
  QuizItem,
  SubmissionListResponse,
  TeachingItem,
} from "@/types/types/learning";

interface ReviewItem {
  id: number;
  title: string;
  count: number;
  href: string;
  type: "Tugas" | "Kuis/Ujian";
}

interface DashboardData {
  userName: string;
  teaching: TeachingItem[];
  students: User[];
  assignments: AssignmentItem[];
  quizzes: QuizItem[];
  reviewItems: ReviewItem[];
  errors: string[];
  reviewHasError: boolean;
  teachingLoadFailed: boolean;
  loadedAt: number;
}

const emptyData: DashboardData = {
  userName: "Guru",
  teaching: [],
  students: [],
  assignments: [],
  quizzes: [],
  reviewItems: [],
  errors: [],
  reviewHasError: false,
  teachingLoadFailed: false,
  loadedAt: 0,
};

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function newestFirst<T extends { ID: number; CreatedAt?: string }>(items: T[]): T[] {
  return [...items].sort((left, right) => {
    const leftTime = left.CreatedAt ? Date.parse(left.CreatedAt) : NaN;
    const rightTime = right.CreatedAt ? Date.parse(right.CreatedAt) : NaN;
    if (Number.isFinite(leftTime) && Number.isFinite(rightTime) && leftTime !== rightTime) {
      return rightTime - leftTime;
    }
    return right.ID - left.ID;
  });
}

function DashboardLoading() {
  return (
    <div aria-label="Memuat dashboard guru" aria-busy="true" className="mx-auto max-w-[1440px]">
      <div className="mb-8 space-y-3">
        <div className="motion-safe:animate-pulse h-3 w-36 rounded bg-brand/10" />
        <div className="motion-safe:animate-pulse h-9 w-72 max-w-full rounded bg-brand/10" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="motion-safe:animate-pulse h-28 rounded-xl border border-line bg-white" />
        ))}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="motion-safe:animate-pulse h-64 rounded-xl border border-line bg-white" />
        ))}
      </div>
    </div>
  );
}

function StatIcon({ type }: { type: "class" | "subject" | "student" | "assignment" | "quiz" }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.7,
    viewBox: "0 0 24 24",
    "aria-hidden": true as const,
  };

  switch (type) {
    case "class":
      return <svg {...common}><path d="M4 5.5h16v14H4zM8 5.5V3.8h8v1.7M8 10h8M8 14h5" /></svg>;
    case "subject":
      return <svg {...common}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21zM4 5.5v13M8 7h8M8 11h8" /></svg>;
    case "student":
      return <svg {...common}><circle cx="9" cy="8" r="3" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 5.5a3 3 0 0 1 0 5.8M17 14a5 5 0 0 1 3.5 5" /></svg>;
    case "assignment":
      return <svg {...common}><path d="M8 4h8M9 3h6v3H9zM6 5H4v16h16V5h-2M8 11h8M8 15h5" /></svg>;
    case "quiz":
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M9.6 9a2.5 2.5 0 1 1 4.3 1.7c-1 .9-1.9 1.3-1.9 2.8M12 17.5v.1" /></svg>;
  }
}

function QuickActionIcon({ type }: { type: "assignment" | "quiz" | "material" }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.7,
    viewBox: "0 0 24 24",
    "aria-hidden": true as const,
  };

  if (type === "assignment") {
    return <svg {...common}><path d="M8 4h8M9 3h6v3H9zM6 5H4v16h16V5h-2M8 11h8M8 15h5" /></svg>;
  }
  if (type === "quiz") {
    return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M9.6 9a2.5 2.5 0 1 1 4.3 1.7c-1 .9-1.9 1.3-1.9 2.8M12 17.5v.1" /></svg>;
  }
  return <svg {...common}><path d="M12 3v12M7 10l5 5 5-5M4 17v4h16v-4" /></svg>;
}

function DashboardContent({ data }: { data: DashboardData }) {
  const now = data.loadedAt;
  const activeAssignments = data.assignments.filter((assignment) => {
    const deadline = Date.parse(assignment.Deadline);
    return Number.isFinite(deadline) && deadline >= now;
  }).length;
  const activeQuizzes = data.quizzes.filter((quiz) => {
    const start = Date.parse(quiz.StartTime);
    const end = Date.parse(quiz.EndTime);
    return Number.isFinite(start) && Number.isFinite(end) && start <= now && now <= end;
  }).length;
  const uniqueStudents = new Set(data.students.map((student) => student.ID));
  const stats = [
    { label: "Kelas Diampu", value: new Set(data.teaching.map((item) => item.ClassID)).size, icon: "class" as const },
    { label: "Mata Pelajaran", value: new Set(data.teaching.map((item) => item.SubjectID)).size, icon: "subject" as const },
    { label: "Total Siswa", value: uniqueStudents.size, icon: "student" as const },
    { label: "Tugas Aktif", value: activeAssignments, icon: "assignment" as const },
    { label: "Kuis/Ujian Aktif", value: activeQuizzes, icon: "quiz" as const },
  ];
  const latestTeaching = data.teaching.slice(0, 8);

  return (
    <div className="mx-auto max-w-[1440px]">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-brand">Dashboard Guru</p>
        <h1 className="mt-2 text-3xl font-semibold font-[family-name:var(--font-fraunces)] sm:text-4xl">
          Selamat datang, {data.userName}
        </h1>
        <p className="mt-2 text-sm text-muted">Ringkasan kegiatan belajar dan mengajar Anda.</p>
      </div>

      {data.errors.length > 0 && (
        <div role="status" className="mb-6 rounded-xl border border-brand/20 bg-brand/10 px-4 py-3 text-sm text-ink">
          Sebagian data belum dapat dimuat. {data.errors.join(" ")}
        </div>
      )}

      <section aria-label="Statistik guru" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <article key={stat.label} className="rounded-xl border border-line bg-white p-5 shadow-sm">
            <span className="grid size-10 place-items-center rounded-lg bg-brand/10 text-brand">
              <span className="size-5"><StatIcon type={stat.icon} /></span>
            </span>
            <p className="mt-4 text-sm text-muted">{stat.label}</p>
            <p className="mt-1 text-2xl font-semibold">{stat.value}</p>
          </article>
        ))}
      </section>

      {data.teaching.length === 0 && !data.teachingLoadFailed && (
        <p className="mt-6 rounded-xl border border-brand/20 bg-brand/10 px-4 py-3 text-sm text-ink">
          Anda belum ditugaskan mengampu kelas. Hubungi admin.
        </p>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="rounded-xl border border-line bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold font-[family-name:var(--font-fraunces)]">Perlu Dinilai</h2>
              <p className="mt-1 text-sm text-muted">Tugas dan kuis yang membutuhkan tindak lanjut.</p>
            </div>
          </div>
          {data.reviewItems.length === 0 && data.reviewHasError ? (
            <p className="rounded-lg bg-surface px-4 py-5 text-center text-sm text-muted">Data penilaian belum dapat dimuat.</p>
          ) : data.reviewItems.length === 0 ? (
            <p className="rounded-lg bg-surface px-4 py-5 text-center text-sm text-muted">Tidak ada yang perlu dinilai</p>
          ) : (
            <ul className="divide-y divide-line">
              {data.reviewItems.map((item) => (
                <li key={`${item.type}-${item.id}`} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{item.title}</p>
                    <p className="mt-1 text-xs text-muted">{item.count} {item.type === "Tugas" ? "belum dinilai" : "pengerjaan menunggu penilaian"}</p>
                  </div>
                  <Link href={item.href} className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-brand-dark transition-colors hover:bg-brand/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transition-none">
                    Periksa
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-line bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold font-[family-name:var(--font-fraunces)]">Kelas yang Saya Ampu</h2>
            <Link href="/guru/teaching" className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-brand-dark transition-colors hover:bg-brand/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transition-none">
              Lihat semua
            </Link>
          </div>
          {latestTeaching.length === 0 ? (
            <p className="rounded-lg bg-surface px-4 py-5 text-center text-sm text-muted">
              {data.teachingLoadFailed ? "Daftar kelas belum dapat dimuat." : "Belum ada penugasan kelas."}
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {latestTeaching.map((item, index) => (
                <li key={item.ID ?? `${item.ClassID}-${item.SubjectID}-${index}`} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <span className="min-w-0 truncate text-sm font-semibold">{item.Subject?.SubjectName ?? "Mata pelajaran"}</span>
                  <span className="shrink-0 rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand-dark">{item.Class?.ClassName ?? "Kelas"}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-line bg-white p-5 shadow-sm sm:p-6 xl:col-span-2">
          <h2 className="text-xl font-semibold font-[family-name:var(--font-fraunces)]">Aksi Cepat</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Link href="/guru/assignments" className="flex min-h-16 items-center gap-3 rounded-lg border border-line px-4 py-3 text-sm font-semibold transition-colors hover:border-brand/40 hover:bg-brand/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transition-none">
              <span className="size-5 text-brand"><QuickActionIcon type="assignment" /></span>
              Buat Tugas
            </Link>
            <Link href="/guru/quizzes" className="flex min-h-16 items-center gap-3 rounded-lg border border-line px-4 py-3 text-sm font-semibold transition-colors hover:border-brand/40 hover:bg-brand/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transition-none">
              <span className="size-5 text-brand"><QuickActionIcon type="quiz" /></span>
              Buat Kuis
            </Link>
            <Link href="/guru/materials" className="flex min-h-16 items-center gap-3 rounded-lg border border-line px-4 py-3 text-sm font-semibold transition-colors hover:border-brand/40 hover:bg-brand/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transition-none">
              <span className="size-5 text-brand"><QuickActionIcon type="material" /></span>
              Unggah Materi
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function GuruDashboardContent() {
  const [data, setData] = useState<DashboardData>(emptyData);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      const [teachingResult, studentsResult, assignmentsResult, quizzesResult, profileResult] = await Promise.allSettled([
        apiFetchList<TeachingItem>("/api/guru/teaching"),
        apiFetchList<User>("/api/guru/students"),
        apiFetchList<AssignmentItem>("/api/assignments"),
        apiFetchList<QuizItem>("/api/guru/quizzes"),
        apiFetch<{ data: User }>("/api/me"),
      ]);

      const errors: string[] = [];
      let reviewHasError =
        assignmentsResult.status === "rejected" || quizzesResult.status === "rejected";
      const teaching = teachingResult.status === "fulfilled" ? teachingResult.value : [];
      const students = studentsResult.status === "fulfilled" ? studentsResult.value : [];
      const assignments = assignmentsResult.status === "fulfilled" ? assignmentsResult.value : [];
      const quizzes = quizzesResult.status === "fulfilled" ? quizzesResult.value : [];
      const userName = profileResult.status === "fulfilled" && profileResult.value.data.Name?.trim()
        ? profileResult.value.data.Name
        : "Guru";

      if (teachingResult.status === "rejected") errors.push(errorMessage(teachingResult.reason, "Daftar kelas gagal dimuat."));
      if (studentsResult.status === "rejected") errors.push(errorMessage(studentsResult.reason, "Data siswa gagal dimuat."));
      if (assignmentsResult.status === "rejected") errors.push(errorMessage(assignmentsResult.reason, "Daftar tugas gagal dimuat."));
      if (quizzesResult.status === "rejected") errors.push(errorMessage(quizzesResult.reason, "Daftar kuis gagal dimuat."));
      if (profileResult.status === "rejected") errors.push(errorMessage(profileResult.reason, "Profil guru gagal dimuat."));

      const recentAssignments = newestFirst(assignments).slice(0, 8);
      const recentQuizzes = newestFirst(quizzes).slice(0, 8);
      const [assignmentReviewResults, quizReviewResults] = await Promise.all([
        Promise.allSettled(recentAssignments.map((assignment) =>
          apiFetch<SubmissionListResponse>(`/api/guru/assignments/${assignment.ID}/submissions`),
        )),
        Promise.allSettled(recentQuizzes.map((quiz) =>
          apiFetchList<QuizAttempt>(`/api/guru/quizzes/${quiz.ID}/submissions`),
        )),
      ]);

      const reviewItems: ReviewItem[] = [];
      assignmentReviewResults.forEach((result, index) => {
        if (result.status === "rejected") {
          reviewHasError = true;
          errors.push(errorMessage(result.reason, `Pengumpulan tugas "${recentAssignments[index].Title}" gagal dimuat.`));
          return;
        }
        const pending = Math.max(0, result.value.summary.submitted - result.value.summary.graded);
        if (pending > 0) {
          reviewItems.push({
            id: recentAssignments[index].ID,
            title: recentAssignments[index].Title,
            count: pending,
            href: `/guru/assignments/${recentAssignments[index].ID}`,
            type: "Tugas",
          });
        }
      });

      quizReviewResults.forEach((result, index) => {
        if (result.status === "rejected") {
          reviewHasError = true;
          errors.push(errorMessage(result.reason, `Pengerjaan kuis "${recentQuizzes[index].Title}" gagal dimuat.`));
          return;
        }
        const pending = result.value.filter((attempt) => attempt.Status === "selesai").length;
        if (pending > 0) {
          reviewItems.push({
            id: recentQuizzes[index].ID,
            title: recentQuizzes[index].Title,
            count: pending,
            href: `/guru/quizzes/${recentQuizzes[index].ID}`,
            type: "Kuis/Ujian",
          });
        }
      });

      if (isMounted) {
        setData({
          userName,
          teaching,
          students,
          assignments,
          quizzes,
          reviewItems,
          errors,
          reviewHasError,
          teachingLoadFailed: teachingResult.status === "rejected",
          loadedAt: Date.now(),
        });
        setIsLoading(false);
      }
    }

    void loadDashboard();
    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) return <DashboardLoading />;
  return <DashboardContent data={data} />;
}
