import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  LOCALE_ID,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { finalize, Subscription } from 'rxjs';
import { PreferencesService } from '../../core/services/preferences.service';
import { StudentService } from '../../core/student/student.service';
import type { StudentCourse } from '../../core/student/student.models';
import { createStudentCopy, studentStatus } from './student-ui';

@Component({
  selector: 'app-student-courses',
  imports: [RouterLink],
  templateUrl: './student-courses.component.html',
  styleUrls: ['./student-shared.css', './student-courses.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentCoursesComponent {
  readonly copy = createStudentCopy();
  readonly preferences = inject(PreferencesService);
  readonly courses = signal<StudentCourse[]>([]);
  readonly loading = signal(false);
  readonly error = signal(false);
  readonly statusLabel = studentStatus;
  private readonly locale = inject(LOCALE_ID);
  private readonly api = inject(StudentService);
  private readonly destroyRef = inject(DestroyRef);
  private request?: Subscription;

  constructor() {
    this.load();
  }

  name(course: StudentCourse): string {
    return (
      this.preferences.itemName({
        nameAr: course.nameAr ?? undefined,
        nameEn: course.nameEn ?? undefined,
        name: course.name ?? undefined,
      }) ||
      course.subjectName ||
      this.copy.course
    );
  }
  number(value: number): string {
    return new Intl.NumberFormat(this.locale).format(value);
  }
  validProgress(value: number | null): boolean {
    return value !== null && value >= 0 && value <= 100;
  }

  load(): void {
    this.request?.unsubscribe();
    this.loading.set(true);
    this.error.set(false);
    this.courses.set([]);
    this.request = this.api
      .getCourses()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (page) => this.courses.set(page.items),
        error: () => this.error.set(true),
      });
  }
}
