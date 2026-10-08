"use client";

import { useEffect, useState, type FormEvent } from "react";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import Modal from "@/components/admin/Modal";
import { apiFetch, apiFetchList } from "@/lib/api";
import type { Class, Major } from "@/types";

function EditIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="m14 5 5 5M4 20l4.5-1 10.8-10.8a2.1 2.1 0 0 0-3-3L5.5 16z" /></svg>;
}

function DeleteIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M10 11v6M14 11v6M5.5 7l1 14h11l1-14M9 7V4h6v3" /></svg>;
}

function AddIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>;
}

function SkeletonRows() {
  return (
    <div className="animate-pulse space-y-3 p-5" aria-label="Memuat daftar jurusan" role="status">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="grid grid-cols-[1.5fr_1fr_0.7fr] items-center gap-5 py-3">
          <span className="h-4 rounded bg-line" />
          <span className="h-4 w-16 rounded bg-line" />
          <span className="ml-auto h-8 w-20 rounded bg-line" />
        </div>
      ))}
    </div>
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export default function AdminMajorsPage() {
  const [majors, setMajors] = useState<Major[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMajor, setEditingMajor] = useState<Major | null>(null);
  const [majorName, setMajorName] = useState("");
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingMajor, setDeletingMajor] = useState<Major | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function loadData() {
    const [majorsResult, classesResult] = await Promise.allSettled([
      apiFetchList<Major>("/api/admin/majors"),
      apiFetchList<Class>("/api/admin/classes"),
    ]);

    if (majorsResult.status === "fulfilled") {
      setMajors(majorsResult.value);
    }
    if (classesResult.status === "fulfilled") {
      setClasses(classesResult.value);
    }
    if (majorsResult.status === "rejected") {
      setPageError(getErrorMessage(majorsResult.reason, "Daftar jurusan gagal dimuat."));
    } else if (classesResult.status === "rejected") {
      setPageError(getErrorMessage(classesResult.reason, "Data kelas gagal dimuat."));
    } else {
      setPageError("");
    }
    setIsLoading(false);
  }

  async function refreshMajors() {
    try {
      setMajors(await apiFetchList<Major>("/api/admin/majors"));
      setPageError("");
    } catch (error) {
      setPageError(getErrorMessage(error, "Daftar jurusan gagal dimuat ulang."));
    }
  }

  useEffect(() => {
    void Promise.resolve().then(() => loadData());
  }, []);

  function openAddModal() {
    setEditingMajor(null);
    setMajorName("");
    setFormError("");
    setIsModalOpen(true);
  }

  function openEditModal(major: Major) {
    setEditingMajor(major);
    setMajorName(major.MajorName);
    setFormError("");
    setIsModalOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = majorName.trim();
    if (!normalizedName) {
      setFormError("Nama jurusan wajib diisi.");
      return;
    }

    setIsSaving(true);
    setFormError("");
    try {
      const body = JSON.stringify({ major_name: normalizedName });
      if (editingMajor) {
        await apiFetch(`/api/admin/majors/${editingMajor.ID}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body,
        });
        setMajors((current) => current.map((major) =>
          major.ID === editingMajor.ID ? { ...major, MajorName: normalizedName } : major,
        ));
        setIsModalOpen(false);
      } else {
        await apiFetch("/api/admin/majors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });
        setIsModalOpen(false);
        await refreshMajors();
      }
    } catch (error) {
      setFormError(getErrorMessage(error, "Jurusan gagal disimpan."));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingMajor) return;

    setIsDeleting(true);
    setPageError("");
    try {
      await apiFetch(`/api/admin/majors/${deletingMajor.ID}`, { method: "DELETE" });
      setMajors((current) => current.filter((major) => major.ID !== deletingMajor.ID));
      setDeletingMajor(null);
    } catch (error) {
      setPageError(getErrorMessage(error, "Jurusan gagal dihapus."));
    } finally {
      setIsDeleting(false);
    }
  }

  function classCount(majorId: number): number {
    return classes.filter((schoolClass) => schoolClass.MajorID === majorId).length;
  }

  return (
    <div className="mx-auto max-w-[1440px]">
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-1 text-sm font-medium text-brand">Administrasi akademik</p>
          <h2 className="text-2xl font-semibold text-ink font-[family-name:var(--font-fraunces)] sm:text-3xl">Manajemen Jurusan</h2>
          <p className="mt-2 text-sm text-muted">Kelola data jurusan sekolah</p>
        </div>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-lg bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:self-auto"
          onClick={openAddModal}
          type="button"
        >
          <span className="size-[18px]"><AddIcon /></span>
          Tambah Jurusan
        </button>
      </div>

      {pageError && <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{pageError}</p>}

      <section className="overflow-hidden rounded-xl border border-line bg-white shadow-[0_2px_10px_rgba(17,17,17,0.04)]">
        {isLoading ? (
          <SkeletonRows />
        ) : majors.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center px-6 py-12 text-center">
            <h3 className="text-base font-semibold text-ink">Belum ada data jurusan</h3>
            <p className="mt-1 max-w-sm text-sm text-muted">Tambahkan jurusan untuk mulai mengelola program sekolah.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] border-collapse text-left">
              <thead className="bg-surface/80">
                <tr className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                  <th className="px-5 py-3.5">Nama Jurusan</th>
                  <th className="px-5 py-3.5">Jumlah Kelas</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {majors.map((major) => (
                  <tr key={major.ID} className="transition-colors hover:bg-surface/50">
                    <td className="px-5 py-4 text-sm font-medium text-ink">{major.MajorName}</td>
                    <td className="px-5 py-4 text-sm text-muted">{isLoading ? "-" : classCount(major.ID)}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button aria-label={`Edit jurusan ${major.MajorName}`} className="inline-flex size-9 items-center justify-center rounded-lg border border-line text-muted transition hover:border-brand/40 hover:bg-brand/5 hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand" onClick={() => openEditModal(major)} title="Edit jurusan" type="button">
                          <span className="size-[17px]"><EditIcon /></span>
                        </button>
                        <button aria-label={`Hapus jurusan ${major.MajorName}`} className="inline-flex size-9 items-center justify-center rounded-lg border border-line text-muted transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600" onClick={() => { setPageError(""); setDeletingMajor(major); }} title="Hapus jurusan" type="button">
                          <span className="size-[17px]"><DeleteIcon /></span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isModalOpen && (
        <Modal title={editingMajor ? "Edit Jurusan" : "Tambah Jurusan"} onClose={() => { if (!isSaving) setIsModalOpen(false); }}>
          <form className="mt-6 space-y-5" noValidate onSubmit={handleSubmit}>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="major-name">Nama Jurusan</label>
              <input
                autoComplete="off"
                className="h-11 w-full rounded-lg border border-line px-3 text-sm outline-none transition placeholder:text-muted/70 focus:border-brand focus:ring-2 focus:ring-brand/15"
                id="major-name"
                onChange={(event) => setMajorName(event.target.value)}
                placeholder="cth: Rekayasa Perangkat Lunak"
                required
                value={majorName}
              />
              {formError && <p className="mt-1.5 text-sm text-red-600" role="alert">{formError}</p>}
            </div>
            <div className="flex justify-end gap-3 border-t border-line pt-4">
              <button className="min-h-11 rounded-lg border border-line px-4 text-sm font-semibold text-ink transition hover:bg-surface disabled:opacity-60" disabled={isSaving} onClick={() => setIsModalOpen(false)} type="button">Batal</button>
              <button className="min-h-11 rounded-lg bg-brand px-5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60" disabled={isSaving} type="submit">{isSaving ? "Menyimpan..." : "Simpan"}</button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmDialog
        isLoading={isDeleting}
        isOpen={deletingMajor !== null}
        message={deletingMajor ? `Jurusan ${deletingMajor.MajorName} akan dihapus. Tindakan ini tidak dapat dibatalkan.` : ""}
        onCancel={() => { if (!isDeleting) setDeletingMajor(null); }}
        onConfirm={() => void handleDelete()}
        title="Hapus Jurusan?"
      />
    </div>
  );
}