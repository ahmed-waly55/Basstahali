import { Component, OnInit, ChangeDetectorRef, ApplicationRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { TeacherFormRequest, TeacherService } from '../../core/services/teacher.service';

@Component({
  selector: 'app-teacher-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './teacher-form.component.html',
  styleUrl: './teacher-form.component.css',
})
export class TeacherFormComponent implements OnInit {

  // نموذج البيانات المرتبط بالفورم
  formData: TeacherFormRequest = {
    fullName: '',
    email: '',
    password: '',
    whatsAppNumber: '',
    payoutMethod: '',
    payoutAccount: '',
    curriculumId: '',
    gradeLevelId: '',
    subjectIds: []
  };

  // القوائم للجلب من الـ API
  curriculaList: any[] = [];
  gradeLevelsList: any[] = [];
  subjectsList: any[] = [];

  // متغيرات لمتابعة حالة الطلب
  requestIdInput: string = '';
  requestStatusResult: any = null;

  constructor(
    private teacherService: TeacherService,
    private cdr: ChangeDetectorRef,
    private appRef: ApplicationRef,
    private ngZone: NgZone // حقن NgZone لضمان تشغيل التحديثات داخل نطاق Angular
  ) {}

  ngOnInit(): void {
    this.loadCurricula();
  }

  // دالة مساعدة مركزية لإجبار Angular على تحديث الـ UI فوراً
  private triggerChangeDetection() {
    this.ngZone.run(() => {
      this.cdr.markForCheck();
      this.cdr.detectChanges();
      this.appRef.tick();
    });
  }

  // 1. جلب المناهج عند التحميل
  loadCurricula() {
    this.teacherService.getCurricula().subscribe({
      next: (response: any) => {
        this.curriculaList = response.data || [];
        this.triggerChangeDetection();
      },
      error: (err) => console.error('خطأ في جلب المناهج:', err)
    });
  }

  // عند تغيير المنهج
  onCurriculumChange(curriculumId: string) {
    this.ngZone.run(() => {
      console.log('Selected Curriculum ID:', curriculumId);
      this.formData.curriculumId = curriculumId;
      this.formData.gradeLevelId = '';
      this.formData.subjectIds = [];
      this.gradeLevelsList = [];
      this.subjectsList = [];

      if (curriculumId) {
        this.teacherService.getGradeLevels(curriculumId).subscribe({
          next: (response: any) => {
            console.log('Grade Levels API Response:', response);
            this.ngZone.run(() => {
              this.gradeLevelsList = response.data || [];
              this.triggerChangeDetection();
            });
          },
          error: (err) => console.error('خطأ في جلب المراحل:', err)
        });
      } else {
        this.triggerChangeDetection();
      }
    });
  }

  // للتحقق هل المادة محددة مسبقاً أم لا
  isSubjectSelected(subjectId: string): boolean {
    return this.formData.subjectIds?.includes(subjectId);
  }

  // عند الضغط على الـ Checkbox (إضافة أو إزالة)
  onSubjectCheckboxChange(subjectId: string, event: any) {
    this.ngZone.run(() => {
      if (!this.formData.subjectIds) {
        this.formData.subjectIds = [];
      }

      if (event.target.checked) {
        if (!this.formData.subjectIds.includes(subjectId)) {
          this.formData.subjectIds.push(subjectId);
        }
      } else {
        this.formData.subjectIds = this.formData.subjectIds.filter((id: string) => id !== subjectId);
      }
      this.triggerChangeDetection();
    });
  }

  // عند تغيير المرحلة
  onGradeLevelChange(gradeLevelId: string) {
    this.ngZone.run(() => {
      console.log('Selected Grade Level ID:', gradeLevelId);
      this.formData.gradeLevelId = gradeLevelId;
      this.formData.subjectIds = [];
      this.subjectsList = [];

      if (gradeLevelId) {
        this.teacherService.getSubjects(gradeLevelId).subscribe({
          next: (response: any) => {
            console.log('Subjects API Response:', response);
            this.ngZone.run(() => {
              this.subjectsList = response.data || [];
              this.triggerChangeDetection();
            });
          },
          error: (err) => console.error('خطأ في جلب المواد:', err)
        });
      } else {
        this.triggerChangeDetection();
      }
    });
  }

  // إرسال طلب التسجيل (POST)
  onSubmit() {
    this.teacherService.submitTeacherForm(this.formData).subscribe({
      next: (response: any) => {
        const reqId = response?.data?.requestId || response?.requestId || response?.id || 'REQ-XXXXXX';

        Swal.fire({
          icon: 'success',
          title: 'تم إرسال طلبك بنجاح!',
          text: `رقم الطلب الخاص بك هو: ${reqId}`,
          confirmButtonText: 'حسناً',
          confirmButtonColor: '#7c3aed'
        });
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

  // متابعة الحالة (GET)
  checkStatus() {
    if (!this.requestIdInput.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'تنبيه',
        text: 'يرجى إدخال رقم الطلب أولاً للاستعلام.',
        confirmButtonText: 'حسناً',
        confirmButtonColor: '#7c3aed'
      });
      return;
    }

    this.requestStatusResult = null;

    this.teacherService.getRequestStatus(this.requestIdInput).subscribe({
      next: (data: any) => {
        this.ngZone.run(() => {
          this.requestStatusResult = data;
          this.triggerChangeDetection();
        });

        Swal.fire({
          icon: 'info',
          title: 'حالة الطلب',
          html: `
            <div style="text-align: right; direction: rtl;">
              <p style="margin-bottom: 8px;"><b>رقم الطلب:</b> ${data.id || this.requestIdInput}</p>
              <p style="margin-bottom: 8px;"><b>تاريخ التقديم:</b> ${data.createdAt || 'غير متوفر'}</p>
              <p><b>الحالة الحالية:</b> <span style="color: #d97706; font-weight: bold;">${data.status || 'قيد المراجعة'}</span></p>
            </div>
          `,
          confirmButtonText: 'إغلاق',
          confirmButtonColor: '#7c3aed'
        });
      },
      error: (error) => {
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
