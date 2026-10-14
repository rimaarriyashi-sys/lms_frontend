"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import EmptyState from "@/components/admin/EmptyState";
import Modal from "@/components/admin/Modal";
import PageHeader from "@/components/admin/PageHeader";
import TableSkeleton from "@/components/admin/TableSkeleton";
import { apiFetch, apiFetchList } from "@/lib/api";
import { majorFullName } from "@/lib/majors";
import type { Class, Major, User } from "@/types";

function EditIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="m14 5 5 5M4 20l4.5-1 10.8-10.8a2.1 2.1 0 0 0-3-3L5.5 16z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="M4 7h16M10 11v6M14 11v6M5.5 7l1 14h11l1-14M9 7V4h6v3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

function AddIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function MajorIcon() {
  return (
    <svg aria-hidden="true" className="size-6" fill="none" viewBox="0 0 24 24">
      <path d="M4 20V8l8-4 8 4v12M2.5 20h19M8 10v2M12 10v2M16 10v2M8 15v2M12 15v2M16 15v2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export default function AdminMajorsPage() {
  const [majors, setMajors] = useState<Major[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<User[]>([]);
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
    setIsLoading(true);
    const [majorsResult, classesResult, usersResult] = await Promise.allSettled([
      apiFetchList<Major>("/api/admin/majors"),
      apiFetchList<Class>("/api/admin/classes"),
      apiFetchList<User>("/api/admin/users"),
    ]);

    const failures: string[] = [];
    if (majorsResult.status === "fulfilled") setMajors(majorsResult.value);
    else failures.push(getErrorMessage(majorsResult.reason, "Daftar jurusan gagal dimuat."));
    if (classesResult.status === "fulfilled") setClasses(classesResult.value);
    else failures.push(getErrorMessage(classesResult.reason, "Data kelas gagal dimuat."));
    if (usersResult.status === "fulfilled") {
      setStudents(usersResult.value.filter((user) => user.RoleID === 3));
    } else {
      failures.push(getErrorMessage(usersResult.reason, "Data siswa gagal dimuat."));
    }

    setPageError(failures.join(" "));
    setIsLoading(false);
  }

  useEffect(() => {
    void Promise.resolve().then(() => loadData());
  }, []);

  const studentsByMajor = useMemo(() => {
    const classMajorById = new Map(
      classes.map((schoolClass) => [schoolClass.ID, schoolClass.MajorID]),
    );
    return majors.map((major) => {
      const majorClasses = classes.filter((schoolClass) => schoolClass.MajorID === major.ID);
      const majorClassIds = new Set(majorClasses.map((schoolClass) => schoolClass.ID));
      const studentCount = students.filter(
        (student) => student.ClassID != null &&
          classMajorById.get(student.ClassID) === major.ID && majorClassIds.has(student.ClassID),
      ).length;
      const homeroomCount = majorClasses.filter(
        (schoolClass) => Boolean(schoolClass.HomeroomTeacherID),
      ).length;

      return { major, classCount: majorClasses.length, studentCount, homeroomCount };
    });
  }, [classes, majors, students]);

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
      setFormError("Nama atau kode jurusan wajib diisi.");
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
      } else {
        await apiFetch("/api/admin/majors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });
      }
      setIsModalOpen(false);
      await loadData();
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
      setDeletingMajor(null);
      await loadData();
    } catch (error) {
      setPageError(getErrorMessage(error, "Jurusan gagal dihapus."));
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
            onClick={openAddModal}
            type="button"
          >
            <span className="size-[18px]"><AddIcon /></span>
            Tambah Jurusan
          </button>
        )}
        description="Kelola program keahlian dan pantau kelengkapan datanya."
        eyebrow="Administrasi akademik"
        title="Manajemen Jurusan"
      />

      {pageError && (
        <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {pageError}
        </p>
      )}

      {isLoading ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div className="rounded-lg border border-line bg-white p-5" key={index}>
              <TableSkeleton columns={2} rows={3} />
            </div>
          ))}
        </section>
      ) : majors.length === 0 ? (
        <section className="rounded-lg border border-line bg-white">
          <EmptyState
            description="Tambahkan jurusan untuk mulai mengelola kelas dan data akademik sekolah."
            icon={<MajorIcon />}
            title="Belum ada data jurusan"
          />
        </section>
      ) : (
        <section aria-label="Daftar jurusan" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {studentsByMajor.map(({ major, classCount, studentCount, homeroomCount }) => (
            <article
              className="group relative overflow-hidden rounded-lg border border-line bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-[0_14px_34px_-24px_rgba(17,17,17,0.35)]"
              key={major.ID}
            >
              <Link
                aria-label={`Lihat kelas jurusan ${major.MajorName}`}
                className="absolute inset-0 z-0 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                href={`/admin/classes?jurusan=${major.ID}`}
              />
              <div className="pointer-events-none relative z-10 flex h-full flex-col p-5">
                <div className="flex items-start justify-between gap-4">
                  <span className="inline-flex min-h-8 items-center rounded-md bg-brand px-2.5 py-1 text-xs font-bold tracking-wide text-white">
                    {major.MajorName}
                  </span>
                  <div className="pointer-events-auto flex shrink-0 gap-1.5">
                    <button
                      aria-label={`Edit jurusan ${major.MajorName}`}
                      className="grid size-9 place-items-center rounded-lg border border-line bg-white text-muted transition-colors hover:border-brand/40 hover:bg-brand/5 hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                      onClick={() => openEditModal(major)}
                      title="Edit jurusan"
                      type="button"
                    >
                      <span className="size-[17px]"><EditIcon /></span>
                    </button>
                    <button
                      aria-label={`Hapus jurusan ${major.MajorName}`}
                      className="grid size-9 place-items-center rounded-lg border border-line bg-white text-muted transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                      onClick={() => {
                        setPageError("");
                        setDeletingMajor(major);
                      }}
                      title="Hapus jurusan"
                      type="button"
                    >
                      <span className="size-[17px]"><DeleteIcon /></span>
                    </button>
                  </div>
                </div>
                <h2 className="mt-5 font-[family-name:var(--font-fraunces)] text-xl font-semibold leading-snug text-ink">
                  {majorFullName(major.MajorName)}
                </h2>
                <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-4">
                  <div>
                    <p className="text-xs text-muted">Jumlah kelas</p>
                    <p className="mt-1 text-lg font-semibold tabular-nums text-ink">{classCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Jumlah siswa</p>
                    <p className="mt-1 text-lg font-semibold tabular-nums text-ink">{studentCount}</p>
                  </div>
                  <div className="col-span-2 flex items-center justify-between gap-3 border-t border-line pt-3">
                    <p className="text-xs text-muted">Wali kelas terisi</p>
                    <p className="text-sm font-semibold tabular-nums text-ink">
                      {homeroomCount}/{classCount}
                    </p>
                  </div>
                </div>
                <span className="sr-only">Klik untuk melihat daftar kelas</span>
              </div>
            </article>
          ))}
        </section>
      )}

      {isModalOpen && (
        <Modal
          onClose={() => {
            if (!isSaving) setIsModalOpen(false);
          }}
          title={editingMajor ? "Edit Jurusan" : "Tambah Jurusan"}
        >
          <form className="mt-6 space-y-5" noValidate onSubmit={handleSubmit}>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="major-name">
                Nama atau Kode Jurusan
              </label>
              <input
                autoComplete="off"
                className="h-11 w-full rounded-lg border border-line px-3 text-sm outline-none transition placeholder:text-muted/70 focus:border-brand focus:ring-2 focus:ring-brand/15"
                id="major-name"
                onChange={(event) => setMajorName(event.target.value)}
                placeholder="Contoh: PPLG"
                required
                value={majorName}
              />
              {formError && <p className="mt-1.5 text-sm text-red-600" role="alert">{formError}</p>}
            </div>
            <div className="flex justify-end gap-3 border-t border-line pt-4">
              <button className="min-h-11 rounded-lg border border-line px-4 text-sm font-semibold text-ink transition hover:bg-surface disabled:opacity-60" disabled={isSaving} onClick={() => setIsModalOpen(false)} type="button">
                Batal
              </button>
              <button className="min-h-11 rounded-lg bg-brand px-5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60" disabled={isSaving} type="submit">
                {isSaving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmDialog
        isLoading={isDeleting}
        isOpen={deletingMajor !== null}
        message={deletingMajor ? `Jurusan ${deletingMajor.MajorName} akan dihapus. Tindakan ini tidak dapat dibatalkan.` : ""}
        onCancel={() => {
          if (!isDeleting) setDeletingMajor(null);
        }}
        onConfirm={() => void handleDelete()}
        title="Hapus Jurusan?"
      />
    </div>
  );
}