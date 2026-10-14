"use client";

import { useEffect, useState } from "react";
import EmptyState from "@/components/admin/EmptyState";
import PageHeader from "@/components/admin/PageHeader";
import Pagination from "@/components/admin/Pagination";
import SearchInput from "@/components/admin/SearchInput";
import TableSkeleton from "@/components/admin/TableSkeleton";
import { apiFetchList } from "@/lib/api";
import { exportTablePdf } from "@/lib/exportPdf";
import type { Class, Major, User } from "@/types";

interface StudentTableRow {
  student: User;
  className: string;
  majorName: string;
  majorId: number | null;
}

const UNASSIGNED_CLASS = "__without_class__";
const pageSize = 15;
const classLevels = ["X", "XI", "XII"] as const;

function SearchIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></svg>;
}

function DownloadIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M7 10l5 5 5-5M4 17v4h16v-4" /></svg>;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<User[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [majorFilter, setMajorFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
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
      majorId: schoolClass?.MajorID ?? null,
    };
  });
  const filteredRows = studentRows.filter(({ student, majorId }) => {
    const matchesSearch = student.Name.toLocaleLowerCase().includes(normalizedSearch) ||
      (student.NIS ?? "").toLocaleLowerCase().includes(normalizedSearch);
    const matchesMajor = majorFilter === "" || String(majorId ?? "") === majorFilter;
    const matchesClass = classFilter === ""
      ? true
      : classFilter === UNASSIGNED_CLASS
        ? student.ClassID == null
        : student.ClassID === Number(classFilter);

    return matchesSearch && matchesMajor && matchesClass;
  });
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(currentPage, pageCount);
  const visibleRows = filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize);
  const filteredClassCount = new Set(
    filteredRows.flatMap(({ student }) => student.ClassID == null ? [] : [student.ClassID]),
  ).size;
  const classGroups = classLevels
    .map((level) => ({
      level,
      classes: classes
        .filter((schoolClass) => {
          const belongsToMajor = majorFilter === "" || String(schoolClass.MajorID ?? "") === majorFilter;
          return belongsToMajor && schoolClass.ClassName.trim().split(/\s+/)[0] === level;
        })
        .sort((left, right) => left.ClassName.localeCompare(right.ClassName, "id")),
    }))
    .filter((group) => group.classes.length > 0);

  async function handleExport() {
    if (filteredRows.length === 0) return;

    setIsExporting(true);
    setPageError("");
    try {
      await exportTablePdf({
        title: "Data Siswa",
        fileName: "data-siswa.pdf",
        columns: ["Nama", "NIS", "Kelas", "Jurusan"],
        rows: filteredRows.map(({ student, className, majorName }) => [
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
      <PageHeader
        actions={(
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-lg border border-brand/30 bg-white px-4 text-sm font-semibold text-brand-dark transition hover:bg-brand/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
            disabled={filteredRows.length === 0 || isExporting}
            onClick={() => void handleExport()}
            type="button"
          >
            <span className="size-[18px]"><DownloadIcon /></span>
            {isExporting ? "Menyiapkan PDF..." : "Export PDF"}
          </button>
        )}
        description="Cari siswa berdasarkan nama, NIS, jurusan, atau kelas."
        eyebrow="Administrasi pengguna"
        title="Data Siswa"
      />

      {pageError && (
        <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {pageError}
        </p>
      )}

      <section className="overflow-hidden rounded-lg border border-line bg-white">
        <div className="grid gap-3 border-b border-line p-4 sm:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_220px_250px] sm:p-5">
          <SearchInput
            label="Cari nama atau NIS"
            onChange={(value) => {
              setSearchTerm(value);
              setCurrentPage(1);
            }}
            placeholder="Cari nama atau NIS..."
            value={searchTerm}
          />
          <label className="block">
            <span className="sr-only">Filter jurusan</span>
            <select
              className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
              onChange={(event) => {
                setMajorFilter(event.target.value);
                setClassFilter("");
                setCurrentPage(1);
              }}
              value={majorFilter}
            >
              <option value="">Semua jurusan</option>
              {majors.map((major) => (
                <option key={major.ID} value={major.ID}>{major.MajorName}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="sr-only">Filter kelas</span>
            <select
              className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
              onChange={(event) => {
                setClassFilter(event.target.value);
                setCurrentPage(1);
              }}
              value={classFilter}
            >
              <option value="">Semua kelas</option>
              {classGroups.map((group) => (
                <optgroup key={group.level} label={`Tingkat ${group.level}`}>
                  {group.classes.map((schoolClass) => (
                    <option key={schoolClass.ID} value={schoolClass.ID}>{schoolClass.ClassName}</option>
                  ))}
                </optgroup>
              ))}
              <option value={UNASSIGNED_CLASS}>Tanpa kelas</option>
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface/50 px-4 py-3 sm:px-5">
          <p className="text-sm font-semibold text-ink">
            {filteredRows.length.toLocaleString("id-ID")} siswa
            <span className="mx-2 text-muted" aria-hidden="true">·</span>
            {filteredClassCount.toLocaleString("id-ID")} kelas
          </p>
          <p className="text-xs text-muted">Hasil sesuai filter saat ini</p>
        </div>

        {isLoading ? (
          <div className="p-5"><TableSkeleton columns={4} rows={8} /></div>
        ) : filteredRows.length === 0 ? (
          <EmptyState
            description={students.length === 0 ? "Belum ada akun siswa yang terdaftar." : "Ubah kata pencarian atau filter untuk melihat siswa lainnya."}
            icon={<span className="size-6"><SearchIcon /></span>}
            title={students.length === 0 ? "Belum ada data siswa" : "Tidak ada siswa ditemukan"}
          />
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
                {visibleRows.map(({ student, className, majorName }) => (
                  <tr className="transition-colors hover:bg-surface/50" key={student.ID}>
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-ink">{student.Name}</p>
                      <p className="mt-0.5 text-xs text-muted">{student.Email}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted">{student.NIS || "-"}</td>
                    <td className="px-5 py-4 text-sm text-ink">{className}</td>
                    <td className="px-5 py-4">
                      {majorName !== "-" ? (
                        <span className="inline-flex rounded-md border border-brand/15 bg-brand/10 px-2 py-1 text-xs font-semibold text-brand-dark">
                          {majorName}
                        </span>
                      ) : <span className="text-sm text-muted">-</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && filteredRows.length > 0 && (
          <Pagination onPageChange={setCurrentPage} page={safePage} pageSize={pageSize} total={filteredRows.length} />
        )}
      </section>
    </div>
  );
}