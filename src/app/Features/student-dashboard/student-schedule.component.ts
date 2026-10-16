import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  LOCALE_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, Subscription } from 'rxjs';
import { StudentService } from '../../core/student/student.service';
import type {
  StudentHomeSchedule,
  StudentPage,
  StudentSession,
} from '../../core/student/student.models';
import {
  createStudentCopy,
  localStudentDay,
  validStudentDay,
  safeLessonLink,
  studentDate,
  studentStatus,
  studentTime,
} from './student-ui';

@Component({
  selector: 'app-student-schedule',
  templateUrl: './student-schedule.component.html',
  styleUrls: ['./student-shared.css', './student-schedule.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentScheduleComponent {
  readonly copy = createStudentCopy();
  readonly locale = inject(LOCALE_ID);
  readonly selectedDate = signal(localStudentDay());
  readonly view = signal<'all' | 'day'>('all');
  readonly pageSize = 10;
  readonly pageNumber = signal(1);
  readonly page = signal<StudentPage<StudentSession> | null>(null);
  readonly homeSchedule = signal<StudentHomeSchedule | null>(null);
  readonly lessons = computed(() =>
    this.view() === 'all' ? (this.homeSchedule()?.items ?? []) : (this.page()?.items ?? []),
  );
  readonly loading = signal(false);
  readonly error = signal(false);
  readonly invalidDate = signal(false);
  readonly safeLink = safeLessonLink;
  readonly statusLabel = studentStatus;
  readonly hasNext = computed(() => {
    if (this.view() !== 'day') return false;
    const page = this.page();
    if (!page) return false;
    if (page.hasNextPage !== null) return page.hasNextPage;
    if (page.totalPages !== null && page.totalPages > 0) return this.pageNumber() < page.totalPages;
    const pageSize = page.pageSize !== null && page.pageSize > 0 ? page.pageSize : this.pageSize;
    return page.totalCount !== null && this.pageNumber() * pageSize < page.totalCount;
  });
  readonly hasPrevious = computed(
    () => this.view() === 'day' && this.pageNumber() > 1 && this.page()?.hasPreviousPage !== false,
  );
  readonly showPagination = computed(() => {
    if (this.view() !== 'day') return false;
    const page = this.page();
    return (
      page !== null &&
      (page.hasNextPage !== null ||
        page.hasPreviousPage !== null ||
        page.totalPages !== null ||
        page.totalCount !== null ||
        this.pageNumber() > 1)
    );
  });
  private readonly api = inject(StudentService);
  private readonly destroyRef = inject(DestroyRef);
  private request?: Subscription;

  constructor() {
    this.load();
  }

  date(value: string | null): string {
    return studentDate(value, this.locale);
  }
  number(value: number): string {
    return new Intl.NumberFormat(this.locale).format(value);
  }
  lessonTime(lesson: StudentSession): string {
    const start = studentTime(lesson.startTime, this.locale);
    const end = studentTime(lesson.endTime, this.locale);
    if (start) return [start, end].filter(Boolean).join(' – ');
    if (lesson.timeRange || lesson.timeSlot) return lesson.timeRange || lesson.timeSlot!;
    if (lesson.occurrenceAt && /T\d{2}:\d{2}/.test(lesson.occurrenceAt)) {
      const occurrence = new Date(lesson.occurrenceAt);
      if (Number.isFinite(occurrence.getTime())) {
        return new Intl.DateTimeFormat(this.locale, { hour: 'numeric', minute: '2-digit' }).format(
          occurrence,
        );
      }
    }
    return this.copy.notProvided;
  }

  lessonDay(lesson: StudentSession): string | null {
    const date = lesson.date || lesson.occurrenceAt;
    if (date) {
      const label = studentDate(date, this.locale);
      if (label !== this.copy.notProvided) return label;
    }
    const day = lesson.dayOfWeek || lesson.day;
    if (!day) return null;
    const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const index = weekdays.indexOf(day.trim().toLowerCase());
    return index < 0
      ? day
      : new Intl.DateTimeFormat(this.locale, { weekday: 'long', timeZone: 'UTC' }).format(
          new Date(Date.UTC(2024, 0, 7 + index)),
        );
  }

  recurrence(lesson: StudentSession): string | null {
    const labels: Record<string, string> = {
      once: this.copy.recurrenceOnce,
      daily: this.copy.recurrenceDaily,
      weekly: this.copy.recurrenceWeekly,
      monthly: this.copy.recurrenceMonthly,
    };
    return lesson.recurrenceType ? (labels[lesson.recurrenceType.toLowerCase()] ?? null) : null;
  }

  changeViewFromControl(event: Event): void {
    const control = event.target as HTMLInputElement;
    if (control.checked && (control.value === 'all' || control.value === 'day')) {
      this.changeView(control.value);
    }
  }

  changeView(view: 'all' | 'day'): void {
    if (view === this.view()) return;
    this.view.set(view);
    this.invalidDate.set(false);
    this.pageNumber.set(1);
    this.load();
  }

  changeDate(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.invalidDate.set(!validStudentDay(value));
    if (this.invalidDate() || value === this.selectedDate()) return;
    this.selectedDate.set(value);
    this.pageNumber.set(1);
    this.load();
  }

  today(): void {
    this.selectedDate.set(localStudentDay());
    this.view.set('day');
    this.invalidDate.set(false);
    this.pageNumber.set(1);
    this.load();
  }

  changePage(direction: -1 | 1): void {
    if (this.loading() || (direction === 1 ? !this.hasNext() : !this.hasPrevious())) return;
    this.pageNumber.update((page) => page + direction);
    this.load();
  }

  load(): void {
    this.request?.unsubscribe();
    this.loading.set(true);
    this.error.set(false);
    this.page.set(null);
    this.homeSchedule.set(null);
    if (this.view() === 'all') {
      this.request = this.api
        .getHomeSchedule()
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          finalize(() => this.loading.set(false)),
        )
        .subscribe({
          next: (schedule) => this.homeSchedule.set(schedule),
          error: () => this.error.set(true),
        });
      return;
    }
    this.request = this.api
      .getSchedule(this.selectedDate(), this.pageNumber(), this.pageSize)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({ next: (page) => this.page.set(page), error: () => this.error.set(true) });
  }
}
