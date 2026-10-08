"use client";

import { useEffect, useState, type FormEvent } from "react";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import Modal from "@/components/admin/Modal";
import { apiFetch, apiFetchList } from "@/lib/api";
import type { User } from "@/types";

const roles = [
  { id: 1, name: "Admin" },
  { id: 2, name: "Guru" },
  { id: 3, name: "Siswa" },
  { id: 4, name: "Kurikulum" },
  { id: 5, name: "Kepsek" },
] as const;

interface UserForm {
  name: string;
  email: string;
  roleId: string;
  password: string;
}

interface UserFormErrors {
  name?: string;
  email?: string;
  roleId?: string;
  password?: string;
  request?: string;
}

const emptyForm: UserForm = { name: "", email: "", roleId: "3", password: "" };

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

function roleStyle(roleId: number): string {
  switch (roleId) {
    case 1:
      return "bg-brand/10 text-brand-dark";
    case 2:
      return "bg-emerald-50 text-emerald-700";
    case 3:
      return "bg-lime-50 text-lime-700";
    case 4:
      return "bg-amber-50 text-amber-700";
    default:
      return "bg-rose-50 text-rose-700";
  }
}

function roleName(user: User): string {
  return user.Role?.RoleName ?? roles.find((role) => role.id === user.RoleID)?.name ?? "Tidak diketahui";
}

function SkeletonRows() {
  return (
    <div className="animate-pulse space-y-3 p-5" aria-label="Memuat daftar akun" role="status">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="grid grid-cols-[1.2fr_1.5fr_0.8fr_0.7fr] items-center gap-5 py-3">
          <span className="h-4 rounded bg-line" />
          <span className="h-4 rounded bg-line" />
          <span className="h-6 w-20 rounded-full bg-line" />
          <span className="h-8 w-20 rounded bg-line" />
        </div>
      ))}
    </div>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [formErrors, setFormErrors] = useState<UserFormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function loadUsers() {
    try {
      const data = await apiFetchList<User>("/api/admin/users");
      setUsers(data);
      setPageError("");
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Daftar akun gagal dimuat.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(() => loadUsers());
  }, []);

  const filteredUsers = users.filter((user) =>
    user.Name.toLocaleLowerCase().includes(searchTerm.trim().toLocaleLowerCase()),
  );

  function openAddModal() {
    setEditingUser(null);
    setForm(emptyForm);
    setFormErrors({});
    setIsModalOpen(true);
  }

  function openEditModal(user: User) {
    setEditingUser(user);
    setForm({ name: user.Name, email: user.Email, roleId: String(user.RoleID), password: "" });
    setFormErrors({});
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
    if (!editingUser && !form.password.trim()) errors.password = "Password wajib diisi.";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    setFormErrors({});
    const roleId = Number(form.roleId);
    const body: { name: string; email: string; password?: string; role_id: number } = {
      name: form.name.trim(),
      email: form.email.trim(),
      role_id: roleId,
    };
    if (form.password) body.password = form.password;

    try {
      if (editingUser) {
        await apiFetch(`/api/admin/users/${encodeURIComponent(editingUser.ID)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const selectedRole = roles.find((role) => role.id === roleId);
        setUsers((currentUsers) =>
          currentUsers.map((user) =>
            user.ID === editingUser.ID
              ? {
                  ...user,
                  Name: body.name,
                  Email: body.email,
                  RoleID: roleId,
                  Role: selectedRole ? { ID: roleId, RoleName: selectedRole.name } : user.Role,
                }
              : user,
          ),
        );
        setIsModalOpen(false);
      } else {
        await apiFetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        setIsModalOpen(false);
        void loadUsers();
      }
    } catch (error) {
      setFormErrors({
        request: error instanceof Error ? error.message : "Perubahan akun gagal disimpan.",
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
      setUsers((currentUsers) => currentUsers.filter((user) => user.ID !== deletingUser.ID));
      setDeletingUser(null);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Akun gagal dihapus.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1440px]">
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-1 text-sm font-medium text-brand">Administrasi pengguna</p>
          <h2 className="text-2xl font-semibold text-ink font-[family-name:var(--font-fraunces)] sm:text-3xl">Manajemen Akun</h2>
          <p className="mt-2 text-sm text-muted">Kelola semua akun pengguna sistem</p>
        </div>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-lg bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:self-auto"
          onClick={openAddModal}
          type="button"
        >
          <span className="size-[18px]"><AddIcon /></span>
          Tambah Akun
        </button>
      </div>

      {pageError && (
        <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {pageError}
        </p>
      )}

      <section className="overflow-hidden rounded-xl border border-line bg-white shadow-[0_2px_10px_rgba(17,17,17,0.04)]">
        <div className="border-b border-line p-4 sm:p-5">
          <label className="relative block max-w-md">
            <span className="sr-only">Cari nama pengguna</span>
            <span className="pointer-events-none absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-muted"><SearchIcon /></span>
            <input
              className="h-11 w-full rounded-lg border border-line bg-white pl-10 pr-3 text-sm text-ink outline-none transition placeholder:text-muted/75 focus:border-brand focus:ring-2 focus:ring-brand/15"
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Cari nama pengguna..."
              type="search"
              value={searchTerm}
            />
          </label>
        </div>

        {isLoading ? (
          <SkeletonRows />
        ) : filteredUsers.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center px-6 py-12 text-center">
            <span className="mb-4 grid size-12 place-items-center rounded-full bg-surface text-muted"><span className="size-6"><SearchIcon /></span></span>
            <h3 className="text-base font-semibold text-ink">Tidak ada akun ditemukan</h3>
            <p className="mt-1 max-w-sm text-sm text-muted">Coba ubah kata pencarian atau tambahkan akun pengguna baru.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead className="bg-surface/80">
                <tr className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                  <th className="px-5 py-3.5">Nama</th>
                  <th className="px-5 py-3.5">Email</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredUsers.map((user) => (
                  <tr key={user.ID} className="transition-colors hover:bg-surface/50">
                    <td className="px-5 py-4 text-sm font-medium text-ink">{user.Name}</td>
                    <td className="px-5 py-4 text-sm text-muted">{user.Email}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${roleStyle(user.RoleID)}`}>
                        {roleName(user)}
                      </span>
                    </td>
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
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && filteredUsers.length > 0 && (
          <div className="border-t border-line px-5 py-3 text-xs text-muted">
            Menampilkan {filteredUsers.length} dari {users.length} akun
          </div>
        )}
      </section>

      {isModalOpen && (
        <Modal
          maxWidth="max-w-xl"
          onClose={() => {
            if (!isSaving) setIsModalOpen(false);
          }}
          title={editingUser ? "Edit Akun Pengguna" : "Tambah Akun Pengguna"}
        >
          <form className="mt-6 space-y-4" noValidate onSubmit={handleSubmit}>
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
              <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="user-password">Password{editingUser ? " (opsional)" : ""}</label>
              <input
                autoComplete="new-password"
                className="h-11 w-full rounded-lg border border-line px-3 text-sm outline-none transition placeholder:text-muted/70 focus:border-brand focus:ring-2 focus:ring-brand/15"
                id="user-password"
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                placeholder={editingUser ? "Kosongkan jika tidak ingin mengubah password" : "Masukkan password"}
                required={!editingUser}
                type="password"
                value={form.password}
              />
              {formErrors.password && <p className="mt-1 text-xs text-red-600">{formErrors.password}</p>}
            </div>
            {formErrors.request && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">{formErrors.request}</p>}
            <div className="flex justify-end gap-3 border-t border-line pt-4">
              <button
                className="min-h-11 rounded-lg border border-line px-4 text-sm font-semibold text-ink transition hover:bg-surface disabled:opacity-60"
                disabled={isSaving}
                onClick={() => setIsModalOpen(false)}
                type="button"
              >
                Batal
              </button>
              <button
                className="min-h-11 rounded-lg bg-brand px-5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSaving}
                type="submit"
              >
                {isSaving ? "Menyimpan..." : "Simpan"}
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