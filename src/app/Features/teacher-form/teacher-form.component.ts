import { PreferencesService } from '../../core/services/preferences.service';
import { TranslatePipe } from '../../core/services/translate.pipe';
import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
  FormsModule,
} from '@angular/forms';
import { Subject, Subscription, finalize, takeUntil } from 'rxjs';
import Swal, { type SweetAlertOptions } from 'sweetalert2';
import { TeacherService } from '../../core/services/teacher.service';

export type RegistrationStatus = 'Pending' | 'Approved' | 'Rejected';
export interface RegistrationResult {
  status: RegistrationStatus;
  reason: string;
}
export function registrationResult(response: any): RegistrationResult | null {
  if (response?.success === false) return null;
  const payload = response?.data ?? response?.res ?? response;
  const status = typeof payload === 'string' ? payload : payload?.status;
  const normalized = typeof status === 'string' ? status.trim().toLowerCase() : '';
  const statuses: Record<string, RegistrationStatus> = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
  };
  if (!statuses[normalized]) return null;
  return {
    status: statuses[normalized],
    reason: typeof payload?.rejectionReason === 'string' ? payload.rejectionReason : '',
  };
}

@Component({
  selector: 'app-teacher-form',
  standalone: true,
  imports: [TranslatePipe, CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './teacher-form.component.html',
  styleUrl: './teacher-form.component.css',
})
export class TeacherFormComponent implements OnInit, OnDestroy {
  preferences = inject(PreferencesService);

  private destroy$ = new Subject<void>();

  // تعريف الـ FormGroup الرئيسي للفورم
  teacherForm!: FormGroup;

  // القوائم للجلب من الـ API
  curriculaList: any[] = [];
  gradeLevelsList: any[] = [];
  subjectsList: any[] = [];

  // متغيرات لمتابعة حالة الطلب
  requestIdInput: string = '';
  requestStatusResult: RegistrationResult | null = null;
  statusWhatsAppInput = '';
  statusLoading = false;
  statusError = '';
  submitting = false;
  private statusSubscription?: Subscription;
  get statusLabel(): string {
    return this.requestStatusResult?.status === 'Approved'
      ? 'تم قبول طلبك'
      : this.requestStatusResult?.status === 'Rejected'
        ? 'تم رفض الطلب'
        : 'الطلب قيد المراجعة';
  }
  clearStatusResult(): void {
    this.statusSubscription?.unsubscribe();
    this.requestStatusResult = null;
    this.statusError = '';
  }

  constructor(
    private fb: FormBuilder,
    private teacherService: TeacherService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadCurricula();
    this.setupFormListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // تهيئة الفورم وحقوله
  private initForm() {
    this.teacherForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      whatsAppNumber: ['', Validators.required],
      payoutMethod: ['', Validators.required],
      payoutAccount: ['', Validators.required],
      curriculumId: ['', Validators.required],
      gradeLevelId: [{ value: '', disabled: true }, Validators.required],
      subjectIds: this.fb.array([], Validators.required), // لحفظ المواد المختارة كـ FormArray
    });
  }

  // مراقبة التغييرات في المنهج والمرحلة الدراسية لتحديث القوائم تلقائياً
  private setupFormListeners() {
    // عند تغير المنهج الدراسي
    this.teacherForm
      .get('curriculumId')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((curriculumId) => {
        this.ngZone.run(() => {
          this.teacherForm.get('gradeLevelId')?.setValue('');
          this.teacherForm.get('gradeLevelId')?.disable();
          this.gradeLevelsList = [];
          this.subjectsList = [];
          this.clearSubjectIds();

          if (curriculumId) {
            this.teacherService
              .getGradeLevels(curriculumId)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (response: any) => {
                  this.ngZone.run(() => {
                    this.gradeLevelsList = response.data || [];
                    this.teacherForm.get('gradeLevelId')?.enable();
                    this.cdr.markForCheck();
                  });
                },
                error: (err) => console.error('خطأ في جلب المراحل:', err),
              });
          }
          this.cdr.markForCheck();
        });
      });

    // عند تغير المرحلة الدراسية
    this.teacherForm
      .get('gradeLevelId')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((gradeLevelId) => {
        this.ngZone.run(() => {
          this.clearSubjectIds();
          this.subjectsList = [];

          if (gradeLevelId) {
            this.teacherService
              .getSubjects(gradeLevelId)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (response: any) => {
                  this.ngZone.run(() => {
                    this.subjectsList = response.data || [];
                    this.cdr.markForCheck();
                  });
                },
                error: (err) => console.error('خطأ في جلب المواد:', err),
              });
          }
          this.cdr.markForCheck();
        });
      });
  }

  // الحصول على FormArray الخاص بالمواد
  get subjectIdsArray(): FormArray {
    return this.teacherForm.get('subjectIds') as FormArray;
  }

  // تفريغ المواد المختارة
  private clearSubjectIds() {
    while (this.subjectIdsArray.length !== 0) {
      this.subjectIdsArray.removeAt(0);
    }
  }

  // التحقق هل المادة محددة أم لا
  isSubjectSelected(subjectId: string): boolean {
    return this.subjectIdsArray.value.includes(subjectId);
  }

  // التعامل مع تحديد المواد عبر الـ Checkboxes
  onSubjectCheckboxChange(subjectId: string, event: any) {
    this.ngZone.run(() => {
      const array = this.subjectIdsArray;
      if (event.target.checked) {
        if (!array.value.includes(subjectId)) {
          array.push(this.fb.control(subjectId));
        }
      } else {
        const index = array.controls.findIndex((x) => x.value === subjectId);
        if (index !== -1) {
          array.removeAt(index);
        }
      }
      array.updateValueAndValidity();
      this.cdr.markForCheck();
    });
  }

  // جلب المناهج عند التحميل
  loadCurricula() {
    this.teacherService
      .getCurricula()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.ngZone.run(() => {
            this.curriculaList = response.data || [];
            this.cdr.markForCheck();
          });
        },
        error: (err) => console.error('خطأ في جلب المناهج:', err),
      });
  }

  // إرسال طلب التسجيل (POST)
  onSubmit() {
    if (this.submitting) return;
    if (this.teacherForm.invalid) {
      this.teacherForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const whatsAppNumber = this.teacherForm.value.whatsAppNumber;
    this.teacherService
      .submitTeacherForm(this.teacherForm.value)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.submitting = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (response: any) => {
          const payload = response?.data ?? response?.res ?? response;
          const reqId = payload?.requestId ?? payload?.id;
          if (reqId !== undefined && reqId !== null) this.requestIdInput = String(reqId);
          this.statusWhatsAppInput = whatsAppNumber;
          this.clearStatusResult();

          this.showAlert({
            icon: 'success',
            title: this.preferences.translate('تم إرسال طلبك بنجاح!'),
            text:
              reqId !== undefined && reqId !== null
                ? `${this.preferences.translate('رقم الطلب الخاص بك')}: ${reqId}`
                : this.preferences.translate('تم إرسال طلبك بنجاح!'),
            confirmButtonText: this.preferences.translate('حسناً'),
          });
          this.teacherForm.reset();
          this.clearSubjectIds();
        },
        error: (error) => {
          const errorMessage =
            error?.error?.message ||
            'حدث خطأ أثناء إرسال الطلب، تأكد من صحة البيانات والمحاولة مرة أخرى.';

          this.showAlert({
            icon: 'error',
            title: this.preferences.translate('عذراً!'),
            text: errorMessage,
            confirmButtonText: this.preferences.translate('موافق'),
          });
          console.error(error);
        },
      });
  }

  private showAlert(options: SweetAlertOptions) {
    return Swal.fire({
      ...options,
      buttonsStyling: false,
      showCloseButton: true,
      closeButtonAriaLabel: this.preferences.translate('إغلاق'),
      backdrop: 'rgba(20, 12, 37, 0.5)',
      customClass: {
        popup: 'basstahali-dialog',
        title: 'basstahali-dialog__title',
        htmlContainer: 'basstahali-dialog__message',
        actions: 'basstahali-dialog__actions',
        confirmButton: 'basstahali-dialog__confirm',
        closeButton: 'basstahali-dialog__close',
      },
    });
  }

  checkStatus(): void {
    if (this.statusLoading) return;
    this.statusError = '';
    this.requestStatusResult = null;
    const requestId = this.requestIdInput.trim();
    const number =
      this.statusWhatsAppInput.trim() ||
      String(this.teacherForm.get('whatsAppNumber')?.value ?? '').trim();
    if (!/^[1-9]\d*$/.test(requestId) || Number(requestId) > 2147483647) {
      this.statusError = 'أدخل رقم الطلب الرقمي الذي حصلت عليه بعد التسجيل.';
      return;
    }
    this.statusLoading = true;
    this.statusSubscription = this.teacherService
      .getRequestStatus(requestId, number)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.statusLoading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          this.requestStatusResult = registrationResult(response);
          if (!this.requestStatusResult)
            this.statusError = 'تعذر قراءة حالة الطلب. حاول مرة أخرى أو تواصل مع الدعم.';
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.statusError =
            error.status === 400 &&
            error.error?.errors?.some((item: any) => item.field === 'whatsAppNumber')
              ? 'تعذر متابعة الطلب حاليًا. تواصل مع الدعم للمساعدة.'
              : error.status === 400 || error.status === 403 || error.status === 404
                ? 'تأكد من رقم الطلب الذي حصلت عليه بعد التسجيل.'
                : 'تعذر الاتصال بالخدمة. حاول مرة أخرى بعد قليل.';
          this.cdr.markForCheck();
        },
      });
  }
}
