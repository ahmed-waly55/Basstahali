import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { SKIP_ERROR_NOTIFICATION } from '../interceptors/loading-interceptor';
import { StudentDashboard, StudentPage, StudentSession } from './student.models';
import {
  StudentDataError,
  StudentService,
  adaptStudentProfile,
  unwrapStudentResponse,
} from './student.service';

describe('StudentService private data', () => {
  const base = `${environment.baseUrl}/api/v1`;
  let service: StudentService;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withFetch()), provideHttpClientTesting()],
    });
    service = TestBed.inject(StudentService);
    backend = TestBed.inject(HttpTestingController);
  });
  afterEach(() => backend.verify());

  it('rejects failed HTTP 200 envelopes rather than treating their data as success', () => {
    let failure: unknown;
    service.getDashboard().subscribe({ error: (error) => (failure = error) });
    backend
      .expectOne(base + '/dashboards/student')
      .flush({ success: false, data: { totalSessions: 99 } });
    expect(failure).toBeInstanceOf(StudentDataError);
    expect(() => unwrapStudentResponse({ success: 'true', data: [] })).toThrow(StudentDataError);
  });

  it('preserves unknown stats and explicit zero values separately', () => {
    let dashboard: StudentDashboard | undefined;
    service.getDashboard().subscribe((value) => (dashboard = value));
    backend
      .expectOne(base + '/dashboards/student')
      .flush({ success: true, data: { stats: { totalSessions: 0, usedSessions: 3 } } });
    expect(dashboard?.stats.find((stat) => stat.key === 'totalSessions')?.value).toBe(0);
    expect(dashboard?.stats.find((stat) => stat.key === 'remainingSessions')?.value).toBeNull();
    expect(dashboard?.stats.find((stat) => stat.key === 'attendanceRate')?.value).toBeNull();
  });

  it('does not mistake an authentication user ID for the student entity ID', () => {
    expect(() => adaptStudentProfile({ user: { id: 'auth-user-id' } })).toThrow(StudentDataError);
    expect(
      adaptStudentProfile({ student: { id: 'student-entity' }, user: { id: 'auth-user-id' } })
        .studentId,
    ).toBe('student-entity');
    expect(adaptStudentProfile({ studentId: 'student-entity', id: 'other' }).studentId).toBe(
      'student-entity',
    );
  });

  it('scopes courses to a fresh own profile response and encodes its entity identifier', () => {
    service.getCourses().subscribe();
    const profile = backend.expectOne(base + '/profile/student');
    expect(profile.request.cache).toBe('no-store');
    profile.flush({
      success: true,
      data: { student: { id: 'own/student' }, user: { id: 'auth-user-id' } },
    });
    const courses = backend.expectOne(base + '/courses/students/own%2Fstudent');
    expect(courses.request.transferCache).toBe(false);
    courses.flush({ success: true, data: [] });

    service.getCourses().subscribe();
    backend
      .expectOne(base + '/profile/student')
      .flush({ success: true, data: { studentId: 'second-session-student' } });
    backend.expectOne(base + '/courses/students/second-session-student').flush([]);
  });

  it('never calls student-scoped endpoints when own profile identification is unavailable', () => {
    let failure: unknown;
    service.getCourses().subscribe({ error: (error) => (failure = error) });
    backend
      .expectOne(base + '/profile/student')
      .flush({ success: true, data: { user: { id: 'auth-user' } } });
    backend.expectNone((request) => request.url.includes('/courses/students/'));
    expect(failure).toBeInstanceOf(StudentDataError);
  });

  it('requests the chosen local calendar day and documented pagination for the own student', () => {
    let page: StudentPage<StudentSession> | undefined;
    service.getDailySchedule('2026-10-15', 2, 10).subscribe((value) => (page = value));
    backend
      .expectOne(base + '/profile/student')
      .flush({ success: true, data: { id: 'own-student' } });
    const request = backend.expectOne((request) => request.url === base + '/schedules/daily');
    expect(request.request.params.get('studentId')).toBe('own-student');
    expect(request.request.params.get('date')).toBe('2026-10-15');
    expect(request.request.params.get('PageNumber')).toBe('2');
    expect(request.request.params.get('PageSize')).toBe('10');
    expect(request.request.cache).toBe('no-store');
    expect(request.request.transferCache).toBe(false);
    request.flush({
      success: true,
      data: {
        items: [{ id: 'session', classLink: 'javascript:alert(1)' }],
        pageNumber: 2,
        pageSize: 10,
        totalCount: 23,
        totalPages: 3,
        hasPreviousPage: true,
        hasNextPage: true,
      },
    });
    expect(page?.totalCount).toBe(23);
    expect(page?.hasNextPage).toBe(true);
    expect(page?.items[0].classLink).toBeNull();
    expect(page?.items[0].teacherName).toBeNull();
  });

  it('rejects impossible dates without making any request', () => {
    let failure: unknown;
    service.getDailySchedule('2026-02-30').subscribe({ error: (error) => (failure = error) });
    expect(failure).toBeInstanceOf(StudentDataError);
    backend.expectNone(() => true);
  });

  it('rejects unsupported list responses instead of showing a misleading empty state', () => {
    let failure: unknown;
    service.getAssignments().subscribe({ error: (error) => (failure = error) });
    backend.expectOne(base + '/assignments').flush({ success: true, data: { unexpected: [] } });
    expect(failure).toBeInstanceOf(StudentDataError);
  });

  it('retains actual empty lists with unknown pagination rather than inventing totals', () => {
    let page: StudentPage<unknown> | undefined;
    service.getAssignments().subscribe((value) => (page = value));
    backend.expectOne(base + '/assignments').flush({ success: true, data: [] });
    expect(page?.items).toEqual([]);
    expect(page?.totalCount).toBeNull();
    expect(page?.hasNextPage).toBeNull();
  });

  it('keeps private messages uncached and suppresses duplicate global error alerts', () => {
    service.getMessages('conversation/one', 2, 30).subscribe();
    const request = backend.expectOne(
      (request) => request.url === base + '/conversations/conversation%2Fone/messages',
    );
    expect(request.request.params.get('PageNumber')).toBe('2');
    expect(request.request.cache).toBe('no-store');
    expect(request.request.transferCache).toBe(false);
    expect(request.request.context.get(SKIP_ERROR_NOTIFICATION)).toBe(true);
    request.flush({ data: { items: [] } });
  });

  it('sends only the documented chat body and allows void success responses', () => {
    let result: unknown = 'pending';
    service.sendMessage('conversation', ' Hello ').subscribe((value) => (result = value));
    const request = backend.expectOne(base + '/conversations/conversation/messages');
    expect(request.request.body).toEqual({ body: 'Hello' });
    expect(request.request.method).toBe('POST');
    expect(request.request.cache).toBe('no-store');
    expect(request.request.transferCache).toBe(false);
    expect(request.request.context.get(SKIP_ERROR_NOTIFICATION)).toBe(true);
    request.flush({ success: true });
    expect(result).toBeNull();
  });

  it('keeps multipart form field names and leaves the Content-Type boundary to the browser', () => {
    const file = new File(['answer'], 'answer.txt', { type: 'text/plain' });
    service
      .submitAssignment('assignment', { textAnswer: 'My answer', submit: true, file }, true)
      .subscribe();
    const request = backend.expectOne(base + '/assignments/assignment/submission');
    expect(request.request.method).toBe('PUT');
    expect(request.request.headers.has('Content-Type')).toBe(false);
    expect(request.request.body).toBeInstanceOf(FormData);
    const body = request.request.body as FormData;
    expect(body.get('TextAnswer')).toBe('My answer');
    expect(body.get('Submit')).toBe('true');
    expect((body.get('File') as File).name).toBe('answer.txt');
    request.flush(null);
  });

  it('validates practice subjects against real subscriptions and never uses the course ID', () => {
    let failure: unknown;
    service.createExam('course-id', 10, 'Easy').subscribe({ error: (error) => (failure = error) });
    backend.expectOne(base + '/profile/student').flush({ data: { studentId: 'own' } });
    backend
      .expectOne(base + '/courses/students/own')
      .flush({ data: [{ id: 'course-id', subjectId: 'subject-id', subjectName: 'Math' }] });
    backend.expectNone(base + '/student-exams');
    expect(failure).toBeInstanceOf(StudentDataError);
  });

  it('creates a practice exam with the documented DTO only after own-subject validation', () => {
    service.createExam('subject-id', 10, 'Medium').subscribe();
    backend.expectOne(base + '/profile/student').flush({
      data: { student: { id: 'own', teacherAssignments: [{ subjectId: 'subject-id' }] } },
    });
    backend.expectOne(base + '/courses/students/own').flush([]);
    const request = backend.expectOne(base + '/student-exams');
    expect(request.request.body).toEqual({
      subjectId: 'subject-id',
      questionCount: 10,
      difficulty: 'Medium',
    });
    request.flush({ success: true });
  });

  it('submits explicit exam question IDs with no fabricated question or answer values', () => {
    service.submitExam('exam', [{ questionId: 'question', answer: 'Answer' }]).subscribe();
    const request = backend.expectOne(base + '/student-exams/exam/submit');
    expect(request.request.body).toEqual({
      answers: [{ questionId: 'question', answer: 'Answer' }],
    });
    request.flush(null);
  });

  it('passes API failure envelopes on mutations to inline error handling', () => {
    let failure: unknown;
    service.requestAttendance('session').subscribe({ error: (error) => (failure = error) });
    const request = backend.expectOne(base + '/attendance/requests');
    expect(request.request.body).toEqual({ sessionId: 'session', notes: null });
    request.flush({ success: false, message: 'Denied' });
    expect(failure).toBeInstanceOf(StudentDataError);
  });

  it('changes passwords without trimming or persisting password values', () => {
    service.changePassword(' current ', ' new ').subscribe();
    const request = backend.expectOne(base + '/auth/change-password');
    expect(request.request.body).toEqual({ currentPassword: ' current ', newPassword: ' new ' });
    expect(request.request.transferCache).toBe(false);
    expect(request.request.cache).toBe('no-store');
    request.flush(null);
  });
});
