import type { Class, Subject, User } from "@/types";

/* ===== Gaya PascalCase (struct Go langsung) ===== */

export interface TeachingItem {
  ID: number;
  TeacherID: string;
  SubjectID: number;
  Subject?: Subject;
  ClassID: number;
  Class?: Class;
}

export interface MaterialItem {
  ID: number;
  SubjectID: number;
  ClassID?: number | null;
  Title: string;
  Description?: string;
  ContentURL?: string;
  FileName?: string;
  UploadedBy?: string;
  CreatedAt?: string;
}

export interface AssignmentItem {
  ID: number;
  SubjectID: number;
  ClassID?: number | null;
  TeacherID?: string;
  Title: string;
  Description?: string;
  Type?: string; // "tugas" | "projek"
  Deadline: string;
  MaxScore: number;
  GradesPublished?: boolean;
  CreatedAt?: string;
  AttachmentURL?: string;
  AttachmentName?: string;
}

export interface QuizItem {
  ID: number;
  SubjectID: number;
  Subject?: Subject;
  ClassID?: number | null;
  TeacherID: string;
  Title: string;
  QuizType: string; // "kuis" | "ujian"
  IsTimed: boolean;
  DurationMin: number;
  StartTime: string;
  EndTime: string;
  ResultMode: string; // "hidden" | "after_submit" | "after_publish"
  ResultsPublished: boolean;
  ShowAnswerKey: boolean;
  CreatedAt?: string;
  Instructions?: string;
  AttachmentURL?: string;
  AttachmentName?: string;
  QuestionCount?: number;
  MaxScore?: number;
}

export interface QuestionItem {
  ID: number;
  QuizID: number;
  QuestionText: string;
  QuestionType: string; // "pilihan_ganda" | "esai"
  OptionA?: string;
  OptionB?: string;
  OptionC?: string;
  OptionD?: string;
  CorrectOption?: string;
  Score: number;
}

export interface QuizAttempt {
  ID: number;
  QuizID: number;
  StudentID: string;
  Student?: User;
  StartedAt: string;
  SubmittedAt?: string | null;
  TotalScore: number;
  Status: string; // "mengerjakan" | "selesai" | "sudah_dinilai"
}

export interface AnswerItem {
  ID: number;
  QuizSubmissionID: number;
  QuestionID: number;
  Question?: QuestionItem;
  SelectedOption?: string;
  EssayAnswer?: string;
  Score: number;
  TeacherComment?: string;
  Graded: boolean;
}

/* ===== Gaya snake_case (view struct Go) ===== */

export interface SubmissionRow {
  student_id: string;
  student_name: string;
  student_nis: string;
  submitted: boolean;
  submission_id: number | null;
  file_url: string;
  file_name: string;
  note: string;
  graded: boolean;
  score: number | null;
  feedback: string;
  submitted_at: string | null;
  is_late: boolean;
}

export interface SubmissionSummary {
  total_students: number;
  submitted: number;
  graded: number;
}

export interface SubmissionListResponse {
  data: SubmissionRow[];
  assignment: AssignmentItem;
  summary: SubmissionSummary;
}

export interface GradeRow {
  id: number;
  student_id: string;
  student_name: string;
  student_nis: string;
  subject_id: number;
  subject_name: string;
  class_id: number | null;
  class_name: string;
  assignment_avg: number;
  quiz_avg: number;
  final_score: number;
  semester: string;
  academic_year: string;
  generated_at: string;
}

export interface GenerateGradesResponse {
  message: string;
  count: number;
  data: GradeRow[];
}

export interface EssayGradeResult {
  message: string;
  total_score: number;
  pending_essay: number;
  status: string;
}

export interface MySubmission {
  id: number;
  assignment_id: number;
  file_url: string;
  file_name: string;
  note: string;
  submitted_at: string;
  is_late: boolean;
  status: "dikumpulkan" | "dinilai";
  score_visible: boolean;
  score: number | null;
  max_score: number;
  feedback: string;
}

export interface StudentQuiz {
  id: number;
  title: string;
  quiz_type: string;
  subject_id: number;
  subject_name: string;
  is_timed: boolean;
  duration_min: number;
  start_time: string;
  end_time: string;
  phase: "akan_datang" | "dibuka" | "ditutup";
  submission_id: number | null;
  submission_status: "belum" | "mengerjakan" | "selesai";
  result_visible: boolean;
  instructions: string;
  attachment_url: string;
  attachment_name: string;
}

export interface StudentQuestion {
  id: number;
  question_text: string;
  question_type: "pilihan_ganda" | "esai";
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  score: number;
}

export interface StudentQuizSession {
  data: StudentQuestion[];
  submission_id: number;
  started_at: string;
  quiz: {
    id: number;
    title: string;
    is_timed: boolean;
    duration_min: number;
    end_time: string;
    instructions: string;
    attachment_url: string;
    attachment_name: string;
  };
}

export interface StartQuizResponse {
  message: string;
  data: { submission_id: number; started_at: string; status: string };
}

export interface SubmitQuizResponse {
  message: string;
  result_visible: boolean;
  total_score?: number;
  is_final?: boolean;
}

export interface QuizResultData {
  submission_id: number;
  quiz_id: number;
  quiz_title: string;
  status: string;
  submitted_at: string | null;
  result_visible: boolean;
  answer_key_visible: boolean;
  total_score?: number;
  max_score?: number;
  is_final?: boolean;
}

export interface ReviewItem {
  question_id: number;
  question_text: string;
  question_type: "pilihan_ganda" | "esai";
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  max_score: number;
  selected_option: string;
  essay_answer: string;
  score: number;
  teacher_comment: string;
  correct_option?: string;
}

export interface QuizReviewResponse {
  data: ReviewItem[];
  answer_key_visible: boolean;
  total_score: number;
  max_score: number;
  is_final: boolean;
}