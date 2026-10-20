import { Component, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, FormsModule],
  templateUrl: './footer.component.html',
  changeDetection: ChangeDetectionStrategy.Default,
  styleUrl: './footer.component.css',
})
export class FooterComponent {
  readonly messages = {
    m_724341e8f3eb: $localize`:@@m_724341e8f3eb:منصة تعليمية تساعد الطلاب على التعلم بسهولة وتحقيق أفضل النتائج من خلال تجربة تعليمية حديثة ومميزة.`,
    m_6e58cd380220: $localize`:@@m_6e58cd380220:روابط سريعة`,
    m_b986d8fb163c: $localize`:@@m_b986d8fb163c:الرئيسية`,
    m_1ea7464560c3: $localize`:@@m_1ea7464560c3:المناهج الدراسية`,
    m_ec15ec94c35d: $localize`:@@m_ec15ec94c35d:المميزات`,
    m_43edaf712d07: $localize`:@@m_43edaf712d07:المدرسين`,
    m_2e84aea0e101: $localize`:@@m_2e84aea0e101:انضم لهيئة التدريس`,
    m_c380b562310d: $localize`:@@m_c380b562310d:الدعم`,
    m_8b7b36b70cdd: $localize`:@@m_8b7b36b70cdd:سياسة الخصوصية`,
    m_bec6c46de276: $localize`:@@m_bec6c46de276:الشروط والأحكام`,
    m_90b224ff944b: $localize`:@@m_90b224ff944b:الأسئلة الشائعة`,
    m_988638232136: $localize`:@@m_988638232136:تواصل معنا`,
    m_54db1b890699: $localize`:@@m_54db1b890699:الامارات العربية المتحدة، دبي`,
    m_70b341c96b9c: $localize`:@@m_70b341c96b9c:بسطهالي`,
  };

  email: string = '';
  currentYear: number = new Date().getFullYear();
  readonly copyright = $localize`:@@footerCopyright:جميع الحقوق محفوظة © ${this.currentYear}:YEAR: بسطهالي`;

  subscribeNewsletter() {
    if (this.email) {
      console.log('Subscribed with email:', this.email);
      this.email = '';
    }
  }
}
