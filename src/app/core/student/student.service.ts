import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, defer, map, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SKIP_ERROR_NOTIFICATION } from '../interceptors/loading-interceptor';
import {
  StudentAssignment,
  StudentAssignmentSubmission,
  StudentConversation,
  StudentCourse,
  StudentDashboard,
  StudentExam,
  StudentExamAnswer,
  StudentExamQuestion,
  StudentExcuse,
  StudentMessage,
  StudentPage,
  StudentProfile,
  StudentRating,
  StudentRecord,
  StudentSession,
  StudentStatKey,
  StudentSubject,
  studentNumber,
  studentRecord,
  studentSafeUrl,
  studentString,
} from './student.models';

export class StudentDataError extends Error {
  constructor(message = 'The student API returned an unsupported response.') {
    super(message);
    this.name = 'StudentDataError';
  }
}

/** Reject failed API envelopes even when their HTTP status is 200. */
export function unwrapStudentResponse(value: unknown, allowEmpty = false): unknown {
  const record = studentRecord(value);
  if (record && 'success' in record) {
    if (record['success'] !== true) throw new StudentDataError('The student API request failed.');
    if (!('data' in record) && !allowEmpty) throw new StudentDataError();
    value = record['data'];
  } else if (
    record &&
    'data' in record &&
    (Object.keys(record).length === 1 || 'message' in record || 'traceId' in record)
  ) {
    value = record['data'];
  }
  if ((value === null || value === undefined) && !allowEmpty) throw new StudentDataError();
  return value ?? null;
}

function field(record: StudentRecord, ...keys: string[]): unknown {
  for (const key of keys) if (record[key] !== null && record[key] !== undefined) return record[key];
  return null;
}
function text(record: StudentRecord, ...keys: string[]): string | null {
  return studentString(field(record, ...keys));
}
function number(record: StudentRecord, ...keys: string[]): number | null {
  return studentNumber(field(record, ...keys));
}
function bool(record: StudentRecord, key: string): boolean | null {
  return typeof record[key] === 'boolean' ? (record[key] as boolean) : null;
}
function requiredRecord(value: unknown): StudentRecord {
  const record = studentRecord(value);
  if (!record) throw new StudentDataError();
  return record;
}
function nestedName(record: StudentRecord, key: string): string | null {
  const nested = studentRecord(record[key]);
  return nested ? text(nested, 'name', 'fullName', 'nameAr', 'nameEn', 'title') : null;
}
function idSegment(value: string): string {
  const id = studentString(value);
  if (!id) throw new StudentDataError('A record identifier is required.');
  return encodeURIComponent(id);
}
function pageParams(pageNumber: number, pageSize: number): HttpParams {
  if (
    !Number.isInteger(pageNumber) ||
    pageNumber < 1 ||
    !Number.isInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > 100
  ) {
    throw new StudentDataError('Invalid pagination.');
  }
  return new HttpParams().set('PageNumber', pageNumber).set('PageSize', pageSize);
}

export function adaptStudentPage<T>(
  value: unknown,
  adapt: (item: StudentRecord) => T,
  aliases: string[] = [],
): StudentPage<T> {
  const record = studentRecord(value);
  let items = Array.isArray(value)
    ? value
    : record
      ? field(record, 'items', 'results', 'records', ...aliases)
      : null;
  if (record && items === null && record['items'] === null && number(record, 'totalCount') === 0)
    items = [];
  if (!Array.isArray(items)) throw new StudentDataError();
  return {
    items: items.map((item) => adapt(requiredRecord(item))),
    pageNumber: record ? number(record, 'pageNumber', 'page') : null,
    pageSize: record ? number(record, 'pageSize') : null,
    totalCount: record ? number(record, 'totalCount', 'total') : null,
    totalPages: record ? number(record, 'totalPages') : null,
    hasPreviousPage: record ? bool(record, 'hasPreviousPage') : null,
    hasNextPage: record ? bool(record, 'hasNextPage') : null,
  };
}

export function adaptStudentProfile(value: unknown): StudentProfile {
  const raw = requiredRecord(value);
  const record = studentRecord(raw['student']) ?? studentRecord(raw['profile']) ?? raw;
  const user = studentRecord(raw['user']);
  const sessions = studentRecord(record['sessions']) ?? studentRecord(raw['sessions']);
  const credits = field(record, 'compensatoryCredits');
  // An authentication user ID is not the student entity ID. Only this own-profile endpoint supplies it.
  const studentId = text(raw, 'studentId') ?? text(record, 'studentId', 'id');
  if (!studentId)
    throw new StudentDataError('The own student profile does not contain a student identifier.');
  return {
    studentId,
    userName: text(record, 'userName') ?? (user ? text(user, 'userName') : null),
    fullName: text(record, 'fullName', 'name') ?? (user ? text(user, 'fullName') : null),
    email: text(record, 'email') ?? (user ? text(user, 'email') : null),
    phoneNumber: text(record, 'phoneNumber'),
    parentName: text(record, 'parentName'),
    parentPhoneNumber: text(record, 'parentPhoneNumber'),
    curriculumName: text(record, 'curriculumName') ?? nestedName(record, 'curriculum'),
    educationStageName:
      text(record, 'educationStageName', 'stageName') ?? nestedName(record, 'educationStage'),
    gradeLevelName: text(record, 'gradeLevelName', 'gradeName') ?? nestedName(record, 'gradeLevel'),
    sessionCreditBalance: number(record, 'sessionCreditBalance'),
    sessions: {
      totalSessions: sessions ? number(sessions, 'totalSessions') : null,
      usedSessions: sessions ? number(sessions, 'usedSessions') : null,
      remainingSessions: sessions ? number(sessions, 'remainingSessions') : null,
    },
    subscriptionMode: text(record, 'subscriptionMode'),
    regularSessionCreditBalance: number(record, 'regularSessionCreditBalance'),
    courseSessionCreditBalance: number(record, 'courseSessionCreditBalance'),
    compensatorySessionCreditBalance: number(record, 'compensatorySessionCreditBalance'),
    compensatoryCreditsAdded: number(record, 'compensatoryCreditsAdded'),
    subscriptionStartedAt: text(record, 'subscriptionStartedAt'),
    compensatoryCredits: Array.isArray(credits)
      ? credits.flatMap((value) => {
          const credit = studentRecord(value);
          return credit
            ? [
                {
                  id: text(credit, 'id'),
                  quantity: number(credit, 'quantity'),
                  remaining: number(credit, 'remaining'),
                  reason: text(credit, 'reason'),
                  addedAt: text(credit, 'addedAt'),
                  expiresAt: text(credit, 'expiresAt'),
                  status: text(credit, 'status'),
                },
              ]
            : [];
        })
      : [],
    expirationDate: text(record, 'expirationDate'),
    status: text(record, 'status'),
    raw,
  };
}

function adaptDashboard(value: unknown): StudentDashboard {
  const raw = requiredRecord(value);
  const stats =
    studentRecord(raw['stats']) ??
    studentRecord(raw['statistics']) ??
    studentRecord(raw['summary']) ??
    raw;
  const sessions = studentRecord(stats['sessions']);
  const aliases: Record<StudentStatKey, string[]> = {
    totalSessions: ['totalSessions'],
    usedSessions: ['usedSessions', 'completedSessions'],
    remainingSessions: ['remainingSessions', 'sessionCreditBalance'],
    courseCount: ['courseCount', 'coursesCount', 'totalCourses', 'enrolledCoursesCount'],
    upcomingSessions: ['upcomingSessionsCount', 'upcomingSessions', 'scheduledSessionsCount'],
    attendanceRate: ['attendanceRate', 'attendancePercentage'],
    completedAssignments: ['completedAssignmentsCount', 'completedAssignments'],
    pendingAssignments: ['pendingAssignmentsCount', 'pendingAssignments'],
  };
  return {
    stats: (Object.entries(aliases) as [StudentStatKey, string[]][]).map(([key, keys]) => ({
      key,
      value: number(stats, ...keys) ?? (sessions ? number(sessions, ...keys) : null),
    })),
    raw,
  };
}

function adaptSession(raw: StudentRecord): StudentSession {
  return {
    id: text(raw, 'id', 'sessionId'),
    studentId: text(raw, 'studentId'),
    teacherName: text(raw, 'teacherName') ?? nestedName(raw, 'teacher'),
    subjectName: text(raw, 'subjectName') ?? nestedName(raw, 'subject'),
    date: text(raw, 'date'),
    startTime: text(raw, 'startTime'),
    endTime: text(raw, 'endTime'),
    timeRange: text(raw, 'timeRange'),
    classLink: studentSafeUrl(field(raw, 'classLink', 'meetingLink')),
    status: text(raw, 'status'),
    occurrenceAt: text(raw, 'occurrenceAt'),
    courseName: text(raw, 'courseName') ?? nestedName(raw, 'course'),
    paymentStatus: text(raw, 'paymentStatus'),
    raw,
  };
}
function adaptCourse(raw: StudentRecord): StudentCourse {
  const subject = studentRecord(raw['subject']);
  return {
    id: text(raw, 'id', 'courseId'),
    name: text(raw, 'name', 'courseName', 'title', 'nameAr', 'nameEn'),
    nameAr: text(raw, 'nameAr'),
    nameEn: text(raw, 'nameEn'),
    teacherName: text(raw, 'teacherName') ?? nestedName(raw, 'teacher'),
    subjectName: text(raw, 'subjectName') ?? nestedName(raw, 'subject'),
    subjectId: text(raw, 'subjectId') ?? (subject ? text(subject, 'id') : null),
    status: text(raw, 'status'),
    progress: number(raw, 'progress', 'progressPercentage'),
    remainingSessions: number(raw, 'remainingSessions'),
    classLink: studentSafeUrl(field(raw, 'classLink', 'meetingLink')),
    raw,
  };
}
function adaptConversation(raw: StudentRecord): StudentConversation {
  const last = studentRecord(raw['lastMessage']);
  return {
    id: text(raw, 'id', 'conversationId'),
    title: text(raw, 'title', 'subject', 'participantName', 'teacherName'),
    subject: text(raw, 'subject'),
    lastMessage: last ? text(last, 'body', 'text') : text(raw, 'lastMessage', 'lastMessageBody'),
    updatedAt: text(raw, 'updatedAt', 'lastMessageAt'),
    unreadCount: number(raw, 'unreadCount', 'unreadMessagesCount'),
    status: text(raw, 'status'),
    raw,
  };
}
function adaptMessage(raw: StudentRecord): StudentMessage {
  return {
    id: text(raw, 'id', 'messageId'),
    body: text(raw, 'body', 'text', 'message'),
    senderName: text(raw, 'senderName') ?? nestedName(raw, 'sender'),
    senderId: text(raw, 'senderId'),
    createdAt: text(raw, 'createdAt', 'sentAt'),
    isMine: bool(raw, 'isMine'),
    raw,
  };
}
function adaptQuestion(value: unknown): StudentExamQuestion {
  const raw = requiredRecord(value);
  const options = field(raw, 'options', 'choices');
  return {
    id: text(raw, 'id', 'questionId'),
    text: text(raw, 'text', 'questionText', 'question', 'title'),
    type: text(raw, 'type', 'questionType'),
    options: Array.isArray(options)
      ? options.map((value) => {
          if (typeof value === 'string') return { id: null, text: value, value };
          const option = requiredRecord(value);
          return {
            id: text(option, 'id', 'optionId'),
            text: text(option, 'text', 'label'),
            value: text(option, 'value', 'id'),
          };
        })
      : [],
  };
}
function adaptExam(raw: StudentRecord): StudentExam {
  const questions = field(raw, 'questions', 'questionItems');
  return {
    id: text(raw, 'id', 'examId'),
    title: text(raw, 'title', 'name'),
    subjectName: text(raw, 'subjectName') ?? nestedName(raw, 'subject'),
    description: text(raw, 'description'),
    status: text(raw, 'status'),
    dueDate: text(raw, 'dueDate', 'endsAt'),
    score: number(raw, 'score', 'grade'),
    maxScore: number(raw, 'maxScore', 'maxGrade', 'totalMarks'),
    isSubmitted: bool(raw, 'isSubmitted'),
    submittedAt: text(raw, 'submittedAt'),
    questions: Array.isArray(questions) ? questions.map(adaptQuestion) : [],
    raw,
  };
}
function adaptAssignment(raw: StudentRecord): StudentAssignment {
  const submission = studentRecord(raw['submission']);
  return {
    id: text(raw, 'id', 'assignmentId'),
    title: text(raw, 'title', 'name'),
    description: text(raw, 'description'),
    subjectName: text(raw, 'subjectName') ?? nestedName(raw, 'subject'),
    dueDate: text(raw, 'dueDate'),
    status: text(raw, 'status') ?? (submission ? text(submission, 'status') : null),
    grade: number(raw, 'grade') ?? (submission ? number(submission, 'grade') : null),
    maxGrade: number(raw, 'maxGrade'),
    textAnswer: text(raw, 'textAnswer') ?? (submission ? text(submission, 'textAnswer') : null),
    fileUrl: studentSafeUrl(field(raw, 'fileUrl', 'attachmentUrl')),
    raw,
  };
}

@Injectable({ providedIn: 'root' })
export class StudentService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.baseUrl}/api/v1`;

  private options(params?: HttpParams) {
    return {
      params,
      context: new HttpContext().set(SKIP_ERROR_NOTIFICATION, true),
      transferCache: false as const,
      cache: 'no-store' as const,
    };
  }
  private get(path: string, params?: HttpParams): Observable<unknown> {
    return defer(() => this.http.get<unknown>(this.base + path, this.options(params))).pipe(
      map((value) => unwrapStudentResponse(value)),
    );
  }
  private post(
    path: string,
    body: unknown,
    method: 'POST' | 'PUT' | 'PATCH' = 'POST',
  ): Observable<unknown> {
    return defer(() =>
      this.http.request<unknown>(method, this.base + path, { ...this.options(), body }),
    ).pipe(map((value) => unwrapStudentResponse(value, true)));
  }

  getProfile(): Observable<StudentProfile> {
    return this.get('/profile/student').pipe(map(adaptStudentProfile));
  }
  getDashboard(): Observable<StudentDashboard> {
    return this.get('/dashboards/student').pipe(map(adaptDashboard));
  }
  changePassword(currentPassword: string, newPassword: string): Observable<unknown> {
    return defer(() => {
      if (!currentPassword || !newPassword)
        throw new StudentDataError('Both passwords are required.');
      return this.post('/auth/change-password', { currentPassword, newPassword });
    });
  }

  getCourses(): Observable<StudentPage<StudentCourse>> {
    return this.getProfile().pipe(
      switchMap((profile) => this.get(`/courses/students/${idSegment(profile.studentId)}`)),
      map((value) => adaptStudentPage(value, adaptCourse, ['courses'])),
    );
  }
  getDailySchedule(
    date: string,
    pageNumber = 1,
    pageSize = 10,
  ): Observable<StudentPage<StudentSession>> {
    return defer(() => {
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        !Number.isFinite(Date.parse(date)) ||
        new Date(date).toISOString().slice(0, 10) !== date
      )
        throw new StudentDataError('Invalid schedule date.');
      const params = pageParams(pageNumber, pageSize).set('date', date);
      // The Student API identifies the signed-in student from the bearer token.
      // Its optional studentId filter is unnecessary here; profile loading must not block the timetable.
      return this.get('/schedules/daily', params);
    }).pipe(map((value) => adaptStudentPage(value, adaptSession, ['sessions', 'schedules'])));
  }
  getConversations(pageNumber = 1, pageSize = 10): Observable<StudentPage<StudentConversation>> {
    return defer(() => this.get('/conversations', pageParams(pageNumber, pageSize))).pipe(
      map((value) => adaptStudentPage(value, adaptConversation, ['conversations'])),
    );
  }
  getMessages(
    conversationId: string,
    pageNumber = 1,
    pageSize = 30,
  ): Observable<StudentPage<StudentMessage>> {
    return defer(() =>
      this.get(
        `/conversations/${idSegment(conversationId)}/messages`,
        pageParams(pageNumber, pageSize),
      ),
    ).pipe(map((value) => adaptStudentPage(value, adaptMessage, ['messages'])));
  }
  sendMessage(conversationId: string, body: string): Observable<unknown> {
    return defer(() => {
      if (!studentString(body)) throw new StudentDataError('A message body is required.');
      return this.post(`/conversations/${idSegment(conversationId)}/messages`, {
        body: body.trim(),
      });
    });
  }
  markConversationRead(conversationId: string): Observable<unknown> {
    return defer(() =>
      this.post(`/conversations/${idSegment(conversationId)}/read`, null, 'PATCH'),
    );
  }
  getExams(): Observable<StudentPage<StudentExam>> {
    return this.get('/student-exams/me').pipe(
      map((value) => adaptStudentPage(value, adaptExam, ['exams'])),
    );
  }
  getSubscribedSubjects(): Observable<StudentSubject[]> {
    return this.getProfile().pipe(
      switchMap((profile) =>
        this.get(`/courses/students/${idSegment(profile.studentId)}`).pipe(
          map((value) => {
            const courses = adaptStudentPage(value, adaptCourse, ['courses']).items;
            const subjects = new Map<string, StudentSubject>();
            const add = (record: StudentRecord, explicitSubject = false) => {
              const nested = studentRecord(record['subject']);
              const id =
                text(record, 'subjectId') ??
                (nested ? text(nested, 'id') : null) ??
                (explicitSubject ? text(record, 'id') : null);
              if (!id) return;
              const source = nested ?? record;
              const option = {
                id,
                name:
                  text(record, 'subjectName') ??
                  text(source, ...(explicitSubject || nested ? ['name', 'nameAr', 'nameEn'] : [])),
                nameAr: text(
                  source,
                  ...(explicitSubject || nested ? ['nameAr'] : ['subjectNameAr']),
                ),
                nameEn: text(
                  source,
                  ...(explicitSubject || nested ? ['nameEn'] : ['subjectNameEn']),
                ),
              };
              const previous = subjects.get(id);
              subjects.set(
                id,
                previous
                  ? {
                      id,
                      name: previous.name ?? option.name,
                      nameAr: previous.nameAr ?? option.nameAr,
                      nameEn: previous.nameEn ?? option.nameEn,
                    }
                  : option,
              );
            };
            const raw =
              studentRecord(profile.raw['student']) ??
              studentRecord(profile.raw['profile']) ??
              profile.raw;
            for (const key of ['subjects', 'teacherAssignments']) {
              const list = raw[key];
              if (Array.isArray(list))
                for (const value of list) {
                  const record = studentRecord(value);
                  if (record) add(record, key === 'subjects');
                }
            }
            for (const course of courses) add(course.raw);
            return [...subjects.values()];
          }),
        ),
      ),
    );
  }
  createExam(
    subjectId: string,
    questionCount: number,
    difficulty: 'Easy' | 'Medium' | 'Hard',
  ): Observable<unknown> {
    return defer(() => {
      idSegment(subjectId);
      if (
        !Number.isInteger(questionCount) ||
        questionCount < 1 ||
        questionCount > 100 ||
        !['Easy', 'Medium', 'Hard'].includes(difficulty)
      )
        throw new StudentDataError('Invalid practice exam settings.');
      return this.getSubscribedSubjects().pipe(
        switchMap((subjects) => {
          if (!subjects.some((subject) => subject.id === subjectId))
            throw new StudentDataError(
              'The subject is not available in the own student subscriptions.',
            );
          return this.post('/student-exams', { subjectId, questionCount, difficulty });
        }),
      );
    });
  }
  submitExam(examId: string, answers: StudentExamAnswer[]): Observable<unknown> {
    return defer(() => {
      if (
        !answers.length ||
        answers.some(
          (answer) =>
            !studentString(answer.questionId) ||
            (answer.answer !== null && typeof answer.answer !== 'string'),
        )
      )
        throw new StudentDataError('Invalid exam answers.');
      return this.post(`/student-exams/${idSegment(examId)}/submit`, {
        answers: answers.map(({ questionId, answer }) => ({ questionId, answer })),
      });
    });
  }
  getAssignments(): Observable<StudentPage<StudentAssignment>> {
    return this.get('/assignments').pipe(
      map((value) => adaptStudentPage(value, adaptAssignment, ['assignments'])),
    );
  }
  submitAssignment(
    assignmentId: string,
    submission: StudentAssignmentSubmission,
    update = false,
  ): Observable<unknown> {
    return defer(() => {
      const body = new FormData();
      body.set('TextAnswer', submission.textAnswer);
      body.set('Submit', String(submission.submit));
      if (submission.file) body.set('File', submission.file, submission.file.name);
      // HttpClient adds the browser-generated multipart boundary. Do not set Content-Type here.
      return this.post(
        `/assignments/${idSegment(assignmentId)}/submission`,
        body,
        update ? 'PUT' : 'POST',
      );
    });
  }
  requestAttendance(sessionId: string, notes?: string): Observable<unknown> {
    return defer(() => {
      idSegment(sessionId);
      return this.post('/attendance/requests', { sessionId, notes: studentString(notes) });
    });
  }
  createExcuse(
    sessionId: string,
    reason: string,
    proposedAlternativeAt?: string,
  ): Observable<unknown> {
    return defer(() => {
      idSegment(sessionId);
      if (!studentString(reason)) throw new StudentDataError('An excuse reason is required.');
      if (proposedAlternativeAt && !Number.isFinite(Date.parse(proposedAlternativeAt)))
        throw new StudentDataError('Invalid alternative date.');
      return this.post('/session-excuses', {
        sessionId,
        reason: reason.trim(),
        proposedAlternativeAt: proposedAlternativeAt || null,
      });
    });
  }
  getExcuses(): Observable<StudentPage<StudentExcuse>> {
    return this.get('/session-excuses').pipe(
      map((value) =>
        adaptStudentPage(
          value,
          (raw) => ({
            id: text(raw, 'id'),
            sessionId: text(raw, 'sessionId'),
            reason: text(raw, 'reason'),
            status: text(raw, 'status'),
            proposedAlternativeAt: text(raw, 'proposedAlternativeAt'),
            raw,
          }),
          ['excuses'],
        ),
      ),
    );
  }
  rateSession(sessionId: string, score: number, comment?: string): Observable<unknown> {
    return defer(() => {
      if (!Number.isInteger(score) || score < 1 || score > 5)
        throw new StudentDataError('The rating must be from 1 to 5.');
      return this.post(`/session-ratings/sessions/${idSegment(sessionId)}`, {
        score,
        comment: studentString(comment),
      });
    });
  }
  getMyRatings(pageNumber = 1, pageSize = 10): Observable<StudentPage<StudentRating>> {
    return defer(() => this.get('/session-ratings/me', pageParams(pageNumber, pageSize))).pipe(
      map((value) =>
        adaptStudentPage(
          value,
          (raw) => ({
            id: text(raw, 'id'),
            sessionId: text(raw, 'sessionId'),
            score: number(raw, 'score'),
            comment: text(raw, 'comment'),
            createdAt: text(raw, 'createdAt'),
            raw,
          }),
          ['ratings'],
        ),
      ),
    );
  }
  getAttendanceReport(): Observable<StudentRecord> {
    return this.getProfile().pipe(
      switchMap((profile) =>
        this.get(
          '/attendance/student-report',
          new HttpParams().set('studentId', profile.studentId),
        ),
      ),
      map(requiredRecord),
    );
  }
}
