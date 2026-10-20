import { PreferencesService } from '../../core/services/preferences.service';
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
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './teacher-form.component.html',
  styleUrl: './teacher-form.component.css',
})
export class TeacherFormComponent implements OnInit, OnDestroy {
  readonly messages = {
    m_c487aa009b97: $localize`:@@m_c487aa009b97:طلب الانضمام`,
    m_81dd7c16d7c7: $localize`:@@m_81dd7c16d7c7:انضم لمنصتنا الرائدة وعلم بطريقة أذكى`,
    m_e19b16bdb71a: $localize`:@@m_e19b16bdb71a:الاسم الكامل`,
    m_0915ef8ea533: $localize`:@@m_0915ef8ea533:البريد الإلكتروني`,
    m_7ba22cf7e99d: $localize`:@@m_7ba22cf7e99d:كلمة المرور`,
    m_6a2b8df8483a: $localize`:@@m_6a2b8df8483a:رقم الواتساب`,
    m_3fd0d66f7b3b: $localize`:@@m_3fd0d66f7b3b:طريقة الدفع المفضلة`,
    m_c073b7b6bd0e: $localize`:@@m_c073b7b6bd0e:اختر طريقة الدفع`,
    m_d6c70fa86ae6: $localize`:@@m_d6c70fa86ae6:محفظة إلكترونية (Wallet)`,
    m_4b8a64045d21: $localize`:@@m_4b8a64045d21:حساب بنكي (BankAccount)`,
    m_309e352a442d: $localize`:@@m_309e352a442d:حساب الدفع`,
    m_173cce3ff639: $localize`:@@m_173cce3ff639:المنهج الدراسي`,
    m_e3c20fce1b7e: $localize`:@@m_e3c20fce1b7e:اختر المنهج الدراسي`,
    m_008f7f5eff27: $localize`:@@m_008f7f5eff27:المستوى أو المرحلة الدراسية`,
    m_f0065a356387: $localize`:@@m_f0065a356387:اختر المرحلة الدراسية`,
    m_87e502d1caf5: $localize`:@@m_87e502d1caf5:المواد الدراسية (يمكن اختيار أكثر من مادة)`,
    m_062161fbd262: $localize`:@@m_062161fbd262:يرجى اختيار المرحلة الدراسية أولاً لعرض المواد المتاحة.`,
    m_17239dab0c30: $localize`:@@m_17239dab0c30:لا توجد مواد دراسية متاحة لهذه المرحلة.`,
    m_b303cc20c191: $localize`:@@m_b303cc20c191:جاري الإرسال...`,
    m_b347c2553b57: $localize`:@@m_b347c2553b57:إرسال الطلب`,
    m_e72c2dc9bbfd: $localize`:@@m_e72c2dc9bbfd:متابعة حالة طلبك`,
    m_fef858d1a60a: $localize`:@@m_fef858d1a60a:تابع خطوات قبول طلبك في المنصة لحظة بلحظة`,
    m_cee8f138e31b: $localize`:@@m_cee8f138e31b:جارٍ التحميل...`,
    m_f6f85d3316dc: $localize`:@@m_f6f85d3316dc:استعلام`,
    m_6909e60c6bf7: $localize`:@@m_6909e60c6bf7:حالة الطلب`,
    m_e20fd49cb3bd: $localize`:@@m_e20fd49cb3bd:رقم الحساب أو المحفظة`,
    m_d4630f175c88: $localize`:@@m_d4630f175c88:رقم الطلب`,
    m_1944e9e9bf40: $localize`:@@m_1944e9e9bf40:رقم الطلب الرقمي`,
  };

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
      ? $localize`:@@m_560a4e05f8f6:تم قبول طلبك`
      : this.requestStatusResult?.status === 'Rejected'
        ? $localize`:@@m_1176fd725375:تم رفض الطلب`
        : $localize`:@@m_03fa409d803f:الطلب قيد المراجعة`;
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
            title: $localize`:@@m_f53f6891cd38:تم إرسال طلبك بنجاح!`,
            text:
              reqId !== undefined && reqId !== null
                ? `${$localize`:@@m_a0afebb40750:رقم الطلب الخاص بك`}: ${reqId}`
                : $localize`:@@m_f53f6891cd38:تم إرسال طلبك بنجاح!`,
            confirmButtonText: $localize`:@@m_d4c6598d6ffa:حسناً`,
          });
          this.teacherForm.reset();
          this.clearSubjectIds();
        },
        error: (error) => {
          const errorMessage =
            error?.error?.message ||
            $localize`:@@m_6b3d0ba6ee57:حدث خطأ أثناء إرسال الطلب، تأكد من صحة البيانات والمحاولة مرة أخرى.`;

          this.showAlert({
            icon: 'error',
            title: $localize`:@@m_c31fcf9712cd:عذراً!`,
            text: errorMessage,
            confirmButtonText: $localize`:@@m_90725495747d:موافق`,
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
      closeButtonAriaLabel: $localize`:@@m_5bf826c5e57c:إغلاق`,
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
      this.statusError = $localize`:@@m_82b83ce7db40:أدخل رقم الطلب الرقمي الذي حصلت عليه بعد التسجيل.`;
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
            this.statusError = $localize`:@@m_5140c1716194:تعذر قراءة حالة الطلب. حاول مرة أخرى أو تواصل مع الدعم.`;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.statusError =
            error.status === 400 &&
            error.error?.errors?.some((item: any) => item.field === 'whatsAppNumber')
              ? $localize`:@@m_9cca2848e618:تعذر متابعة الطلب حاليًا. تواصل مع الدعم للمساعدة.`
              : error.status === 400 || error.status === 403 || error.status === 404
                ? $localize`:@@m_843595f06a90:تأكد من رقم الطلب الذي حصلت عليه بعد التسجيل.`
                : $localize`:@@m_1657a1247635:تعذر الاتصال بالخدمة. حاول مرة أخرى بعد قليل.`;
          this.cdr.markForCheck();
        },
      });
  }
}
