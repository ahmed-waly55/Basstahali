import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { AuthError, AuthUser } from '../../core/auth/auth.models';
import { AuthService } from '../../core/auth/auth.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  const student: AuthUser = {
    id: 'test-student',
    userName: 'student',
    fullName: 'Test Student',
    email: 'student@example.invalid',
    roles: ['Student'],
  };
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let auth: {
    isAuthenticated: ReturnType<typeof signal<boolean>>;
    login: ReturnType<typeof vi.fn>;
  };
  let route: { snapshot: { queryParamMap: ReturnType<typeof convertToParamMap> } };
  let navigate: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    auth = { isAuthenticated: signal(false), login: vi.fn(() => of(student)) };
    route = { snapshot: { queryParamMap: convertToParamMap({}) } };
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        { provide: ActivatedRoute, useValue: route },
      ],
    }).compileComponents();
    navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
  });

  function create(returnUrl?: string): void {
    route.snapshot.queryParamMap = convertToParamMap(returnUrl ? { returnUrl } : {});
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  function fill(): void {
    component.form.setValue({ userName: 'student', password: 'test-password' });
  }

  it('rejects blank credentials locally and explains both required fields', () => {
    create();
    component.form.controls.userName.setValue('   ');
    component.submit();
    fixture.detectChanges();

    expect(auth.login).not.toHaveBeenCalled();
    expect(component.form.controls.userName.value).toBe('');
    expect(fixture.nativeElement.querySelector('#login-username-error')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#login-password-error')).toBeTruthy();
    expect(document.activeElement?.id).toBe('login-username');
  });

  it('trims only the username, prevents duplicate requests and returns to the student page', () => {
    create('/student?tab=subjects#active');
    const request = new Subject<AuthUser>();
    auth.login.mockReturnValue(request);
    component.form.setValue({ userName: '  student  ', password: ' test-password ' });

    component.submit();
    component.submit();
    fixture.detectChanges();

    expect(auth.login).toHaveBeenCalledExactlyOnceWith('student', ' test-password ');
    expect(component.pending()).toBe(true);
    expect(fixture.nativeElement.querySelector('fieldset').disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('button[type="submit"]').disabled).toBe(true);

    request.next(student);
    request.complete();
    expect(navigate).toHaveBeenCalledWith('/student?tab=subjects#active', { replaceUrl: true });
    expect(component.form.controls.password.value).toBe('');
    expect(component.pending()).toBe(false);
  });

  it('shows a typed credential error without navigating', () => {
    create();
    fill();
    auth.login.mockReturnValue(throwError(() => new AuthError('invalid-credentials')));
    component.submit();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      component.messages.authLoginInvalidCredentials,
    );
    expect(component.pending()).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('provides a fresh retry after a network failure and never renders raw error text', () => {
    create();
    fill();
    auth.login.mockReturnValueOnce(throwError(() => new Error('private-backend-detail')));
    component.submit();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(component.messages.authLoginUnavailable);
    expect(fixture.nativeElement.textContent).not.toContain('private-backend-detail');
    expect(fixture.nativeElement.querySelector('button[type="submit"]').textContent).toContain(
      component.messages.authLoginRetry,
    );

    component.submit();
    expect(auth.login).toHaveBeenCalledTimes(2);
    expect(navigate).toHaveBeenCalledWith('/student', { replaceUrl: true });
    expect(component.error()).toBeNull();
  });

  it('rejects an external return target after successful login', () => {
    create('https://example.invalid/student');
    fill();
    component.submit();
    expect(navigate).toHaveBeenCalledWith('/student', { replaceUrl: true });
  });

  it('takes an already authenticated student directly to their account', () => {
    auth.isAuthenticated.set(true);
    create('/student');
    expect(navigate).toHaveBeenCalledWith('/student', { replaceUrl: true });
    expect(auth.login).not.toHaveBeenCalled();
  });

  it('cancels a pending login when the view is destroyed', () => {
    create();
    fill();
    const request = new Subject<AuthUser>();
    auth.login.mockReturnValue(request);
    component.submit();
    expect(request.observed).toBe(true);

    fixture.destroy();
    expect(request.observed).toBe(false);
    request.next(student);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('toggles password visibility with an accessible state and label', () => {
    create();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector(
      'button[aria-controls="login-password"]',
    );
    const input: HTMLInputElement = fixture.nativeElement.querySelector('#login-password');
    expect(input.type).toBe('password');

    button.click();
    fixture.detectChanges();
    expect(input.type).toBe('text');
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.getAttribute('aria-label')).toBe(component.messages.authLoginHidePassword);
    expect(auth.login).not.toHaveBeenCalled();
  });
});
