export interface User {
  ID: string;
  NISN_NIP?: string;
  NIS?: string;
  Name: string;
  Email: string;
  RoleID: number;
  Role?: Role;
  ClassID?: number | null;
  Class?: Class;
  CreatedAt?: string;
}

export interface Role {
  ID: number;
  RoleName: string;
}

export interface Major {
  ID: number;
  MajorName: string;
  CreatedAt?: string;
}

export interface Class {
  ID: number;
  ClassName: string;
  HomeroomTeacherID?: string | null;
  HomeroomTeacher?: User;
  MajorID?: number | null;
  Major?: Major;
  CreatedAt?: string;
}

export interface Subject {
  ID: number;
  SubjectName: string;
  TeacherID: string;
  Teacher?: User;
}

export interface Schedule {
  ID: number;
  ClassID: number;
  Class?: Class;
  SubjectID: number;
  Subject?: Subject;
  DayOfWeek: string;
  StartTime: string;
  EndTime: string;
}

export interface Material {
  ID: number;
  SubjectID: number;
  Title: string;
  ContentURL?: string;
  UploadedBy?: string;
}

export interface Assignment {
  ID: number;
  SubjectID: number;
  Title: string;
  Deadline: string;
  MaxScore: number;
}

export interface Submission {
  ID: number;
  AssignmentID: number;
  StudentID: string;
  FileURL: string;
  Score: number;
  Feedback?: string;
}

export interface Quiz {
  ID: number;
  SubjectID: number;
  Subject?: Subject;
  TeacherID: string;
  Teacher?: User;
  Title: string;
  QuizType: string;
  IsTimed: boolean;
  DurationMin: number;
  StartTime: string;
  EndTime: string;
  CreatedAt?: string;
}

export interface Question {
  ID: number;
  QuizID: number;
  QuestionText: string;
  QuestionType: string;
  OptionA?: string;
  OptionB?: string;
  OptionC?: string;
  OptionD?: string;
  CorrectOption?: string;
  Score: number;
}

export interface QuizSubmission {
  ID: number;
  QuizID: number;
  Quiz?: Quiz;
  StudentID: string;
  Student?: User;
  StartedAt: string;
  SubmittedAt?: string | null;
  TotalScore: number;
  Status: string;
}

export interface Answer {
  ID: number;
  QuizSubmissionID: number;
  QuestionID: number;
  Question?: Question;
  SelectedOption?: string;
  EssayAnswer?: string;
  Score: number;
  TeacherComment?: string;
}

export interface Grade {
  ID: number;
  StudentID: string;
  Student?: User;
  SubjectID: number;
  Subject?: Subject;
  AssignmentAvg: number;
  QuizAvg: number;
  FinalScore: number;
  GeneratedAt?: string;
}