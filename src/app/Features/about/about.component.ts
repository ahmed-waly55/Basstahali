import { TranslatePipe } from '../../core/services/translate.pipe';
import { PreferencesService } from '../../core/services/preferences.service';
import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  inject,
  PLATFORM_ID,
  ChangeDetectionStrategy,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import AOS from 'aos';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './about.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './about.component.css',
})
export class AboutComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly preferences = inject(PreferencesService);
  private platformId = inject(PLATFORM_ID);

  private refreshTimer?: ReturnType<typeof setTimeout>;
  openedFaq = 0;

  faqs = [
    {
      question: 'ما هي منصة بسطهالي؟',
      answer:
        'بسطهالي هي منصة تعليمية إلكترونية تقدم الدروس والواجبات والاختبارات التفاعلية لمساعدة الطلاب على تحسين مستواهم الدراسي.',
    },
    {
      question: 'هل يمكنني الدراسة من الهاتف المحمول؟',
      answer: 'نعم، يمكنك استخدام المنصة من الهاتف أو الجهاز اللوحي أو الكمبيوتر.',
    },
    {
      question: 'هل جميع المواد الدراسية متوفرة؟',
      answer: 'نوفر المواد الدراسية حسب المنهج والصف الدراسي ويتم إضافة محتوى جديد باستمرار.',
    },
    {
      question: 'كيف أتابع تقدمي الدراسي؟',
      answer: 'توفر المنصة تقارير وإحصائيات توضح نتائج الاختبارات والواجبات ومستوى التقدم.',
    },
    {
      question: 'هل يمكن لولي الأمر متابعة الطالب؟',
      answer: 'نعم، يمكن لولي الأمر متابعة مستوى الطالب ونتائجه والاطلاع على التقارير.',
    },
  ];

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      AOS.init({
        duration: 900,
        once: true,
        offset: 120,
        easing: 'ease-out-cubic',
        mirror: false,
      });
    }
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.refreshTimer = setTimeout(() => {
        AOS.refresh();
      }, 100);
    }
  }

  ngOnDestroy(): void {
    clearTimeout(this.refreshTimer);
  }

  toggleFaq(index: number): void {
    this.openedFaq = this.openedFaq === index ? -1 : index;
  }
}
