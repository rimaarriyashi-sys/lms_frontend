"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import EmptyState from "@/components/admin/EmptyState";
import PageHeader from "@/components/admin/PageHeader";
import Pagination from "@/components/admin/Pagination";
import SearchInput from "@/components/admin/SearchInput";
import TableSkeleton from "@/components/admin/TableSkeleton";
import { apiFetchList } from "@/lib/api";
import type { User } from "@/types";

const pageSize = 15;

function StudentIcon() {
  return (
    <svg aria-hidden="true" className="size-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 5.5a3 3 0 0 1 0 5.8M17 14a5 5 0 0 1 3.5 5" />
    </svg>
  );
}

function StudentsLoading() {
  return (
    <div className="mx-auto max-w-[1440px]">
      <PageHeader
        description="Lihat daftar siswa dari kelas yang Anda ampu."
        eyebrow="Area guru"
        title="Data Siswa"
      />
      <div className="rounded-lg border border-line bg-white p-5">
        <TableSkeleton columns={3} rows={8} />
      </div>
    </div>
  );
}

function StudentsContent() {
  const searchParams = useSearchParams();
  const [students, setStudents] = useState<User[]>([]);
  const [classFilter, setClassFilter] = useState(() => searchParams.get("class_id") ?? "");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadStudents() {
      try {
        const result = await apiFetchList<User>("/api/guru/students");
        if (isMounted) setStudents(result);
      } catch (error) {
        if (isMounted) {
          setPageError(error instanceof Error ? error.message : "Daftar siswa gagal dimuat.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadStudents();
    return () => {
      isMounted = false;
    };
  }, []);

  const schoolClasses = useMemo(() => {
    const classes = new Map<number, string>();
    for (const student of students) {
      const classId = student.ClassID ?? student.Class?.ID;
      const className = student.Class?.ClassName;
      if (classId != null && className) classes.set(classId, className);
    }
    return [...classes.entries()].sort((left, right) => left[1].localeCompare(right[1], "id"));
  }, [students]);

  const normalizedSearch = searchTerm.trim().toLocaleLowerCase("id");
  const filteredStudents = students.filter((student) => {
    const studentClassId = student.ClassID ?? student.Class?.ID;
    const matchesClass = !classFilter || String(studentClassId ?? "") === classFilter;
    const nis = student.NIS ?? student.NISN_NIP ?? "";
    const matchesSearch =
      student.Name.toLocaleLowerCase("id").includes(normalizedSearch) ||
      nis.toLocaleLowerCase("id").includes(normalizedSearch);
    return matchesClass && matchesSearch;
  });
  const pageCount = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const safePage = Math.min(currentPage, pageCount);
  const visibleStudents = filteredStudents.slice((safePage - 1) * pageSize, safePage * pageSize);

  function updateClassFilter(value: string) {
    setClassFilter(value);
    setCurrentPage(1);
  }

  function updateSearch(value: string) {
    setSearchTerm(value);
    setCurrentPage(1);
  }

  return (
    <div className="mx-auto max-w-[1440px]">
      <PageHeader
        description="Lihat daftar siswa dari kelas yang Anda ampu."
        eyebrow="Area guru"
        title="Data Siswa"
      />

      {pageError && (
        <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {pageError}
        </p>
      )}

      <section className="mb-5 flex flex-col gap-3 rounded-lg border border-line bg-white p-4 sm:flex-row sm:flex-wrap sm:items-center">
        <label className="block w-full sm:w-auto">
          <span className="sr-only">Filter kelas</span>
          <select
            className="h-11 w-full min-w-48 rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
            onChange={(event) => updateClassFilter(event.target.value)}
            value={classFilter}
          >
            <option value="">Semua kelas</option>
            {schoolClasses.map(([classId, className]) => (
              <option key={classId} value={classId}>{className}</option>
            ))}
          </select>
        </label>
        <SearchInput
          label="Cari nama atau NIS siswa"
          onChange={updateSearch}
          placeholder="Cari nama atau NIS..."
          value={searchTerm}
        />
      </section>

      <section className="overflow-hidden rounded-lg border border-line bg-white">
        {isLoading ? (
          <div className="p-5"><TableSkeleton columns={3} rows={8} /></div>
        ) : filteredStudents.length === 0 ? (
          <EmptyState
            description={
              students.length === 0
                ? "Belum ada siswa yang terdaftar pada kelas yang Anda ampu."
                : "Ubah filter kelas atau kata pencarian untuk melihat siswa lainnya."
            }
            icon={<StudentIcon />}
            title={students.length === 0 ? "Belum ada data siswa" : "Tidak ada siswa ditemukan"}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left">
                <thead className="bg-surface/80">
                  <tr className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                    <th className="px-5 py-3.5">Nama</th>
                    <th className="px-5 py-3.5">NIS</th>
                    <th className="px-5 py-3.5">Kelas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {visibleStudents.map((student) => (
                    <tr className="transition-colors hover:bg-surface/50" key={student.ID}>
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-ink">{student.Name}</p>
                        <p className="mt-1 text-xs text-muted">{student.Email}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-ink">{student.NIS ?? student.NISN_NIP ?? "-"}</td>
                      <td className="px-5 py-4 text-sm text-ink">{student.Class?.ClassName ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={safePage}
              pageSize={pageSize}
              total={filteredStudents.length}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </section>
    </div>
  );
}

export default function GuruStudentsPage() {
  return (
    <Suspense fallback={<StudentsLoading />}>
      <StudentsContent />
    </Suspense>
  );
}
