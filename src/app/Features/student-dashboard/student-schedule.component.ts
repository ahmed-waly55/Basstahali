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
import type { StudentPage, StudentSession } from '../../core/student/student.models';
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
  readonly pageNumber = signal(1);
  readonly page = signal<StudentPage<StudentSession> | null>(null);
  readonly loading = signal(false);
  readonly error = signal(false);
  readonly invalidDate = signal(false);
  readonly safeLink = safeLessonLink;
  readonly statusLabel = studentStatus;
  readonly hasNext = computed(() => {
    const page = this.page();
    return (
      page?.hasNextPage === true ||
      (page?.hasNextPage === null &&
        page.totalPages !== null &&
        this.pageNumber() < page.totalPages)
    );
  });
  readonly hasPrevious = computed(
    () => this.pageNumber() > 1 && this.page()?.hasPreviousPage !== false,
  );
  readonly showPagination = computed(() => {
    const page = this.page();
    return (
      page !== null &&
      (page.hasNextPage !== null ||
        page.hasPreviousPage !== null ||
        page.totalPages !== null ||
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
    return start
      ? [start, end].filter(Boolean).join(' – ')
      : lesson.timeRange || this.copy.notProvided;
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
    this.request = this.api
      .getDailySchedule(this.selectedDate(), this.pageNumber(), 10)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({ next: (page) => this.page.set(page), error: () => this.error.set(true) });
  }
}
