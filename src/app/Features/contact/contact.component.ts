import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, ViewChild, ChangeDetectionStrategy, inject, PLATFORM_ID } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import AOS from 'aos';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact.component.html',
  changeDetection: ChangeDetectionStrategy.Default,
  styleUrl: './contact.component.css',
})
export class ContactComponent implements OnInit {
  private platformId = inject(PLATFORM_ID);

  // الوصول للنموذج مباشرة لتفادي خطأ undefined
  @ViewChild('contactForm') contactForm!: NgForm;

  formData = {
    name: '',
    phone: '',
    email: '',
    subject: 'general',
    message: '',
  };

  isSubmitting = false;

  // إشعار نجاح الإرسال (Custom Toast)
  toast = {
    show: false,
    message: '',
  };

  ngOnInit(): void {
    // التأكد من تشغيل مكتبة AOS في المتصفح فقط لمنع مشاكل الـ SSR
    if (isPlatformBrowser(this.platformId)) {
      AOS.init({
        duration: 800,
        once: true,
      });
    }
  }

  onSubmit() {
    // التأكد من صحة النموذج
    if (!this.contactForm || this.contactForm.invalid) {
      return;
    }

    this.isSubmitting = true;

    // محاكاة إرسال البيانات
    setTimeout(() => {
      console.log('Form Submitted:', this.formData);

      // 1. إظهار الإشعار المخصص
      this.toast = {
        show: true,
        message: 'تم إرسال رسالتك بنجاح! سنقوم بالتواصل معك قريباً.',
      };

      // 2. إعادة تعيين النموذج بدون مشاكل الـ Validation
      this.contactForm.resetForm({
        subject: 'general',
      });

      this.isSubmitting = false;

      // 3. إخفاء الإشعار تلقائياً بعد 3 ثوانٍ
      setTimeout(() => {
        this.toast.show = false;
      }, 3000);
    }, 800);
  }
}
