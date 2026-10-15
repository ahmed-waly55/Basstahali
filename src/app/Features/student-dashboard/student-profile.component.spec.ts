import { TestBed } from '@angular/core/testing';
import { Subject, throwError } from 'rxjs';
import { StudentService } from '../../core/student/student.service';
import { StudentProfileComponent } from './student-profile.component';

describe('StudentProfileComponent password changes', () => {
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
