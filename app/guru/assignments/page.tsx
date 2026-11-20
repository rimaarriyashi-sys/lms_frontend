"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import EmptyState from "@/components/admin/EmptyState";
import Modal from "@/components/admin/Modal";
import PageHeader from "@/components/admin/PageHeader";
import Pagination from "@/components/admin/Pagination";
import SearchInput from "@/components/admin/SearchInput";
import TableSkeleton from "@/components/admin/TableSkeleton";
import { apiFetch, apiFetchList } from "@/lib/api";
import type { AssignmentItem, TeachingItem } from "@/types/types/learning";

interface TeachingOption {
  key: string;
  subjectId: number;
  classId: number;
  subjectName: string;
  className: string;
  label: string;
}

interface AssignmentForm {
  teachingKey: string;
  title: string;
  type: "tugas" | "projek";
  description: string;
  deadline: string;
  maxScore: string;
}

const pageSize = 10;
const emptyForm: AssignmentForm = {
  teachingKey: "",
  title: "",
  type: "tugas",
  description: "",
  deadline: "",
  maxScore: "100",
};

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function toLocalDateTime(value?: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function AssignmentIcon() {
  return (
    <svg aria-hidden="true" className="size-6" fill="none" viewBox="0 0 24 24">
      <path d="M8 4h8M9 3h6v3H9zM6 5H4v16h16V5h-2M8 11h8M8 15h5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
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

export default function GuruAssignmentsPage() {
  const [teaching, setTeaching] = useState<TeachingItem[]>([]);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [classFilter, setClassFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loadedAt, setLoadedAt] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<AssignmentItem | null>(null);
  const [form, setForm] = useState<AssignmentForm>(emptyForm);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingAssignment, setDeletingAssignment] = useState<AssignmentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function loadData(showLoading: boolean) {
    if (showLoading) setIsLoading(true);
    setPageError("");
    const [teachingResult, assignmentsResult] = await Promise.allSettled([
      apiFetchList<TeachingItem>("/api/guru/teaching"),
      apiFetchList<AssignmentItem>("/api/assignments"),
    ]);

    const errors: string[] = [];
    if (teachingResult.status === "fulfilled") setTeaching(teachingResult.value);
    else errors.push(getErrorMessage(teachingResult.reason, "Daftar kelas dan mata pelajaran gagal dimuat."));
    if (assignmentsResult.status === "fulfilled") {
      setAssignments(assignmentsResult.value);
      setLoadedAt(Date.now());
    } else {
      errors.push(getErrorMessage(assignmentsResult.reason, "Daftar tugas gagal dimuat."));
    }
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
        subjectName,
        className,
        label: `${subjectName} — ${className}`,
      });
    }
    return [...options.values()].sort((left, right) => left.label.localeCompare(right.label, "id"));
  }, [teaching]);

  const availableClasses = useMemo(() => {
    const classes = new Map<number, string>();
    for (const option of teachingOptions) classes.set(option.classId, option.className);
    return [...classes.entries()].sort((left, right) => left[1].localeCompare(right[1], "id"));
  }, [teachingOptions]);

  const availableSubjects = useMemo(() => {
    const subjects = new Map<number, string>();
    for (const option of teachingOptions) subjects.set(option.subjectId, option.subjectName);
    return [...subjects.entries()].sort((left, right) => left[1].localeCompare(right[1], "id"));
  }, [teachingOptions]);

  const filteredAssignments = assignments.filter((assignment) =>
    (!classFilter || String(assignment.ClassID ?? "") === classFilter) &&
    (!subjectFilter || String(assignment.SubjectID) === subjectFilter) &&
    assignment.Title.toLocaleLowerCase("id").includes(searchTerm.trim().toLocaleLowerCase("id")),
  );
  const pageCount = Math.max(1, Math.ceil(filteredAssignments.length / pageSize));
  const safePage = Math.min(currentPage, pageCount);
  const visibleAssignments = filteredAssignments.slice((safePage - 1) * pageSize, safePage * pageSize);

  function openCreateModal() {
    setEditingAssignment(null);
    setForm(emptyForm);
    setFormError("");
    setIsModalOpen(true);
  }

  function openEditModal(assignment: AssignmentItem) {
    setEditingAssignment(assignment);
    setForm({
      teachingKey: assignment.ClassID == null ? "" : `${assignment.SubjectID}:${assignment.ClassID}`,
      title: assignment.Title,
      type: assignment.Type === "projek" ? "projek" : "tugas",
      description: assignment.Description ?? "",
      deadline: toLocalDateTime(assignment.Deadline),
      maxScore: String(assignment.MaxScore),
    });
    setFormError("");
    setIsModalOpen(true);
  }

  async function refreshAssignments() {
    await loadData(false);
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
      setFormError("Judul tugas wajib diisi.");
      return;
    }
    if (!form.deadline || Number.isNaN(new Date(form.deadline).getTime())) {
      setFormError("Tenggat waktu wajib diisi dengan tanggal yang valid.");
      return;
    }
    const maxScore = Number(form.maxScore);
    if (!Number.isFinite(maxScore) || maxScore <= 0) {
      setFormError("Nilai maksimal harus lebih besar dari 0.");
      return;
    }

    setIsSaving(true);
    try {
      const body = {
        subject_id: option.subjectId,
        class_id: option.classId,
        title,
        description: form.description.trim(),
        type: form.type,
        deadline: new Date(form.deadline).toISOString(),
        max_score: maxScore,
      };
      if (editingAssignment) {
        await apiFetch(`/api/guru/assignments/${editingAssignment.ID}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        await apiFetch("/api/guru/assignments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
      setIsModalOpen(false);
      setEditingAssignment(null);
      await refreshAssignments();
    } catch (error) {
      setFormError(getErrorMessage(error, "Tugas gagal disimpan."));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingAssignment) return;
    setIsDeleting(true);
    setPageError("");
    try {
      await apiFetch(`/api/guru/assignments/${deletingAssignment.ID}`, { method: "DELETE" });
      setDeletingAssignment(null);
      await refreshAssignments();
    } catch (error) {
      setPageError(getErrorMessage(error, "Tugas gagal dihapus."));
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
            <span className="size-[18px]"><AssignmentIcon /></span>
            Buat Tugas
          </button>
        )}
        description="Kelola tugas dan projek untuk kelas yang Anda ampu."
        eyebrow="Area guru"
        title="Tugas & Projek"
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
        <SearchInput
          label="Cari judul tugas"
          onChange={(value) => {
            setSearchTerm(value);
            setCurrentPage(1);
          }}
          placeholder="Cari judul tugas..."
          value={searchTerm}
        />
      </section>

      <section className="overflow-hidden rounded-lg border border-line bg-white">
        {isLoading ? (
          <div className="p-5"><TableSkeleton columns={7} rows={8} /></div>
        ) : filteredAssignments.length === 0 ? (
          <EmptyState
            description={assignments.length === 0 ? "Buat tugas atau projek untuk kelas yang Anda ampu." : "Ubah filter atau kata pencarian untuk melihat tugas lainnya."}
            icon={<AssignmentIcon />}
            title={assignments.length === 0 ? "Belum ada tugas atau projek" : "Tidak ada tugas ditemukan"}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1160px] border-collapse text-left">
                <thead className="bg-surface/80">
                  <tr className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                    <th className="px-5 py-3.5">Judul</th>
                    <th className="px-5 py-3.5">Mapel</th>
                    <th className="px-5 py-3.5">Kelas</th>
                    <th className="px-5 py-3.5">Tenggat</th>
                    <th className="px-5 py-3.5">Nilai Maks</th>
                    <th className="px-5 py-3.5">Status Nilai</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {visibleAssignments.map((assignment) => {
                    const match = teachingOptions.find((option) =>
                      option.subjectId === assignment.SubjectID &&
                      assignment.ClassID != null &&
                      option.classId === assignment.ClassID,
                    );
                    const subjectName = teachingOptions.find((option) => option.subjectId === assignment.SubjectID)?.subjectName ?? "-";
                    const isOverdue = loadedAt > 0 && Date.parse(assignment.Deadline) < loadedAt;

                    return (
                      <tr className="transition-colors hover:bg-surface/50" key={assignment.ID}>
                        <td className="max-w-64 px-5 py-4">
                          <p className="truncate text-sm font-semibold text-ink">{assignment.Title}</p>
                          <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${assignment.Type === "projek" ? "bg-brand/10 text-brand-dark" : "bg-surface text-muted"}`}>
                            {assignment.Type === "projek" ? "Projek" : "Tugas"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-ink">{subjectName}</td>
                        <td className="px-5 py-4 text-sm text-ink">{assignment.ClassID == null ? "Belum ada kelas" : match?.className ?? "-"}</td>
                        <td className={`whitespace-nowrap px-5 py-4 text-sm ${isOverdue ? "text-red-600" : "text-ink"}`}>{formatDate(assignment.Deadline)}</td>
                        <td className="px-5 py-4 text-sm text-ink">{assignment.MaxScore}</td>
                        <td className="px-5 py-4">
                          {assignment.GradesPublished ? (
                            <span className="inline-flex rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand-dark">Dipublikasikan</span>
                          ) : (
                            <span className="inline-flex rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-muted">Disembunyikan</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              className="inline-flex min-h-9 items-center rounded-lg px-2.5 text-xs font-semibold text-brand-dark transition-colors hover:bg-brand/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                              href={`/guru/assignments/${assignment.ID}`}
                            >
                              Lihat Pengumpulan
                            </Link>
                            <button
                              aria-label={`Edit tugas ${assignment.Title}`}
                              className="grid size-9 place-items-center rounded-lg border border-line text-brand-dark transition-colors hover:border-brand/40 hover:bg-brand/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                              onClick={() => openEditModal(assignment)}
                              type="button"
                            >
                              <EditIcon />
                            </button>
                            <button
                              aria-label={`Hapus tugas ${assignment.Title}`}
                              className="grid size-9 place-items-center rounded-lg border border-red-200 text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                              onClick={() => setDeletingAssignment(assignment)}
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
            <Pagination page={safePage} pageSize={pageSize} total={filteredAssignments.length} onPageChange={setCurrentPage} />
          </>
        )}
      </section>

      {isModalOpen && (
        <Modal
          title={editingAssignment ? "Edit Tugas atau Projek" : "Buat Tugas atau Projek"}
          onClose={() => {
            if (!isSaving) setIsModalOpen(false);
          }}
          maxWidth="max-w-2xl"
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
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">Jenis</span>
              <select
                className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
                disabled={isSaving}
                onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as AssignmentForm["type"] }))}
                value={form.type}
              >
                <option value="tugas">Tugas</option>
                <option value="projek">Projek</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">Deskripsi</span>
              <textarea
                className="min-h-24 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/75 focus:border-brand focus:ring-2 focus:ring-brand/15"
                disabled={isSaving}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                value={form.description}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink">Tenggat <span className="text-red-600">*</span></span>
                <input
                  className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
                  disabled={isSaving}
                  onChange={(event) => setForm((current) => ({ ...current, deadline: event.target.value }))}
                  required
                  type="datetime-local"
                  value={form.deadline}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink">Nilai Maksimal</span>
                <input
                  className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
                  disabled={isSaving}
                  min="1"
                  onChange={(event) => setForm((current) => ({ ...current, maxScore: event.target.value }))}
                  type="number"
                  value={form.maxScore}
                />
              </label>
            </div>
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
        isOpen={deletingAssignment !== null}
        title="Hapus Tugas atau Projek"
        message={`Apakah Anda yakin ingin menghapus "${deletingAssignment?.Title ?? ""}"? Seluruh pengumpulan siswa pada tugas ini ikut terhapus.`}
        onCancel={() => setDeletingAssignment(null)}
        onConfirm={() => void handleDelete()}
        isLoading={isDeleting}
      />
    </div>
  );
}
