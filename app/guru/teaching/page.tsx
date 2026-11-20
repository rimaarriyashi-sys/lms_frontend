"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import EmptyState from "@/components/admin/EmptyState";
import PageHeader from "@/components/admin/PageHeader";
import SearchInput from "@/components/admin/SearchInput";
import TableSkeleton from "@/components/admin/TableSkeleton";
import { apiFetchList } from "@/lib/api";
import type { TeachingItem } from "@/types/types/learning";

interface ClassTeaching {
  classId: number;
  className: string;
  subjects: Map<number, string>;
}

function ClassIcon() {
  return (
    <svg aria-hidden="true" className="size-6" fill="none" viewBox="0 0 24 24">
      <path d="M4 5.5h16v14H4zM8 5.5V3.8h8v1.7M8 10h8M8 14h5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

export default function GuruTeachingPage() {
  const [teaching, setTeaching] = useState<TeachingItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadTeaching() {
      try {
        const result = await apiFetchList<TeachingItem>("/api/guru/teaching");
        if (isMounted) setTeaching(result);
      } catch (error) {
        if (isMounted) {
          setPageError(error instanceof Error ? error.message : "Daftar kelas dan mata pelajaran gagal dimuat.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadTeaching();
    return () => {
      isMounted = false;
    };
  }, []);

  const classes = useMemo(() => {
    const groups = new Map<number, ClassTeaching>();
    for (const item of teaching) {
      const current = groups.get(item.ClassID) ?? {
        classId: item.ClassID,
        className: item.Class?.ClassName ?? `Kelas ${item.ClassID}`,
        subjects: new Map<number, string>(),
      };
      current.subjects.set(item.SubjectID, item.Subject?.SubjectName ?? `Mata pelajaran ${item.SubjectID}`);
      groups.set(item.ClassID, current);
    }
    return [...groups.values()].sort((left, right) => left.className.localeCompare(right.className, "id"));
  }, [teaching]);

  const normalizedSearch = searchTerm.trim().toLocaleLowerCase("id");
  const filteredClasses = classes.filter((schoolClass) =>
    schoolClass.className.toLocaleLowerCase("id").includes(normalizedSearch) ||
    [...schoolClass.subjects.values()].some((subject) =>
      subject.toLocaleLowerCase("id").includes(normalizedSearch),
    ),
  );

  return (
    <div className="mx-auto max-w-[1440px]">
      <PageHeader
        description="Lihat kelas dan mata pelajaran yang ditugaskan kepada Anda."
        eyebrow="Area guru"
        title="Kelas & Mapel Saya"
      />

      {pageError && (
        <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {pageError}
        </p>
      )}

      <section className="mb-5 rounded-lg border border-line bg-white p-4">
        <SearchInput
          label="Cari nama kelas atau mata pelajaran"
          onChange={setSearchTerm}
          placeholder="Cari kelas atau mata pelajaran..."
          value={searchTerm}
        />
      </section>

      <section aria-label="Kelas dan mata pelajaran yang diampu">
        {isLoading ? (
          <div className="rounded-lg border border-line bg-white p-5">
            <TableSkeleton columns={3} rows={6} />
          </div>
        ) : classes.length === 0 ? (
          <div className="rounded-lg border border-line bg-white">
            <EmptyState
              description="Anda belum ditugaskan mengampu kelas. Hubungi admin."
              icon={<ClassIcon />}
              title="Belum ada penugasan"
            />
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="rounded-lg border border-line bg-white">
            <EmptyState
              description="Ubah kata pencarian untuk melihat kelas atau mata pelajaran lainnya."
              icon={<ClassIcon />}
              title="Tidak ada kelas ditemukan"
            />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredClasses.map((schoolClass) => (
              <article key={schoolClass.classId} className="flex flex-col rounded-xl border border-line bg-white p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
                    <ClassIcon />
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold font-[family-name:var(--font-fraunces)] text-ink">
                      {schoolClass.className}
                    </h2>
                    <p className="mt-1 text-xs text-muted">
                      {schoolClass.subjects.size} mata pelajaran
                    </p>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {[...schoolClass.subjects.entries()].map(([subjectId, subjectName]) => (
                    <span
                      key={subjectId}
                      className="inline-flex max-w-full items-center rounded-full bg-brand/10 px-3 py-1.5 text-xs font-medium text-brand-dark"
                    >
                      {subjectName}
                    </span>
                  ))}
                </div>
                <Link
                  href={`/guru/students?class_id=${schoolClass.classId}`}
                  className="mt-6 inline-flex min-h-10 items-center justify-center self-start rounded-lg border border-line px-3 text-sm font-semibold text-brand-dark transition-colors hover:border-brand/40 hover:bg-brand/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transition-none"
                >
                  Lihat Siswa
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
