import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthError, safeReturnUrl } from '../../core/auth/auth.models';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit {
  readonly messages = {
    authLoginBadge: $localize`:@@authLoginBadge:مساحة الطالب`,
    authLoginIntroTitle: $localize`:@@authLoginIntroTitle:مساحتك للتعلّم`,
    authLoginIntroDescription: $localize`:@@authLoginIntroDescription:ادخل لحسابك وتابع رحلتك مع بسطهالي.`,
    authLoginTitle: $localize`:@@authLoginTitle:أهلًا بعودتك`,
    authLoginDescription: $localize`:@@authLoginDescription:سجّل دخولك للوصول إلى حسابك الدراسي.`,
    authLoginUsername: $localize`:@@authLoginUsername:اسم المستخدم`,
    authLoginUsernamePlaceholder: $localize`:@@authLoginUsernamePlaceholder:أدخل اسم المستخدم`,
    authLoginUsernameRequired: $localize`:@@authLoginUsernameRequired:أدخل اسم المستخدم.`,
    authLoginPassword: $localize`:@@authLoginPassword:كلمة المرور`,
    authLoginPasswordPlaceholder: $localize`:@@authLoginPasswordPlaceholder:أدخل كلمة المرور`,
    authLoginPasswordRequired: $localize`:@@authLoginPasswordRequired:أدخل كلمة المرور.`,
    authLoginShowPassword: $localize`:@@authLoginShowPassword:إظهار كلمة المرور`,
    authLoginHidePassword: $localize`:@@authLoginHidePassword:إخفاء كلمة المرور`,
    authLoginSubmit: $localize`:@@authLoginSubmit:تسجيل الدخول`,
    authLoginPending: $localize`:@@authLoginPending:جارٍ تسجيل الدخول...`,
    authLoginRetry: $localize`:@@authLoginRetry:إعادة المحاولة`,
    authLoginErrorTitle: $localize`:@@authLoginErrorTitle:تعذر تسجيل الدخول`,
    authLoginInvalidCredentials: $localize`:@@authLoginInvalidCredentials:اسم المستخدم أو كلمة المرور غير صحيحة.`,
    authLoginStudentOnly: $localize`:@@authLoginStudentOnly:هذه المساحة مخصصة لحسابات الطلاب. تواصل معنا للمساعدة.`,
    authLoginInvalidResponse: $localize`:@@authLoginInvalidResponse:تعذر إكمال تسجيل الدخول. حاول مرة أخرى.`,
    authLoginSessionExpired: $localize`:@@authLoginSessionExpired:انتهت صلاحية جلستك. سجّل الدخول من جديد.`,
    authLoginUnavailable: $localize`:@@authLoginUnavailable:تعذر الاتصال بالمنصة. تحقق من اتصالك ثم حاول مرة أخرى.`,
    authLoginHelp: $localize`:@@authLoginHelp:تحتاج مساعدة في الدخول؟`,
    authLoginSupport: $localize`:@@authLoginSupport:تواصل معنا على واتساب`,
    authLoginNewAccount: $localize`:@@authLoginNewAccount:ليس لديك حساب؟`,
    authLoginRegister: $localize`:@@authLoginRegister:اطلب التسجيل`,
  };

  readonly supportLink =
    'https://wa.me/971563306087?text=' +
    encodeURIComponent(
      $localize`:@@authLoginSupportMessage:السلام عليكم، أحتاج مساعدة في الدخول إلى حسابي على بسطهالي.`,
    );
  readonly registrationLink =
    'https://wa.me/971563306087?text=' +
    encodeURIComponent(
      $localize`:@@authLoginRegistrationMessage:السلام عليكم، أرغب في إنشاء حساب طالب على بسطهالي.`,
    );

  readonly form = new FormGroup({
    userName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
  readonly pending = signal(false);
  readonly passwordVisible = signal(false);
  readonly error = signal<AuthError['code'] | null>(null);
  readonly errorMessage = computed(() => {
    switch (this.error()) {
      case 'invalid-credentials':
        return this.messages.authLoginInvalidCredentials;
      case 'student-only':
        return this.messages.authLoginStudentOnly;
      case 'invalid-response':
        return this.messages.authLoginInvalidResponse;
      case 'session-expired':
        return this.messages.authLoginSessionExpired;
      case 'unavailable':
        return this.messages.authLoginUnavailable;
      default:
        return '';
    }
  });

  @ViewChild('userNameInput') private userNameInput?: ElementRef<HTMLInputElement>;
  @ViewChild('passwordInput') private passwordInput?: ElementRef<HTMLInputElement>;

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly returnUrl = safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) this.navigateToAccount();
  }

  togglePassword(): void {
    this.passwordVisible.update((visible) => !visible);
  }

  submit(): void {
    if (this.pending()) return;

    const { userName, password } = this.form.controls;
    userName.setValue(userName.value.trim(), { emitEvent: false });
    this.form.markAllAsTouched();
    this.error.set(null);

    if (this.form.invalid) {
      (userName.invalid ? this.userNameInput : this.passwordInput)?.nativeElement.focus();
      return;
    }

    this.pending.set(true);
    this.auth
      .login(userName.value, password.value)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.pending.set(false)),
      )
      .subscribe({
        next: () => {
          password.reset('');
          this.navigateToAccount();
        },
        error: (error: unknown) => {
          this.error.set(error instanceof AuthError ? error.code : 'unavailable');
        },
      });
  }

  private navigateToAccount(): void {
    void this.router.navigateByUrl(this.returnUrl, { replaceUrl: true });
  }
}
