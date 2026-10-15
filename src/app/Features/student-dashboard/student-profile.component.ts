import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  LOCALE_ID,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { finalize, Subscription } from 'rxjs';
import { StudentService } from '../../core/student/student.service';
import type { StudentProfile } from '../../core/student/student.models';
import { createStudentCopy, studentDate, studentStatus } from './student-ui';

function matchingPasswords(control: AbstractControl): ValidationErrors | null {
  return control.get('newPassword')?.value === control.get('confirmation')?.value
    ? null
    : { passwordMismatch: true };
}

@Component({
  selector: 'app-student-profile',
  imports: [ReactiveFormsModule],
  templateUrl: './student-profile.component.html',
  styleUrls: ['./student-shared.css', './student-profile.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentProfileComponent {
  readonly copy = createStudentCopy();
  readonly profile = signal<StudentProfile | null>(null);
  readonly loading = signal(false);
  readonly error = signal(false);
  readonly changingPassword = signal(false);
  readonly passwordError = signal(false);
  readonly passwordSuccess = signal(false);
  readonly statusLabel = studentStatus;
  readonly passwordForm = inject(FormBuilder).nonNullable.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', Validators.required],
      confirmation: ['', Validators.required],
    },
    { validators: matchingPasswords },
  );
  readonly supportLink = `https://wa.me/971563306087?text=${encodeURIComponent(this.copy.updateProfileText)}`;
  private readonly api = inject(StudentService);
  private readonly locale = inject(LOCALE_ID);
  private readonly destroyRef = inject(DestroyRef);
  private request?: Subscription;

  constructor() {
    this.load();
    this.destroyRef.onDestroy(() => this.passwordForm.reset());
  }

  date(value: string | null): string {
    return studentDate(value, this.locale);
  }
  number(value: number | null): string {
    return value === null
      ? this.copy.notProvided
      : new Intl.NumberFormat(this.locale).format(value);
  }

  load(): void {
    this.request?.unsubscribe();
    this.loading.set(true);
    this.error.set(false);
    this.profile.set(null);
    this.request = this.api
      .getProfile()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (profile) => this.profile.set(profile),
        error: () => this.error.set(true),
      });
  }

  changePassword(): void {
    if (this.changingPassword()) return;
    this.passwordSuccess.set(false);
    this.passwordError.set(false);
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    const { currentPassword, newPassword } = this.passwordForm.getRawValue();
    this.changingPassword.set(true);
    this.api
      .changePassword(currentPassword, newPassword)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.changingPassword.set(false)),
      )
      .subscribe({
        next: () => {
          this.passwordForm.reset();
          this.passwordSuccess.set(true);
        },
        error: () => {
          this.passwordForm.controls.currentPassword.reset();
          this.passwordError.set(true);
        },
      });
  }
}
