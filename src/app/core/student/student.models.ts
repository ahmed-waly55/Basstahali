/** Private API response models. A missing value stays unknown rather than becoming zero. */
export type StudentRecord = Record<string, unknown>;

export interface StudentPage<T> {
  items: T[];
  pageNumber: number | null;
  pageSize: number | null;
  totalCount: number | null;
  totalPages: number | null;
  hasPreviousPage: boolean | null;
  hasNextPage: boolean | null;
}

export interface StudentProfile {
  studentId: string;
  userName: string | null;
  fullName: string | null;
  email: string | null;
  phoneNumber: string | null;
  parentName: string | null;
  parentPhoneNumber: string | null;
  curriculumName: string | null;
  educationStageName: string | null;
  gradeLevelName: string | null;
  sessionCreditBalance: number | null;
  sessions: {
    totalSessions: number | null;
    usedSessions: number | null;
    remainingSessions: number | null;
  };
  subscriptionMode: string | null;
  regularSessionCreditBalance: number | null;
  courseSessionCreditBalance: number | null;
  compensatorySessionCreditBalance: number | null;
  compensatoryCreditsAdded: number | null;
  subscriptionStartedAt: string | null;
  compensatoryCredits: StudentCompensatoryCredit[];
  expirationDate: string | null;
  status: string | null;
  raw: StudentRecord;
}

export interface StudentCompensatoryCredit {
  id: string | null;
  quantity: number | null;
  remaining: number | null;
  reason: string | null;
  addedAt: string | null;
  expiresAt: string | null;
  status: string | null;
}

export type StudentStatKey =
  | 'totalSessions'
  | 'usedSessions'
  | 'remainingSessions'
  | 'courseCount'
  | 'upcomingSessions'
  | 'attendanceRate'
  | 'completedAssignments'
  | 'pendingAssignments';
export interface StudentStat {
  key: StudentStatKey;
  value: number | null;
}
export interface StudentDashboard {
  stats: StudentStat[];
  raw: StudentRecord;
}

export interface StudentSession {
  id: string | null;
  studentId: string | null;
  teacherName: string | null;
  subjectName: string | null;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  timeRange: string | null;
  classLink: string | null;
  status: string | null;
  occurrenceAt: string | null;
  courseName: string | null;
  paymentStatus: string | null;
  raw: StudentRecord;
}

export interface StudentCourse {
  id: string | null;
  name: string | null;
  nameAr: string | null;
  nameEn: string | null;
  teacherName: string | null;
  subjectName: string | null;
  subjectId: string | null;
  status: string | null;
  progress: number | null;
  remainingSessions: number | null;
  classLink: string | null;
  raw: StudentRecord;
}

export interface StudentConversation {
  id: string | null;
  title: string | null;
  subject: string | null;
  lastMessage: string | null;
  updatedAt: string | null;
  unreadCount: number | null;
  status: string | null;
  raw: StudentRecord;
}
export interface StudentMessage {
  id: string | null;
  body: string | null;
  senderName: string | null;
  senderId: string | null;
  createdAt: string | null;
  isMine: boolean | null;
  raw: StudentRecord;
}
export interface StudentExamOption {
  id: string | null;
  text: string | null;
  value: string | null;
}
export interface StudentExamQuestion {
  id: string | null;
  text: string | null;
  type: string | null;
  options: StudentExamOption[];
}
export interface StudentExam {
  id: string | null;
  title: string | null;
  subjectName: string | null;
  description: string | null;
  status: string | null;
  dueDate: string | null;
  score: number | null;
  maxScore: number | null;
  isSubmitted: boolean | null;
  submittedAt: string | null;
  questions: StudentExamQuestion[];
  raw: StudentRecord;
}
export interface StudentExamAnswer {
  questionId: string;
  answer: string | null;
}
export interface StudentSubject {
  id: string;
  name: string | null;
  nameAr: string | null;
  nameEn: string | null;
}

export interface StudentAssignment {
  id: string | null;
  title: string | null;
  description: string | null;
  subjectName: string | null;
  dueDate: string | null;
  status: string | null;
  grade: number | null;
  maxGrade: number | null;
  textAnswer: string | null;
  fileUrl: string | null;
  raw: StudentRecord;
}
export interface StudentAssignmentSubmission {
  textAnswer: string;
  submit: boolean;
  file?: File;
}
export interface StudentExcuse {
  id: string | null;
  sessionId: string | null;
  reason: string | null;
  status: string | null;
  proposedAlternativeAt: string | null;
  raw: StudentRecord;
}
export interface StudentRating {
  id: string | null;
  sessionId: string | null;
  score: number | null;
  comment: string | null;
  createdAt: string | null;
  raw: StudentRecord;
}

/** API shapes without an OpenAPI schema are only read through explicit known aliases. */
export function studentRecord(value: unknown): StudentRecord | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as StudentRecord)
    : null;
}
export function studentString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}
export function studentNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string' || !/^-?\d+(?:\.\d+)?$/.test(value.trim())) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
export function studentSafeUrl(value: unknown): string | null {
  const text = studentString(value);
  if (!text) return null;
  try {
    const url = new URL(text);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
