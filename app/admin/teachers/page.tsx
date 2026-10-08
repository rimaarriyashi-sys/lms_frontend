"use client";

import { useEffect, useState } from "react";
import { apiFetchList } from "@/lib/api";
import { exportTablePdf } from "@/lib/exportPdf";
import type { Class, Subject, User } from "@/types";

interface TeacherTableRow {
  teacher: User;
  subjects: string;
  subjectSearchText: string;
  homeroomClasses: string;
}

function SearchIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></svg>;
}

function DownloadIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M7 10l5 5 5-5M4 17v4h16v-4" /></svg>;
}

function SkeletonRows() {
  return (
    <div className="animate-pulse space-y-3 p-5" aria-label="Memuat daftar guru" role="status">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="grid grid-cols-[1.1fr_0.8fr_1.4fr_1.1fr] items-center gap-5 py-3">
          <span className="h-4 rounded bg-line" />
          <span className="h-4 w-20 rounded bg-line" />
          <span className="h-4 rounded bg-line" />
          <span className="h-4 rounded bg-line" />
        </div>
      ))}
    </div>
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    async function loadData() {
      const [usersResult, subjectsResult, classesResult] = await Promise.allSettled([
        apiFetchList<User>("/api/admin/users"),
        apiFetchList<Subject>("/api/subjects"),
        apiFetchList<Class>("/api/admin/classes"),
      ]);

      const failures: string[] = [];
      if (usersResult.status === "fulfilled") {
        setTeachers(usersResult.value.filter((user) => user.RoleID === 2));
      } else {
        failures.push(getErrorMessage(usersResult.reason, "Daftar guru gagal dimuat."));
      }
      if (subjectsResult.status === "fulfilled") {
        setSubjects(subjectsResult.value);
      } else {
        failures.push(getErrorMessage(subjectsResult.reason, "Daftar mata pelajaran gagal dimuat."));
      }
      if (classesResult.status === "fulfilled") {
        setClasses(classesResult.value);
      } else {
        failures.push(getErrorMessage(classesResult.reason, "Daftar kelas gagal dimuat."));
      }

      setPageError(failures.join(" "));
      setIsLoading(false);
    }

    void Promise.resolve().then(loadData);
  }, []);

  const teacherRows: TeacherTableRow[] = teachers.map((teacher) => {
    const teacherSubjects = subjects
      .filter((subject) => subject.TeacherID === teacher.ID)
      .map((subject) => subject.SubjectName);
    return {
      teacher,
      subjects: teacherSubjects.join(", ") || "-",
      subjectSearchText: teacherSubjects.join(" ").toLocaleLowerCase(),
      homeroomClasses: classes
        .filter((schoolClass) => schoolClass.HomeroomTeacherID === teacher.ID)
        .map((schoolClass) => schoolClass.ClassName)
        .join(", ") || "-",
    };
  });
  const normalizedSearch = searchTerm.trim().toLocaleLowerCase();
  const displayedRows = teacherRows.filter(({ teacher, subjectSearchText }) =>
    teacher.Name.toLocaleLowerCase().includes(normalizedSearch) ||
    subjectSearchText.includes(normalizedSearch),
  );

  async function handleExport() {
    if (displayedRows.length === 0) return;

    setIsExporting(true);
    setPageError("");
    try {
      await exportTablePdf({
        title: "Data Guru",
        fileName: "data-guru.pdf",
        columns: ["Nama", "NIP", "Mapel Diampu", "Wali Kelas"],
        rows: displayedRows.map(({ teacher, subjects: subjectNames, homeroomClasses }) => [
          teacher.Name,
          teacher.NISN_NIP || "-",
          subjectNames,
          homeroomClasses,
        ]),
      });
    } catch (error) {
      setPageError(getErrorMessage(error, "PDF gagal dibuat."));
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1440px]">
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-1 text-sm font-medium text-brand">Administrasi pengguna</p>
          <h2 className="text-2xl font-semibold text-ink font-[family-name:var(--font-fraunces)] sm:text-3xl">Data Guru</h2>
          <p className="mt-2 text-sm text-muted">Daftar seluruh guru yang terdaftar</p>
        </div>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-lg border border-brand/30 bg-white px-4 text-sm font-semibold text-brand-dark transition hover:bg-brand/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
          disabled={displayedRows.length === 0 || isExporting}
          onClick={() => void handleExport()}
          type="button"
        >
          <span className="size-[18px]"><DownloadIcon /></span>
          {isExporting ? "Menyiapkan PDF..." : "Export PDF"}
        </button>
      </div>

      {pageError && <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{pageError}</p>}

      <section className="overflow-hidden rounded-xl border border-line bg-white shadow-[0_2px_10px_rgba(17,17,17,0.04)]">
        <div className="border-b border-line p-4 sm:p-5">
          <label className="relative block max-w-md">
            <span className="sr-only">Cari nama atau mapel</span>
            <span className="pointer-events-none absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-muted"><SearchIcon /></span>
            <input
              className="h-11 w-full rounded-lg border border-line bg-white pl-10 pr-3 text-sm text-ink outline-none transition placeholder:text-muted/75 focus:border-brand focus:ring-2 focus:ring-brand/15"
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Cari nama atau mapel..."
              type="search"
              value={searchTerm}
            />
          </label>
        </div>

        {isLoading ? (
          <SkeletonRows />
        ) : displayedRows.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center px-6 py-12 text-center">
            <span className="mb-4 grid size-12 place-items-center rounded-full bg-surface text-muted"><span className="size-6"><SearchIcon /></span></span>
            <h3 className="text-base font-semibold text-ink">Tidak ada guru ditemukan</h3>
            <p className="mt-1 max-w-sm text-sm text-muted">Coba ubah kata pencarian untuk melihat daftar guru.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-left">
              <thead className="bg-surface/80">
                <tr className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                  <th className="px-5 py-3.5">Nama</th>
                  <th className="px-5 py-3.5">NIP</th>
                  <th className="px-5 py-3.5">Mapel Diampu</th>
                  <th className="px-5 py-3.5">Wali Kelas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {displayedRows.map(({ teacher, subjects: subjectNames, homeroomClasses }) => (
                  <tr key={teacher.ID} className="transition-colors hover:bg-surface/50">
                    <td className="px-5 py-4 text-sm font-medium text-ink">{teacher.Name}</td>
                    <td className="px-5 py-4 text-sm text-muted">{teacher.NISN_NIP || "-"}</td>
                    <td className="px-5 py-4 text-sm text-muted">{subjectNames}</td>
                    <td className="px-5 py-4 text-sm text-muted">{homeroomClasses}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && displayedRows.length > 0 && (
          <div className="border-t border-line px-5 py-3 text-xs text-muted">
            Menampilkan {displayedRows.length} dari {teachers.length} guru
          </div>
        )}
      </section>
    </div>
  );
}