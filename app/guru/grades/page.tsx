"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import EmptyState from "@/components/admin/EmptyState";
import Modal from "@/components/admin/Modal";
import PageHeader from "@/components/admin/PageHeader";
import Pagination from "@/components/admin/Pagination";
import SearchInput from "@/components/admin/SearchInput";
import TableSkeleton from "@/components/admin/TableSkeleton";
import { apiFetch, apiFetchList } from "@/lib/api";
import { exportTablePdf } from "@/lib/exportPdf";
import type { GradeRow, GenerateGradesResponse, TeachingItem } from "@/types/types/learning";

interface TeachingOption {
  key: string;
  subjectId: number;
  classId: number;
  subjectName: string;
  className: string;
  label: string;
}

interface GradesResponse {
  data: GradeRow[];
}

type Semester = "Ganjil" | "Genap";

const pageSize = 15;
const academicYearPattern = /^\d{4}\/\d{4}$/;

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function formatNumber(value: number): string {
  return Number.isFinite(value)
    ? new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(value)
    : "-";
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function GradeIcon() {
  return (
    <svg aria-hidden="true" className="size-6" fill="none" viewBox="0 0 24 24">
      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

export default function GuruGradesPage() {
  const [teaching, setTeaching] = useState<TeachingItem[]>([]);
  const [teachingKey, setTeachingKey] = useState("");
  const [semester, setSemester] = useState<Semester>("Ganjil");
  const [academicYear, setAcademicYear] = useState("2026/2027");
  const [assignmentWeight, setAssignmentWeight] = useState("50");
  const [quizWeight, setQuizWeight] = useState("50");
  const [grades, setGrades] = useState<GradeRow[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isTeachingLoading, setIsTeachingLoading] = useState(true);
  const [isGradesLoading, setIsGradesLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pageError, setPageError] = useState("");
  const [generateError, setGenerateError] = useState("");
  const [isGenerateConfirmationOpen, setIsGenerateConfirmationOpen] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    let isMounted = true;

    async function loadTeaching() {
      try {
        const result = await apiFetchList<TeachingItem>("/api/guru/teaching");
        if (isMounted) {
          setTeaching(result);
          if (result.length > 0) setTeachingKey(`${result[0].SubjectID}:${result[0].ClassID}`);
        }
      } catch (error) {
        if (isMounted) setPageError(getErrorMessage(error, "Daftar kelas dan mata pelajaran gagal dimuat."));
      } finally {
        if (isMounted) setIsTeachingLoading(false);
      }
    }

    void loadTeaching();
    return () => {
      isMounted = false;
    };
  }, []);

  const teachingOptions = useMemo(() => {
    const options = new Map<string, TeachingOption>();
    for (const item of teaching) {
      const subjectName = item.Subject?.SubjectName ?? `Mata pelajaran ${item.SubjectID}`;
      const className = item.Class?.ClassName ?? `Kelas ${item.ClassID}`;
      const key = `${item.SubjectID}:${item.ClassID}`;
      options.set(key, {
        key,
        subjectId: item.SubjectID,
        classId: item.ClassID,
        subjectName,
        className,
        label: `${subjectName} — ${className}`,
      });
    }
    return [...options.values()].sort((left, right) => left.label.localeCompare(right.label, "id"));
  }, [teaching]);

  const selectedTeaching = teachingOptions.find((option) => option.key === teachingKey) ?? null;

  const loadGrades = useCallback(async (option: TeachingOption, selectedSemester: Semester, selectedYear: string) => {
    const currentRequestId = ++requestId.current;
    setIsGradesLoading(true);
    setPageError("");
    try {
      const query = new URLSearchParams({
        class_id: String(option.classId),
        semester: selectedSemester,
        academic_year: selectedYear,
      });
      const result = await apiFetch<GradesResponse>(
        `/api/guru/subjects/${option.subjectId}/grades?${query.toString()}`,
      );
      if (currentRequestId === requestId.current) setGrades(result.data ?? []);
    } catch (error) {
      if (currentRequestId === requestId.current) {
        setGrades([]);
        setPageError(getErrorMessage(error, "Daftar nilai gagal dimuat."));
      }
    } finally {
      if (currentRequestId === requestId.current) setIsGradesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedTeaching) return;
    void Promise.resolve().then(() => loadGrades(selectedTeaching, semester, academicYear));
  }, [academicYear, loadGrades, selectedTeaching, semester]);

  const filteredGrades = grades.filter((grade) =>
    grade.student_name.toLocaleLowerCase("id").includes(searchTerm.trim().toLocaleLowerCase("id")),
  );
  const pageCount = Math.max(1, Math.ceil(filteredGrades.length / pageSize));
  const safePage = Math.min(currentPage, pageCount);
  const visibleGrades = filteredGrades.slice((safePage - 1) * pageSize, safePage * pageSize);
  const weightsSummary = selectedWeights();
  const totalWeight = weightsSummary ? weightsSummary.assignment + weightsSummary.quiz : 0;

  function selectedWeights(): { assignment: number; quiz: number } | null {
    const assignment = Number(assignmentWeight);
    const quiz = Number(quizWeight);
    if (!Number.isFinite(assignment) || !Number.isFinite(quiz)) return null;
    return { assignment, quiz };
  }

  function validateGenerate(): string {
    if (!selectedTeaching) return "Pilih mata pelajaran dan kelas.";
    if (!academicYearPattern.test(academicYear.trim())) {
      return "Tahun ajaran harus menggunakan format YYYY/YYYY, misalnya 2026/2027.";
    }
    const weights = selectedWeights();
    if (!weights || weights.assignment < 0 || weights.quiz < 0) {
      return "Bobot tugas dan kuis harus berupa angka nol atau lebih.";
    }
    if (weights.assignment + weights.quiz !== 100) {
      return "Total Bobot Tugas dan Bobot Kuis harus 100.";
    }
    return "";
  }

  function requestGenerate() {
    setGenerateError("");
    const validationError = validateGenerate();
    if (validationError) {
      setGenerateError(validationError);
      return;
    }
    setIsGenerateConfirmationOpen(true);
  }

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    requestGenerate();
  }

  async function confirmGenerate() {
    if (!selectedTeaching) return;
    const validationError = validateGenerate();
    if (validationError) {
      setGenerateError(validationError);
      setIsGenerateConfirmationOpen(false);
      return;
    }

    const weights = selectedWeights();
    if (!weights) return;
    setIsGenerating(true);
    setGenerateError("");
    setPageError("");
    try {
      const result = await apiFetch<GenerateGradesResponse>(
        `/api/guru/subjects/${selectedTeaching.subjectId}/generate-grades`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            class_id: selectedTeaching.classId,
            semester,
            academic_year: academicYear.trim(),
            assignment_weight: weights.assignment,
            quiz_weight: weights.quiz,
          }),
        },
      );
      setGrades(result.data ?? []);
      setIsGenerateConfirmationOpen(false);
      await loadGrades(selectedTeaching, semester, academicYear.trim());
    } catch (error) {
      setGenerateError(getErrorMessage(error, "Nilai gagal digenerate."));
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleExport() {
    if (!selectedTeaching || filteredGrades.length === 0) return;
    setPageError("");
    const safeName = (value: string) =>
      value.toLocaleLowerCase("id").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    try {
      await exportTablePdf({
        title: `Nilai ${selectedTeaching.subjectName} - ${selectedTeaching.className} (${semester} ${academicYear.trim()})`,
        fileName: `nilai-${safeName(selectedTeaching.subjectName)}-${safeName(selectedTeaching.className)}.pdf`,
        columns: ["Nama", "NIS", "Rata-rata Tugas", "Rata-rata Kuis", "Nilai Akhir"],
        rows: filteredGrades.map((grade) => [
          grade.student_name,
          grade.student_nis || "-",
          formatNumber(grade.assignment_avg),
          formatNumber(grade.quiz_avg),
          formatNumber(grade.final_score),
        ]),
      });
    } catch (error) {
      setPageError(getErrorMessage(error, "PDF nilai gagal dibuat."));
    }
  }

  return (
    <div className="mx-auto max-w-[1440px]">
      <PageHeader
        description="Hitung dan tinjau nilai akhir siswa berdasarkan tugas dan kuis."
        eyebrow="Area guru"
        title="Nilai"
      />

      {pageError && (
        <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {pageError}
        </p>
      )}

      <section className="mb-7 rounded-xl border border-line bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="text-xl font-semibold font-[family-name:var(--font-fraunces)] text-ink">Generate Nilai</h2>
          <p className="mt-1 text-sm text-muted">Pilih kelas, semester, tahun ajaran, dan bobot penilaian.</p>
        </div>
        <form className="space-y-4" onSubmit={(event) => void handleGenerate(event)}>
          {generateError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {generateError}
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <label className="block sm:col-span-2 xl:col-span-1">
              <span className="mb-1.5 block text-sm font-medium text-ink">Mapel — Kelas</span>
              <select
                className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
                disabled={isTeachingLoading || teachingOptions.length === 0 || isGenerating}
                onChange={(event) => {
                  setTeachingKey(event.target.value);
                  setCurrentPage(1);
                  setSearchTerm("");
                }}
                required
                value={teachingKey}
              >
                <option value="">{isTeachingLoading ? "Memuat..." : "Pilih mapel dan kelas"}</option>
                {teachingOptions.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">Semester</span>
              <select
                className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
                disabled={isGenerating}
                onChange={(event) => setSemester(event.target.value as Semester)}
                value={semester}
              >
                <option value="Ganjil">Ganjil</option>
                <option value="Genap">Genap</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">Tahun Ajaran</span>
              <input
                className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none transition placeholder:text-muted/75 focus:border-brand focus:ring-2 focus:ring-brand/15"
                disabled={isGenerating}
                onChange={(event) => setAcademicYear(event.target.value)}
                placeholder="YYYY/YYYY"
                value={academicYear}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink">Bobot Tugas</span>
                <input
                  className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
                  disabled={isGenerating}
                  max="100"
                  min="0"
                  onChange={(event) => setAssignmentWeight(event.target.value)}
                  type="number"
                  value={assignmentWeight}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink">Bobot Kuis</span>
                <input
                  className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
                  disabled={isGenerating}
                  max="100"
                  min="0"
                  onChange={(event) => setQuizWeight(event.target.value)}
                  type="number"
                  value={quizWeight}
                />
              </label>
            </div>
          </div>
          <div className="flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">
              Total bobot: <span className={`font-semibold ${totalWeight === 100 ? "text-brand-dark" : "text-red-600"}`}>
                {totalWeight}%
              </span>
            </p>
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isGenerating || isTeachingLoading || !selectedTeaching}
              type="submit"
            >
              {isGenerating ? "Mengenerate..." : "Generate Nilai"}
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-line p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold font-[family-name:var(--font-fraunces)] text-ink">Daftar Nilai</h2>
            <p className="mt-1 text-sm text-muted">
              {selectedTeaching
                ? `${selectedTeaching.subjectName} · ${selectedTeaching.className} · ${semester} ${academicYear}`
                : "Pilih mata pelajaran dan kelas untuk melihat daftar nilai."}
            </p>
          </div>
          <button
            className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-lg border border-line px-4 text-sm font-semibold text-brand-dark transition-colors hover:bg-brand/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
            disabled={filteredGrades.length === 0}
            onClick={() => void handleExport()}
            type="button"
          >
            <svg aria-hidden="true" className="size-[18px]" fill="none" viewBox="0 0 24 24">
              <path d="M12 3v12M7 10l5 5 5-5M4 17v4h16v-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
            </svg>
            Export PDF
          </button>
        </div>

        <div className="border-b border-line p-4">
          <SearchInput
            label="Cari nama siswa"
            onChange={(value) => {
              setSearchTerm(value);
              setCurrentPage(1);
            }}
            placeholder="Cari nama siswa..."
            value={searchTerm}
          />
        </div>

        {isTeachingLoading || isGradesLoading ? (
          <div className="p-5"><TableSkeleton columns={6} rows={8} /></div>
        ) : !selectedTeaching ? (
          <EmptyState
            description="Pilih mata pelajaran dan kelas pada bagian Generate Nilai untuk melihat data."
            icon={<GradeIcon />}
            title="Pilih kelas dan mata pelajaran"
          />
        ) : filteredGrades.length === 0 ? (
          <EmptyState
            description={grades.length === 0 ? "Klik Generate Nilai untuk membuat daftar nilai semester ini." : "Ubah kata pencarian untuk melihat nilai siswa lainnya."}
            icon={<GradeIcon />}
            title={grades.length === 0 ? "Belum ada nilai. Klik Generate Nilai." : "Tidak ada siswa ditemukan"}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse text-left">
                <thead className="bg-surface/80">
                  <tr className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                    <th className="px-5 py-3.5">Nama</th>
                    <th className="px-5 py-3.5">NIS</th>
                    <th className="px-5 py-3.5">Rata-rata Tugas</th>
                    <th className="px-5 py-3.5">Rata-rata Kuis/Ujian</th>
                    <th className="px-5 py-3.5">Nilai Akhir</th>
                    <th className="px-5 py-3.5">Terakhir digenerate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {visibleGrades.map((grade) => (
                    <tr className="transition-colors hover:bg-surface/50" key={grade.id}>
                      <td className="px-5 py-4 text-sm font-semibold text-ink">{grade.student_name}</td>
                      <td className="px-5 py-4 text-sm text-ink">{grade.student_nis || "-"}</td>
                      <td className="px-5 py-4 text-sm text-ink">{formatNumber(grade.assignment_avg)}</td>
                      <td className="px-5 py-4 text-sm text-ink">{formatNumber(grade.quiz_avg)}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${grade.final_score >= 75 ? "bg-brand/10 text-brand-dark" : "bg-surface text-muted"}`}>
                          {formatNumber(grade.final_score)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-muted">{formatDate(grade.generated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={safePage} pageSize={pageSize} total={filteredGrades.length} onPageChange={setCurrentPage} />
          </>
        )}
      </section>

      {isGenerateConfirmationOpen && selectedTeaching && (
        <Modal
          title="Konfirmasi Generate Nilai"
          onClose={() => {
            if (!isGenerating) setIsGenerateConfirmationOpen(false);
          }}
          maxWidth="max-w-lg"
        >
          <div className="mt-5">
            <p className="rounded-lg border border-brand/20 bg-brand/10 px-4 py-3 text-sm leading-6 text-ink">
              Tugas yang sudah dikumpulkan tetapi belum dinilai dihitung 0. Pastikan semua sudah dinilai.
            </p>
            <p className="mt-4 text-sm text-muted">
              Generate nilai {selectedTeaching.subjectName} — {selectedTeaching.className} untuk semester {semester} tahun ajaran {academicYear}?
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                className="min-h-11 rounded-lg border border-line px-5 text-sm font-semibold text-ink transition hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isGenerating}
                onClick={() => setIsGenerateConfirmationOpen(false)}
                type="button"
              >
                Batal
              </button>
              <button
                className="min-h-11 rounded-lg bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isGenerating}
                onClick={() => void confirmGenerate()}
                type="button"
              >
                {isGenerating ? "Mengenerate..." : "Lanjutkan"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
