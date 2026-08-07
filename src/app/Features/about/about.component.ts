import {
  Component,
  OnInit,
  AfterViewInit,
  inject,
  PLATFORM_ID,
  ChangeDetectionStrategy,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import AOS from 'aos';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [],
  templateUrl: './about.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './about.component.css',
})
export class AboutComponent implements OnInit, AfterViewInit {
  private platformId = inject(PLATFORM_ID);

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
        once: false,
        offset: 120,
        easing: 'ease-out-cubic',
        mirror: false,
      });
    }
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        AOS.refresh();
      }, 100);
    }
  }

  toggleFaq(index: number): void {
    this.openedFaq = this.openedFaq === index ? -1 : index;
  }
}
