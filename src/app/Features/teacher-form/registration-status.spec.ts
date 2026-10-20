import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { registrationResult, TeacherFormComponent } from './teacher-form.component';
import { TeacherService } from '../../core/services/teacher.service';

describe('Teacher application status', () => {
  it('uses the nested registration status rather than the envelope status', () => {
    expect(registrationResult({ status: 200, data: { status: 'Approved' } })?.status).toBe(
      'Approved',
    );
    expect(registrationResult({ status: 200, data: { status: 'Pending' } })?.status).toBe(
      'Pending',
    );
    expect(
      registrationResult({ res: { status: 'Rejected', rejectionReason: 'Review notes' } }),
    ).toEqual({ status: 'Rejected', reason: 'Review notes' });
  });
  it('never invents a pending status for malformed or failed responses', () => {
    expect(registrationResult({ status: 200, data: null })).toBeNull();
    expect(registrationResult({ success: false, data: { status: 'Approved' } })).toBeNull();
    expect(registrationResult({ data: { status: 'Unexpected' } })).toBeNull();
  });
  it('sends the documented numeric request ID and registered WhatsApp number', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    TestBed.inject(TeacherService).getRequestStatus('123', '+00000000000').subscribe();
    const backend = TestBed.inject(HttpTestingController);
    const request = backend.expectOne((req) => req.url.endsWith('/teacher-forms/123/status'));
    expect(request.request.params.get('whatsAppNumber')).toBe('+00000000000');
    request.flush({ success: true, data: { status: 'Pending' } });
    backend.verify();
  });
  it('requests only a numeric ID in the UI and shows the returned approved state', () => {
    TestBed.configureTestingModule({
      imports: [TeacherFormComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(TeacherFormComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    const backend = TestBed.inject(HttpTestingController);
    backend.expectOne('https://api.basstahali.com/api/v1/curricula').flush({ data: [] });
    component.requestIdInput = 'not-numeric';
    component.checkStatus();
    expect(component.statusError).toContain('الرقمي');
    component.requestIdInput = '123';
    expect(fixture.nativeElement.querySelector('#status-whatsapp')).toBeNull();
    component.statusWhatsAppInput = '+00000000000';
    component.checkStatus();
    const request = backend.expectOne((req) => req.url.endsWith('/teacher-forms/123/status'));
    request.flush({ status: 200, data: { status: 'Approved' } });
    fixture.detectChanges();
    expect(component.statusLoading).toBe(false);
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain(
      'تم قبول طلبك',
    );
    component.clearStatusResult();
    expect(component.requestStatusResult).toBeNull();
    backend.verify();
  });
});
