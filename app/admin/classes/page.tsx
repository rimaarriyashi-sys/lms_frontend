"use client";

import { useEffect, useState, type FormEvent } from "react";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import Modal from "@/components/admin/Modal";
import { apiFetch, apiFetchList } from "@/lib/api";
import type { Class, Major, User } from "@/types";

interface ClassForm {
  name: string;
  majorId: string;
  homeroomTeacherId: string;
}

const emptyForm: ClassForm = { name: "", majorId: "", homeroomTeacherId: "" };

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
    <div className="animate-pulse space-y-3 p-5" aria-label="Memuat daftar kelas" role="status">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="grid grid-cols-[1.2fr_1fr_1.2fr_0.8fr_0.7fr] items-center gap-5 py-3">
          <span className="h-4 rounded bg-line" />
          <span className="h-4 rounded bg-line" />
          <span className="h-4 rounded bg-line" />
          <span className="h-4 w-12 rounded bg-line" />
          <span className="ml-auto h-8 w-20 rounded bg-line" />
        </div>
      ))}
    </div>
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export default function AdminClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [form, setForm] = useState<ClassForm>(emptyForm);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingClass, setDeletingClass] = useState<Class | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function loadData() {
    const [classesResult, majorsResult, usersResult] = await Promise.allSettled([
      apiFetchList<Class>("/api/admin/classes"),
      apiFetchList<Major>("/api/admin/majors"),
      apiFetchList<User>("/api/admin/users"),
    ]);

    const failures: string[] = [];
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
    if (usersResult.status === "fulfilled") {
      setTeachers(usersResult.value.filter((user) => user.RoleID === 2));
      setStudents(usersResult.value.filter((user) => user.RoleID === 3));
    } else {
      failures.push(getErrorMessage(usersResult.reason, "Daftar pengguna gagal dimuat."));
    }

    setPageError(failures.join(" "));
    setIsLoading(false);
  }

  async function refreshClasses() {
    try {
      setClasses(await apiFetchList<Class>("/api/admin/classes"));
      setPageError("");
    } catch (error) {
      setPageError(getErrorMessage(error, "Daftar kelas gagal dimuat ulang."));
    }
  }

  useEffect(() => {
    void Promise.resolve().then(() => loadData());
  }, []);

  function openAddModal() {
    setEditingClass(null);
    setForm(emptyForm);
    setFormError("");
    setIsModalOpen(true);
  }

  function openEditModal(schoolClass: Class) {
    setEditingClass(schoolClass);
    setForm({
      name: schoolClass.ClassName,
      majorId: schoolClass.MajorID == null ? "" : String(schoolClass.MajorID),
      homeroomTeacherId: schoolClass.HomeroomTeacherID ?? "",
    });
    setFormError("");
    setIsModalOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = form.name.trim();
    if (!normalizedName) {
      setFormError("Nama kelas wajib diisi.");
      return;
    }

    setIsSaving(true);
    setFormError("");
    const body = {
      class_name: normalizedName,
      major_id: form.majorId ? Number(form.majorId) : null,
      homeroom_teacher_id: form.homeroomTeacherId || null,
    };

    try {
      if (editingClass) {
        await apiFetch(`/api/admin/classes/${editingClass.ID}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        await apiFetch("/api/admin/classes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
      setIsModalOpen(false);
      await refreshClasses();
    } catch (error) {
      setFormError(getErrorMessage(error, "Kelas gagal disimpan."));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingClass) return;

    setIsDeleting(true);
    setPageError("");
    try {
      await apiFetch(`/api/admin/classes/${deletingClass.ID}`, { method: "DELETE" });
      setClasses((current) => current.filter((schoolClass) => schoolClass.ID !== deletingClass.ID));
      setDeletingClass(null);
    } catch (error) {
      setPageError(getErrorMessage(error, "Kelas gagal dihapus."));
    } finally {
      setIsDeleting(false);
    }
  }

  function studentCount(classId: number): number {
    return students.filter((student) => student.ClassID === classId).length;
  }

  return (
    <div className="mx-auto max-w-[1440px]">
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-1 text-sm font-medium text-brand">Administrasi akademik</p>
          <h2 className="text-2xl font-semibold text-ink font-[family-name:var(--font-fraunces)] sm:text-3xl">Manajemen Kelas</h2>
          <p className="mt-2 text-sm text-muted">Kelola data kelas sekolah</p>
        </div>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-lg bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:self-auto"
          onClick={openAddModal}
          type="button"
        >
          <span className="size-[18px]"><AddIcon /></span>
          Tambah Kelas
        </button>
      </div>

      {pageError && <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{pageError}</p>}

      <section className="overflow-hidden rounded-xl border border-line bg-white shadow-[0_2px_10px_rgba(17,17,17,0.04)]">
        {isLoading ? (
          <SkeletonRows />
        ) : classes.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center px-6 py-12 text-center">
            <h3 className="text-base font-semibold text-ink">Belum ada data kelas</h3>
            <p className="mt-1 max-w-sm text-sm text-muted">Tambahkan kelas untuk mengatur jurusan dan wali kelas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead className="bg-surface/80">
                <tr className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                  <th className="px-5 py-3.5">Nama Kelas</th>
                  <th className="px-5 py-3.5">Jurusan</th>
                  <th className="px-5 py-3.5">Wali Kelas</th>
                  <th className="px-5 py-3.5">Jumlah Siswa</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {classes.map((schoolClass) => (
                  <tr key={schoolClass.ID} className="transition-colors hover:bg-surface/50">
                    <td className="px-5 py-4 text-sm font-medium text-ink">{schoolClass.ClassName}</td>
                    <td className="px-5 py-4 text-sm text-muted">{schoolClass.Major?.MajorName ?? "-"}</td>
                    <td className="px-5 py-4 text-sm text-muted">{schoolClass.HomeroomTeacher?.Name ?? "Belum ditentukan"}</td>
                    <td className="px-5 py-4 text-sm text-muted">{studentCount(schoolClass.ID)}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button aria-label={`Edit kelas ${schoolClass.ClassName}`} className="inline-flex size-9 items-center justify-center rounded-lg border border-line text-muted transition hover:border-brand/40 hover:bg-brand/5 hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand" onClick={() => openEditModal(schoolClass)} title="Edit kelas" type="button">
                          <span className="size-[17px]"><EditIcon /></span>
                        </button>
                        <button aria-label={`Hapus kelas ${schoolClass.ClassName}`} className="inline-flex size-9 items-center justify-center rounded-lg border border-line text-muted transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600" onClick={() => { setPageError(""); setDeletingClass(schoolClass); }} title="Hapus kelas" type="button">
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
        <Modal title={editingClass ? "Edit Kelas" : "Tambah Kelas"} onClose={() => { if (!isSaving) setIsModalOpen(false); }}>
          <form className="mt-6 space-y-4" noValidate onSubmit={handleSubmit}>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="class-name">Nama Kelas</label>
              <input
                autoComplete="off"
                className="h-11 w-full rounded-lg border border-line px-3 text-sm outline-none transition placeholder:text-muted/70 focus:border-brand focus:ring-2 focus:ring-brand/15"
                id="class-name"
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="cth: X RPL 1"
                required
                value={form.name}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="class-major">Jurusan</label>
              <select
                className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
                id="class-major"
                onChange={(event) => setForm((current) => ({ ...current, majorId: event.target.value }))}
                value={form.majorId}
              >
                <option value="">Tanpa jurusan</option>
                {majors.map((major) => <option key={major.ID} value={major.ID}>{major.MajorName}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="class-teacher">Wali Kelas</label>
              <select
                className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
                id="class-teacher"
                onChange={(event) => setForm((current) => ({ ...current, homeroomTeacherId: event.target.value }))}
                value={form.homeroomTeacherId}
              >
                <option value="">Belum ditentukan</option>
                {teachers.map((teacher) => <option key={teacher.ID} value={teacher.ID}>{teacher.Name}</option>)}
              </select>
            </div>
            {formError && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">{formError}</p>}
            <div className="flex justify-end gap-3 border-t border-line pt-4">
              <button className="min-h-11 rounded-lg border border-line px-4 text-sm font-semibold text-ink transition hover:bg-surface disabled:opacity-60" disabled={isSaving} onClick={() => setIsModalOpen(false)} type="button">Batal</button>
              <button className="min-h-11 rounded-lg bg-brand px-5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60" disabled={isSaving} type="submit">{isSaving ? "Menyimpan..." : "Simpan"}</button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmDialog
        isLoading={isDeleting}
        isOpen={deletingClass !== null}
        message={deletingClass ? `Kelas ${deletingClass.ClassName} akan dihapus. Tindakan ini tidak dapat dibatalkan.` : ""}
        onCancel={() => { if (!isDeleting) setDeletingClass(null); }}
        onConfirm={() => void handleDelete()}
        title="Hapus Kelas?"
      />
    </div>
  );
}