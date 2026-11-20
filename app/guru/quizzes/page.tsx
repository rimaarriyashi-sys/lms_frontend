"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import EmptyState from "@/components/admin/EmptyState";
import Modal from "@/components/admin/Modal";
import PageHeader from "@/components/admin/PageHeader";
import Pagination from "@/components/admin/Pagination";
import SearchInput from "@/components/admin/SearchInput";
import TableSkeleton from "@/components/admin/TableSkeleton";
import { apiFetch, apiFetchList } from "@/lib/api";
import type { QuizItem, TeachingItem } from "@/types/types/learning";

type QuizType = "kuis" | "ujian";
type ResultMode = "hidden" | "after_submit" | "after_publish";
type TypeFilter = "" | QuizType;

interface TeachingOption {
  key: string;
  subjectId: number;
  classId: number;
  label: string;
}

interface QuizForm {
  teachingKey: string;
  title: string;
  quizType: QuizType;
  startTime: string;
  endTime: string;
  isTimed: boolean;
  durationMin: string;
  resultMode: ResultMode;
  showAnswerKey: boolean;
}

const pageSize = 10;

function defaultForm(quizType: QuizType = "kuis"): QuizForm {
  return {
    teachingKey: "",
    title: "",
    quizType,
    startTime: "",
    endTime: "",
    isTimed: false,
    durationMin: "",
    resultMode: quizType === "kuis" ? "hidden" : "after_publish",
    showAnswerKey: false,
  };
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function toLocalDateTime(value?: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function formatSchedule(startTime: string, endTime: string): string {
  const formatPart = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "-"
      : new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(date);
  };
  return `${formatPart(startTime)} – ${formatPart(endTime)}`;
}

function resultModeLabel(mode: string): string {
  if (mode === "after_submit") return "Langsung setelah selesai";
  if (mode === "after_publish") return "Setelah dipublikasikan";
  return "Disembunyikan";
}

function QuizIcon() {
  return (
    <svg aria-hidden="true" className="size-6" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path d="M9.6 9a2.5 2.5 0 1 1 4.3 1.7c-1 .9-1.9 1.3-1.9 2.8M12 17.5v.1" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg aria-hidden="true" className="size-[18px]" fill="none" viewBox="0 0 24 24">
      <path d="m14 5 5 5M4 20l4.5-1 10.8-10.8a2.1 2.1 0 0 0-3-3L5.5 16z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg aria-hidden="true" className="size-[18px]" fill="none" viewBox="0 0 24 24">
      <path d="M4 7h16M10 11v6M14 11v6M5.5 7l1 14h11l1-14M9 7V4h6v3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

export default function GuruQuizzesPage() {
  const router = useRouter();
  const [teaching, setTeaching] = useState<TeachingItem[]>([]);
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [classFilter, setClassFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<QuizItem | null>(null);
  const [form, setForm] = useState<QuizForm>(defaultForm());
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingQuiz, setDeletingQuiz] = useState<QuizItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function loadData(showLoading: boolean) {
    if (showLoading) setIsLoading(true);
    setPageError("");
    const [teachingResult, quizzesResult] = await Promise.allSettled([
      apiFetchList<TeachingItem>("/api/guru/teaching"),
      apiFetchList<QuizItem>("/api/guru/quizzes"),
    ]);

    const errors: string[] = [];
    if (teachingResult.status === "fulfilled") setTeaching(teachingResult.value);
    else errors.push(getErrorMessage(teachingResult.reason, "Daftar kelas dan mata pelajaran gagal dimuat."));
    if (quizzesResult.status === "fulfilled") setQuizzes(quizzesResult.value);
    else errors.push(getErrorMessage(quizzesResult.reason, "Daftar kuis dan ujian gagal dimuat."));
    setPageError(errors.join(" "));
    setIsLoading(false);
  }

  useEffect(() => {
    void Promise.resolve().then(() => loadData(true));
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
        label: `${subjectName} — ${className}`,
      });
    }
    return [...options.values()].sort((left, right) => left.label.localeCompare(right.label, "id"));
  }, [teaching]);

  const availableClasses = useMemo(() => {
    const classes = new Map<number, string>();
    for (const item of teaching) {
      if (item.Class) classes.set(item.ClassID, item.Class.ClassName);
    }
    return [...classes.entries()].sort((left, right) => left[1].localeCompare(right[1], "id"));
  }, [teaching]);

  const availableSubjects = useMemo(() => {
    const subjects = new Map<number, string>();
    for (const item of teaching) {
      if (item.Subject) subjects.set(item.SubjectID, item.Subject.SubjectName);
    }
    return [...subjects.entries()].sort((left, right) => left[1].localeCompare(right[1], "id"));
  }, [teaching]);

  const filteredQuizzes = quizzes.filter((quiz) =>
    (!classFilter || String(quiz.ClassID ?? "") === classFilter) &&
    (!subjectFilter || String(quiz.SubjectID) === subjectFilter) &&
    (!typeFilter || quiz.QuizType === typeFilter) &&
    quiz.Title.toLocaleLowerCase("id").includes(searchTerm.trim().toLocaleLowerCase("id")),
  );
  const pageCount = Math.max(1, Math.ceil(filteredQuizzes.length / pageSize));
  const safePage = Math.min(currentPage, pageCount);
  const visibleQuizzes = filteredQuizzes.slice((safePage - 1) * pageSize, safePage * pageSize);

  function openCreateModal() {
    setEditingQuiz(null);
    setForm(defaultForm());
    setFormError("");
    setIsModalOpen(true);
  }

  function openEditModal(quiz: QuizItem) {
    setEditingQuiz(quiz);
    setForm({
      teachingKey: quiz.ClassID == null ? "" : `${quiz.SubjectID}:${quiz.ClassID}`,
      title: quiz.Title,
      quizType: quiz.QuizType === "ujian" ? "ujian" : "kuis",
      startTime: toLocalDateTime(quiz.StartTime),
      endTime: toLocalDateTime(quiz.EndTime),
      isTimed: quiz.IsTimed,
      durationMin: quiz.DurationMin > 0 ? String(quiz.DurationMin) : "",
      resultMode: quiz.ResultMode === "after_submit" || quiz.ResultMode === "after_publish"
        ? quiz.ResultMode
        : "hidden",
      showAnswerKey: quiz.ShowAnswerKey,
    });
    setFormError("");
    setIsModalOpen(true);
  }

  function updateQuizType(quizType: QuizType) {
    setForm((current) => ({
      ...current,
      quizType,
      resultMode: quizType === "ujian" && current.resultMode === "after_submit"
        ? "after_publish"
        : current.resultMode,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    const option = teachingOptions.find((item) => item.key === form.teachingKey);
    if (!option) {
      setFormError("Pilih mata pelajaran dan kelas.");
      return;
    }
    const title = form.title.trim();
    if (!title) {
      setFormError("Judul kuis atau ujian wajib diisi.");
      return;
    }
    const start = new Date(form.startTime);
    const end = new Date(form.endTime);
    if (!form.startTime || Number.isNaN(start.getTime())) {
      setFormError("Waktu mulai wajib diisi dengan tanggal yang valid.");
      return;
    }
    if (!form.endTime || Number.isNaN(end.getTime())) {
      setFormError("Waktu selesai wajib diisi dengan tanggal yang valid.");
      return;
    }
    if (end <= start) {
      setFormError("Waktu selesai harus setelah waktu mulai.");
      return;
    }
    const durationMin = form.isTimed ? Number(form.durationMin) : 0;
    if (form.isTimed && (!Number.isInteger(durationMin) || durationMin <= 0)) {
      setFormError("Durasi menit wajib diisi dengan angka lebih besar dari 0 untuk kuis ber-timer.");
      return;
    }

    setIsSaving(true);
    try {
      const body = {
        subject_id: option.subjectId,
        class_id: option.classId,
        title,
        quiz_type: form.quizType,
        is_timed: form.isTimed,
        duration_min: durationMin,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        result_mode: form.resultMode,
        show_answer_key: form.showAnswerKey,
      };

      if (editingQuiz) {
        await apiFetch(`/api/guru/quizzes/${editingQuiz.ID}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        setIsModalOpen(false);
        setEditingQuiz(null);
        await loadData(false);
      } else {
        const result = await apiFetch<{ data: QuizItem }>("/api/guru/quizzes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!result.data?.ID) {
          throw new Error("Kuis berhasil dibuat, tetapi ID kuis tidak diterima dari server.");
        }
        router.push(`/guru/quizzes/${result.data.ID}`);
      }
    } catch (error) {
      setFormError(getErrorMessage(error, "Kuis atau ujian gagal disimpan."));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingQuiz) return;
    setIsDeleting(true);
    setPageError("");
    try {
      await apiFetch(`/api/guru/quizzes/${deletingQuiz.ID}`, { method: "DELETE" });
      setDeletingQuiz(null);
      await loadData(false);
    } catch (error) {
      setPageError(getErrorMessage(error, "Kuis atau ujian gagal dihapus."));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1440px]">
      <PageHeader
        actions={(
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-lg bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:self-auto"
            onClick={openCreateModal}
            type="button"
          >
            <span className="size-[18px]"><QuizIcon /></span>
            Buat Kuis/Ujian
          </button>
        )}
        description="Kelola jadwal, pengaturan, dan tampilan hasil kuis serta ujian."
        eyebrow="Area guru"
        title="Kuis & Ujian"
      />

      {pageError && (
        <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{pageError}</p>
      )}

      <section className="mb-5 flex flex-col gap-3 rounded-lg border border-line bg-white p-4 sm:flex-row sm:flex-wrap sm:items-center">
        <label className="block w-full sm:w-auto">
          <span className="sr-only">Filter kelas</span>
          <select
            className="h-11 w-full min-w-44 rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
            onChange={(event) => {
              setClassFilter(event.target.value);
              setCurrentPage(1);
            }}
            value={classFilter}
          >
            <option value="">Semua kelas</option>
            {availableClasses.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
        </label>
        <label className="block w-full sm:w-auto">
          <span className="sr-only">Filter mata pelajaran</span>
          <select
            className="h-11 w-full min-w-48 rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
            onChange={(event) => {
              setSubjectFilter(event.target.value);
              setCurrentPage(1);
            }}
            value={subjectFilter}
          >
            <option value="">Semua mata pelajaran</option>
            {availableSubjects.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
        </label>
        <label className="block w-full sm:w-auto">
          <span className="sr-only">Filter jenis</span>
          <select
            className="h-11 w-full min-w-36 rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
            onChange={(event) => {
              setTypeFilter(event.target.value as TypeFilter);
              setCurrentPage(1);
            }}
            value={typeFilter}
          >
            <option value="">Semua jenis</option>
            <option value="kuis">Kuis</option>
            <option value="ujian">Ujian</option>
          </select>
        </label>
        <SearchInput
          label="Cari judul kuis atau ujian"
          onChange={(value) => {
            setSearchTerm(value);
            setCurrentPage(1);
          }}
          placeholder="Cari judul..."
          value={searchTerm}
        />
      </section>

      <section className="overflow-hidden rounded-lg border border-line bg-white">
        {isLoading ? (
          <div className="p-5"><TableSkeleton columns={7} rows={8} /></div>
        ) : filteredQuizzes.length === 0 ? (
          <EmptyState
            description={quizzes.length === 0 ? "Buat kuis atau ujian untuk mengukur pemahaman siswa." : "Ubah filter atau kata pencarian untuk melihat kuis dan ujian lainnya."}
            icon={<QuizIcon />}
            title={quizzes.length === 0 ? "Belum ada kuis atau ujian" : "Tidak ada kuis ditemukan"}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1320px] border-collapse text-left">
                <thead className="bg-surface/80">
                  <tr className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                    <th className="px-5 py-3.5">Judul</th>
                    <th className="px-5 py-3.5">Mapel</th>
                    <th className="px-5 py-3.5">Kelas</th>
                    <th className="px-5 py-3.5">Jadwal</th>
                    <th className="px-5 py-3.5">Durasi</th>
                    <th className="px-5 py-3.5">Tampilan Hasil</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {visibleQuizzes.map((quiz) => {
                    const className = teaching.find((item) =>
                      item.SubjectID === quiz.SubjectID &&
                      quiz.ClassID != null &&
                      item.ClassID === quiz.ClassID,
                    )?.Class?.ClassName;
                    const subjectName = quiz.Subject?.SubjectName ??
                      teaching.find((item) => item.SubjectID === quiz.SubjectID)?.Subject?.SubjectName ??
                      "-";

                    return (
                      <tr className="transition-colors hover:bg-surface/50" key={quiz.ID}>
                        <td className="max-w-64 px-5 py-4">
                          <p className="truncate text-sm font-semibold text-ink">{quiz.Title}</p>
                          <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${quiz.QuizType === "ujian" ? "bg-brand/10 text-brand-dark" : "bg-surface text-muted"}`}>
                            {quiz.QuizType === "ujian" ? "Ujian" : "Kuis"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-ink">{subjectName}</td>
                        <td className="px-5 py-4 text-sm text-ink">{quiz.ClassID == null ? "Belum ada kelas" : className ?? "-"}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-ink">{formatSchedule(quiz.StartTime, quiz.EndTime)}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-ink">{quiz.IsTimed ? `${quiz.DurationMin} menit` : "Tanpa batas"}</td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col items-start gap-1.5">
                            <span className="text-sm text-ink">{resultModeLabel(quiz.ResultMode)}</span>
                            {quiz.ResultsPublished && (
                              <span className="inline-flex rounded-full bg-brand/10 px-2.5 py-1 text-[11px] font-semibold text-brand-dark">Sudah dipublikasikan</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              className="inline-flex min-h-9 items-center rounded-lg px-2.5 text-xs font-semibold text-brand-dark transition-colors hover:bg-brand/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                              href={`/guru/quizzes/${quiz.ID}`}
                            >
                              Kelola
                            </Link>
                            <button
                              aria-label={`Edit ${quiz.QuizType === "ujian" ? "ujian" : "kuis"} ${quiz.Title}`}
                              className="grid size-9 place-items-center rounded-lg border border-line text-brand-dark transition-colors hover:border-brand/40 hover:bg-brand/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                              onClick={() => openEditModal(quiz)}
                              type="button"
                            >
                              <EditIcon />
                            </button>
                            <button
                              aria-label={`Hapus ${quiz.QuizType === "ujian" ? "ujian" : "kuis"} ${quiz.Title}`}
                              className="grid size-9 place-items-center rounded-lg border border-red-200 text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                              onClick={() => setDeletingQuiz(quiz)}
                              type="button"
                            >
                              <DeleteIcon />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={safePage} pageSize={pageSize} total={filteredQuizzes.length} onPageChange={setCurrentPage} />
          </>
        )}
      </section>

      {isModalOpen && (
        <Modal
          title={editingQuiz ? "Edit Kuis/Ujian" : "Buat Kuis/Ujian"}
          onClose={() => {
            if (!isSaving) setIsModalOpen(false);
          }}
          maxWidth="max-w-3xl"
        >
          <form className="mt-6 space-y-4" onSubmit={(event) => void handleSubmit(event)}>
            {formError && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{formError}</p>}
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">Mapel — Kelas <span className="text-red-600">*</span></span>
              <select
                className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
                disabled={isSaving}
                onChange={(event) => setForm((current) => ({ ...current, teachingKey: event.target.value }))}
                required
                value={form.teachingKey}
              >
                <option value="">Pilih mapel dan kelas</option>
                {teachingOptions.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">Judul <span className="text-red-600">*</span></span>
              <input
                className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none transition placeholder:text-muted/75 focus:border-brand focus:ring-2 focus:ring-brand/15"
                disabled={isSaving}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                required
                value={form.title}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink">Jenis</span>
                <select
                  className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
                  disabled={isSaving}
                  onChange={(event) => updateQuizType(event.target.value as QuizType)}
                  value={form.quizType}
                >
                  <option value="kuis">Kuis</option>
                  <option value="ujian">Ujian</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink">Tampilan Hasil ke Siswa</span>
                <select
                  className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
                  disabled={isSaving}
                  onChange={(event) => setForm((current) => ({ ...current, resultMode: event.target.value as ResultMode }))}
                  value={form.resultMode}
                >
                  <option value="hidden">Sembunyikan</option>
                  {form.quizType === "kuis" && <option value="after_submit">Tampilkan langsung setelah selesai</option>}
                  <option value="after_publish">Tampilkan setelah dipublikasikan</option>
                </select>
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink">Mulai <span className="text-red-600">*</span></span>
                <input
                  className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
                  disabled={isSaving}
                  onChange={(event) => setForm((current) => ({ ...current, startTime: event.target.value }))}
                  required
                  type="datetime-local"
                  value={form.startTime}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink">Selesai <span className="text-red-600">*</span></span>
                <input
                  className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
                  disabled={isSaving}
                  onChange={(event) => setForm((current) => ({ ...current, endTime: event.target.value }))}
                  required
                  type="datetime-local"
                  value={form.endTime}
                />
              </label>
            </div>
            <div className="rounded-lg border border-line p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-ink">Ber-timer</p>
                  <p className="mt-1 text-xs text-muted">Tetapkan batas durasi pengerjaan kuis/ujian.</p>
                </div>
                <button
                  aria-checked={form.isTimed}
                  aria-label="Ber-timer"
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60 ${form.isTimed ? "bg-brand" : "bg-line"}`}
                  disabled={isSaving}
                  onClick={() => setForm((current) => ({ ...current, isTimed: !current.isTimed }))}
                  role="switch"
                  type="button"
                >
                  <span className={`inline-block size-5 rounded-full bg-white shadow transition-transform ${form.isTimed ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
              {form.isTimed && (
                <label className="mt-4 block max-w-xs">
                  <span className="mb-1.5 block text-sm font-medium text-ink">Durasi menit <span className="text-red-600">*</span></span>
                  <input
                    className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
                    disabled={isSaving}
                    min="1"
                    onChange={(event) => setForm((current) => ({ ...current, durationMin: event.target.value }))}
                    required
                    type="number"
                    value={form.durationMin}
                  />
                </label>
              )}
            </div>
            <label className="flex items-start gap-3 rounded-lg border border-line p-4">
              <input
                checked={form.showAnswerKey}
                className="mt-0.5 size-4 rounded border-line accent-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                disabled={isSaving}
                onChange={(event) => setForm((current) => ({ ...current, showAnswerKey: event.target.checked }))}
                type="checkbox"
              />
              <span>
                <span className="block text-sm font-medium text-ink">Izinkan siswa melihat kunci jawaban pada pembahasan</span>
                <span className="mt-1 block text-xs text-muted">Kunci jawaban hanya ditampilkan sesuai aturan hasil yang berlaku.</span>
              </span>
            </label>

            <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:justify-end">
              <button
                className="min-h-11 rounded-lg border border-line px-5 text-sm font-semibold text-ink transition hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSaving}
                onClick={() => setIsModalOpen(false)}
                type="button"
              >
                Batal
              </button>
              <button
                className="min-h-11 rounded-lg bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSaving || teachingOptions.length === 0}
                type="submit"
              >
                {isSaving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmDialog
        isOpen={deletingQuiz !== null}
        title="Hapus Kuis/Ujian"
        message={`Apakah Anda yakin ingin menghapus "${deletingQuiz?.Title ?? ""}"? Soal dan seluruh pengerjaan siswa ikut terhapus.`}
        onCancel={() => setDeletingQuiz(null)}
        onConfirm={() => void handleDelete()}
        isLoading={isDeleting}
      />
    </div>
  );
}
