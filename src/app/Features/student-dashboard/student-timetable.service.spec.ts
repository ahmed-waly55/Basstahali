import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import type { StudentHomeSchedule } from '../../core/student/student.models';
import { StudentService } from '../../core/student/student.service';
import { StudentTimetableService } from './student-timetable.service';

const home = (weekStart = '2026-10-11'): StudentHomeSchedule => ({
  items: [],
  weekStart,
  weekEnd: '2026-10-17',
});

describe('StudentTimetableService shared authenticated timetable', () => {
  let api: { getHomeSchedule: ReturnType<typeof vi.fn> };
  let auth: { hasSession: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
    api = { getHomeSchedule: vi.fn(() => of(home())) };
    auth = { hasSession: vi.fn(() => true) };
    TestBed.configureTestingModule({
      providers: [
        { provide: StudentService, useValue: api },
        { provide: AuthService, useValue: auth },
      ],
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('shares one pending request between the banner, timetable and simultaneous forced refreshes', () => {
    const response = new Subject<StudentHomeSchedule>();
    api.getHomeSchedule.mockReturnValue(response);
    const service = TestBed.inject(StudentTimetableService);
    const first = service.fullSchedule();
    const banner: StudentHomeSchedule[] = [];
    const table: StudentHomeSchedule[] = [];
    first.subscribe((value) => banner.push(value));
    expect(service.fullSchedule(true)).toBe(first);
    service.fullSchedule().subscribe((value) => table.push(value));
    expect(api.getHomeSchedule).toHaveBeenCalledTimes(1);
    const value = home();
    response.next(value);
    response.complete();
    expect(banner).toEqual([value]);
    expect(table).toEqual([value]);
    expect(service.home()).toBe(value);
    service.fullSchedule().subscribe((cached) => expect(cached).toBe(value));
    expect(api.getHomeSchedule).toHaveBeenCalledTimes(1);
  });

  it('keeps the old timetable until a single forced refresh replaces it for all views', () => {
    const service = TestBed.inject(StudentTimetableService);
    service.fullSchedule().subscribe();
    const previous = service.home();
    const response = new Subject<StudentHomeSchedule>();
    api.getHomeSchedule.mockReturnValue(response);
    const refresh = service.fullSchedule(true);
    refresh.subscribe();
    service.fullSchedule(true).subscribe();
    expect(service.home()).toBe(previous);
    expect(api.getHomeSchedule).toHaveBeenCalledTimes(2);
    const updated = home('2026-10-18');
    response.next(updated);
    response.complete();
    expect(service.home()).toBe(updated);
    service.fullSchedule().subscribe((value) => expect(value).toBe(updated));
    expect(api.getHomeSchedule).toHaveBeenCalledTimes(2);
  });

  it('retries after an error and preserves previously loaded data during a background failure', () => {
    const service = TestBed.inject(StudentTimetableService);
    api.getHomeSchedule.mockReturnValueOnce(throwError(() => new Error('Unavailable')));
    const error = vi.fn();
    service.fullSchedule().subscribe({ error });
    expect(error).toHaveBeenCalledTimes(1);
    expect(service.home()).toBeNull();
    service.fullSchedule().subscribe();
    const previous = service.home();
    expect(previous).not.toBeNull();
    api.getHomeSchedule.mockReturnValueOnce(throwError(() => new Error('Transient outage')));
    service.fullSchedule(true).subscribe({ error });
    expect(service.home()).toBe(previous);
    service.fullSchedule().subscribe();
    expect(api.getHomeSchedule).toHaveBeenCalledTimes(4);
  });

  it('never loads an unauthenticated timetable or adopts a response arriving after logout', () => {
    const response = new Subject<StudentHomeSchedule>();
    api.getHomeSchedule.mockReturnValue(response);
    const service = TestBed.inject(StudentTimetableService);
    service.fullSchedule().subscribe();
    auth.hasSession.mockReturnValue(false);
    response.next(home());
    response.complete();
    expect(service.home()).toBeNull();
    service.fullSchedule(true).subscribe();
    expect(api.getHomeSchedule).toHaveBeenCalledTimes(1);
  });

  it('does not let an older failure mark a retry as complete or create a competing forced request', () => {
    const failed = new Subject<StudentHomeSchedule>();
    const retry = new Subject<StudentHomeSchedule>();
    api.getHomeSchedule.mockReturnValueOnce(failed).mockReturnValue(retry);
    const service = TestBed.inject(StudentTimetableService);
    service.fullSchedule().subscribe({
      error: () => service.fullSchedule().subscribe(),
    });
    failed.error(new Error('Retry now'));
    service.fullSchedule(true).subscribe();
    expect(api.getHomeSchedule).toHaveBeenCalledTimes(2);
    const updated = home('2026-10-18');
    retry.next(updated);
    retry.complete();
    expect(service.home()).toBe(updated);
  });

  it('updates the admission clock every second and rereads the device timezone on focus', () => {
    vi.setSystemTime(new Date('2026-10-16T12:00:00Z'));
    let deviceZone = 'Africa/Cairo';
    const NativeDateTimeFormat = Intl.DateTimeFormat;
    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(function (locales, options) {
      return new NativeDateTimeFormat(locales, {
        ...options,
        timeZone: options?.timeZone || deviceZone,
      });
    });
    const service = TestBed.inject(StudentTimetableService);
    expect(service.now()).toBe(Date.parse('2026-10-16T12:00:00Z'));
    vi.advanceTimersByTime(1_000);
    expect(service.now()).toBe(Date.parse('2026-10-16T12:00:01Z'));
    deviceZone = 'Asia/Dubai';
    window.dispatchEvent(new Event('focus'));
    expect(service.timeZone()).toBe('Asia/Dubai');
  });

  it('cancels requests and removes its clock and focus listeners when the shell is destroyed', () => {
    const response = new Subject<StudentHomeSchedule>();
    api.getHomeSchedule.mockReturnValue(response);
    const service = TestBed.inject(StudentTimetableService);
    service.fullSchedule().subscribe();
    expect(response.observed).toBe(true);
    const current = service.now();
    TestBed.resetTestingModule();
    expect(response.observed).toBe(false);
    vi.advanceTimersByTime(5_000);
    window.dispatchEvent(new Event('focus'));
    expect(service.now()).toBe(current);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not start a browser clock or focus listener during server rendering', () => {
    TestBed.overrideProvider(PLATFORM_ID, { useValue: 'server' });
    const service = TestBed.inject(StudentTimetableService);
    const initial = service.now();
    vi.advanceTimersByTime(5_000);
    expect(service.now()).toBe(initial);
    expect(vi.getTimerCount()).toBe(0);
  });
});
