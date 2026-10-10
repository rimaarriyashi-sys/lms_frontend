"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { roleIdToPath, saveAuth } from "@/lib/auth";

type LoginRole = "admin" | "guru" | "siswa" | "kurikulum" | "kepsek";
type Step = "select" | "login";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: LoginRole;
}

interface LoginResponse {
  message: string;
  token: string;
  role_id: number;
}

const roles: {
  id: LoginRole;
  name: string;
  description: string;
  initials: string;
}[] = [
  {
    id: "admin",
    name: "Admin",
    description: "Kelola akun, kelas, jurusan, mata pelajaran, dan data sekolah.",
    initials: "A",
  },
  {
    id: "guru",
    name: "Guru",
    description: "Kelola kuis, materi, tugas, dan penilaian siswa.",
    initials: "G",
  },
  {
    id: "siswa",
    name: "Siswa",
    description: "Ikuti kuis, kumpulkan tugas, dan pantau nilai belajar.",
    initials: "S",
  },
  {
    id: "kurikulum",
    name: "Kurikulum",
    description: "Pantau nilai, tugas, kuis, guru, dan siswa.",
    initials: "K",
  },
  {
    id: "kepsek",
    name: "Kepala Sekolah",
    description: "Tinjau data akademik dan aktivitas sekolah.",
    initials: "KS",
  },
];

export type { LoginRole };

export default function LoginModal({
  isOpen,
  onClose,
  initialRole,
}: LoginModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(initialRole ? "login" : "select");
  const [selectedRole, setSelectedRole] = useState<LoginRole | null>(
    initialRole ?? null,
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previousProps, setPreviousProps] = useState({ isOpen, initialRole });

  if (
    previousProps.isOpen !== isOpen ||
    previousProps.initialRole !== initialRole
  ) {
    setPreviousProps({ isOpen, initialRole });

    if (isOpen) {
      setStep(initialRole ? "login" : "select");
      setSelectedRole(initialRole ?? null);
      setEmail("");
      setPassword("");
      setIsPasswordVisible(false);
      setError("");
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) {
    return null;
  }

  const activeRole = roles.find((role) => role.id === selectedRole);

  function chooseRole(role: LoginRole) {
    setSelectedRole(role);
    setStep("login");
    setError("");
  }

  function returnToRoleSelection() {
    setStep("select");
    setSelectedRole(null);
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await apiFetch<LoginResponse>("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.token || !Number.isInteger(response.role_id)) {
        throw new Error("Respons login tidak valid. Silakan coba lagi.");
      }

      const destination = roleIdToPath(response.role_id);
      saveAuth(response.token, response.role_id);
      router.push(destination);
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Login gagal. Periksa email dan password Anda.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/55 p-4 backdrop-blur-[3px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <section
        aria-labelledby="login-modal-title"
        aria-modal="true"
        className={`relative my-auto w-full overflow-hidden rounded-[20px] bg-white shadow-[0_28px_90px_-28px_rgba(17,17,17,0.48)] ${
          step === "login" ? "max-w-[850px]" : "max-w-[570px]"
        }`}
        role="dialog"
      >
        <button
          aria-label="Tutup modal"
          className="absolute right-4 top-4 z-10 grid size-10 place-items-center rounded-full text-muted transition hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          onClick={onClose}
          type="button"
        >
          <svg
            aria-hidden="true"
            fill="none"
            height="20"
            viewBox="0 0 24 24"
            width="20"
          >
            <path
              d="m18 6-12 12M6 6l12 12"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1.8"
            />
          </svg>
        </button>

        {step === "select" ? (
          <div className="p-6 pt-8 sm:p-9">
            <span className="mb-3 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
              <span className="size-2 rounded-full bg-brand" />
              Portal akademik sekolah
            </span>
            <h2
              className="font-[family-name:var(--font-fraunces)] text-[32px] leading-tight text-ink sm:text-[38px]"
              id="login-modal-title"
            >
              Masuk ke NexaEdu
            </h2>
            <p className="mt-2 max-w-[390px] text-sm leading-6 text-muted">
              Pilih peran Anda untuk melanjutkan ke ruang kerja.
            </p>

            <div className="mt-7 grid gap-2 sm:grid-cols-2">
              {roles.map((role) => (
                <button
                  className="group flex min-h-[94px] items-center gap-3 rounded-xl border border-line bg-white p-3.5 text-left transition hover:border-brand/55 hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  key={role.id}
                  onClick={() => chooseRole(role.id)}
                  type="button"
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand/10 text-sm font-bold text-brand transition group-hover:bg-brand group-hover:text-white">
                    {role.initials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-ink">
                      {role.name}
                    </span>
                    <span className="mt-1 block text-xs leading-[1.45] text-muted">
                      {role.description}
                    </span>
                  </span>
                  <svg
                    aria-hidden="true"
                    className="size-4 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-brand"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="m9 18 6-6-6-6"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                    />
                  </svg>
                </button>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-3 border-t border-line pt-5 text-xs text-muted">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface text-brand">
                <svg
                  aria-hidden="true"
                  className="size-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 3 5 6v5c0 4.5 2.9 8.1 7 10 4.1-1.9 7-5.5 7-10V6l-7-3Z"
                    stroke="currentColor"
                    strokeLinejoin="round"
                    strokeWidth="1.6"
                  />
                  <path
                    d="m9 12 2 2 4-4"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.6"
                  />
                </svg>
              </span>
              Akses masuk tersedia untuk warga sekolah terdaftar.
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-[0.9fr_1.1fr]">
            <aside className="relative hidden min-h-[510px] overflow-hidden bg-brand p-9 text-white md:flex md:flex-col md:justify-between">
              <div
                aria-hidden="true"
                className="absolute -bottom-24 -left-20 size-72 rounded-full border border-white/15"
              />
              <div
                aria-hidden="true"
                className="absolute -bottom-12 -left-8 size-48 rounded-full border border-white/15"
              />
              <div className="relative">
                <span className="inline-grid size-11 place-items-center rounded-xl border border-white/25 bg-white/10 font-[family-name:var(--font-fraunces)] text-2xl font-semibold">
                  NE
                </span>
                <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
                  NexaEdu / Ruang belajar digital
                </p>
                <h2 className="mt-4 font-[family-name:var(--font-fraunces)] text-4xl leading-[1.08]">
                  Satu ruang,
                  <br />
                  banyak langkah
                  <br />
                  <span className="italic text-white/70">ke depan.</span>
                </h2>
              </div>
              <div className="relative border-t border-white/20 pt-5">
                <span className="text-xs text-white/70">Masuk sebagai</span>
                <p className="mt-1 text-lg font-semibold">
                  {activeRole?.name ?? "Warga sekolah"}
                </p>
              </div>
            </aside>

            <div className="p-6 pt-8 sm:p-9 md:px-10 md:py-12">
              <span className="mb-3 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
                <span className="size-2 rounded-full bg-brand" />
                Portal akademik sekolah
              </span>
              <h2
                className="font-[family-name:var(--font-fraunces)] text-[32px] leading-tight text-ink sm:text-[38px]"
                id="login-modal-title"
              >
                Masuk
                {activeRole ? ` — ${activeRole.name}` : ""}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Gunakan akun sekolah Anda untuk melanjutkan.
              </p>

              {activeRole && (
                <div className="mt-6 flex items-center gap-3 rounded-xl border border-brand/15 bg-surface p-3.5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand text-sm font-bold text-white">
                    {activeRole.initials}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-ink">
                      {activeRole.name}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {activeRole.description}
                    </span>
                  </span>
                </div>
              )}

              <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                <label className="block text-sm font-medium text-ink">
                  Email
                  <input
                    autoComplete="email"
                    className="mt-2 block h-12 w-full rounded-lg border border-line bg-white px-3.5 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-brand focus:ring-4 focus:ring-brand/10"
                    name="email"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="nama@sekolah.sch.id"
                    required
                    type="email"
                    value={email}
                  />
                </label>
                <label className="block text-sm font-medium text-ink">
                  Password
                  <span className="relative mt-2 block">
                    <input
                      autoComplete="current-password"
                      className="block h-12 w-full rounded-lg border border-line bg-white px-3.5 pr-11 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-brand focus:ring-4 focus:ring-brand/10"
                      name="password"
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Masukkan password"
                      required
                      type={isPasswordVisible ? "text" : "password"}
                      value={password}
                    />
                    <button
                      aria-label={
                        isPasswordVisible
                          ? "Sembunyikan password"
                          : "Tampilkan password"
                      }
                      className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted transition hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-brand"
                      onClick={() =>
                        setIsPasswordVisible((visible) => !visible)
                      }
                      type="button"
                    >
                      <svg
                        aria-hidden="true"
                        className="size-5"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        {isPasswordVisible ? (
                          <>
                            <path
                              d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="1.7"
                            />
                            <circle
                              cx="12"
                              cy="12"
                              r="2.5"
                              stroke="currentColor"
                              strokeWidth="1.7"
                            />
                          </>
                        ) : (
                          <>
                            <path
                              d="m3 3 18 18M10.6 6.2A9.8 9.8 0 0 1 12 6c6.1 0 9.5 6 9.5 6a16 16 0 0 1-3.1 3.5M6.2 6.7C3.8 8.2 2.5 12 2.5 12s3.4 6 9.5 6c1.1 0 2.1-.2 3-.5"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="1.7"
                            />
                          </>
                        )}
                      </svg>
                    </button>
                  </span>
                </label>

                {error && (
                  <p
                    aria-live="polite"
                    className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm leading-5 text-red-700"
                    role="alert"
                  >
                    {error}
                  </p>
                )}

                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg px-2 text-sm font-medium text-muted transition hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                    disabled={isSubmitting}
                    onClick={returnToRoleSelection}
                    type="button"
                  >
                    <span aria-hidden="true">←</span>
                    Ganti Peran
                  </button>
                  <button
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-white shadow-[0_8px_18px_-8px_rgba(152,107,149,0.85)] transition hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-65"
                    disabled={isSubmitting}
                    type="submit"
                  >
                    {isSubmitting ? "Memproses..." : "Masuk"}
                    {!isSubmitting && <span aria-hidden="true">→</span>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}