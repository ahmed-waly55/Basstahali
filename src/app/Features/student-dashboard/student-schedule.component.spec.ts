import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import type {
  StudentHomeSchedule,
  StudentPage,
  StudentSession,
} from '../../core/student/student.models';
import { StudentService } from '../../core/student/student.service';
import { StudentScheduleComponent } from './student-schedule.component';

function page(
  items: StudentSession[] = [],
  totalCount: number | null = null,
): StudentPage<StudentSession> {
  return {
    items,
    totalCount,
    pageNumber: null,
    pageSize: null,
    totalPages: null,
    hasPreviousPage: null,
    hasNextPage: null,
  };
}

function home(items: StudentSession[] = []): StudentHomeSchedule {
  return { items, weekStart: '2026-10-11', weekEnd: '2026-10-17' };
}

function lesson(subjectName: string): StudentSession {
  return {
    id: 'private-session-id',
    studentId: 'private-student-id',
    teacherName: 'معلم تجريبي',
    subjectName,
    date: null,
    day: null,
    dayOfWeek: 'Sunday',
    startTime: null,
    endTime: null,
    timeRange: null,
    timeSlot: '10:00 – 11:00',
    period: null,
    classLink: 'https://meet.example.com/lesson',
    status: null,
    occurrenceAt: null,
    courseName: null,
    paymentStatus: null,
    recurrenceType: 'Weekly',
    recurrenceEndDate: null,
    raw: {},
  };
}

describe('StudentScheduleComponent full and filtered schedule', () => {
  let api: { getHomeSchedule: ReturnType<typeof vi.fn>; getSchedule: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    api = { getHomeSchedule: vi.fn(() => of(home())), getSchedule: vi.fn(() => of(page())) };
    TestBed.configureTestingModule({
      imports: [StudentScheduleComponent],
      providers: [{ provide: StudentService, useValue: api }],
    });
  });

  it('opens the own home schedule without sending date or pagination parameters', () => {
    const fixture = TestBed.createComponent(StudentScheduleComponent);
    fixture.detectChanges();
    expect(api.getHomeSchedule).toHaveBeenCalledExactlyOnceWith();
    expect(api.getSchedule).not.toHaveBeenCalled();
    expect(fixture.componentInstance.view()).toBe('all');
    expect(fixture.nativeElement.querySelector('input[type=date]')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain(
      fixture.componentInstance.copy.noWeekLessons,
    );
    expect(fixture.nativeElement.querySelector('.student-schedule-week').textContent).toContain(
      fixture.componentInstance.date('2026-10-11'),
    );
    expect(fixture.nativeElement.querySelector('.student-pagination')).toBeNull();
  });

  it('restores a selected day through native radio and date events after recreating the view', () => {
    const original = TestBed.createComponent(StudentScheduleComponent);
    original.detectChanges();
    const dayControl = original.nativeElement.querySelector(
      '#student-schedule-view-day',
    ) as HTMLInputElement;
    dayControl.checked = true;
    dayControl.dispatchEvent(new Event('change', { bubbles: true }));
    original.detectChanges();
    const dateControl = original.nativeElement.querySelector(
      '#student-schedule-date',
    ) as HTMLInputElement;
    dateControl.value = '2026-11-02';
    dateControl.dispatchEvent(new Event('change', { bubbles: true }));
    const saved = { checked: dayControl.checked, date: dateControl.value };
    original.destroy();

    const restored = TestBed.createComponent(StudentScheduleComponent);
    restored.detectChanges();
    const restoredDay = restored.nativeElement.querySelector(
      '#student-schedule-view-day',
    ) as HTMLInputElement;
    restoredDay.checked = saved.checked;
    restoredDay.dispatchEvent(new Event('change', { bubbles: true }));
    restored.detectChanges();
    const restoredDate = restored.nativeElement.querySelector(
      '#student-schedule-date',
    ) as HTMLInputElement;
    expect(restoredDate).not.toBeNull();
    restoredDate.value = saved.date;
    restoredDate.dispatchEvent(new Event('input', { bubbles: true }));
    restoredDate.dispatchEvent(new Event('change', { bubbles: true }));
    restored.detectChanges();
    expect(restored.componentInstance.view()).toBe('day');
    expect(restored.componentInstance.selectedDate()).toBe('2026-11-02');
    expect(api.getSchedule).toHaveBeenLastCalledWith('2026-11-02', 1, 10);
    expect(restoredDay.checked).toBe(true);
    expect(restored.nativeElement.querySelector('#student-schedule-view-all').checked).toBe(false);
  });

  it('shows all returned home lessons without treating the weekly response as a paginated list', () => {
    api.getHomeSchedule.mockReturnValue(
      of(home(Array.from({ length: 12 }, (_, index) => lesson(`Lesson ${index + 1}`)))),
    );
    const fixture = TestBed.createComponent(StudentScheduleComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.student-lesson')).toHaveLength(12);
    expect(fixture.componentInstance.showPagination()).toBe(false);
    fixture.componentInstance.changePage(1);
    expect(api.getHomeSchedule).toHaveBeenCalledTimes(1);
    expect(api.getSchedule).not.toHaveBeenCalled();
  });

  it('requests a chosen day and resets pagination when the date or view changes', () => {
    api.getSchedule.mockReturnValue(of(page([], 23)));
    const component = TestBed.createComponent(StudentScheduleComponent).componentInstance;
    component.selectedDate.set('2026-10-16');
    component.changeView('day');
    expect(api.getSchedule).toHaveBeenLastCalledWith('2026-10-16', 1, 10);
    component.changePage(1);
    expect(api.getSchedule).toHaveBeenLastCalledWith('2026-10-16', 2, 10);
    component.changeDate({ target: { value: '2026-10-20' } } as unknown as Event);
    expect(api.getSchedule).toHaveBeenLastCalledWith('2026-10-20', 1, 10);
    component.changeView('all');
    expect(api.getHomeSchedule).toHaveBeenCalledTimes(2);
    expect(component.pageNumber()).toBe(1);
  });

  it('supports totalCount-only day pagination and retries a failed page without changing its filter', () => {
    api.getSchedule.mockReturnValue(of(page([], 23)));
    const component = TestBed.createComponent(StudentScheduleComponent).componentInstance;
    component.changeView('day');
    expect(component.showPagination()).toBe(true);
    expect(component.hasNext()).toBe(true);
    api.getSchedule.mockReturnValueOnce(throwError(() => new Error('Schedule is unavailable')));
    component.changePage(1);
    expect(component.error()).toBe(true);
    expect(component.loading()).toBe(false);
    component.load();
    expect(api.getSchedule).toHaveBeenLastCalledWith(component.selectedDate(), 2, 10);
    expect(component.error()).toBe(false);
    component.changePage(1);
    expect(component.pageNumber()).toBe(3);
    expect(component.hasNext()).toBe(false);
  });

  it('cancels a pending home request when choosing a day and ignores its late result', () => {
    const full = new Subject<StudentHomeSchedule>();
    const day = new Subject<StudentPage<StudentSession>>();
    api.getHomeSchedule.mockReturnValueOnce(full);
    api.getSchedule.mockReturnValueOnce(day);
    const fixture = TestBed.createComponent(StudentScheduleComponent);
    expect(full.observed).toBe(true);
    fixture.componentInstance.changeView('day');
    expect(full.observed).toBe(false);
    expect(day.observed).toBe(true);
    full.next(home([lesson('Old result')]));
    expect(fixture.componentInstance.lessons()).toEqual([]);
    day.next(page([lesson('Current result')]));
    day.complete();
    expect(fixture.componentInstance.lessons()[0].subjectName).toBe('Current result');
    expect(fixture.componentInstance.homeSchedule()).toBeNull();
    fixture.destroy();
    expect(day.observed).toBe(false);
  });

  it('uses a supplied occurrence time only when no explicit time range is available', () => {
    const component = TestBed.createComponent(StudentScheduleComponent).componentInstance;
    const item = { ...lesson('الرياضيات'), timeSlot: null, occurrenceAt: '2026-10-16T14:30:00Z' };
    const expected = new Intl.DateTimeFormat(TestBed.inject(LOCALE_ID), {
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(item.occurrenceAt));
    expect(component.lessonTime(item)).toBe(expected);
    expect(component.lessonTime({ ...item, occurrenceAt: '2026-10-16' })).toBe(
      component.copy.notProvided,
    );
  });

  it('shows supplied weekdays and recurrence without inventing dates, status or identifiers', () => {
    api.getHomeSchedule.mockReturnValue(of(home([lesson('الرياضيات')])));
    const fixture = TestBed.createComponent(StudentScheduleComponent);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    const item = root.querySelector('.student-lesson')!;
    const expectedWeekday = new Intl.DateTimeFormat(TestBed.inject(LOCALE_ID), {
      weekday: 'long',
      timeZone: 'UTC',
    }).format(new Date(Date.UTC(2024, 0, 7)));
    expect(item.textContent).toContain(expectedWeekday);
    expect(item.textContent).toContain(fixture.componentInstance.copy.recurrenceWeekly);
    expect(item.textContent).toContain('10:00 – 11:00');
    expect(item.textContent).not.toContain('2024');
    expect(item.textContent).not.toContain(fixture.componentInstance.copy.status + ':');
    expect(root.textContent).not.toContain('private-session-id');
    expect(root.textContent).not.toContain('private-student-id');
    expect(root.querySelector('a[target=_blank]')?.getAttribute('href')).toBe(
      'https://meet.example.com/lesson',
    );
  });
});
