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
import { RouterLink } from '@angular/router';
import { finalize, Subscription } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { StudentService } from '../../core/student/student.service';
import type { StudentSession, StudentStat } from '../../core/student/student.models';
import {
  lessonPresentation,
  studentSourceDay,
  studentTimeZoneLabel,
} from './student-lesson-display';
import { StudentTimetableService } from './student-timetable.service';
import { createStudentCopy, studentDate, studentStatus } from './student-ui';

@Component({
  selector: 'app-student-overview',
  imports: [RouterLink],
  templateUrl: './student-overview.component.html',
  styleUrls: ['./student-shared.css', './student-overview.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentOverviewComponent {
  readonly copy = createStudentCopy();
  readonly auth = inject(AuthService);
  readonly locale = inject(LOCALE_ID);
  readonly today = studentSourceDay();
  readonly timetable = inject(StudentTimetableService);
  readonly supportLink = `https://wa.me/971563306087?text=${encodeURIComponent(this.copy.supportMessage)}`;
  readonly stats = signal<StudentStat[]>([]);
  readonly sessions = signal<StudentSession[]>([]);
  readonly statsLoading = signal(false);
  readonly lessonsLoading = signal(false);
  readonly statsError = signal(false);
  readonly lessonsError = signal(false);
  readonly statusLabel = studentStatus;
  readonly timeZoneLabel = computed(() =>
    studentTimeZoneLabel(this.timetable.timeZone(), this.locale, this.timetable.now()),
  );
  readonly rows = computed(() =>
    this.sessions().map((lesson) =>
      lessonPresentation(
        lesson,
        {
          now: this.timetable.now(),
          timeZone: this.timetable.timeZone(),
          selectedDate: this.today,
        },
        this.locale,
      ),
    ),
  );
  private readonly api = inject(StudentService);
  private readonly destroyRef = inject(DestroyRef);
  private statsRequest?: Subscription;
  private lessonsRequest?: Subscription;

  constructor() {
    this.loadStats();
    this.loadLessons();
  }

  date(value: string | null): string {
    return studentDate(value, this.locale);
  }
  number(value: number | null): string {
    return value === null
      ? this.copy.notProvided
      : new Intl.NumberFormat(this.locale).format(value);
  }
  loadStats(): void {
    this.statsRequest?.unsubscribe();
    this.statsLoading.set(true);
    this.statsError.set(false);
    this.stats.set([]);
    this.statsRequest = this.api
      .getDashboard()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.statsLoading.set(false)),
      )
      .subscribe({
        next: (dashboard) => this.stats.set(dashboard.stats.filter((stat) => stat.value !== null)),
        error: () => this.statsError.set(true),
      });
  }

  loadLessons(): void {
    this.lessonsRequest?.unsubscribe();
    this.lessonsLoading.set(true);
    this.lessonsError.set(false);
    this.sessions.set([]);
    this.lessonsRequest = this.api
      .getDailySchedule(this.today, 1, 4)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.lessonsLoading.set(false)),
      )
      .subscribe({
        next: (page) => this.sessions.set(page.items),
        error: () => this.lessonsError.set(true),
      });
  }
}
