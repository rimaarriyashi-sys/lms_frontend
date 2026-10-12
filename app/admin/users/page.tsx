"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import EmptyState from "@/components/admin/EmptyState";
import Modal from "@/components/admin/Modal";
import PageHeader from "@/components/admin/PageHeader";
import Pagination from "@/components/admin/Pagination";
import SearchInput from "@/components/admin/SearchInput";
import TableSkeleton from "@/components/admin/TableSkeleton";
import { apiFetch, apiFetchList } from "@/lib/api";
import type { Class as SchoolClass, User } from "@/types";

const roles = [
  { id: 1, name: "Admin" },
  { id: 2, name: "Guru" },
  { id: 3, name: "Siswa" },
  { id: 4, name: "Kurikulum" },
  { id: 5, name: "Kepsek" },
] as const;

const pageSize = 10;

interface ManagedUser extends User {
  Specialty?: string;
  TempatLahir?: string;
  TanggalLahir?: string;
  JenisKelamin?: string;
}

interface UserForm {
  name: string;
  email: string;
  roleId: string;
  password: string;
  nisnNip: string;
  nis: string;
  specialty: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: string;
  classId: string;
}

interface UserFormErrors {
  name?: string;
  email?: string;
  roleId?: string;
  password?: string;
  request?: string;
}

interface ImportResponse {
  detail?: {
    guru_baru?: number;
    siswa_baru?: number;
    kelas_baru?: number;
  };
}

const emptyForm: UserForm = {
  name: "",
  email: "",
  roleId: "3",
  password: "",
  nisnNip: "",
  nis: "",
  specialty: "",
  tempatLahir: "",
  tanggalLahir: "",
  jenisKelamin: "",
  classId: "",
};

function SearchIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <circle cx="10.8" cy="10.8" r="6.8" stroke="currentColor" strokeWidth="1.7" />
      <path d="m16 16 4.5 4.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </svg>
  );
}

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

function UploadIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="M12 15V3M8 7l4-4 4 4M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

function EyeIcon({ visible }: { visible: boolean }) {
  return (
    <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24">
      {visible ? (
        <>
          <path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
          <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.7" />
        </>
      ) : (
        <path d="m3 3 18 18M10.6 6.2A9.8 9.8 0 0 1 12 6c6.1 0 9.5 6 9.5 6a16 16 0 0 1-3.1 3.5M6.2 6.7C3.8 8.2 2.5 12 2.5 12s3.4 6 9.5 6c1.1 0 2.1-.2 3-.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
      )}
    </svg>
  );
}

function roleName(roleId: number): string {
  return roles.find((role) => role.id === roleId)?.name ?? "Tidak diketahui";
}

function roleStyle(): string {
  return "border border-brand/15 bg-brand/10 text-brand-dark";
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<number | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [classError, setClassError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [formErrors, setFormErrors] = useState<UserFormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [deletingUser, setDeletingUser] = useState<ManagedUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importError, setImportError] = useState("");
  const [importSummary, setImportSummary] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  async function loadUsers() {
    setIsLoading(true);
    try {
      setUsers(await apiFetchList<ManagedUser>("/api/admin/users"));
      setPageError("");
    } catch (error) {
      setPageError(getErrorMessage(error, "Daftar akun gagal dimuat."));
    } finally {
      setIsLoading(false);
    }
  }

  async function loadClasses() {
    try {
      const data = await apiFetchList<SchoolClass>("/api/admin/classes");
      setClasses(data.sort((left, right) => left.ClassName.localeCompare(right.ClassName, "id")));
      setClassError("");
    } catch (error) {
      setClassError(getErrorMessage(error, "Daftar kelas gagal dimuat."));
    }
  }

  useEffect(() => {
    void Promise.resolve().then(() => {
      void loadUsers();
      void loadClasses();
    });
  }, []);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase();
    return users.filter((user) => {
      const matchesRole = roleFilter === "all" || user.RoleID === roleFilter;
      const matchesSearch =
        user.Name.toLocaleLowerCase().includes(normalizedSearch) ||
        user.Email.toLocaleLowerCase().includes(normalizedSearch);
      return matchesRole && matchesSearch;
    });
  }, [roleFilter, searchTerm, users]);

  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const safePage = Math.min(currentPage, pageCount);
  const visibleUsers = filteredUsers.slice((safePage - 1) * pageSize, safePage * pageSize);
  const sortedClasses = useMemo(
    () => [...classes].sort((left, right) => left.ClassName.localeCompare(right.ClassName, "id")),
    [classes],
  );

  function openAddModal() {
    setEditingUser(null);
    setForm(emptyForm);
    setFormErrors({});
    setIsPasswordVisible(false);
    setIsModalOpen(true);
  }

  function openEditModal(user: ManagedUser) {
    setEditingUser(user);
    setForm({
      name: user.Name,
      email: user.Email,
      roleId: String(user.RoleID),
      password: "",
      nisnNip: user.NISN_NIP ?? "",
      nis: user.NIS ?? "",
      specialty: user.Specialty ?? "",
      tempatLahir: user.TempatLahir ?? "",
      tanggalLahir: user.TanggalLahir?.slice(0, 10) ?? "",
      jenisKelamin: user.JenisKelamin ?? "",
      classId: user.ClassID == null ? "" : String(user.ClassID),
    });
    setFormErrors({});
    setIsPasswordVisible(false);
    setIsModalOpen(true);
  }

  function validateForm(): boolean {
    const errors: UserFormErrors = {};
    const normalizedName = form.name.trim();
    const normalizedEmail = form.email.trim();

    if (!normalizedName) errors.name = "Nama lengkap wajib diisi.";
    if (!normalizedEmail) {
      errors.email = "Email wajib diisi.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      errors.email = "Masukkan alamat email yang valid.";
    }
    if (!form.roleId || !roles.some((role) => role.id === Number(form.roleId))) {
      errors.roleId = "Pilih role pengguna.";
    }
    if (!editingUser && !form.password.trim()) {
      errors.password = "Password wajib diisi.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    setFormErrors({});
    const roleId = Number(form.roleId);
    const isTeacher = roleId === 2;
    const isStudent = roleId === 3;
    const body: {
      name: string;
      email: string;
      password?: string;
      role_id: number;
      nisn_nip: string;
      nis: string;
      tempat_lahir: string;
      tanggal_lahir: string;
      jenis_kelamin: string;
      specialty: string;
      class_id: number | null;
    } = {
      name: form.name.trim(),
      email: form.email.trim(),
      role_id: roleId,
      nisn_nip: isTeacher || isStudent ? form.nisnNip.trim() : "",
      nis: isStudent ? form.nis.trim() : "",
      tempat_lahir: isTeacher || isStudent ? form.tempatLahir.trim() : "",
      tanggal_lahir: isTeacher || isStudent ? form.tanggalLahir : "",
      jenis_kelamin: isTeacher || isStudent ? form.jenisKelamin : "",
      specialty: isTeacher ? form.specialty.trim() : "",
      class_id: isStudent && form.classId ? Number(form.classId) : null,
    };
    if (form.password) body.password = form.password;

    try {
      if (editingUser) {
        await apiFetch(`/api/admin/users/${encodeURIComponent(editingUser.ID)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        await apiFetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      setIsModalOpen(false);
      await loadUsers();
    } catch (error) {
      setFormErrors({
        request: getErrorMessage(error, "Perubahan akun gagal disimpan."),
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingUser) return;

    setIsDeleting(true);
    setPageError("");
    try {
      await apiFetch(`/api/admin/users/${encodeURIComponent(deletingUser.ID)}`, {
        method: "DELETE",
      });
      setDeletingUser(null);
      await loadUsers();
    } catch (error) {
      setPageError(getErrorMessage(error, "Akun gagal dihapus."));
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!importFile) {
      setImportError("Pilih file Excel berformat .xlsx terlebih dahulu.");
      return;
    }

    setIsImporting(true);
    setImportError("");
    setImportSummary("");
    const formData = new FormData();
    formData.append("file", importFile);

    try {
      const response = await apiFetch<ImportResponse>("/api/admin/import", {
        method: "POST",
        body: formData,
      });
      const detail = response?.detail;
      setImportSummary(
        detail
          ? `Import berhasil: ${detail.guru_baru ?? 0} guru baru, ${detail.siswa_baru ?? 0} siswa baru, ${detail.kelas_baru ?? 0} kelas baru.`
          : "Import berhasil.",
      );
      setImportFile(null);
      setIsImportModalOpen(false);
      await Promise.all([loadUsers(), loadClasses()]);
    } catch (error) {
      setImportError(getErrorMessage(error, "File Excel gagal diimpor."));
    } finally {
      setIsImporting(false);
    }
  }

  const roleCounts = roles.map((role) => ({
    ...role,
    count: users.filter((user) => user.RoleID === role.id).length,
  }));

  return (
    <div className="mx-auto max-w-[1440px]">
      <PageHeader
        actions={
          <>
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-lg border border-line bg-white px-4 text-sm font-semibold text-ink transition-colors hover:border-brand/40 hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:self-auto"
              onClick={() => {
                setImportFile(null);
                setImportError("");
                setIsImportModalOpen(true);
              }}
              type="button"
            >
              <span className="size-[18px] text-brand"><UploadIcon /></span>
              Import Excel
            </button>
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-lg bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:self-auto"
              onClick={openAddModal}
              type="button"
            >
              <span className="size-[18px]"><AddIcon /></span>
              Tambah Akun
            </button>
          </>
        }
        description="Kelola akun dan akses pengguna NexaEdu."
        eyebrow="Administrasi pengguna"
        title="Manajemen Akun"
      />

      {pageError && (
        <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {pageError}
        </p>
      )}
      {importSummary && (
        <p className="mb-5 rounded-lg border border-brand/20 bg-brand/5 px-4 py-3 text-sm text-brand-dark" role="status">
          {importSummary}
        </p>
      )}

      <section className="overflow-hidden rounded-xl border border-line bg-white">
        <div className="space-y-4 border-b border-line p-4 sm:p-5">
          <div aria-label="Filter akun berdasarkan role" className="flex flex-wrap gap-2">
            <button
              aria-pressed={roleFilter === "all"}
              className={`inline-flex min-h-9 items-center gap-2 rounded-full border px-3.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${roleFilter === "all" ? "border-brand bg-brand text-white" : "border-line bg-white text-muted hover:border-brand/35 hover:text-brand"}`}
              onClick={() => {
                setRoleFilter("all");
                setCurrentPage(1);
              }}
              type="button"
            >
              Semua <span className="tabular-nums">{users.length}</span>
            </button>
            {roleCounts.map((role) => (
              <button
                aria-pressed={roleFilter === role.id}
                className={`inline-flex min-h-9 items-center gap-2 rounded-full border px-3.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${roleFilter === role.id ? "border-brand bg-brand text-white" : "border-line bg-white text-muted hover:border-brand/35 hover:text-brand"}`}
                key={role.id}
                onClick={() => {
                  setRoleFilter(role.id);
                  setCurrentPage(1);
                }}
                type="button"
              >
                {role.name} <span className="tabular-nums">{role.count}</span>
              </button>
            ))}
          </div>
          <SearchInput
            label="Cari nama atau email pengguna"
            onChange={(value) => {
              setSearchTerm(value);
              setCurrentPage(1);
            }}
            placeholder="Cari nama atau email..."
            value={searchTerm}
          />
        </div>

        {isLoading ? (
          <div className="p-5">
            <TableSkeleton columns={5} rows={8} />
          </div>
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            description={
              searchTerm || roleFilter !== "all"
                ? "Coba ubah kata pencarian atau filter role yang dipilih."
                : "Tambahkan akun baru atau impor daftar pengguna dari file Excel."
            }
            icon={<span className="size-6"><SearchIcon /></span>}
            title="Tidak ada akun ditemukan"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-left">
              <thead className="bg-surface/80">
                <tr className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                  <th className="px-5 py-3.5">Nama</th>
                  <th className="px-5 py-3.5">Email</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Identitas</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visibleUsers.map((user) => {
                  const identity = user.RoleID === 2
                    ? user.NISN_NIP ?? "-"
                    : user.RoleID === 3
                      ? user.NIS ?? "-"
                      : "-";

                  return (
                    <tr className="transition-colors hover:bg-surface/50" key={user.ID}>
                      <td className="px-5 py-4 text-sm font-medium text-ink">{user.Name}</td>
                      <td className="px-5 py-4 text-sm text-muted">{user.Email}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${roleStyle()}`}>
                          {roleName(user.RoleID)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-muted">{identity || "-"}</td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            aria-label={`Edit akun ${user.Name}`}
                            className="inline-flex size-9 items-center justify-center rounded-lg border border-line text-muted transition hover:border-brand/40 hover:bg-brand/5 hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                            onClick={() => openEditModal(user)}
                            title="Edit akun"
                            type="button"
                          >
                            <span className="size-[17px]"><EditIcon /></span>
                          </button>
                          <button
                            aria-label={`Hapus akun ${user.Name}`}
                            className="inline-flex size-9 items-center justify-center rounded-lg border border-line text-muted transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                            onClick={() => {
                              setPageError("");
                              setDeletingUser(user);
                            }}
                            title="Hapus akun"
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
        {!isLoading && filteredUsers.length > 0 && (
          <Pagination
            onPageChange={setCurrentPage}
            page={safePage}
            pageSize={pageSize}
            total={filteredUsers.length}
          />
        )}
      </section>

      {isModalOpen && (
        <Modal
          maxWidth="max-w-2xl"
          onClose={() => {
            if (!isSaving) setIsModalOpen(false);
          }}
          title={editingUser ? "Edit Akun Pengguna" : "Tambah Akun Pengguna"}
        >
          <form className="mt-6 space-y-5" noValidate onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="user-name">Nama Lengkap</label>
                <input
                  autoComplete="name"
                  className="h-11 w-full rounded-lg border border-line px-3 text-sm outline-none transition placeholder:text-muted/70 focus:border-brand focus:ring-2 focus:ring-brand/15"
                  id="user-name"
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  required
                  value={form.name}
                />
                {formErrors.name && <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="user-email">Email</label>
                <input
                  autoComplete="email"
                  className="h-11 w-full rounded-lg border border-line px-3 text-sm outline-none transition placeholder:text-muted/70 focus:border-brand focus:ring-2 focus:ring-brand/15"
                  id="user-email"
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  required
                  type="email"
                  value={form.email}
                />
                {formErrors.email && <p className="mt-1 text-xs text-red-600">{formErrors.email}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="user-role">Role</label>
                <select
                  className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
                  id="user-role"
                  onChange={(event) => setForm((current) => ({ ...current, roleId: event.target.value }))}
                  value={form.roleId}
                >
                  {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
                </select>
                {formErrors.roleId && <p className="mt-1 text-xs text-red-600">{formErrors.roleId}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="user-password">
                  Password{editingUser ? " (opsional)" : ""}
                </label>
                <div className="relative">
                  <input
                    autoComplete="new-password"
                    className="h-11 w-full rounded-lg border border-line px-3 pr-11 text-sm outline-none transition placeholder:text-muted/70 focus:border-brand focus:ring-2 focus:ring-brand/15"
                    id="user-password"
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                    placeholder={editingUser ? "Kosongkan jika tidak ingin mengubah password" : "Masukkan password"}
                    required={!editingUser}
                    type={isPasswordVisible ? "text" : "password"}
                    value={form.password}
                  />
                  <button
                    aria-label={isPasswordVisible ? "Sembunyikan password" : "Tampilkan password"}
                    className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-brand"
                    onClick={() => setIsPasswordVisible((visible) => !visible)}
                    type="button"
                  >
                    <EyeIcon visible={isPasswordVisible} />
                  </button>
                </div>
                {formErrors.password && <p className="mt-1 text-xs text-red-600">{formErrors.password}</p>}
              </div>
            </div>

            {Number(form.roleId) === 2 && (
              <div className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="user-nip">NIP</label>
                  <input className="h-11 w-full rounded-lg border border-line px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15" id="user-nip" onChange={(event) => setForm((current) => ({ ...current, nisnNip: event.target.value }))} value={form.nisnNip} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="user-specialty">Keahlian</label>
                  <input className="h-11 w-full rounded-lg border border-line px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15" id="user-specialty" onChange={(event) => setForm((current) => ({ ...current, specialty: event.target.value }))} value={form.specialty} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="user-birthplace">Tempat Lahir</label>
                  <input className="h-11 w-full rounded-lg border border-line px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15" id="user-birthplace" onChange={(event) => setForm((current) => ({ ...current, tempatLahir: event.target.value }))} value={form.tempatLahir} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="user-birthdate">Tanggal Lahir</label>
                  <input className="h-11 w-full rounded-lg border border-line px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15" id="user-birthdate" onChange={(event) => setForm((current) => ({ ...current, tanggalLahir: event.target.value }))} type="date" value={form.tanggalLahir} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="user-gender">Jenis Kelamin</label>
                  <select className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15" id="user-gender" onChange={(event) => setForm((current) => ({ ...current, jenisKelamin: event.target.value }))} value={form.jenisKelamin}>
                    <option value="">Pilih jenis kelamin</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
              </div>
            )}

            {Number(form.roleId) === 3 && (
              <div className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="user-nisn">NISN</label>
                  <input className="h-11 w-full rounded-lg border border-line px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15" id="user-nisn" onChange={(event) => setForm((current) => ({ ...current, nisnNip: event.target.value }))} value={form.nisnNip} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="user-nis">NIS</label>
                  <input className="h-11 w-full rounded-lg border border-line px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15" id="user-nis" onChange={(event) => setForm((current) => ({ ...current, nis: event.target.value }))} value={form.nis} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="user-class">Kelas</label>
                  <select className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15" id="user-class" onChange={(event) => setForm((current) => ({ ...current, classId: event.target.value }))} value={form.classId}>
                    <option value="">Belum ada kelas</option>
                    {sortedClasses.map((schoolClass) => <option key={schoolClass.ID} value={schoolClass.ID}>{schoolClass.ClassName}</option>)}
                  </select>
                  {classError && <p className="mt-1 text-xs text-red-600">{classError}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="student-birthplace">Tempat Lahir</label>
                  <input className="h-11 w-full rounded-lg border border-line px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15" id="student-birthplace" onChange={(event) => setForm((current) => ({ ...current, tempatLahir: event.target.value }))} value={form.tempatLahir} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="student-birthdate">Tanggal Lahir</label>
                  <input className="h-11 w-full rounded-lg border border-line px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15" id="student-birthdate" onChange={(event) => setForm((current) => ({ ...current, tanggalLahir: event.target.value }))} type="date" value={form.tanggalLahir} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="student-gender">Jenis Kelamin</label>
                  <select className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15" id="student-gender" onChange={(event) => setForm((current) => ({ ...current, jenisKelamin: event.target.value }))} value={form.jenisKelamin}>
                    <option value="">Pilih jenis kelamin</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
              </div>
            )}

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

      {isImportModalOpen && (
        <Modal
          maxWidth="max-w-2xl"
          onClose={() => {
            if (!isImporting) setIsImportModalOpen(false);
          }}
          title="Import Data Excel"
        >
          <form className="mt-6 space-y-5" onSubmit={handleImport}>
            <div className="rounded-lg border border-line bg-surface p-4 text-sm text-muted">
              <p className="font-semibold text-ink">Format file</p>
              <p className="mt-1">File .xlsx harus memiliki sheet dengan baris pertama sebagai header.</p>
              <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="font-semibold text-ink">Sheet “Guru”</dt>
                  <dd className="mt-1 leading-5">Nama, Email, Password, NIP, Tempat Lahir, Tanggal Lahir, JK, Mapel</dd>
                </div>
                <div>
                  <dt className="font-semibold text-ink">Sheet “Siswa”</dt>
                  <dd className="mt-1 leading-5">Nama, Email, Password, NISN, NIS, Tempat Lahir, Tanggal Lahir, JK, Kelas</dd>
                </div>
              </dl>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="import-file">
                File Excel (.xlsx)
              </label>
              <input
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="block min-h-11 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink file:mr-3 file:rounded-md file:border-0 file:bg-brand/10 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-brand"
                id="import-file"
                onChange={(event) => {
                  setImportFile(event.target.files?.[0] ?? null);
                  setImportError("");
                }}
                required
                type="file"
              />
            </div>

            {importError && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">
                {importError}
              </p>
            )}
            <div className="flex justify-end gap-3 border-t border-line pt-4">
              <button className="min-h-11 rounded-lg border border-line px-4 text-sm font-semibold text-ink transition hover:bg-surface disabled:opacity-60" disabled={isImporting} onClick={() => setIsImportModalOpen(false)} type="button">
                Batal
              </button>
              <button className="min-h-11 rounded-lg bg-brand px-5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60" disabled={isImporting} type="submit">
                {isImporting ? "Mengimpor..." : "Import Data"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmDialog
        isLoading={isDeleting}
        isOpen={deletingUser !== null}
        message={deletingUser ? `Akun ${deletingUser.Name} akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.` : ""}
        onCancel={() => {
          if (!isDeleting) setDeletingUser(null);
        }}
        onConfirm={() => void handleDelete()}
        title="Hapus Akun?"
      />
    </div>
  );
}