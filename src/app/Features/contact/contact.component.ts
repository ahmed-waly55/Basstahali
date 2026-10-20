import { PreferencesService } from '../../core/services/preferences.service';
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
  imports: [CommonModule, FormsModule],
  templateUrl: './contact.component.html',
  changeDetection: ChangeDetectionStrategy.Default,
  styleUrl: './contact.component.css',
})
export class ContactComponent implements OnInit {
  readonly validation = {
    nameRequired: $localize`:@@contactNameRequired:الاسم مطلوب.`,
    nameLength: $localize`:@@contactNameLength:يجب أن يتكون الاسم من 3 أحرف على الأقل.`,
    emailRequired: $localize`:@@contactEmailRequired:البريد الإلكتروني مطلوب.`,
    emailInvalid: $localize`:@@contactEmailInvalid:يرجى إدخال بريد إلكتروني صحيح.`,
    messageRequired: $localize`:@@contactMessageRequired:محتوى الرسالة مطلوب.`,
    messageLength: $localize`:@@contactMessageLength:يجب أن تكون الرسالة من 5 أحرف على الأقل.`,
  };
  readonly messages = {
    m_9558283b468d: $localize`:@@m_9558283b468d:دائماً في خدمتك`,
    m_3e0489cbf4d1: $localize`:@@m_3e0489cbf4d1:تواصل`,
    m_1848e4c3a18f: $localize`:@@m_1848e4c3a18f:معنا`,
    m_881d28ce21c9: $localize`:@@m_881d28ce21c9:هل لديك استفسار أو تحتاج إلى مساعدة؟ فريقنا جاهز للرد على جميع أسئلتك في أسرع وقت.`,
    m_097a879115b1: $localize`:@@m_097a879115b1:معلومات التواصل`,
    m_add7d016d30f: $localize`:@@m_add7d016d30f:الهاتف / واتساب`,
    m_0915ef8ea533: $localize`:@@m_0915ef8ea533:البريد الإلكتروني`,
    m_ae2039744d1f: $localize`:@@m_ae2039744d1f:الموقع`,
    m_f6fcef2c495b: $localize`:@@m_f6fcef2c495b:الإمارات العربية المتحدة`,
    m_5fc2d6940b78: $localize`:@@m_5fc2d6940b78:تابعنا على شبكات التواصل`,
    m_8a31c1a876a3: $localize`:@@m_8a31c1a876a3:أرسل لنا رسالة`,
    m_c25d47561bec: $localize`:@@m_c25d47561bec:الاسم بالكامل`,
    m_211cce4ca4ef: $localize`:@@m_211cce4ca4ef:رقم الهاتف`,
    m_a11b17485f35: $localize`:@@m_a11b17485f35:رقم الهاتف مطلوب.`,
    m_46c4079468f0: $localize`:@@m_46c4079468f0:موضوع الرسالة`,
    m_10abd58851b1: $localize`:@@m_10abd58851b1:استفسار عام`,
    m_7740a2ed65a8: $localize`:@@m_7740a2ed65a8:استفسار عن المناهج والكورسات`,
    m_9fefbe40ac00: $localize`:@@m_9fefbe40ac00:مشكلة تقنية في المنصة`,
    m_44fb9984749d: $localize`:@@m_44fb9984749d:موضوع آخر`,
    m_bf04bed9b3fa: $localize`:@@m_bf04bed9b3fa:الرسالة`,
    m_b303cc20c191: $localize`:@@m_b303cc20c191:جاري الإرسال...`,
    m_df0ee33a777c: $localize`:@@m_df0ee33a777c:فتح الرسالة في البريد`,
    m_0499f346f405: $localize`:@@m_0499f346f405:أدخل اسمك الكريم`,
    m_ea5b08e4316a: $localize`:@@m_ea5b08e4316a:اكتب رسالتك هنا بالتفصيل...`,
  };

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
        mirror: false,
      });
    }
  }

  onSubmit() {
    // التأكد من صحة النموذج
    if (!this.contactForm || this.contactForm.invalid) {
      return;
    }

    const subject = $localize`:@@m_632baa1f8a32:استفسار من بسطهالي` + ': ' + this.formData.subject;
    const body = `${this.formData.name}\n${this.formData.phone}\n${this.formData.email}\n\n${this.formData.message}`;
    if (isPlatformBrowser(this.platformId)) {
      window.location.href = `mailto:basstahali@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
  }
}
