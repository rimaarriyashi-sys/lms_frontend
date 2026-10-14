"use client";

import { Suspense, useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import EmptyState from "@/components/admin/EmptyState";
import Modal from "@/components/admin/Modal";
import PageHeader from "@/components/admin/PageHeader";
import Pagination from "@/components/admin/Pagination";
import SearchInput from "@/components/admin/SearchInput";
import TableSkeleton from "@/components/admin/TableSkeleton";
import { apiFetch, apiFetchList } from "@/lib/api";
import { majorFullName } from "@/lib/majors";
import type { Class, Major, User } from "@/types";

interface ClassForm {
  name: string;
  majorId: string;
  homeroomTeacherId: string;
}

interface ClassFormErrors {
  name?: string;
  majorId?: string;
  request?: string;
}

type ClassLevel = "" | "X" | "XI" | "XII";

const emptyForm: ClassForm = { name: "", majorId: "", homeroomTeacherId: "" };
const pageSize = 12;
const levels: Exclude<ClassLevel, "">[] = ["X", "XI", "XII"];

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

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function getClassLevel(className: string): string {
  const firstWord = className.trim().split(/\s+/)[0] ?? "";
  return levels.includes(firstWord as Exclude<ClassLevel, "">) ? firstWord : "-";
}

function ClassesLoadingFallback() {
  return (
    <div className="mx-auto max-w-[1440px]">
      <PageHeader
        description="Kelola daftar kelas, jurusan, dan wali kelas."
        eyebrow="Administrasi akademik"
        title="Manajemen Kelas"
      />
      <div className="rounded-lg border border-line bg-white p-5">
        <TableSkeleton columns={6} rows={8} />
      </div>
    </div>
  );
}

function AdminClassesContent() {
  const searchParams = useSearchParams();
  const [classes, setClasses] = useState<Class[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [majorFilter, setMajorFilter] = useState(() => searchParams.get("jurusan") ?? "");
  const [levelFilter, setLevelFilter] = useState<ClassLevel>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [form, setForm] = useState<ClassForm>(emptyForm);
  const [formErrors, setFormErrors] = useState<ClassFormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [deletingClass, setDeletingClass] = useState<Class | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function loadData() {
    setIsLoading(true);
    const [classesResult, majorsResult, usersResult] = await Promise.allSettled([
      apiFetchList<Class>("/api/admin/classes"),
      apiFetchList<Major>("/api/admin/majors"),
      apiFetchList<User>("/api/admin/users"),
    ]);

    const failures: string[] = [];
    if (classesResult.status === "fulfilled") setClasses(classesResult.value);
    else failures.push(getErrorMessage(classesResult.reason, "Daftar kelas gagal dimuat."));
    if (majorsResult.status === "fulfilled") setMajors(majorsResult.value);
    else failures.push(getErrorMessage(majorsResult.reason, "Daftar jurusan gagal dimuat."));
    if (usersResult.status === "fulfilled") {
      setTeachers(usersResult.value.filter((user) => user.RoleID === 2));
      setStudents(usersResult.value.filter((user) => user.RoleID === 3));
    } else {
      failures.push(getErrorMessage(usersResult.reason, "Daftar pengguna gagal dimuat."));
    }

    setPageError(failures.join(" "));
    setIsLoading(false);
  }

  useEffect(() => {
    void Promise.resolve().then(() => loadData());
  }, []);

  const sortedTeachers = useMemo(
    () => [...teachers].sort((left, right) => left.Name.localeCompare(right.Name, "id")),
    [teachers],
  );
  const majorsById = useMemo(
    () => new Map(majors.map((major) => [major.ID, major])),
    [majors],
  );
  const filteredClasses = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase();
    return classes.filter((schoolClass) => {
      const matchesMajor = !majorFilter || String(schoolClass.MajorID ?? "") === majorFilter;
      const matchesLevel = !levelFilter || getClassLevel(schoolClass.ClassName) === levelFilter;
      const matchesName = schoolClass.ClassName.toLocaleLowerCase().includes(normalizedSearch);
      return matchesMajor && matchesLevel && matchesName;
    });
  }, [classes, levelFilter, majorFilter, searchTerm]);
  const pageCount = Math.max(1, Math.ceil(filteredClasses.length / pageSize));
  const safePage = Math.min(currentPage, pageCount);
  const visibleClasses = filteredClasses.slice((safePage - 1) * pageSize, safePage * pageSize);

  function openAddModal() {
    setEditingClass(null);
    setForm(emptyForm);
    setFormErrors({});
    setIsModalOpen(true);
  }

  function openEditModal(schoolClass: Class) {
    setEditingClass(schoolClass);
    setForm({
      name: schoolClass.ClassName,
      majorId: schoolClass.MajorID == null ? "" : String(schoolClass.MajorID),
      homeroomTeacherId: schoolClass.HomeroomTeacherID ?? "",
    });
    setFormErrors({});
    setIsModalOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = form.name.trim();
    const errors: ClassFormErrors = {};
    if (!normalizedName) errors.name = "Nama kelas wajib diisi.";
    if (!form.majorId) errors.majorId = "Pilih jurusan untuk kelas ini.";
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSaving(true);
    const body = {
      class_name: normalizedName,
      major_id: Number(form.majorId),
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
      await loadData();
    } catch (error) {
      setFormErrors({ request: getErrorMessage(error, "Kelas gagal disimpan.") });
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
      setDeletingClass(null);
      await loadData();
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
      <PageHeader
        actions={(
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-lg bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:self-auto"
            onClick={openAddModal}
            type="button"
          >
            <span className="size-[18px]"><AddIcon /></span>
            Tambah Kelas
          </button>
        )}
        description="Atur pembagian kelas, tingkat, jurusan, dan wali kelas."
        eyebrow="Administrasi akademik"
        title="Manajemen Kelas"
      />

      {pageError && (
        <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {pageError}
        </p>
      )}

      <section className="mb-5 flex flex-col gap-3 rounded-lg border border-line bg-white p-4 sm:flex-row sm:flex-wrap sm:items-center">
        <label className="block w-full sm:w-auto">
          <span className="sr-only">Filter jurusan</span>
          <select
            className="h-11 w-full min-w-48 rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
            onChange={(event) => {
              setMajorFilter(event.target.value);
              setCurrentPage(1);
            }}
            value={majorFilter}
          >
            <option value="">Semua jurusan</option>
            {majors.map((major) => (
              <option key={major.ID} value={major.ID}>{major.MajorName} · {majorFullName(major.MajorName)}</option>
            ))}
          </select>
        </label>
        <label className="block w-full sm:w-auto">
          <span className="sr-only">Filter tingkat</span>
          <select
            className="h-11 w-full min-w-36 rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
            onChange={(event) => {
              setLevelFilter(event.target.value as ClassLevel);
              setCurrentPage(1);
            }}
            value={levelFilter}
          >
            <option value="">Semua tingkat</option>
            {levels.map((level) => <option key={level} value={level}>{level}</option>)}
          </select>
        </label>
        <SearchInput
          label="Cari nama kelas"
          onChange={(value) => {
            setSearchTerm(value);
            setCurrentPage(1);
          }}
          placeholder="Cari nama kelas..."
          value={searchTerm}
        />
      </section>

      <section className="overflow-hidden rounded-lg border border-line bg-white">
        {isLoading ? (
          <div className="p-5"><TableSkeleton columns={6} rows={8} /></div>
        ) : filteredClasses.length === 0 ? (
          <EmptyState
            description={classes.length === 0 ? "Tambahkan kelas untuk mulai mengelola rombongan belajar." : "Ubah filter atau kata pencarian untuk melihat kelas lainnya."}
            icon={<svg aria-hidden="true" className="size-6" fill="none" viewBox="0 0 24 24"><path d="M4 5.5h16v14H4zM8 5.5V3.8h8v1.7M8 10h8M8 14h5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /></svg>}
            title={classes.length === 0 ? "Belum ada data kelas" : "Tidak ada kelas ditemukan"}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead className="bg-surface/80">
                <tr className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                  <th className="px-5 py-3.5">Kelas</th>
                  <th className="px-5 py-3.5">Jurusan</th>
                  <th className="px-5 py-3.5">Tingkat</th>
                  <th className="px-5 py-3.5">Wali Kelas</th>
                  <th className="px-5 py-3.5">Jumlah Siswa</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visibleClasses.map((schoolClass) => {
                  const major = schoolClass.MajorID == null
                    ? undefined
                    : majorsById.get(schoolClass.MajorID);
                  const teacher = schoolClass.HomeroomTeacher?.Name ?? teachers.find(
                    (item) => item.ID === schoolClass.HomeroomTeacherID,
                  )?.Name;

                  return (
                    <tr className="transition-colors hover:bg-surface/50" key={schoolClass.ID}>
                      <td className="px-5 py-4 text-sm font-semibold text-ink">{schoolClass.ClassName}</td>
                      <td className="px-5 py-4">
                        {major ? (
                          <div className="flex min-w-0 flex-col items-start gap-1">
                            <span className="inline-flex rounded-md bg-brand/10 px-2 py-0.5 text-[10px] font-bold text-brand-dark">
                              {major.MajorName}
                            </span>
                            <span className="max-w-64 text-xs leading-5 text-muted">
                              {majorFullName(major.MajorName)}
                            </span>
                          </div>
                        ) : <span className="text-sm text-muted">-</span>}
                      </td>
                      <td className="px-5 py-4 text-sm text-ink">{getClassLevel(schoolClass.ClassName)}</td>
                      <td className={`px-5 py-4 text-sm ${teacher ? "text-ink" : "italic text-muted"}`}>
                        {teacher || "Belum ditentukan"}
                      </td>
                      <td className="px-5 py-4 text-sm font-medium tabular-nums text-ink">
                        {studentCount(schoolClass.ID)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            aria-label={`Edit kelas ${schoolClass.ClassName}`}
                            className="inline-flex size-9 items-center justify-center rounded-lg border border-line text-muted transition hover:border-brand/40 hover:bg-brand/5 hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                            onClick={() => openEditModal(schoolClass)}
                            title="Edit kelas"
                            type="button"
                          >
                            <span className="size-[17px]"><EditIcon /></span>
                          </button>
                          <button
                            aria-label={`Hapus kelas ${schoolClass.ClassName}`}
                            className="inline-flex size-9 items-center justify-center rounded-lg border border-line text-muted transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                            onClick={() => {
                              setPageError("");
                              setDeletingClass(schoolClass);
                            }}
                            title="Hapus kelas"
                            type="button"
                          >
                            <span className="size-[17px]"><DeleteIcon /></span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && filteredClasses.length > 0 && (
          <Pagination onPageChange={setCurrentPage} page={safePage} pageSize={pageSize} total={filteredClasses.length} />
        )}
      </section>

      {isModalOpen && (
        <Modal
          onClose={() => {
            if (!isSaving) setIsModalOpen(false);
          }}
          title={editingClass ? "Edit Kelas" : "Tambah Kelas"}
        >
          <form className="mt-6 space-y-5" noValidate onSubmit={handleSubmit}>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="class-name">Nama Kelas</label>
              <input
                autoComplete="off"
                className="h-11 w-full rounded-lg border border-line px-3 text-sm outline-none transition placeholder:text-muted/70 focus:border-brand focus:ring-2 focus:ring-brand/15"
                id="class-name"
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Contoh: X PPLG 1"
                required
                value={form.name}
              />
              {formErrors.name && <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="class-major">Jurusan</label>
                <select
                  className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
                  id="class-major"
                  onChange={(event) => setForm((current) => ({ ...current, majorId: event.target.value }))}
                  required
                  value={form.majorId}
                >
                  <option value="">Pilih jurusan</option>
                  {majors.map((major) => (
                    <option key={major.ID} value={major.ID}>
                      {major.MajorName} · {majorFullName(major.MajorName)}
                    </option>
                  ))}
                </select>
                {formErrors.majorId && <p className="mt-1 text-xs text-red-600">{formErrors.majorId}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="class-teacher">Wali Kelas (opsional)</label>
                <select
                  className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
                  id="class-teacher"
                  onChange={(event) => setForm((current) => ({ ...current, homeroomTeacherId: event.target.value }))}
                  value={form.homeroomTeacherId}
                >
                  <option value="">Belum ditentukan</option>
                  {sortedTeachers.map((teacher) => (
                    <option key={teacher.ID} value={teacher.ID}>{teacher.Name}</option>
                  ))}
                </select>
              </div>
            </div>
            {formErrors.request && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">
                {formErrors.request}
              </p>
            )}
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
        isOpen={deletingClass !== null}
        message={deletingClass ? `Kelas ${deletingClass.ClassName} akan dihapus. Tindakan ini tidak dapat dibatalkan.` : ""}
        onCancel={() => {
          if (!isDeleting) setDeletingClass(null);
        }}
        onConfirm={() => void handleDelete()}
        title="Hapus Kelas?"
      />
    </div>
  );
}

export default function AdminClassesPage() {
  return (
    <Suspense fallback={<ClassesLoadingFallback />}>
      <AdminClassesContent />
    </Suspense>
  );
}