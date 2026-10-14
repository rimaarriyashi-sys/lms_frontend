"use client";

import { useEffect, useState, type FormEvent } from "react";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import EmptyState from "@/components/admin/EmptyState";
import Modal from "@/components/admin/Modal";
import PageHeader from "@/components/admin/PageHeader";
import Pagination from "@/components/admin/Pagination";
import SearchInput from "@/components/admin/SearchInput";
import TableSkeleton from "@/components/admin/TableSkeleton";
import { apiFetch, apiFetchList } from "@/lib/api";
import type { Subject, User } from "@/types";

interface SubjectForm {
  name: string;
  teacherId: string;
}

const emptyForm: SubjectForm = { name: "", teacherId: "" };

function SearchIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></svg>;
}

function EditIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="m14 5 5 5M4 20l4.5-1 10.8-10.8a2.1 2.1 0 0 0-3-3L5.5 16z" /></svg>;
}

function DeleteIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M10 11v6M14 11v6M5.5 7l1 14h11l1-14M9 7V4h6v3" /></svg>;
}

function AddIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [form, setForm] = useState<SubjectForm>(emptyForm);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingSubject, setDeletingSubject] = useState<Subject | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function loadData() {
    const [subjectsResult, usersResult] = await Promise.allSettled([
      apiFetchList<Subject>("/api/subjects"),
      apiFetchList<User>("/api/admin/users"),
    ]);

    const failures: string[] = [];
    if (subjectsResult.status === "fulfilled") {
      setSubjects(subjectsResult.value);
    } else {
      failures.push(getErrorMessage(subjectsResult.reason, "Daftar mata pelajaran gagal dimuat."));
    }
    if (usersResult.status === "fulfilled") {
      setTeachers(usersResult.value.filter((user) => user.RoleID === 2));
    } else {
      failures.push(getErrorMessage(usersResult.reason, "Daftar guru gagal dimuat."));
    }

    setPageError(failures.join(" "));
    setIsLoading(false);
  }

  async function refreshSubjects() {
    try {
      setSubjects(await apiFetchList<Subject>("/api/subjects"));
      setPageError("");
    } catch (error) {
      setPageError(getErrorMessage(error, "Daftar mata pelajaran gagal dimuat ulang."));
    }
  }

  useEffect(() => {
    void Promise.resolve().then(() => loadData());
  }, []);

  const normalizedSearch = searchTerm.trim().toLocaleLowerCase();
  const filteredSubjects = subjects.filter((subject) =>
    subject.SubjectName.toLocaleLowerCase().includes(normalizedSearch) ||
    (subject.Teacher?.Name ?? "").toLocaleLowerCase().includes(normalizedSearch),
  );
  const pageCount = Math.max(1, Math.ceil(filteredSubjects.length / 10));
  const safePage = Math.min(currentPage, pageCount);
  const visibleSubjects = filteredSubjects.slice((safePage - 1) * 10, safePage * 10);

  function openAddModal() {
    setEditingSubject(null);
    setForm(emptyForm);
    setFormError("");
    setIsModalOpen(true);
  }

  function openEditModal(subject: Subject) {
    setEditingSubject(subject);
    setForm({ name: subject.SubjectName, teacherId: subject.TeacherID });
    setFormError("");
    setIsModalOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = form.name.trim();
    if (!normalizedName) {
      setFormError("Nama mata pelajaran wajib diisi.");
      return;
    }
    if (!form.teacherId) {
      setFormError("Guru pengampu wajib dipilih.");
      return;
    }

    setIsSaving(true);
    setFormError("");
    const body = JSON.stringify({ subject_name: normalizedName, teacher_id: form.teacherId });

    try {
      if (editingSubject) {
        await apiFetch(`/api/admin/subjects/${editingSubject.ID}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body,
        });
      } else {
        await apiFetch("/api/admin/subjects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });
      }
      setIsModalOpen(false);
      await refreshSubjects();
    } catch (error) {
      setFormError(getErrorMessage(error, "Mata pelajaran gagal disimpan."));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingSubject) return;

    setIsDeleting(true);
    setPageError("");
    try {
      await apiFetch(`/api/admin/subjects/${deletingSubject.ID}`, { method: "DELETE" });
      setSubjects((current) => current.filter((subject) => subject.ID !== deletingSubject.ID));
      setDeletingSubject(null);
    } catch (error) {
      setPageError(getErrorMessage(error, "Mata pelajaran gagal dihapus."));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1440px]">
      <PageHeader
        actions={(
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-lg bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:self-auto"
            onClick={openAddModal}
            type="button"
          >
            <span className="size-[18px]"><AddIcon /></span>
            Tambah Mapel
          </button>
        )}
        description="Kelola mata pelajaran dan guru pengampunya."
        eyebrow="Administrasi akademik"
        title="Mata Pelajaran"
      />

      {pageError && <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{pageError}</p>}

      <section className="overflow-hidden rounded-lg border border-line bg-white">
        <div className="border-b border-line p-4 sm:p-5">
          <SearchInput
            label="Cari nama mapel atau guru"
            onChange={(value) => {
              setSearchTerm(value);
              setCurrentPage(1);
            }}
            placeholder="Cari nama mapel atau guru..."
            value={searchTerm}
          />
        </div>

        {isLoading ? (
          <div className="p-5"><TableSkeleton columns={3} rows={7} /></div>
        ) : filteredSubjects.length === 0 ? (
          <EmptyState
            description={searchTerm ? "Coba ubah kata pencarian atau tambahkan mata pelajaran baru." : "Tambahkan mata pelajaran dan pilih guru pengampu untuk mulai."}
            icon={<span className="size-6"><SearchIcon /></span>}
            title={searchTerm ? "Tidak ada mata pelajaran ditemukan" : "Belum ada mata pelajaran"}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead className="bg-surface/80">
                <tr className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                  <th className="px-5 py-3.5">Mata Pelajaran</th>
                  <th className="px-5 py-3.5">Guru Pengampu</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visibleSubjects.map((subject) => (
                  <tr key={subject.ID} className="transition-colors hover:bg-surface/50">
                    <td className="px-5 py-4 text-sm font-semibold text-ink">{subject.SubjectName}</td>
                    <td className="px-5 py-4">
                      {subject.Teacher?.Name ? (
                        <span className="inline-flex items-center gap-2.5 text-sm text-ink">
                          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand/10 text-[10px] font-bold text-brand">
                            {subject.Teacher.Name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}
                          </span>
                          {subject.Teacher.Name}
                        </span>
                      ) : <span className="text-sm text-muted">-</span>}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button aria-label={`Edit mata pelajaran ${subject.SubjectName}`} className="inline-flex size-9 items-center justify-center rounded-lg border border-line text-muted transition hover:border-brand/40 hover:bg-brand/5 hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand" onClick={() => openEditModal(subject)} title="Edit mata pelajaran" type="button">
                          <span className="size-[17px]"><EditIcon /></span>
                        </button>
                        <button aria-label={`Hapus mata pelajaran ${subject.SubjectName}`} className="inline-flex size-9 items-center justify-center rounded-lg border border-line text-muted transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600" onClick={() => { setPageError(""); setDeletingSubject(subject); }} title="Hapus mata pelajaran" type="button">
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
        {!isLoading && filteredSubjects.length > 0 && (
          <Pagination onPageChange={setCurrentPage} page={safePage} pageSize={10} total={filteredSubjects.length} />
        )}
      </section>

      {isModalOpen && (
        <Modal title={editingSubject ? "Edit Mata Pelajaran" : "Tambah Mata Pelajaran"} onClose={() => { if (!isSaving) setIsModalOpen(false); }}>
          <form className="mt-6 space-y-4" noValidate onSubmit={handleSubmit}>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="subject-name">Nama Mata Pelajaran</label>
              <input
                autoComplete="off"
                className="h-11 w-full rounded-lg border border-line px-3 text-sm outline-none transition placeholder:text-muted/70 focus:border-brand focus:ring-2 focus:ring-brand/15"
                id="subject-name"
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="cth: Matematika"
                required
                value={form.name}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="subject-teacher">Guru Pengampu</label>
              <select
                className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
                id="subject-teacher"
                onChange={(event) => setForm((current) => ({ ...current, teacherId: event.target.value }))}
                required
                value={form.teacherId}
              >
                <option value="">Pilih guru</option>
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
        isOpen={deletingSubject !== null}
        message="Yakin ingin menghapus mata pelajaran ini?"
        onCancel={() => { if (!isDeleting) setDeletingSubject(null); }}
        onConfirm={() => void handleDelete()}
        title="Hapus Mata Pelajaran?"
      />
    </div>
  );
}