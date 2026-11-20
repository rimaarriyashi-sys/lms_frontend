"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import EmptyState from "@/components/admin/EmptyState";
import Modal from "@/components/admin/Modal";
import PageHeader from "@/components/admin/PageHeader";
import TableSkeleton from "@/components/admin/TableSkeleton";
import { apiFetch } from "@/lib/api";
import type {
  AnswerItem,
  EssayGradeResult,
  QuestionItem,
  QuizAttempt,
  QuizItem,
} from "@/types/types/learning";

type TabName = "questions" | "results";
type QuestionType = "pilihan_ganda" | "esai";
type OptionKey = "A" | "B" | "C" | "D";

interface QuizQuestionsResponse {
  data: QuestionItem[];
  quiz: QuizItem;
}

interface AttemptListResponse {
  data: QuizAttempt[];
}

interface SubmissionAnswersResponse {
  data: AnswerItem[];
  student_name: string;
}

interface QuestionForm {
  questionType: QuestionType;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: OptionKey | "";
  score: string;
}

interface EssayGradeForm {
  score: string;
  comment: string;
}

const emptyQuestionForm: QuestionForm = {
  questionType: "pilihan_ganda",
  questionText: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correctOption: "",
  score: "10",
};

const optionKeys: OptionKey[] = ["A", "B", "C", "D"];

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function formatDate(value: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function resultModeText(mode: string): string {
  if (mode === "after_submit") return "Hasil tampil langsung setelah selesai";
  if (mode === "after_publish") return "Hasil tampil setelah dipublikasikan";
  return "Hasil disembunyikan dari siswa";
}

function QuizIcon() {
  return (
    <svg aria-hidden="true" className="size-6" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path d="M9.6 9a2.5 2.5 0 1 1 4.3 1.7c-1 .9-1.9 1.3-1.9 2.8M12 17.5v.1" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
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

function OptionText({ option, text }: { option: OptionKey; text?: string }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="font-semibold">{option}.</span>
      <span>{text || <span className="text-muted">Belum diisi</span>}</span>
    </div>
  );
}

function optionForKey(question: QuestionItem, key?: string): string {
  switch (key) {
    case "A": return question.OptionA ?? "";
    case "B": return question.OptionB ?? "";
    case "C": return question.OptionC ?? "";
    case "D": return question.OptionD ?? "";
    default: return "";
  }
}

function defaultEssayForm(answer: AnswerItem): EssayGradeForm {
  return {
    score: answer.Graded ? String(answer.Score) : "",
    comment: answer.TeacherComment ?? "",
  };
}

export default function GuruQuizDetailPage() {
  const params = useParams<{ id: string }>();
  const quizId = params.id;
  const [activeTab, setActiveTab] = useState<TabName>("questions");
  const [quiz, setQuiz] = useState<QuizItem | null>(null);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(true);
  const [isLoadingAttempts, setIsLoadingAttempts] = useState(false);
  const [pageError, setPageError] = useState("");
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionItem | null>(null);
  const [questionForm, setQuestionForm] = useState<QuestionForm>(emptyQuestionForm);
  const [questionFormError, setQuestionFormError] = useState("");
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);
  const [deletingQuestion, setDeletingQuestion] = useState<QuestionItem | null>(null);
  const [isDeletingQuestion, setIsDeletingQuestion] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState<QuizAttempt | null>(null);
  const [answers, setAnswers] = useState<AnswerItem[]>([]);
  const [studentName, setStudentName] = useState("");
  const [isLoadingAnswers, setIsLoadingAnswers] = useState(false);
  const [answerError, setAnswerError] = useState("");
  const [essayForms, setEssayForms] = useState<Record<number, EssayGradeForm>>({});
  const [savingAnswerId, setSavingAnswerId] = useState<number | null>(null);
  const [gradeSummary, setGradeSummary] = useState<EssayGradeResult | null>(null);
  const [showPublishConfirmation, setShowPublishConfirmation] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const loadQuizQuestions = useCallback(async (showLoading: boolean) => {
    if (showLoading) setIsLoadingQuiz(true);
    setPageError("");
    try {
      const result = await apiFetch<QuizQuestionsResponse>(`/api/guru/quizzes/${quizId}/questions`);
      setQuiz(result.quiz);
      setQuestions(result.data);
    } catch (error) {
      setPageError(getErrorMessage(error, "Data kuis dan soal gagal dimuat."));
    } finally {
      setIsLoadingQuiz(false);
    }
  }, [quizId]);

  const loadAttempts = useCallback(async (showLoading: boolean) => {
    if (showLoading) setIsLoadingAttempts(true);
    try {
      const result = await apiFetch<AttemptListResponse>(`/api/guru/quizzes/${quizId}/submissions`);
      setAttempts(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      setPageError(getErrorMessage(error, "Hasil pengerjaan siswa gagal dimuat."));
    } finally {
      setIsLoadingAttempts(false);
    }
  }, [quizId]);

  useEffect(() => {
    void Promise.resolve().then(() => loadQuizQuestions(true));
  }, [loadQuizQuestions]);

  const totalScore = useMemo(
    () => questions.reduce((sum, question) => sum + question.Score, 0),
    [questions],
  );

  function openCreateQuestion() {
    setEditingQuestion(null);
    setQuestionForm(emptyQuestionForm);
    setQuestionFormError("");
    setIsQuestionModalOpen(true);
  }

  function openEditQuestion(question: QuestionItem) {
    setEditingQuestion(question);
    setQuestionForm({
      questionType: question.QuestionType === "esai" ? "esai" : "pilihan_ganda",
      questionText: question.QuestionText,
      optionA: question.OptionA ?? "",
      optionB: question.OptionB ?? "",
      optionC: question.OptionC ?? "",
      optionD: question.OptionD ?? "",
      correctOption: (optionKeys.includes(question.CorrectOption as OptionKey)
        ? question.CorrectOption
        : "") as OptionKey | "",
      score: String(question.Score),
    });
    setQuestionFormError("");
    setIsQuestionModalOpen(true);
  }

  function updateQuestionType(questionType: QuestionType) {
    setQuestionForm((current) => ({
      ...current,
      questionType,
      correctOption: questionType === "esai" ? "" : current.correctOption,
    }));
  }

  async function handleQuestionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuestionFormError("");
    const questionText = questionForm.questionText.trim();
    if (!questionText) {
      setQuestionFormError("Pertanyaan wajib diisi.");
      return;
    }
    const score = Number(questionForm.score);
    if (!Number.isFinite(score) || score <= 0) {
      setQuestionFormError("Skor harus berupa angka lebih besar dari 0.");
      return;
    }
    if (questionForm.questionType === "pilihan_ganda") {
      if (!questionForm.optionA.trim() || !questionForm.optionB.trim()) {
        setQuestionFormError("Opsi A dan B wajib diisi untuk soal pilihan ganda.");
        return;
      }
      if (!questionForm.correctOption || !optionForKey({
        ID: 0,
        QuizID: Number(quizId),
        QuestionText: questionText,
        QuestionType: "pilihan_ganda",
        OptionA: questionForm.optionA,
        OptionB: questionForm.optionB,
        OptionC: questionForm.optionC,
        OptionD: questionForm.optionD,
        Score: score,
      }, questionForm.correctOption).trim()) {
        setQuestionFormError("Pilih kunci jawaban dari opsi yang sudah diisi.");
        return;
      }
    }

    setIsSavingQuestion(true);
    try {
      const body = {
        question_text: questionText,
        question_type: questionForm.questionType,
        option_a: questionForm.questionType === "pilihan_ganda" ? questionForm.optionA.trim() : "",
        option_b: questionForm.questionType === "pilihan_ganda" ? questionForm.optionB.trim() : "",
        option_c: questionForm.questionType === "pilihan_ganda" ? questionForm.optionC.trim() : "",
        option_d: questionForm.questionType === "pilihan_ganda" ? questionForm.optionD.trim() : "",
        correct_option: questionForm.questionType === "pilihan_ganda" ? questionForm.correctOption : "",
        score,
      };
      if (editingQuestion) {
        await apiFetch(`/api/guru/questions/${editingQuestion.ID}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        await apiFetch(`/api/guru/quizzes/${quizId}/questions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
      setIsQuestionModalOpen(false);
      setEditingQuestion(null);
      await loadQuizQuestions(false);
    } catch (error) {
      setQuestionFormError(getErrorMessage(error, "Soal gagal disimpan."));
    } finally {
      setIsSavingQuestion(false);
    }
  }

  async function handleDeleteQuestion() {
    if (!deletingQuestion) return;
    setIsDeletingQuestion(true);
    setPageError("");
    try {
      await apiFetch(`/api/guru/questions/${deletingQuestion.ID}`, { method: "DELETE" });
      setDeletingQuestion(null);
      await loadQuizQuestions(false);
    } catch (error) {
      setPageError(getErrorMessage(error, "Soal gagal dihapus."));
    } finally {
      setIsDeletingQuestion(false);
    }
  }

  async function openAttemptReview(attempt: QuizAttempt) {
    setSelectedAttempt(attempt);
    setAnswers([]);
    setStudentName(attempt.Student?.Name ?? "");
    setAnswerError("");
    setGradeSummary(null);
    setEssayForms({});
    setIsLoadingAnswers(true);
    try {
      const result = await apiFetch<SubmissionAnswersResponse>(`/api/guru/submissions/${attempt.ID}/answers`);
      setAnswers(result.data);
      setStudentName(result.student_name || attempt.Student?.Name || "");
      setEssayForms(Object.fromEntries(
        result.data
          .filter((answer) => answer.Question?.QuestionType === "esai")
          .map((answer) => [answer.ID, defaultEssayForm(answer)]),
      ));
    } catch (error) {
      setAnswerError(getErrorMessage(error, "Jawaban siswa gagal dimuat."));
    } finally {
      setIsLoadingAnswers(false);
    }
  }

  async function refreshAttemptAnswers() {
    if (!selectedAttempt) return;
    setIsLoadingAnswers(true);
    try {
      const result = await apiFetch<SubmissionAnswersResponse>(`/api/guru/submissions/${selectedAttempt.ID}/answers`);
      setAnswers(result.data);
      setStudentName(result.student_name || selectedAttempt.Student?.Name || "");
      setEssayForms(Object.fromEntries(
        result.data
          .filter((answer) => answer.Question?.QuestionType === "esai")
          .map((answer) => [answer.ID, defaultEssayForm(answer)]),
      ));
    } catch (error) {
      setAnswerError(getErrorMessage(error, "Jawaban terbaru gagal dimuat."));
    } finally {
      setIsLoadingAnswers(false);
    }
  }

  async function handleEssayGrade(answer: AnswerItem) {
    if (!answer.Question) return;
    const form = essayForms[answer.ID] ?? defaultEssayForm(answer);
    const score = Number(form.score);
    if (form.score.trim() === "" || !Number.isFinite(score) || score < 0 || score > answer.Question.Score) {
      setAnswerError(`Nilai harus diisi dari 0 sampai ${answer.Question.Score}.`);
      return;
    }
    setAnswerError("");
    setSavingAnswerId(answer.ID);
    try {
      const result = await apiFetch<EssayGradeResult>(`/api/guru/answers/${answer.ID}/grade`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, teacher_comment: form.comment.trim() }),
      });
      setGradeSummary(result);
      await Promise.all([refreshAttemptAnswers(), loadAttempts(false)]);
    } catch (error) {
      setAnswerError(getErrorMessage(error, "Nilai esai gagal disimpan."));
    } finally {
      setSavingAnswerId(null);
    }
  }

  async function handlePublishToggle() {
    if (!quiz) return;
    setIsPublishing(true);
    setPageError("");
    try {
      await apiFetch(`/api/guru/quizzes/${quizId}/publish`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !quiz.ResultsPublished }),
      });
      setShowPublishConfirmation(false);
      await loadQuizQuestions(false);
    } catch (error) {
      setPageError(getErrorMessage(error, "Status publikasi hasil gagal diperbarui."));
    } finally {
      setIsPublishing(false);
    }
  }

  const isEssayQuiz = quiz?.ResultMode === "after_publish";
  const isPublished = Boolean(quiz?.ResultsPublished);

  return (
    <div className="mx-auto max-w-[1440px]">
      {isLoadingQuiz && !quiz ? (
        <>
          <div className="mb-7 space-y-3">
            <div className="motion-safe:animate-pulse h-3 w-28 rounded bg-brand/10" />
            <div className="motion-safe:animate-pulse h-9 w-80 max-w-full rounded bg-brand/10" />
          </div>
          <section className="rounded-lg border border-line bg-white p-5"><TableSkeleton columns={3} rows={6} /></section>
        </>
      ) : !quiz ? (
        <>
          <PageHeader description="Kelola soal dan hasil pengerjaan siswa." eyebrow="Area guru" title="Kuis & Ujian" />
          {pageError && <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{pageError}</p>}
          <div className="rounded-lg border border-line bg-white">
            <EmptyState description="Informasi kuis belum dapat ditampilkan." icon={<QuizIcon />} title="Gagal memuat kuis" />
          </div>
          <Link className="mt-5 inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-semibold text-brand-dark hover:bg-brand/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand" href="/guru/quizzes">
            Kembali ke Kuis & Ujian
          </Link>
        </>
      ) : (
        <>
          <PageHeader
            actions={(
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-white px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                href="/guru/quizzes"
              >
                Kembali ke Kuis & Ujian
              </Link>
            )}
            description={`${formatDate(quiz.StartTime)} – ${formatDate(quiz.EndTime)}`}
            eyebrow="Pengelolaan kuis"
            title={quiz.Title}
          />
          {pageError && <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{pageError}</p>}

          <section className="mb-6 flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand-dark">
              {quiz.QuizType === "ujian" ? "Ujian" : "Kuis"}
            </span>
            <span className="inline-flex rounded-full bg-surface px-3 py-1.5 text-xs font-medium text-ink">
              {resultModeText(quiz.ResultMode)}
            </span>
            {quiz.ResultsPublished && (
              <span className="inline-flex rounded-full bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand-dark">
                Hasil dipublikasikan
              </span>
            )}
            {quiz.IsTimed && (
              <span className="inline-flex rounded-full bg-surface px-3 py-1.5 text-xs font-medium text-ink">
                {quiz.DurationMin} menit
              </span>
            )}
          </section>

          <div className="mb-5 flex flex-col gap-3 border-b border-line sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2" role="tablist" aria-label="Konten kuis">
              <button
                aria-selected={activeTab === "questions"}
                className={`min-h-11 border-b-2 px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${activeTab === "questions" ? "border-brand text-brand-dark" : "border-transparent text-muted hover:text-ink"}`}
                id="quiz-questions-tab"
                onClick={() => setActiveTab("questions")}
                role="tab"
                type="button"
              >
                Soal
              </button>
              <button
                aria-selected={activeTab === "results"}
                className={`min-h-11 border-b-2 px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${activeTab === "results" ? "border-brand text-brand-dark" : "border-transparent text-muted hover:text-ink"}`}
                id="quiz-results-tab"
                onClick={() => {
                  setActiveTab("results");
                  void Promise.resolve().then(() => loadAttempts(true));
                }}
                role="tab"
                type="button"
              >
                Hasil Siswa
              </button>
            </div>
            {activeTab === "questions" ? (
              <button
                className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-lg bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:self-auto"
                onClick={openCreateQuestion}
                type="button"
              >
                <span aria-hidden="true" className="text-lg leading-none">+</span>
                Tambah Soal
              </button>
            ) : isEssayQuiz ? (
              <button
                className={`inline-flex min-h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${isPublished ? "border border-line bg-white text-ink hover:bg-surface" : "bg-brand text-white hover:bg-brand-dark"}`}
                onClick={() => setShowPublishConfirmation(true)}
                type="button"
              >
                {isPublished ? "Sembunyikan Hasil" : "Publikasikan Hasil"}
              </button>
            ) : null}
          </div>

          {activeTab === "questions" ? (
            <section aria-labelledby="quiz-questions-tab" role="tabpanel">
              <div className="mb-4 flex items-center justify-between rounded-lg border border-line bg-white px-5 py-4">
                <p className="text-sm text-muted">{questions.length} soal</p>
                <p className="text-sm font-semibold text-ink">Total skor: {totalScore}</p>
              </div>
              {isLoadingQuiz ? (
                <div className="rounded-lg border border-line bg-white p-5"><TableSkeleton columns={3} rows={6} /></div>
              ) : questions.length === 0 ? (
                <div className="rounded-lg border border-line bg-white">
                  <EmptyState description="Tambahkan soal untuk melengkapi kuis atau ujian ini." icon={<QuizIcon />} title="Belum ada soal" />
                </div>
              ) : (
                <ol className="space-y-4">
                  {questions.map((question, index) => (
                    <li key={question.ID} className="rounded-xl border border-line bg-white p-5 shadow-sm sm:p-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand/10 text-sm font-semibold text-brand-dark">{index + 1}</span>
                            <span className="inline-flex rounded-full bg-surface px-2.5 py-1 text-[11px] font-semibold text-muted">
                              {question.QuestionType === "esai" ? "Esai" : "Pilihan Ganda"}
                            </span>
                            <span className="text-xs font-medium text-muted">{question.Score} poin</span>
                          </div>
                          <p className="whitespace-pre-wrap text-sm font-medium leading-6 text-ink">{question.QuestionText}</p>
                          {question.QuestionType !== "esai" && (
                            <div className="mt-4 grid gap-2 sm:grid-cols-2">
                              {optionKeys.map((option) => {
                                const isCorrect = question.CorrectOption === option;
                                return (
                                  <div
                                    className={`rounded-lg border px-3 py-2.5 ${isCorrect ? "border-brand/40 bg-brand/10 text-brand-dark" : "border-line text-ink"}`}
                                    key={option}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <OptionText option={option} text={optionForKey(question, option)} />
                                      {isCorrect && <span className="shrink-0 text-[11px] font-semibold">Kunci jawaban</span>}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-2 sm:pl-3">
                          <button
                            aria-label={`Edit soal ${index + 1}`}
                            className="grid size-9 place-items-center rounded-lg border border-line text-brand-dark transition-colors hover:border-brand/40 hover:bg-brand/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                            onClick={() => openEditQuestion(question)}
                            type="button"
                          >
                            <EditIcon />
                          </button>
                          <button
                            aria-label={`Hapus soal ${index + 1}`}
                            className="grid size-9 place-items-center rounded-lg border border-red-200 text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                            onClick={() => setDeletingQuestion(question)}
                            type="button"
                          >
                            <svg aria-hidden="true" className="size-[18px]" fill="none" viewBox="0 0 24 24">
                              <path d="M4 7h16M10 11v6M14 11v6M5.5 7l1 14h11l1-14M9 7V4h6v3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          ) : (
            <section aria-labelledby="quiz-results-tab" role="tabpanel" className="overflow-hidden rounded-lg border border-line bg-white">
              {isLoadingAttempts ? (
                <div className="p-5"><TableSkeleton columns={6} rows={8} /></div>
              ) : attempts.length === 0 ? (
                <EmptyState description="Belum ada siswa yang mengerjakan kuis atau ujian ini." icon={<QuizIcon />} title="Belum ada hasil siswa" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] border-collapse text-left">
                    <thead className="bg-surface/80">
                      <tr className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                        <th className="px-5 py-3.5">Nama</th>
                        <th className="px-5 py-3.5">NIS</th>
                        <th className="px-5 py-3.5">Status</th>
                        <th className="px-5 py-3.5">Waktu Kumpul</th>
                        <th className="px-5 py-3.5">Skor</th>
                        <th className="px-5 py-3.5 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {attempts.map((attempt) => {
                        const status = attempt.Status === "sudah_dinilai"
                          ? "Sudah dinilai"
                          : attempt.Status === "selesai"
                            ? "Menunggu penilaian esai"
                            : "Sedang mengerjakan";
                        const statusClass = attempt.Status === "sudah_dinilai"
                          ? "bg-brand/10 text-brand-dark"
                          : attempt.Status === "selesai"
                            ? "bg-surface text-ink"
                            : "bg-surface text-muted";
                        return (
                          <tr className="transition-colors hover:bg-surface/50" key={attempt.ID}>
                            <td className="px-5 py-4 text-sm font-semibold text-ink">{attempt.Student?.Name ?? "-"}</td>
                            <td className="px-5 py-4 text-sm text-ink">{attempt.Student?.NIS ?? attempt.Student?.NISN_NIP ?? "-"}</td>
                            <td className="px-5 py-4">
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass}`}>{status}</span>
                            </td>
                            <td className="whitespace-nowrap px-5 py-4 text-sm text-ink">{formatDate(attempt.SubmittedAt ?? null)}</td>
                            <td className="px-5 py-4 text-sm font-semibold text-ink">{attempt.TotalScore}</td>
                            <td className="px-5 py-4 text-right">
                              <button
                                className="inline-flex min-h-9 items-center justify-center rounded-lg bg-brand px-3 text-xs font-semibold text-white transition-colors hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                                onClick={() => void openAttemptReview(attempt)}
                                type="button"
                              >
                                Periksa
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </>
      )}

      {isQuestionModalOpen && (
        <Modal
          title={editingQuestion ? "Edit Soal" : "Tambah Soal"}
          onClose={() => {
            if (!isSavingQuestion) setIsQuestionModalOpen(false);
          }}
          maxWidth="max-w-3xl"
        >
          <form className="mt-6 space-y-4" onSubmit={(event) => void handleQuestionSubmit(event)}>
            {questionFormError && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{questionFormError}</p>}
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">Jenis Soal</span>
              <select
                className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
                disabled={isSavingQuestion}
                onChange={(event) => updateQuestionType(event.target.value as QuestionType)}
                value={questionForm.questionType}
              >
                <option value="pilihan_ganda">Pilihan Ganda</option>
                <option value="esai">Esai</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">Pertanyaan <span className="text-red-600">*</span></span>
              <textarea
                className="min-h-28 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/75 focus:border-brand focus:ring-2 focus:ring-brand/15"
                disabled={isSavingQuestion}
                onChange={(event) => setQuestionForm((current) => ({ ...current, questionText: event.target.value }))}
                required
                value={questionForm.questionText}
              />
            </label>
            {questionForm.questionType === "pilihan_ganda" && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  {optionKeys.map((option) => {
                    const field = `option${option}` as "optionA" | "optionB" | "optionC" | "optionD";
                    return (
                      <label className="block" key={option}>
                        <span className="mb-1.5 block text-sm font-medium text-ink">
                          Opsi {option}{(option === "A" || option === "B") && <span className="text-red-600"> *</span>}
                        </span>
                        <input
                          className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none transition placeholder:text-muted/75 focus:border-brand focus:ring-2 focus:ring-brand/15"
                          disabled={isSavingQuestion}
                          onChange={(event) => setQuestionForm((current) => ({ ...current, [field]: event.target.value }))}
                          required={option === "A" || option === "B"}
                          value={questionForm[field]}
                        />
                      </label>
                    );
                  })}
                </div>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-ink">Kunci Jawaban <span className="text-red-600">*</span></span>
                  <select
                    className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
                    disabled={isSavingQuestion}
                    onChange={(event) => setQuestionForm((current) => ({ ...current, correctOption: event.target.value as OptionKey | "" }))}
                    required
                    value={questionForm.correctOption}
                  >
                    <option value="">Pilih kunci jawaban</option>
                    {optionKeys.map((option) => {
                      const field = `option${option}` as "optionA" | "optionB" | "optionC" | "optionD";
                      return questionForm[field].trim()
                        ? <option key={option} value={option}>Opsi {option}</option>
                        : null;
                    })}
                  </select>
                </label>
              </>
            )}
            <label className="block max-w-xs">
              <span className="mb-1.5 block text-sm font-medium text-ink">Skor <span className="text-red-600">*</span></span>
              <input
                className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
                disabled={isSavingQuestion}
                min="0.01"
                onChange={(event) => setQuestionForm((current) => ({ ...current, score: event.target.value }))}
                required
                step="any"
                type="number"
                value={questionForm.score}
              />
            </label>
            <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:justify-end">
              <button
                className="min-h-11 rounded-lg border border-line px-5 text-sm font-semibold text-ink transition hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSavingQuestion}
                onClick={() => setIsQuestionModalOpen(false)}
                type="button"
              >
                Batal
              </button>
              <button
                className="min-h-11 rounded-lg bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSavingQuestion}
                type="submit"
              >
                {isSavingQuestion ? "Menyimpan..." : "Simpan Soal"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {selectedAttempt && (
        <Modal
          title={`Hasil Siswa${studentName ? ` — ${studentName}` : ""}`}
          onClose={() => {
            if (savingAnswerId === null) setSelectedAttempt(null);
          }}
          maxWidth="max-w-5xl"
        >
          <div className="mt-5 max-h-[75vh] space-y-4 overflow-y-auto pr-1">
            {answerError && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{answerError}</p>}
            {gradeSummary && (
              <div className="rounded-lg border border-brand/20 bg-brand/10 px-4 py-3 text-sm text-ink" role="status">
                Total skor terbaru: <strong>{gradeSummary.total_score}</strong>
                <span className="mx-2 text-brand/60">·</span>
                Sisa esai yang belum dinilai: <strong>{gradeSummary.pending_essay}</strong>
              </div>
            )}
            {isLoadingAnswers ? (
              <div className="rounded-lg border border-line bg-white p-5"><TableSkeleton columns={2} rows={6} /></div>
            ) : answers.length === 0 ? (
              <EmptyState description="Belum ada jawaban untuk pengerjaan ini." icon={<QuizIcon />} title="Jawaban tidak tersedia" />
            ) : (
              answers.map((answer, index) => {
                const question = answer.Question;
                if (!question) {
                  return (
                    <article key={answer.ID} className="rounded-lg border border-line bg-white p-4">
                      <p className="text-sm text-muted">Informasi soal untuk jawaban ini tidak tersedia.</p>
                    </article>
                  );
                }

                if (question.QuestionType !== "esai") {
                  return (
                    <article key={answer.ID} className="rounded-xl border border-line bg-white p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-ink">Soal {index + 1}: {question.QuestionText}</p>
                        <span className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand-dark">
                          Skor otomatis: {answer.Score} / {question.Score}
                        </span>
                      </div>
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {optionKeys.map((option) => {
                          const isSelected = answer.SelectedOption === option;
                          const isCorrect = question.CorrectOption === option;
                          const optionClass = isCorrect
                            ? "border-brand/40 bg-brand/10 text-brand-dark"
                            : isSelected
                              ? "border-ink/30 bg-surface text-ink"
                              : "border-line text-muted";
                          const markers = [
                            isSelected ? "Jawaban siswa" : "",
                            isCorrect ? "Kunci jawaban" : "",
                          ].filter(Boolean);
                          return (
                            <div className={`rounded-lg border px-3 py-2.5 ${optionClass}`} key={option}>
                              <div className="flex items-start justify-between gap-2">
                                <OptionText option={option} text={optionForKey(question, option)} />
                                {markers.length > 0 && <span className="shrink-0 text-[11px] font-semibold">{markers.join(" · ")}</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </article>
                  );
                }

                const form = essayForms[answer.ID] ?? defaultEssayForm(answer);
                const isSaving = savingAnswerId === answer.ID;
                return (
                  <article key={answer.ID} className="rounded-xl border border-line bg-white p-5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold leading-6 text-ink">Soal {index + 1}: {question.QuestionText}</h3>
                      <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-muted">Esai · {question.Score} poin</span>
                    </div>
                    <div className="mt-4 rounded-lg bg-surface px-4 py-3">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Jawaban siswa</p>
                      <p className="whitespace-pre-wrap text-sm leading-6 text-ink">{answer.EssayAnswer || "Tidak ada jawaban."}</p>
                    </div>
                    <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,180px)_1fr]">
                      <label className="block">
                        <span className="mb-1.5 block text-sm font-medium text-ink">Nilai (0–{question.Score})</span>
                        <input
                          className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
                          disabled={isSaving}
                          max={question.Score}
                          min="0"
                          onChange={(event) => setEssayForms((current) => ({
                            ...current,
                            [answer.ID]: { ...form, score: event.target.value },
                          }))}
                          step="any"
                          type="number"
                          value={form.score}
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block text-sm font-medium text-ink">Komentar</span>
                        <textarea
                          className="min-h-11 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/75 focus:border-brand focus:ring-2 focus:ring-brand/15"
                          disabled={isSaving}
                          onChange={(event) => setEssayForms((current) => ({
                            ...current,
                            [answer.ID]: { ...form, comment: event.target.value },
                          }))}
                          value={form.comment}
                        />
                      </label>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button
                        className="inline-flex min-h-10 items-center justify-center rounded-lg bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={savingAnswerId !== null}
                        onClick={() => void handleEssayGrade(answer)}
                        type="button"
                      >
                        {isSaving ? "Menyimpan..." : "Simpan Nilai"}
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </Modal>
      )}

      <ConfirmDialog
        isOpen={deletingQuestion !== null}
        title="Hapus Soal"
        message="Apakah Anda yakin ingin menghapus soal ini? Tindakan ini tidak dapat dibatalkan."
        onCancel={() => setDeletingQuestion(null)}
        onConfirm={() => void handleDeleteQuestion()}
        isLoading={isDeletingQuestion}
      />

      {showPublishConfirmation && quiz && (
        <Modal
          title={isPublished ? "Sembunyikan Hasil" : "Publikasikan Hasil"}
          onClose={() => {
            if (!isPublishing) setShowPublishConfirmation(false);
          }}
          maxWidth="max-w-md"
        >
          <div className="mt-5">
            <p className="text-sm leading-6 text-muted">
              {isPublished
                ? "Hasil kuis ini tidak lagi terlihat oleh siswa sampai dipublikasikan kembali."
                : "Hasil kuis akan terlihat oleh siswa setelah dipublikasikan."}
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
                {isPublishing ? "Memproses..." : isPublished ? "Sembunyikan Hasil" : "Publikasikan Hasil"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
