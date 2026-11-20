"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import EmptyState from "@/components/admin/EmptyState";
import Modal from "@/components/admin/Modal";
import PageHeader from "@/components/admin/PageHeader";
import TableSkeleton from "@/components/admin/TableSkeleton";
import { apiFetch, downloadFile } from "@/lib/api";
import type { AssignmentItem, SubmissionListResponse, SubmissionRow } from "@/types/types/learning";

interface GradeForm {
  score: string;
  feedback: string;
}

const emptyGradeForm: GradeForm = { score: "", feedback: "" };

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function formatDate(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function AssignmentIcon() {
  return (
    <svg aria-hidden="true" className="size-6" fill="none" viewBox="0 0 24 24">
      <path d="M8 4h8M9 3h6v3H9zM6 5H4v16h16V5h-2M8 11h8M8 15h5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24">
      <path d="M12 3v12M7 10l5 5 5-5M4 17v4h16v-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-xl border border-line bg-white p-5 shadow-sm">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
    </article>
  );
}

export default function GuruAssignmentSubmissionsPage() {
  const params = useParams<{ id: string }>();
  const assignmentId = params.id;
  const [response, setResponse] = useState<SubmissionListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [downloadingSubmissionId, setDownloadingSubmissionId] = useState<number | null>(null);
  const [gradingSubmission, setGradingSubmission] = useState<SubmissionRow | null>(null);
  const [gradeForm, setGradeForm] = useState<GradeForm>(emptyGradeForm);
  const [gradeError, setGradeError] = useState("");
  const [isSavingGrade, setIsSavingGrade] = useState(false);
  const [showPublishConfirmation, setShowPublishConfirmation] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const loadSubmissions = useCallback(async (showLoading: boolean) => {
    if (showLoading) setIsLoading(true);
    setPageError("");
    try {
      const result = await apiFetch<SubmissionListResponse>(`/api/guru/assignments/${assignmentId}/submissions`);
      setResponse(result);
    } catch (error) {
      setPageError(getErrorMessage(error, "Data pengumpulan tugas gagal dimuat."));
    } finally {
      setIsLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    void Promise.resolve().then(() => loadSubmissions(true));
  }, [loadSubmissions]);

  function openGradeModal(submission: SubmissionRow) {
    setGradingSubmission(submission);
    setGradeForm({
      score: submission.score == null ? "" : String(submission.score),
      feedback: submission.feedback ?? "",
    });
    setGradeError("");
  }

  async function handleGradeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!gradingSubmission?.submission_id || !response) return;
    setGradeError("");
    if (gradeForm.score.trim() === "") {
      setGradeError("Nilai wajib diisi.");
      return;
    }
    const score = Number(gradeForm.score);
    if (!Number.isFinite(score) || score < 0 || score > response.assignment.MaxScore) {
      setGradeError(`Nilai harus berada di antara 0 dan ${response.assignment.MaxScore}.`);
      return;
    }

    setIsSavingGrade(true);
    try {
      await apiFetch(`/api/guru/submissions/${gradingSubmission.submission_id}/grade`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, feedback: gradeForm.feedback.trim() }),
      });
      setGradingSubmission(null);
      await loadSubmissions(false);
    } catch (error) {
      setGradeError(getErrorMessage(error, "Nilai gagal disimpan."));
    } finally {
      setIsSavingGrade(false);
    }
  }

  async function handlePublishToggle() {
    if (!response) return;
    setIsPublishing(true);
    setPageError("");
    try {
      await apiFetch(`/api/guru/assignments/${assignmentId}/publish`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !response.assignment.GradesPublished }),
      });
      setShowPublishConfirmation(false);
      await loadSubmissions(false);
    } catch (error) {
      setPageError(getErrorMessage(error, "Status publikasi nilai gagal diperbarui."));
    } finally {
      setIsPublishing(false);
    }
  }

  async function handleDownload(submission: SubmissionRow) {
    if (!submission.file_url) return;
    setPageError("");
    setDownloadingSubmissionId(submission.submission_id);
    try {
      await downloadFile(submission.file_url, submission.file_name || "pengumpulan");
    } catch (error) {
      setPageError(getErrorMessage(error, "File pengumpulan gagal diunduh."));
    } finally {
      setDownloadingSubmissionId(null);
    }
  }

  const assignment: AssignmentItem | null = response?.assignment ?? null;
  const published = Boolean(assignment?.GradesPublished);

  return (
    <div className="mx-auto max-w-[1440px]">
      {isLoading && !response ? (
        <>
          <div className="mb-6">
            <div className="motion-safe:animate-pulse mb-3 h-3 w-28 rounded bg-brand/10" />
            <div className="motion-safe:animate-pulse h-9 w-80 max-w-full rounded bg-brand/10" />
          </div>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => <div key={index} className="motion-safe:animate-pulse h-24 rounded-xl border border-line bg-white" />)}
          </div>
          <section className="rounded-lg border border-line bg-white p-5"><TableSkeleton columns={8} rows={8} /></section>
        </>
      ) : !response ? (
        <>
          <PageHeader
            description="Data pengumpulan siswa untuk tugas ini."
            eyebrow="Area guru"
            title="Pengumpulan Tugas"
          />
          {pageError && <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{pageError}</p>}
          <div className="rounded-lg border border-line bg-white">
            <EmptyState
              description="Data tugas dan pengumpulan belum dapat ditampilkan."
              icon={<AssignmentIcon />}
              title="Gagal memuat pengumpulan"
            />
          </div>
          <Link className="mt-5 inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-semibold text-brand-dark hover:bg-brand/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand" href="/guru/assignments">
            Kembali ke daftar tugas
          </Link>
        </>
      ) : (
        <>
          <PageHeader
            actions={(
              <button
                className={`inline-flex min-h-11 items-center justify-center rounded-lg px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60 ${published ? "border border-line bg-white text-ink hover:bg-surface" : "bg-brand text-white hover:bg-brand-dark"}`}
                disabled={isPublishing}
                onClick={() => setShowPublishConfirmation(true)}
                type="button"
              >
                {published ? "Sembunyikan Nilai" : "Publikasikan Nilai"}
              </button>
            )}
            description={`Tenggat: ${formatDate(assignment?.Deadline)} · ${assignment?.Type === "projek" ? "Projek" : "Tugas"}`}
            eyebrow="Pengumpulan dan penilaian"
            title={assignment?.Title ?? "Pengumpulan Tugas"}
          />

          {pageError && <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{pageError}</p>}

          <div className="mb-6 flex flex-wrap items-center gap-3">
            <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${published ? "bg-brand/10 text-brand-dark" : "bg-surface text-muted"}`}>
              {published ? "Nilai dipublikasikan" : "Nilai disembunyikan"}
            </span>
            <Link className="inline-flex min-h-9 items-center rounded-lg px-3 text-sm font-semibold text-brand-dark hover:bg-brand/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand" href="/guru/assignments">
              Kembali ke tugas
            </Link>
          </div>

          <section aria-label="Ringkasan pengumpulan" className="mb-6 grid gap-4 sm:grid-cols-3">
            <SummaryCard label="Total Siswa" value={response.summary.total_students} />
            <SummaryCard label="Sudah Mengumpulkan" value={response.summary.submitted} />
            <SummaryCard label="Sudah Dinilai" value={response.summary.graded} />
          </section>

          <section className="overflow-hidden rounded-lg border border-line bg-white">
            {isLoading ? (
              <div className="p-5"><TableSkeleton columns={8} rows={8} /></div>
            ) : response.data.length === 0 ? (
              <EmptyState
                description="Belum ada siswa pada kelas tugas ini."
                icon={<AssignmentIcon />}
                title="Belum ada data siswa"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1320px] border-collapse text-left">
                  <thead className="bg-surface/80">
                    <tr className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                      <th className="px-5 py-3.5">Nama</th>
                      <th className="px-5 py-3.5">NIS</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Waktu Kumpul</th>
                      <th className="px-5 py-3.5">File</th>
                      <th className="px-5 py-3.5">Catatan Siswa</th>
                      <th className="px-5 py-3.5">Nilai</th>
                      <th className="px-5 py-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {response.data.map((submission) => {
                      const status = !submission.submitted
                        ? "Belum mengumpulkan"
                        : submission.graded
                          ? "Dinilai"
                          : submission.is_late
                            ? "Terlambat"
                            : "Dikumpulkan";
                      const statusClass = !submission.submitted
                        ? "bg-surface text-muted"
                        : submission.graded
                          ? "bg-brand/10 text-brand-dark"
                          : submission.is_late
                            ? "bg-red-50 text-red-700"
                            : "bg-surface text-ink";

                      return (
                        <tr className="transition-colors hover:bg-surface/50" key={submission.student_id}>
                          <td className="px-5 py-4 text-sm font-semibold text-ink">{submission.student_name}</td>
                          <td className="px-5 py-4 text-sm text-ink">{submission.student_nis || "-"}</td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass}`}>{status}</span>
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 text-sm text-ink">{formatDate(submission.submitted_at)}</td>
                          <td className="px-5 py-4">
                            {submission.submitted && submission.file_url ? (
                              <button
                                className="inline-flex min-h-9 max-w-48 items-center gap-2 rounded-lg px-2.5 text-xs font-semibold text-brand-dark transition-colors hover:bg-brand/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-wait disabled:opacity-60"
                                disabled={downloadingSubmissionId === submission.submission_id}
                                onClick={() => void handleDownload(submission)}
                                type="button"
                              >
                                <DownloadIcon />
                                <span className="truncate">{downloadingSubmissionId === submission.submission_id ? "Mengunduh..." : submission.file_name || "Unduh"}</span>
                              </button>
                            ) : <span className="text-sm text-muted">-</span>}
                          </td>
                          <td className="max-w-56 px-5 py-4 text-sm text-muted">
                            <span className="line-clamp-2">{submission.note || "-"}</span>
                          </td>
                          <td className="px-5 py-4 text-sm font-semibold text-ink">
                            {submission.graded && submission.score != null ? `${submission.score} / ${assignment?.MaxScore}` : "-"}
                          </td>
                          <td className="px-5 py-4 text-right">
                            {submission.submitted && submission.submission_id != null ? (
                              <button
                                className="inline-flex min-h-9 items-center justify-center rounded-lg bg-brand px-3 text-xs font-semibold text-white transition-colors hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                                onClick={() => openGradeModal(submission)}
                                type="button"
                              >
                                {submission.graded ? "Ubah Nilai" : "Beri Nilai"}
                              </button>
                            ) : <span className="text-sm text-muted">-</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {gradingSubmission && (
        <Modal
          title={gradingSubmission.graded ? "Ubah Nilai" : "Beri Nilai"}
          onClose={() => {
            if (!isSavingGrade) setGradingSubmission(null);
          }}
          maxWidth="max-w-xl"
        >
          <form className="mt-6 space-y-4" onSubmit={(event) => void handleGradeSubmit(event)}>
            {gradeError && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{gradeError}</p>}
            <div className="rounded-lg bg-surface px-4 py-3">
              <p className="text-sm font-semibold text-ink">{gradingSubmission.student_name}</p>
              {gradingSubmission.note && <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{gradingSubmission.note}</p>}
            </div>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">Nilai (0–{assignment?.MaxScore})</span>
              <input
                autoFocus
                className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
                disabled={isSavingGrade}
                max={assignment?.MaxScore}
                min="0"
                onChange={(event) => setGradeForm((current) => ({ ...current, score: event.target.value }))}
                required
                step="any"
                type="number"
                value={gradeForm.score}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">Umpan balik</span>
              <textarea
                className="min-h-24 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/75 focus:border-brand focus:ring-2 focus:ring-brand/15"
                disabled={isSavingGrade}
                onChange={(event) => setGradeForm((current) => ({ ...current, feedback: event.target.value }))}
                value={gradeForm.feedback}
              />
            </label>
            <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:justify-end">
              <button
                className="min-h-11 rounded-lg border border-line px-5 text-sm font-semibold text-ink transition hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSavingGrade}
                onClick={() => setGradingSubmission(null)}
                type="button"
              >
                Batal
              </button>
              <button
                className="min-h-11 rounded-lg bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSavingGrade}
                type="submit"
              >
                {isSavingGrade ? "Menyimpan..." : "Simpan Nilai"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showPublishConfirmation && assignment && (
        <Modal
          title={published ? "Sembunyikan Nilai" : "Publikasikan Nilai"}
          onClose={() => {
            if (!isPublishing) setShowPublishConfirmation(false);
          }}
          maxWidth="max-w-md"
        >
          <div className="mt-5">
            <p className="text-sm leading-6 text-muted">
              {published
                ? "Nilai tugas ini tidak lagi terlihat oleh siswa sampai dipublikasikan kembali."
                : "Nilai yang sudah diberikan akan terlihat oleh siswa setelah dipublikasikan."}
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                className="min-h-11 rounded-lg border border-line px-5 text-sm font-semibold text-ink transition hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isPublishing}
                onClick={() => setShowPublishConfirmation(false)}
                type="button"
              >
                Batal
              </button>
              <button
                className="min-h-11 rounded-lg bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isPublishing}
                onClick={() => void handlePublishToggle()}
                type="button"
              >
                {isPublishing ? "Memproses..." : published ? "Sembunyikan Nilai" : "Publikasikan Nilai"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
