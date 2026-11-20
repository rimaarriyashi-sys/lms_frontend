"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import EmptyState from "@/components/admin/EmptyState";
import Modal from "@/components/admin/Modal";
import PageHeader from "@/components/admin/PageHeader";
import Pagination from "@/components/admin/Pagination";
import SearchInput from "@/components/admin/SearchInput";
import TableSkeleton from "@/components/admin/TableSkeleton";
import { apiFetch, apiFetchList, downloadFile, uploadFile } from "@/lib/api";
import type { TeachingItem, MaterialItem } from "@/types/types/learning";

interface TeachingOption {
  key: string;
  subjectId: number;
  classId: number;
  label: string;
  subjectName: string;
  className: string;
}

interface MaterialForm {
  teachingKey: string;
  title: string;
  description: string;
}

const pageSize = 10;
const allowedExtensions = new Set([
  ".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx",
  ".txt", ".zip", ".rar", ".png", ".jpg", ".jpeg",
]);
const maxFileSize = 10 * 1024 * 1024;
const acceptFileTypes = ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.rar,.png,.jpg,.jpeg";
const emptyForm: MaterialForm = { teachingKey: "", title: "", description: "" };

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function MaterialIcon() {
  return (
    <svg aria-hidden="true" className="size-6" fill="none" viewBox="0 0 24 24">
      <path d="M6 3.5h8l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1zM14 3.5V8h4M9 12h6M9 16h6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
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

function getExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex >= 0 ? fileName.slice(dotIndex).toLocaleLowerCase("en-US") : "";
}

function formatDate(value?: string): string {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(date);
}

export default function GuruMaterialsPage() {
  const [teaching, setTeaching] = useState<TeachingItem[]>([]);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [classFilter, setClassFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialItem | null>(null);
  const [form, setForm] = useState<MaterialForm>(emptyForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formError, setFormError] = useState("");
  const [savePhase, setSavePhase] = useState<"idle" | "uploading" | "saving">("idle");
  const [deletingMaterial, setDeletingMaterial] = useState<MaterialItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function loadData(showLoading: boolean) {
    if (showLoading) setIsLoading(true);
    setPageError("");
    const [teachingResult, materialsResult] = await Promise.allSettled([
      apiFetchList<TeachingItem>("/api/guru/teaching"),
      apiFetchList<MaterialItem>("/api/materials"),
    ]);

    const errors: string[] = [];
    if (teachingResult.status === "fulfilled") setTeaching(teachingResult.value);
    else errors.push(getErrorMessage(teachingResult.reason, "Daftar kelas dan mata pelajaran gagal dimuat."));
    if (materialsResult.status === "fulfilled") setMaterials(materialsResult.value);
    else errors.push(getErrorMessage(materialsResult.reason, "Daftar materi gagal dimuat."));
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
        subjectName,
        className,
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

  const filteredMaterials = materials.filter((material) => {
    const matchesClass = !classFilter || String(material.ClassID ?? "") === classFilter;
    const matchesSubject = !subjectFilter || String(material.SubjectID) === subjectFilter;
    const matchesSearch = material.Title.toLocaleLowerCase("id").includes(searchTerm.trim().toLocaleLowerCase("id"));
    return matchesClass && matchesSubject && matchesSearch;
  });
  const pageCount = Math.max(1, Math.ceil(filteredMaterials.length / pageSize));
  const safePage = Math.min(currentPage, pageCount);
  const visibleMaterials = filteredMaterials.slice((safePage - 1) * pageSize, safePage * pageSize);

  function resetFilters() {
    setCurrentPage(1);
  }

  function openCreateModal() {
    setEditingMaterial(null);
    setForm(emptyForm);
    setSelectedFile(null);
    setFormError("");
    setIsModalOpen(true);
  }

  function openEditModal(material: MaterialItem) {
    const teachingKey = material.ClassID == null ? "" : `${material.SubjectID}:${material.ClassID}`;
    setEditingMaterial(material);
    setForm({
      teachingKey,
      title: material.Title,
      description: material.Description ?? "",
    });
    setSelectedFile(null);
    setFormError("");
    setIsModalOpen(true);
  }

  async function refreshMaterials() {
    await loadData(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const selectedTeaching = teachingOptions.find((option) => option.key === form.teachingKey);
    if (!selectedTeaching) {
      setFormError("Pilih mata pelajaran dan kelas.");
      return;
    }
    const title = form.title.trim();
    if (!title) {
      setFormError("Judul materi wajib diisi.");
      return;
    }
    if (!editingMaterial && !selectedFile) {
      setFormError("Pilih file materi yang akan diunggah.");
      return;
    }
    if (selectedFile) {
      if (!allowedExtensions.has(getExtension(selectedFile.name))) {
        setFormError("Format file tidak didukung. Pilih PDF, DOC/DOCX, PPT/PPTX, XLS/XLSX, TXT, ZIP/RAR, PNG, JPG, atau JPEG.");
        return;
      }
      if (selectedFile.size > maxFileSize) {
        setFormError("Ukuran file maksimal 10 MB.");
        return;
      }
    }
    if (editingMaterial && !editingMaterial.ContentURL && !selectedFile) {
      setFormError("Pilih file materi yang akan diunggah.");
      return;
    }

    setSavePhase(selectedFile ? "uploading" : "saving");
    try {
      const uploaded = selectedFile ? await uploadFile(selectedFile) : null;
      setSavePhase("saving");
      const body = {
        subject_id: selectedTeaching.subjectId,
        class_id: selectedTeaching.classId,
        title,
        description: form.description.trim(),
        content_url: uploaded?.file_url ?? editingMaterial?.ContentURL ?? "",
        file_name: uploaded?.file_name ?? editingMaterial?.FileName ?? "",
      };

      if (editingMaterial) {
        await apiFetch(`/api/guru/materials/${editingMaterial.ID}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        await apiFetch("/api/guru/materials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      setIsModalOpen(false);
      setEditingMaterial(null);
      setSelectedFile(null);
      await refreshMaterials();
    } catch (error) {
      setFormError(getErrorMessage(error, "Materi gagal disimpan."));
    } finally {
      setSavePhase("idle");
    }
  }

  async function handleDelete() {
    if (!deletingMaterial) return;

    setIsDeleting(true);
    setPageError("");
    try {
      await apiFetch(`/api/guru/materials/${deletingMaterial.ID}`, { method: "DELETE" });
      setDeletingMaterial(null);
      await refreshMaterials();
    } catch (error) {
      setPageError(getErrorMessage(error, "Materi gagal dihapus."));
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleDownload(material: MaterialItem) {
    if (!material.ContentURL) {
      setPageError("File materi tidak tersedia untuk diunduh.");
      return;
    }
    setPageError("");
    try {
      await downloadFile(material.ContentURL, material.FileName ?? material.Title);
    } catch (error) {
      setPageError(getErrorMessage(error, "File materi gagal diunduh."));
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
            <span className="size-[18px]"><MaterialIcon /></span>
            Unggah Materi
          </button>
        )}
        description="Kelola materi belajar dan file untuk kelas yang Anda ampu."
        eyebrow="Area guru"
        title="Materi"
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
            className="h-11 w-full min-w-44 rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
            onChange={(event) => {
              setClassFilter(event.target.value);
              resetFilters();
            }}
            value={classFilter}
          >
            <option value="">Semua kelas</option>
            {availableClasses.map(([classId, className]) => (
              <option key={classId} value={classId}>{className}</option>
            ))}
          </select>
        </label>
        <label className="block w-full sm:w-auto">
          <span className="sr-only">Filter mata pelajaran</span>
          <select
            className="h-11 w-full min-w-48 rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
            onChange={(event) => {
              setSubjectFilter(event.target.value);
              resetFilters();
            }}
            value={subjectFilter}
          >
            <option value="">Semua mata pelajaran</option>
            {availableSubjects.map(([subjectId, subjectName]) => (
              <option key={subjectId} value={subjectId}>{subjectName}</option>
            ))}
          </select>
        </label>
        <SearchInput
          label="Cari judul materi"
          onChange={(value) => {
            setSearchTerm(value);
            resetFilters();
          }}
          placeholder="Cari judul materi..."
          value={searchTerm}
        />
      </section>

      <section className="overflow-hidden rounded-lg border border-line bg-white">
        {isLoading ? (
          <div className="p-5"><TableSkeleton columns={6} rows={8} /></div>
        ) : filteredMaterials.length === 0 ? (
          <EmptyState
            description={
              materials.length === 0
                ? "Unggah materi untuk membagikan bahan belajar kepada kelas yang Anda ampu."
                : "Ubah filter atau kata pencarian untuk melihat materi lainnya."
            }
            icon={<MaterialIcon />}
            title={materials.length === 0 ? "Belum ada materi" : "Tidak ada materi ditemukan"}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1060px] border-collapse text-left">
                <thead className="bg-surface/80">
                  <tr className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                    <th className="px-5 py-3.5">Judul</th>
                    <th className="px-5 py-3.5">Mapel</th>
                    <th className="px-5 py-3.5">Kelas</th>
                    <th className="px-5 py-3.5">File</th>
                    <th className="px-5 py-3.5">Tanggal</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {visibleMaterials.map((material) => {
                    const relatedTeaching = teachingOptions.find(
                      (option) => option.subjectId === material.SubjectID &&
                        material.ClassID != null &&
                        option.classId === material.ClassID,
                    );
                    const subjectName = teachingOptions.find((option) => option.subjectId === material.SubjectID)?.subjectName ?? "-";

                    return (
                      <tr className="transition-colors hover:bg-surface/50" key={material.ID}>
                        <td className="max-w-64 px-5 py-4">
                          <p className="truncate text-sm font-semibold text-ink">{material.Title}</p>
                          {material.Description && (
                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">{material.Description}</p>
                          )}
                        </td>
                        <td className="px-5 py-4 text-sm text-ink">{subjectName}</td>
                        <td className="px-5 py-4 text-sm text-ink">
                          {material.ClassID == null ? "Belum ada kelas" : relatedTeaching?.className ?? "-"}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="max-w-40 truncate text-xs text-muted">{material.FileName ?? "-"}</span>
                            {material.ContentURL && (
                              <button
                                aria-label={`Unduh ${material.FileName ?? material.Title}`}
                                className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-brand-dark transition-colors hover:bg-brand/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                                onClick={() => void handleDownload(material)}
                                type="button"
                              >
                                <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24">
                                  <path d="M12 3v12M7 10l5 5 5-5M4 17v4h16v-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
                                </svg>
                                Unduh
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-ink">{formatDate(material.CreatedAt)}</td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              aria-label={`Edit materi ${material.Title}`}
                              className="grid size-9 place-items-center rounded-lg border border-line text-brand-dark transition-colors hover:border-brand/40 hover:bg-brand/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                              onClick={() => openEditModal(material)}
                              type="button"
                            >
                              <EditIcon />
                            </button>
                            <button
                              aria-label={`Hapus materi ${material.Title}`}
                              className="grid size-9 place-items-center rounded-lg border border-red-200 text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                              onClick={() => setDeletingMaterial(material)}
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
            <Pagination
              page={safePage}
              pageSize={pageSize}
              total={filteredMaterials.length}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </section>

      {isModalOpen && (
        <Modal
          title={editingMaterial ? "Edit Materi" : "Unggah Materi"}
          onClose={() => {
            if (savePhase === "idle") setIsModalOpen(false);
          }}
          maxWidth="max-w-2xl"
        >
          <form className="mt-6 space-y-4" onSubmit={(event) => void handleSubmit(event)}>
            {formError && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                {formError}
              </p>
            )}
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">Mapel — Kelas <span className="text-red-600">*</span></span>
              <select
                className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
                disabled={savePhase !== "idle"}
                onChange={(event) => setForm((current) => ({ ...current, teachingKey: event.target.value }))}
                required
                value={form.teachingKey}
              >
                <option value="">Pilih mapel dan kelas</option>
                {teachingOptions.map((option) => (
                  <option key={option.key} value={option.key}>{option.label}</option>
                ))}
              </select>
              {teachingOptions.length === 0 && (
                <span className="mt-1 block text-xs text-muted">Data penugasan kelas belum tersedia.</span>
              )}
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">Judul <span className="text-red-600">*</span></span>
              <input
                className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none transition placeholder:text-muted/75 focus:border-brand focus:ring-2 focus:ring-brand/15"
                disabled={savePhase !== "idle"}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Masukkan judul materi"
                required
                value={form.title}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">Deskripsi <span className="text-muted">(opsional)</span></span>
              <textarea
                className="min-h-24 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/75 focus:border-brand focus:ring-2 focus:ring-brand/15"
                disabled={savePhase !== "idle"}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Tambahkan keterangan materi"
                value={form.description}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">
                File {editingMaterial ? <span className="text-muted">(opsional, maksimal 10 MB)</span> : <span className="text-red-600">*</span>}
              </span>
              <input
                accept={acceptFileTypes}
                className="block min-h-11 w-full cursor-pointer rounded-lg border border-line bg-white text-sm text-muted file:mr-4 file:h-11 file:border-0 file:bg-surface file:px-4 file:text-sm file:font-semibold file:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                disabled={savePhase !== "idle"}
                onChange={(event) => {
                  setSelectedFile(event.target.files?.[0] ?? null);
                  setFormError("");
                }}
                type="file"
              />
              <span className="mt-1 block text-xs text-muted">
                {selectedFile
                  ? `File baru: ${selectedFile.name}`
                  : editingMaterial?.FileName
                    ? `File saat ini: ${editingMaterial.FileName}. Kosongkan untuk mempertahankan file lama.`
                    : "Format: PDF, DOC/DOCX, PPT/PPTX, XLS/XLSX, TXT, ZIP/RAR, PNG, JPG/JPEG."}
              </span>
            </label>

            <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:justify-end">
              <button
                className="min-h-11 rounded-lg border border-line px-5 text-sm font-semibold text-ink transition hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60"
                disabled={savePhase !== "idle"}
                onClick={() => setIsModalOpen(false)}
                type="button"
              >
                Batal
              </button>
              <button
                className="min-h-11 rounded-lg bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60"
                disabled={savePhase !== "idle" || teachingOptions.length === 0}
                type="submit"
              >
                {savePhase === "uploading" ? "Mengunggah..." : savePhase === "saving" ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmDialog
        isOpen={deletingMaterial !== null}
        title="Hapus Materi"
        message={`Apakah Anda yakin ingin menghapus materi "${deletingMaterial?.Title ?? ""}"? Tindakan ini tidak dapat dibatalkan.`}
        onCancel={() => setDeletingMaterial(null)}
        onConfirm={() => void handleDelete()}
        isLoading={isDeleting}
      />
    </div>
  );
}
