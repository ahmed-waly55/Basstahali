import { PageHeadingComponent } from '../../shared/components/page-heading/page-heading.component';
import { PreferencesService } from '../../core/services/preferences.service';
import { TranslatePipe } from '../../core/services/translate.pipe';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  OnInit,
  ViewChild,
  ChangeDetectionStrategy,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import AOS from 'aos';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [PageHeadingComponent, TranslatePipe, CommonModule, FormsModule],
  templateUrl: './contact.component.html',
  changeDetection: ChangeDetectionStrategy.Default,
  styleUrl: './contact.component.css',
})
export class ContactComponent implements OnInit {
  preferences = inject(PreferencesService);
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

    const subject = this.preferences.translate('استفسار من بسطهالي') + ': ' + this.formData.subject;
    const body = `${this.formData.name}\n${this.formData.phone}\n${this.formData.email}\n\n${this.formData.message}`;
    if (isPlatformBrowser(this.platformId)) {
      window.location.href = `mailto:support@basstahali.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
  }
}
