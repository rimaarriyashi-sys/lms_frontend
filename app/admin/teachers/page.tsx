"use client";

import { useEffect, useState } from "react";
import EmptyState from "@/components/admin/EmptyState";
import PageHeader from "@/components/admin/PageHeader";
import Pagination from "@/components/admin/Pagination";
import SearchInput from "@/components/admin/SearchInput";
import TableSkeleton from "@/components/admin/TableSkeleton";
import { apiFetchList } from "@/lib/api";
import { exportTablePdf } from "@/lib/exportPdf";
import type { Class, Subject, User } from "@/types";

interface TeacherTableRow {
  teacher: User;
  subjects: Subject[];
  subjectSearchText: string;
  homeroomClasses: string;
}

const pageSize = 10;

function SearchIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></svg>;
}

function DownloadIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M7 10l5 5 5-5M4 17v4h16v-4" /></svg>;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
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
    const teacherSubjects = subjects.filter((subject) => subject.TeacherID === teacher.ID);
    return {
      teacher,
      subjects: teacherSubjects,
      subjectSearchText: teacherSubjects.map((subject) => subject.SubjectName).join(" ").toLocaleLowerCase(),
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
  const pageCount = Math.max(1, Math.ceil(displayedRows.length / pageSize));
  const safePage = Math.min(currentPage, pageCount);
  const visibleRows = displayedRows.slice((safePage - 1) * pageSize, safePage * pageSize);

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
          subjectNames.map((subject) => subject.SubjectName).join(", ") || "-",
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
      <PageHeader
        actions={(
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-lg border border-brand/30 bg-white px-4 text-sm font-semibold text-brand-dark transition hover:bg-brand/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
            disabled={displayedRows.length === 0 || isExporting}
            onClick={() => void handleExport()}
            type="button"
          >
            <span className="size-[18px]"><DownloadIcon /></span>
            {isExporting ? "Menyiapkan PDF..." : "Export PDF"}
          </button>
        )}
        description="Daftar guru, mata pelajaran yang diampu, dan kelas wali."
        eyebrow="Administrasi pengguna"
        title="Data Guru"
      />

      {pageError && <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{pageError}</p>}

      <section className="overflow-hidden rounded-lg border border-line bg-white">
        <div className="border-b border-line p-4 sm:p-5">
          <SearchInput
            label="Cari nama atau mapel"
            onChange={(value) => {
              setSearchTerm(value);
              setCurrentPage(1);
            }}
            placeholder="Cari nama atau mapel..."
            value={searchTerm}
          />
        </div>

        {isLoading ? (
          <div className="p-5"><TableSkeleton columns={4} rows={7} /></div>
        ) : displayedRows.length === 0 ? (
          <EmptyState
            description={searchTerm ? "Coba ubah kata pencarian untuk melihat guru lainnya." : "Belum ada akun guru yang terdaftar."}
            icon={<span className="size-6"><SearchIcon /></span>}
            title="Tidak ada guru ditemukan"
          />
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
                {visibleRows.map(({ teacher, subjects: subjectNames, homeroomClasses }) => (
                  <tr key={teacher.ID} className="transition-colors hover:bg-surface/50">
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-ink">{teacher.Name}</p>
                      <p className="mt-0.5 text-xs text-muted">{teacher.Email}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted">{teacher.NISN_NIP || "-"}</td>
                    <td className="px-5 py-4">
                      {subjectNames.length > 0 ? (
                        <div className="flex max-w-[420px] flex-wrap gap-1.5">
                          {subjectNames.map((subject) => (
                            <span className="inline-flex rounded-md border border-brand/15 bg-brand/10 px-2 py-1 text-xs font-medium text-brand-dark" key={subject.ID}>
                              {subject.SubjectName}
                            </span>
                          ))}
                        </div>
                      ) : <span className="text-sm text-muted">-</span>}
                    </td>
                    <td className="px-5 py-4 text-sm text-muted">{homeroomClasses}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && displayedRows.length > 0 && (
          <Pagination onPageChange={setCurrentPage} page={safePage} pageSize={pageSize} total={displayedRows.length} />
        )}
      </section>
    </div>
  );
}