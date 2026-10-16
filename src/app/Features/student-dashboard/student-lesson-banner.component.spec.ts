import { LOCALE_ID, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import type { StudentHomeSchedule, StudentSession } from '../../core/student/student.models';
import { StudentLessonBannerComponent } from './student-lesson-banner.component';
import { StudentTimetableService } from './student-timetable.service';

const start = Date.parse('2026-10-16T16:00:00Z');
function lesson(overrides: Partial<StudentSession> = {}): StudentSession {
  return {
    id: 'private-lesson-id',
    studentId: 'private-student-id',
    teacherName: 'أ. نهى كمال',
    subjectName: 'اللغة العربية',
    date: null,
    day: null,
    dayOfWeek: null,
    startTime: null,
    endTime: '2026-10-16T17:00:00Z',
    timeRange: null,
    timeSlot: null,
    period: null,
    recurrenceType: null,
    recurrenceEndDate: null,
    classLink: 'https://meet.example.com/arabic',
    status: 'Scheduled',
    occurrenceAt: '2026-10-16T16:00:00Z',
    courseName: null,
    paymentStatus: null,
    raw: {},
    ...overrides,
  };
}

describe('StudentLessonBannerComponent admission notice', () => {
  const home = signal<StudentHomeSchedule | null>(null);
  const now = signal(start - 11 * 60_000);
  const timeZone = signal('Asia/Dubai');
  const signedIn = signal(true);
  let fullSchedule: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    home.set({ items: [lesson()], weekStart: '2026-10-11', weekEnd: '2026-10-17' });
    now.set(start - 11 * 60_000);
    timeZone.set('Asia/Dubai');
    signedIn.set(true);
    fullSchedule = vi.fn(() => of(home()));
    TestBed.configureTestingModule({
      imports: [StudentLessonBannerComponent],
      providers: [
        { provide: AuthService, useValue: { hasSession: () => signedIn() } },
        { provide: StudentTimetableService, useValue: { home, now, timeZone, fullSchedule } },
      ],
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('reveals the notice and safe join link at exactly ten minutes before the lesson', () => {
    const fixture = TestBed.createComponent(StudentLessonBannerComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role=status]')).toBeNull();
    now.set(start - 10 * 60_000);
    fixture.detectChanges();
    const notice: HTMLElement = fixture.nativeElement.querySelector('[role=status]');
    expect(notice).not.toBeNull();
    expect(notice.getAttribute('aria-live')).toBe('polite');
    expect(notice.textContent).toContain(fixture.componentInstance.bannerCopy.starting);
    const link = notice.querySelector('a')!;
    expect(link.getAttribute('href')).toBe('https://meet.example.com/arabic');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    expect(notice.textContent).not.toContain('private-lesson-id');
  });

  it('formats the actual lesson instant in the device timezone and hides when the lesson ends', () => {
    now.set(start);
    const fixture = TestBed.createComponent(StudentLessonBannerComponent);
    fixture.detectChanges();
    const expected = new Intl.DateTimeFormat(TestBed.inject(LOCALE_ID), {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'Asia/Dubai',
    }).format(start);
    expect(fixture.nativeElement.querySelector('time').textContent).toBe(expected);
    expect(fixture.nativeElement.textContent).toContain('Asia/Dubai');
    expect(fixture.nativeElement.textContent).toContain(fixture.componentInstance.bannerCopy.live);
    now.set(Date.parse('2026-10-16T17:00:00Z'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role=status]')).toBeNull();
  });

  it('does not show a notice for canceled, unsafe, undated or already started lessons without an end', () => {
    now.set(start + 1);
    home.set({
      weekStart: null,
      weekEnd: null,
      items: [
        lesson({ status: 'Cancelled' }),
        lesson({ classLink: 'javascript:alert(1)' }),
        lesson({ classLink: 'http://meet.example.com/insecure' }),
        lesson({ classLink: 'https://student:secret@meet.example.com/private' }),
        lesson({ occurrenceAt: null }),
        lesson({ endTime: null }),
      ],
    });
    const fixture = TestBed.createComponent(StudentLessonBannerComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role=status]')).toBeNull();
  });

  it('hides immediately after the authenticated session is cleared', () => {
    now.set(start - 60_000);
    const fixture = TestBed.createComponent(StudentLessonBannerComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('a')).not.toBeNull();
    signedIn.set(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role=status]')).toBeNull();
    window.dispatchEvent(new Event('focus'));
    expect(fullSchedule).toHaveBeenCalledTimes(1);
  });

  it('refreshes quietly when focused and removes its automatic refresh listeners on teardown', () => {
    const fixture = TestBed.createComponent(StudentLessonBannerComponent);
    expect(fullSchedule).toHaveBeenCalledExactlyOnceWith(false);
    fullSchedule.mockReturnValue(throwError(() => new Error('Temporary outage')));
    expect(() => window.dispatchEvent(new Event('focus'))).not.toThrow();
    expect(fullSchedule).toHaveBeenLastCalledWith(true);
    const calls = fullSchedule.mock.calls.length;
    fixture.destroy();
    window.dispatchEvent(new Event('focus'));
    vi.advanceTimersByTime(60_000);
    expect(fullSchedule).toHaveBeenCalledTimes(calls);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('refreshes once a minute while visible and never starts background calls after logout', () => {
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    const fixture = TestBed.createComponent(StudentLessonBannerComponent);
    vi.advanceTimersByTime(59_999);
    expect(fullSchedule).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    expect(fullSchedule).toHaveBeenCalledTimes(2);
    expect(fullSchedule).toHaveBeenLastCalledWith(true);
    signedIn.set(false);
    vi.advanceTimersByTime(60_000);
    expect(fullSchedule).toHaveBeenCalledTimes(2);
    fixture.destroy();
  });
});
