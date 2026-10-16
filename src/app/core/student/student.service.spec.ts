import { HttpErrorResponse, provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { SKIP_ERROR_NOTIFICATION } from '../interceptors/loading-interceptor';
import {
  StudentDashboard,
  StudentHomeSchedule,
  StudentPage,
  StudentSession,
} from './student.models';
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

  it('reads the actual profile shape, including zero balances and compensatory credits', () => {
    const profile = adaptStudentProfile({
      id: 'own-student',
      userId: 'different-auth-user',
      userName: 'student.test',
      fullName: 'Test student',
      phoneNumber: '0500000000',
      parentName: 'Test parent',
      parentPhoneNumber: '0500000001',
      gradeLevelId: 'grade-id',
      curriculumId: 'curriculum-id',
      educationStageId: null,
      sessionCreditBalance: 2,
      expirationDate: null,
      status: 'Active',
      sessions: { totalSessions: 2, usedSessions: 0, remainingSessions: 2 },
      subscriptionMode: 'Sessions',
      regularSessionCreditBalance: 0,
      courseSessionCreditBalance: 0,
      compensatorySessionCreditBalance: 2,
      compensatoryCreditsAdded: 2,
      subscriptionStartedAt: null,
      teacherAssignments: [
        { subjectId: 'subject-id', teacherName: 'Test teacher', sessionPrice: 20, currency: 'EGP' },
      ],
      compensatoryCredits: [
        {
          id: 'credit-id',
          quantity: 2,
          remaining: 2,
          reason: '2',
          addedAt: '2026-10-15T23:23:57.6879512+00:00',
          expiresAt: '2026-11-29T23:23:57.6879513+00:00',
          status: 'Active',
        },
      ],
    });
    expect(profile.studentId).toBe('own-student');
    expect(profile.userName).toBe('student.test');
    expect(profile.sessions).toEqual({ totalSessions: 2, usedSessions: 0, remainingSessions: 2 });
    expect(profile.regularSessionCreditBalance).toBe(0);
    expect(profile.courseSessionCreditBalance).toBe(0);
    expect(profile.compensatorySessionCreditBalance).toBe(2);
    expect(profile.compensatoryCreditsAdded).toBe(2);
    expect(profile.compensatoryCredits[0]).toEqual({
      id: 'credit-id',
      quantity: 2,
      remaining: 2,
      reason: '2',
      addedAt: '2026-10-15T23:23:57.6879512+00:00',
      expiresAt: '2026-11-29T23:23:57.6879513+00:00',
      status: 'Active',
    });
    expect(profile.expirationDate).toBeNull();
    expect(profile.subscriptionStartedAt).toBeNull();
    expect(profile.curriculumName).toBeNull();
    expect(profile.gradeLevelName).toBeNull();
    expect(profile.educationStageName).toBeNull();
  });

  it('keeps omitted credit details unknown instead of inventing zero balances or credit history', () => {
    const profile = adaptStudentProfile({ id: 'own-student', compensatoryCredits: [null] });
    expect(profile.sessions).toEqual({
      totalSessions: null,
      usedSessions: null,
      remainingSessions: null,
    });
    expect(profile.regularSessionCreditBalance).toBeNull();
    expect(profile.courseSessionCreditBalance).toBeNull();
    expect(profile.compensatorySessionCreditBalance).toBeNull();
    expect(profile.compensatoryCredits).toEqual([]);
  });

  it('reads nested session statistics without losing an actual used-session count of zero', () => {
    let dashboard: StudentDashboard | undefined;
    service.getDashboard().subscribe((value) => (dashboard = value));
    backend.expectOne(base + '/dashboards/student').flush({
      success: true,
      data: {
        id: 'own-student',
        userId: 'different-user',
        sessionCreditBalance: 2,
        sessions: { totalSessions: 2, usedSessions: 0, remainingSessions: 2 },
      },
      errors: null,
      traceId: null,
    });
    expect(dashboard?.stats.filter((stat) => stat.value !== null)).toEqual([
      { key: 'totalSessions', value: 2 },
      { key: 'usedSessions', value: 0 },
      { key: 'remainingSessions', value: 2 },
    ]);
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

  it('requests the student timetable immediately without waiting for a profile request', () => {
    let page: StudentPage<StudentSession> | undefined;
    service.getDailySchedule('2026-10-15', 2, 10).subscribe((value) => (page = value));
    backend.expectNone(base + '/profile/student');
    const request = backend.expectOne((request) => request.url === base + '/schedules/daily');
    expect(request.request.params.get('studentId')).toBeNull();
    expect(request.request.params.get('date')).toBe('2026-10-15');
    expect(request.request.params.get('PageNumber')).toBe('2');
    expect(request.request.params.get('PageSize')).toBe('10');
    expect(request.request.cache).toBe('no-store');
    expect(request.request.transferCache).toBe(false);
    request.flush({
      success: true,
      data: {
        items: [
          {
            id: 'session',
            studentId: 'own-student',
            subjectName: 'Mathematics',
            teacherName: 'Test teacher',
            date: '2026-10-15',
            startTime: '18:00:00',
            endTime: '19:00:00',
            status: 'Scheduled',
            paymentStatus: 'Paid',
            classLink: 'javascript:alert(1)',
          },
        ],
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
    expect(page?.items[0].teacherName).toBe('Test teacher');
    expect(page?.items[0].subjectName).toBe('Mathematics');
    expect(page?.items[0].date).toBe('2026-10-15');
  });

  it('still requests the timetable when the independent profile endpoint has failed', () => {
    service.getProfile().subscribe({ error: () => {} });
    backend
      .expectOne(base + '/profile/student')
      .flush(null, { status: 500, statusText: 'Server error' });
    let page: StudentPage<StudentSession> | undefined;
    service.getDailySchedule('2026-10-16').subscribe((value) => (page = value));
    backend.expectNone(base + '/profile/student');
    backend
      .expectOne((request) => request.url === base + '/schedules/daily')
      .flush({ success: true, data: { items: null, totalCount: 0, pageNumber: 1, totalPages: 0 } });
    expect(page?.items).toEqual([]);
    expect(page?.totalCount).toBe(0);
  });

  it('preserves timetable HTTP failures rather than reporting an empty list', () => {
    let failure: unknown;
    service.getDailySchedule('2026-10-16').subscribe({ error: (error) => (failure = error) });
    backend
      .expectOne((request) => request.url === base + '/schedules/daily')
      .flush({ success: false }, { status: 403, statusText: 'Forbidden' });
    expect(failure).toBeInstanceOf(HttpErrorResponse);
    expect((failure as HttpErrorResponse).status).toBe(403);
  });

  it('loads the complete home timetable without sending unsupported paging or profile requests', () => {
    let schedule: StudentHomeSchedule | undefined;
    service.getHomeSchedule().subscribe((value) => (schedule = value));
    backend.expectNone(base + '/profile/student');
    const request = backend.expectOne(base + '/home/schedule');
    expect(request.request.params.keys()).toEqual([]);
    expect(request.request.cache).toBe('no-store');
    expect(request.request.transferCache).toBe(false);
    expect(request.request.context.get(SKIP_ERROR_NOTIFICATION)).toBe(true);
    request.flush({
      success: true,
      data: {
        weekStart: '2026-10-11',
        weekEnd: '2026-10-17',
        items: Array.from({ length: 12 }, (_, index) => ({
          id: `home-${index}`,
          subject: 'Mathematics',
          teacher: 'Test teacher',
          name: 'An ambiguous name',
          studentName: 'Private student name',
          day: 'Friday',
          timeSlot: 'Evening',
          timeRange: '18:00 - 19:00',
          period: 'PM',
          zoomUrl: 'https://zoom.us/j/123456789',
          scheduledAt: '2026-10-16T15:00:00Z',
          durationMinutes: 60,
          status: 'Scheduled',
          paymentStatus: 'Paid',
        })),
      },
      errors: null,
      traceId: null,
    });
    expect(schedule?.items).toHaveLength(12);
    expect(schedule?.weekStart).toBe('2026-10-11');
    expect(schedule?.weekEnd).toBe('2026-10-17');
    expect(schedule?.items[0]).toMatchObject({
      subjectName: 'Mathematics',
      teacherName: 'Test teacher',
      day: 'Friday',
      timeSlot: 'Evening',
      timeRange: '18:00 - 19:00',
      period: 'PM',
      occurrenceAt: '2026-10-16T15:00:00Z',
      classLink: 'https://zoom.us/j/123456789',
      studentId: null,
      date: null,
    });
  });

  it('sends only the documented optional weekStart filter to the home timetable', () => {
    service.getHomeSchedule('2026-10-11').subscribe();
    const request = backend.expectOne((req) => req.url === base + '/home/schedule');
    expect(request.request.params.keys()).toEqual(['weekStart']);
    expect(request.request.params.get('weekStart')).toBe('2026-10-11');
    request.flush({
      success: true,
      data: { weekStart: '2026-10-11', weekEnd: '2026-10-17', items: [] },
    });
  });

  it('accepts the home contract nullable items as an empty week without fabricated pagination', () => {
    let schedule: StudentHomeSchedule | undefined;
    service.getHomeSchedule().subscribe((value) => (schedule = value));
    backend.expectOne(base + '/home/schedule').flush({
      success: true,
      data: { weekStart: '2026-10-11', weekEnd: '2026-10-17', items: null },
    });
    expect(schedule?.items).toEqual([]);
    expect(schedule).not.toHaveProperty('totalCount');
    expect(schedule).not.toHaveProperty('totalPages');
  });

  it('rejects unsupported home response shapes and failed envelopes rather than inventing an empty week', () => {
    const failures: unknown[] = [];
    for (const body of [
      { success: true, data: { items: {} } },
      { success: true, data: {} },
      { success: false, data: { items: null } },
    ]) {
      service.getHomeSchedule().subscribe({ error: (error) => failures.push(error) });
      backend.expectOne(base + '/home/schedule').flush(body);
    }
    expect(failures).toHaveLength(3);
    expect(failures.every((error) => error instanceof StudentDataError)).toBe(true);
  });

  it('uses schedules with the selected day and real pagination independently of the daily endpoint', () => {
    let page: StudentPage<StudentSession> | undefined;
    service.getSchedule('2026-10-16', 2, 10).subscribe((value) => (page = value));
    backend.expectNone(base + '/profile/student');
    backend.expectNone((req) => req.url === base + '/schedules/daily');
    const request = backend.expectOne((req) => req.url === base + '/schedules');
    expect(
      Object.fromEntries(
        request.request.params.keys().map((key) => [key, request.request.params.get(key)]),
      ),
    ).toEqual({ date: '2026-10-16', PageNumber: '2', PageSize: '10' });
    request.flush({
      success: true,
      data: {
        items: [
          {
            id: 'weekly',
            dayOfWeek: 'Sunday',
            day: 'Sunday',
            teacherName: '',
            teacher: 'Teacher alias',
            name: 'Do not infer a subject from a person name',
            timeSlot: '18:00 - 19:00',
            zoomUrl: 'https://zoom.us/j/123456789',
            recurrenceType: 'Weekly',
            recurrenceEndDate: '2026-11-29T00:00:00Z',
          },
        ],
        pageNumber: 2,
        pageSize: 10,
        totalCount: 12,
        totalPages: 2,
        hasPreviousPage: true,
        hasNextPage: false,
      },
    });
    expect(page?.items[0]).toMatchObject({
      teacherName: 'Teacher alias',
      subjectName: null,
      dayOfWeek: 'Sunday',
      day: 'Sunday',
      timeSlot: '18:00 - 19:00',
      classLink: 'https://zoom.us/j/123456789',
      recurrenceType: 'Weekly',
      recurrenceEndDate: '2026-11-29T00:00:00Z',
      date: null,
      status: null,
    });
    expect(page?.totalCount).toBe(12);
    expect(page?.hasNextPage).toBe(false);
  });

  it('finds the first safe schedule link when earlier API aliases are empty or unsafe', () => {
    let page: StudentPage<StudentSession> | undefined;
    service.getSchedule().subscribe((value) => (page = value));
    const request = backend.expectOne((req) => req.url === base + '/schedules');
    expect(request.request.params.get('PageNumber')).toBe('1');
    expect(request.request.params.get('PageSize')).toBe('10');
    expect(request.request.params.has('date')).toBe(false);
    request.flush({
      success: true,
      data: {
        items: [
          { classLink: '', zoomUrl: 'https://zoom.us/j/first' },
          { classLink: 'javascript:alert(1)', zoomUrl: 'https://zoom.us/j/second' },
          {
            classLink: 'http://zoom.us/j/unsafe',
            zoomUrl: 'https://user:password@zoom.us/j/unsafe',
            zoom: 'https://zoom.us/j/third',
          },
          { classLink: 'https://zoom.us/j/primary', zoomUrl: 'https://zoom.us/j/secondary' },
          { zoomUrl: 'javascript:alert(1)', zoom: 'data:text/plain,unsafe' },
        ],
      },
    });
    expect(page?.items.map((item) => item.classLink)).toEqual([
      'https://zoom.us/j/first',
      'https://zoom.us/j/second',
      'https://zoom.us/j/third',
      'https://zoom.us/j/primary',
      null,
    ]);
  });

  it('rejects impossible schedule and home week filters before making any request', () => {
    const failures: unknown[] = [];
    service.getSchedule('2026-02-30').subscribe({ error: (error) => failures.push(error) });
    service.getSchedule('').subscribe({ error: (error) => failures.push(error) });
    service.getHomeSchedule('2026-02-30').subscribe({ error: (error) => failures.push(error) });
    expect(failures).toHaveLength(3);
    expect(failures.every((error) => error instanceof StudentDataError)).toBe(true);
    backend.expectNone(() => true);
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
