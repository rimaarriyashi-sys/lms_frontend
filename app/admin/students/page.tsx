"use client";

import { useEffect, useState } from "react";
import { apiFetchList } from "@/lib/api";
import { exportTablePdf } from "@/lib/exportPdf";
import type { Class, Major, User } from "@/types";

interface StudentTableRow {
  student: User;
  className: string;
  majorName: string;
}

const UNASSIGNED_CLASS = "__without_class__";

function SearchIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></svg>;
}

function DownloadIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M7 10l5 5 5-5M4 17v4h16v-4" /></svg>;
}

function SkeletonRows() {
  return (
    <div className="animate-pulse space-y-3 p-5" aria-label="Memuat daftar siswa" role="status">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="grid grid-cols-[1.2fr_0.8fr_1fr_1fr] items-center gap-5 py-3">
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

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<User[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    async function loadData() {
      const [usersResult, classesResult, majorsResult] = await Promise.allSettled([
        apiFetchList<User>("/api/admin/users"),
        apiFetchList<Class>("/api/admin/classes"),
        apiFetchList<Major>("/api/admin/majors"),
      ]);

      const failures: string[] = [];
      if (usersResult.status === "fulfilled") {
        setStudents(usersResult.value.filter((user) => user.RoleID === 3));
      } else {
        failures.push(getErrorMessage(usersResult.reason, "Daftar siswa gagal dimuat."));
      }
      if (classesResult.status === "fulfilled") {
        setClasses(classesResult.value);
      } else {
        failures.push(getErrorMessage(classesResult.reason, "Daftar kelas gagal dimuat."));
      }
      if (majorsResult.status === "fulfilled") {
        setMajors(majorsResult.value);
      } else {
        failures.push(getErrorMessage(majorsResult.reason, "Daftar jurusan gagal dimuat."));
      }

      setPageError(failures.join(" "));
      setIsLoading(false);
    }

    void Promise.resolve().then(loadData);
  }, []);

  const normalizedSearch = searchTerm.trim().toLocaleLowerCase();
  const studentRows: StudentTableRow[] = students.map((student) => {
    const schoolClass = classes.find((item) => item.ID === student.ClassID);
    const major = schoolClass?.MajorID == null
      ? undefined
      : majors.find((item) => item.ID === schoolClass.MajorID);

    return {
      student,
      className: schoolClass?.ClassName ?? "-",
      majorName: major?.MajorName ?? "-",
    };
  });
  const displayedRows = studentRows.filter(({ student }) => {
    const matchesSearch = student.Name.toLocaleLowerCase().includes(normalizedSearch) ||
      (student.NIS ?? "").toLocaleLowerCase().includes(normalizedSearch);
    const matchesClass = classFilter === ""
      ? true
      : classFilter === UNASSIGNED_CLASS
        ? student.ClassID == null
        : student.ClassID === Number(classFilter);

    return matchesSearch && matchesClass;
  });

  async function handleExport() {
    if (displayedRows.length === 0) return;

    setIsExporting(true);
    setPageError("");
    try {
      await exportTablePdf({
        title: "Data Siswa",
        fileName: "data-siswa.pdf",
        columns: ["Nama", "NIS", "Kelas", "Jurusan"],
        rows: displayedRows.map(({ student, className, majorName }) => [
          student.Name,
          student.NIS || "-",
          className,
          majorName,
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
          <h2 className="text-2xl font-semibold text-ink font-[family-name:var(--font-fraunces)] sm:text-3xl">Data Siswa</h2>
          <p className="mt-2 text-sm text-muted">Daftar seluruh siswa yang terdaftar</p>
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
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:p-5">
          <label className="relative block w-full max-w-md">
            <span className="sr-only">Cari nama atau NIS</span>
            <span className="pointer-events-none absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-muted"><SearchIcon /></span>
            <input
              className="h-11 w-full rounded-lg border border-line bg-white pl-10 pr-3 text-sm text-ink outline-none transition placeholder:text-muted/75 focus:border-brand focus:ring-2 focus:ring-brand/15"
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Cari nama atau NIS..."
              type="search"
              value={searchTerm}
            />
          </label>
          <label className="block w-full sm:ml-auto sm:max-w-[260px]">
            <span className="sr-only">Filter kelas</span>
            <select
              className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
              onChange={(event) => setClassFilter(event.target.value)}
              value={classFilter}
            >
              <option value="">Semua Kelas</option>
              <option value={UNASSIGNED_CLASS}>Tanpa kelas</option>
              {classes.map((schoolClass) => (
                <option key={schoolClass.ID} value={schoolClass.ID}>{schoolClass.ClassName}</option>
              ))}
            </select>
          </label>
        </div>

        {isLoading ? (
          <SkeletonRows />
        ) : displayedRows.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center px-6 py-12 text-center">
            <span className="mb-4 grid size-12 place-items-center rounded-full bg-surface text-muted"><span className="size-6"><SearchIcon /></span></span>
            <h3 className="text-base font-semibold text-ink">Tidak ada siswa ditemukan</h3>
            <p className="mt-1 max-w-sm text-sm text-muted">Coba ubah pencarian atau filter kelas untuk melihat data siswa.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-left">
              <thead className="bg-surface/80">
                <tr className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                  <th className="px-5 py-3.5">Nama</th>
                  <th className="px-5 py-3.5">NIS</th>
                  <th className="px-5 py-3.5">Kelas</th>
                  <th className="px-5 py-3.5">Jurusan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {displayedRows.map(({ student, className, majorName }) => (
                  <tr key={student.ID} className="transition-colors hover:bg-surface/50">
                    <td className="px-5 py-4 text-sm font-medium text-ink">{student.Name}</td>
                    <td className="px-5 py-4 text-sm text-muted">{student.NIS || "-"}</td>
                    <td className="px-5 py-4 text-sm text-muted">{className}</td>
                    <td className="px-5 py-4 text-sm text-muted">{majorName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && displayedRows.length > 0 && (
          <div className="border-t border-line px-5 py-3 text-xs text-muted">
            Menampilkan {displayedRows.length} dari {students.length} siswa
          </div>
        )}
      </section>
    </div>
  );
}