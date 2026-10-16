import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { PreferencesService } from '../../core/services/preferences.service';
import { createStudentCopy } from './student-ui';
import { StudentLessonBannerComponent } from './student-lesson-banner.component';
import { StudentTimetableService } from './student-timetable.service';

@Component({
  selector: 'app-student-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, StudentLessonBannerComponent],
  providers: [StudentTimetableService],
  templateUrl: './student-shell.component.html',
  styleUrls: ['./student-shared.css', './student-shell.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentShellComponent {
  readonly auth = inject(AuthService);
  readonly preferences = inject(PreferencesService);
  readonly copy = createStudentCopy();
  readonly signingOut = signal(false);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly navigation = [
    {
      path: '/student',
      label: this.copy.overview,
      exact: true,
      icon: 'M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z',
    },
    {
      path: '/student/schedule',
      label: this.copy.schedule,
      exact: false,
      icon: 'M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z',
    },
    {
      path: '/student/courses',
      label: this.copy.courses,
      exact: false,
      icon: 'm2 7 10-4 10 4-10 4L2 7Zm4 3v7c3 3 9 3 12 0v-7M22 7v8',
    },
    {
      path: '/student/assignments',
      label: this.copy.assignments,
      exact: false,
      icon: 'M9 5H5v16h14V5h-4M9 3h6v4H9V3Zm-1 9h8m-8 4h5',
    },
    {
      path: '/student/exams',
      label: this.copy.exams,
      exact: false,
      icon: 'M14 2H5v20h14V7l-5-5Zm0 0v6h5M8 13h8m-8 4h5',
    },
    {
      path: '/student/messages',
      label: this.copy.messages,
      exact: false,
      icon: 'M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z',
    },
    {
      path: '/student/profile',
      label: this.copy.profile,
      exact: false,
      icon: 'M20 21v-2a7 7 0 0 0-14 0v2M13 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
    },
  ];
  readonly supportLink = `https://wa.me/971563306087?text=${encodeURIComponent(this.copy.supportMessage)}`;

  logout(): void {
    if (this.signingOut()) return;
    this.signingOut.set(true);
    this.auth
      .logout()
      .pipe(
        catchError(() => of(undefined)),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.signingOut.set(false)),
      )
      .subscribe(() => void this.router.navigate(['/login']));
  }
}
