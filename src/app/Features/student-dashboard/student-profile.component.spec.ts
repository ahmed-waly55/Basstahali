import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { adaptStudentProfile, StudentService } from '../../core/student/student.service';
import { StudentProfileComponent } from './student-profile.component';

describe('StudentProfileComponent', () => {
  let response: Subject<unknown>;
  let api: { getProfile: ReturnType<typeof vi.fn>; changePassword: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    response = new Subject<unknown>();
    api = {
      getProfile: vi.fn(() => throwError(() => new Error('Profile is unavailable'))),
      changePassword: vi.fn(() => response),
    };
    TestBed.configureTestingModule({
      imports: [StudentProfileComponent],
      providers: [{ provide: StudentService, useValue: api }],
    });
  });

  it('renders actual session counts and zero balances without exposing private profile fields', () => {
    const studentId = 'f1f2f3a4-1111-4222-8333-444455556666';
    const curriculumId = 'c1c2c3a4-1111-4222-8333-444455556666';
    const setupToken = 'private-profile-setup-token';
    api.getProfile.mockReturnValue(
      of(
        adaptStudentProfile({
          id: studentId,
          userName: 'student_sample',
          fullName: 'حساب طالب تجريبي',
          curriculumId,
          gradeLevelId: 'a1a2a3a4-1111-4222-8333-444455556666',
          educationStageId: null,
          initialPasswordSetupToken: setupToken,
          sessions: { totalSessions: 2, usedSessions: 0, remainingSessions: 2 },
          subscriptionMode: 'Sessions',
          sessionCreditBalance: 2,
          regularSessionCreditBalance: 0,
          courseSessionCreditBalance: 0,
          compensatorySessionCreditBalance: 2,
          compensatoryCreditsAdded: 2,
          expirationDate: null,
          compensatoryCredits: [
            { quantity: 2, remaining: 0, reason: 'تعويض حصة', expiresAt: null },
          ],
        }),
      ),
    );
    const fixture = TestBed.createComponent(StudentProfileComponent);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    const copy = fixture.componentInstance.copy;
    const format = new Intl.NumberFormat(TestBed.inject(LOCALE_ID));
    const fieldValue = (label: string) =>
      Array.from(root.querySelectorAll('dl > div'))
        .find((field) => field.querySelector('dt')?.textContent?.trim() === label)
        ?.querySelector('dd')
        ?.textContent?.trim();
    expect(fieldValue(copy.totalSessions)).toBe(format.format(2));
    expect(fieldValue(copy.usedSessions)).toBe(format.format(0));
    expect(fieldValue(copy.remainingSessions)).toBe(format.format(2));
    expect(fieldValue(copy.regularCreditBalance)).toBe(format.format(0));
    expect(fieldValue(copy.courseCreditBalance)).toBe(format.format(0));
    expect(fieldValue(copy.compensatoryCreditBalance)).toBe(format.format(2));
    expect(fieldValue(copy.creditRemaining)).toBe(format.format(0));
    expect(fieldValue(copy.expiration)).toBe(copy.notProvided);
    expect(root.textContent).toContain(copy.subscriptionBySessions);
    for (const privateValue of [studentId, curriculumId, setupToken]) {
      expect(root.textContent).not.toContain(privateValue);
    }
  });

  it('prevents an incomplete or mismatched password submission', () => {
    const component = TestBed.createComponent(StudentProfileComponent).componentInstance;
    component.changePassword();
    component.passwordForm.setValue({
      currentPassword: 'current',
      newPassword: 'new-password',
      confirmation: 'different-password',
    });
    component.changePassword();
    expect(api.changePassword).not.toHaveBeenCalled();
  });

  it('sends exact password values once and clears the form after confirmation', () => {
    const component = TestBed.createComponent(StudentProfileComponent).componentInstance;
    component.passwordForm.setValue({
      currentPassword: ' current ',
      newPassword: ' new ',
      confirmation: ' new ',
    });
    component.changePassword();
    component.changePassword();
    expect(api.changePassword).toHaveBeenCalledExactlyOnceWith(' current ', ' new ');
    expect(component.changingPassword()).toBe(true);
    response.next({});
    response.complete();
    expect(component.passwordForm.getRawValue()).toEqual({
      currentPassword: '',
      newPassword: '',
      confirmation: '',
    });
    expect(component.passwordSuccess()).toBe(true);
    expect(component.changingPassword()).toBe(false);
  });

  it('clears password fields and cancels the pending subscription when leaving the page', () => {
    const fixture = TestBed.createComponent(StudentProfileComponent);
    fixture.componentInstance.passwordForm.setValue({
      currentPassword: 'current',
      newPassword: 'next',
      confirmation: 'next',
    });
    fixture.componentInstance.changePassword();
    expect(response.observed).toBe(true);
    fixture.destroy();
    expect(response.observed).toBe(false);
    expect(fixture.componentInstance.passwordForm.getRawValue()).toEqual({
      currentPassword: '',
      newPassword: '',
      confirmation: '',
    });
  });
});
