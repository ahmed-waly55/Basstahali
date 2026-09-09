import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray, FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { TeacherService } from '../../core/services/teacher.service';

@Component({
  selector: 'app-teacher-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule , FormsModule],
  templateUrl: './teacher-form.component.html',
  styleUrl: './teacher-form.component.css',
})
export class TeacherFormComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  // تعريف الـ FormGroup الرئيسي للفورم
  teacherForm!: FormGroup;

  // القوائم للجلب من الـ API
  curriculaList: any[] = [];
  gradeLevelsList: any[] = [];
  subjectsList: any[] = [];

  // متغيرات لمتابعة حالة الطلب
  requestIdInput: string = '';
  requestStatusResult: any = null;

  constructor(
    private fb: FormBuilder,
    private teacherService: TeacherService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
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
      subjectIds: this.fb.array([], Validators.required) // لحفظ المواد المختارة كـ FormArray
    });
  }

  // مراقبة التغييرات في المنهج والمرحلة الدراسية لتحديث القوائم تلقائياً
  private setupFormListeners() {
    // عند تغير المنهج الدراسي
    this.teacherForm.get('curriculumId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(curriculumId => {
        this.ngZone.run(() => {
          this.teacherForm.get('gradeLevelId')?.setValue('');
          this.teacherForm.get('gradeLevelId')?.disable();
          this.gradeLevelsList = [];
          this.subjectsList = [];
          this.clearSubjectIds();

          if (curriculumId) {
            this.teacherService.getGradeLevels(curriculumId)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (response: any) => {
                  this.ngZone.run(() => {
                    this.gradeLevelsList = response.data || [];
                    this.teacherForm.get('gradeLevelId')?.enable();
                    this.cdr.markForCheck();
                  });
                },
                error: (err) => console.error('خطأ في جلب المراحل:', err)
              });
          }
          this.cdr.markForCheck();
        });
      });

    // عند تغير المرحلة الدراسية
    this.teacherForm.get('gradeLevelId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(gradeLevelId => {
        this.ngZone.run(() => {
          this.clearSubjectIds();
          this.subjectsList = [];

          if (gradeLevelId) {
            this.teacherService.getSubjects(gradeLevelId)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (response: any) => {
                  this.ngZone.run(() => {
                    this.subjectsList = response.data || [];
                    this.cdr.markForCheck();
                  });
                },
                error: (err) => console.error('خطأ في جلب المواد:', err)
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
        const index = array.controls.findIndex(x => x.value === subjectId);
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
    this.teacherService.getCurricula()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.ngZone.run(() => {
            this.curriculaList = response.data || [];
            this.cdr.markForCheck();
          });
        },
        error: (err) => console.error('خطأ في جلب المناهج:', err)
      });
  }

  // إرسال طلب التسجيل (POST)
  onSubmit() {
    if (this.teacherForm.invalid) {
      this.teacherForm.markAllAsTouched();
      return;
    }

    this.teacherService.submitTeacherForm(this.teacherForm.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          const reqId = response?.data?.requestId || response?.requestId || response?.id || 'REQ-XXXXXX';

          Swal.fire({
            icon: 'success',
            title: 'تم إرسال طلبك بنجاح!',
            text: `رقم الطلب الخاص بك هو: ${reqId}`,
            confirmButtonText: 'حسناً',
            confirmButtonColor: '#7c3aed'
          });
          this.teacherForm.reset();
          this.clearSubjectIds();
        },
        error: (error) => {
          const errorMessage = error?.error?.message || 'حدث خطأ أثناء إرسال الطلب، تأكد من صحة البيانات والمحاولة مرة أخرى.';

          Swal.fire({
            icon: 'error',
            title: 'عذراً!',
            text: errorMessage,
            confirmButtonText: 'موافق',
            confirmButtonColor: '#ef4444'
          });
          console.error(error);
        }
      });
  }

  // متابعة حالة الطلب (GET)
  checkStatus() {
    if (!this.requestIdInput || !this.requestIdInput.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'تنبيه',
        text: 'يرجى إدخال رقم الطلب أولاً للاستعلام.',
        confirmButtonText: 'حسناً',
        confirmButtonColor: '#7c3aed'
      });
      return;
    }

    this.teacherService.getRequestStatus(this.requestIdInput.trim())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          this.ngZone.run(() => {
            this.requestStatusResult = data;
            this.cdr.markForCheck();
            this.cdr.detectChanges();
          });

          Swal.fire({
            icon: 'info',
            title: 'حالة الطلب',
            html: `
              <div style="text-align: right; direction: rtl;">
                <p style="margin-bottom: 8px;"><b>رقم الطلب:</b> ${data.id || this.requestIdInput}</p>
                <p><b>الحالة الحالية:</b> <span style="color: #d97706; font-weight: bold;">${data.status || data.data?.status || 'قيد المراجعة'}</span></p>
              </div>
            `,
            confirmButtonText: 'إغلاق',
            confirmButtonColor: '#7c3aed'
          });
        },
        error: (error) => {
          this.ngZone.run(() => {
            this.requestStatusResult = null;
            this.cdr.markForCheck();
          });

          Swal.fire({
            icon: 'error',
            title: 'لم يتم العثور على الطلب',
            text: 'تأكد من صحة رقم الطلب المدخل.',
            confirmButtonText: 'حسناً',
            confirmButtonColor: '#ef4444'
          });
          console.error(error);
        }
      });
  }
}
