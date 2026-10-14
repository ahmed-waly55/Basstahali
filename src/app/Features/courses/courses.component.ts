import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, ChangeDetectionStrategy, inject, PLATFORM_ID } from '@angular/core';
import * as AOS from 'aos';

export interface Course {
  id: string;
  title: string;
  grade: string;
  subject: string;
  categoryId: string;
  price: number;
  rating: number;
  reviewsCount: number;
  lessonsCount: number;
  duration: string;
  thumbnail: string;
  description: string;
  instructor: {
    name: string;
    avatar: string;
  };
}

@Component({
  selector: 'app-courses',
  imports: [CommonModule],
  templateUrl: './courses.component.html',
  changeDetection: ChangeDetectionStrategy.Default,
  styleUrl: './courses.component.css',
})
export class CoursesComponent implements OnInit {
  readonly lessonLabel = $localize`:@@courseLessonsLabel:درس`;

  readonly messages = {
    m_370e5a7c84ab: $localize`:@@m_370e5a7c84ab:المناهج والمسارات التعليمية`,
    m_a0ee55410b16: $localize`:@@m_a0ee55410b16:استكشف`,
    m_cf8fb985b213: $localize`:@@m_cf8fb985b213:أحدث الكورسات والمواد`,
    m_7a5ffd5900ff: $localize`:@@m_7a5ffd5900ff:محتوى تعليمي شامل ومبسط مصمم خصيصاً لمساعدة الطلاب على التفوق الدراسي واجتياز الاختبارات.`,
    m_f10712b64992: $localize`:@@m_f10712b64992:جنية`,
    m_83fe3c1c8573: $localize`:@@m_83fe3c1c8573:المعلم المسؤول`,
    m_9c34042f2935: $localize`:@@m_9c34042f2935:تفاصيل المنهج`,
    m_0fba16800630: $localize`:@@m_0fba16800630:اشترك الآن`,
  };

  private platformId = inject(PLATFORM_ID);

  selectedCategory = 'all';

  categories = [
    { id: 'all', name: $localize`:@@m_11fdef2dc5f8:الكل` },
    { id: 'secondary', name: $localize`:@@m_2b7e1606aeba:المرحلة الثانوية` },
    { id: 'prep', name: $localize`:@@m_3eb87a1f7668:المرحلة الإعدادية` },
    { id: 'primary', name: $localize`:@@m_36d9c98fcafd:المرحلة الابتدائية` },
  ];

  courses: Course[] = [
    {
      id: 'math-12-adv',
      title: $localize`:@@m_fe287a2a471e:شرح مادة الرياضيات المتقدمة - الصف الثاني عشر`,
      grade: $localize`:@@m_f96df112ac2a:الصف 12 متقدم`,
      subject: $localize`:@@m_825de8950251:الرياضيات`,
      categoryId: 'secondary',
      price: 6500,
      rating: 4.9,
      reviewsCount: 86,
      lessonsCount: 32,
      duration: $localize`:@@m_bac8def995b8:18 ساعة`,
      thumbnail:
        'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=600&auto=format&fit=crop',
      description: $localize`:@@m_e9b3e19631b5:شرح كامل للمنهج شاملاً التفاضل والتكامل، مع حل نماذج الامتحانات السابقة بالتفصيل.`,
      instructor: {
        name: $localize`:@@m_891c08556834:أ. أحمد سليمان`,
        avatar:
          'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=150&auto=format&fit=crop',
      },
    },
    {
      id: 'physics-11',
      title: $localize`:@@m_1929def8710a:أساسيات الفيزياء وتطبيقاتها - الصف الحادي عشر`,
      grade: $localize`:@@m_1cabdca3f6c2:الصف 11`,
      subject: $localize`:@@m_81f1d571624a:الفيزياء`,
      categoryId: 'secondary',
      price: 4999,
      rating: 5.0,
      reviewsCount: 64,
      lessonsCount: 24,
      duration: $localize`:@@m_2e1dfe6cf489:14 ساعة`,
      thumbnail:
        'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?q=80&w=600&auto=format&fit=crop',
      description: $localize`:@@m_4955ab10f746:تغطية شاملة لمفاهيم الحركة والقوى والطاقة مع تجارب تفاعلية ومسائل محلولة.`,
      instructor: {
        name: $localize`:@@m_e0258574b3da:د. محمد الكردي`,
        avatar:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop',
      },
    },
    {
      id: 'english-prep',
      title: $localize`:@@m_73a12781014e:كورس تأسيس واستعداد اختبارات الإنجليزية - المرحلة الإعدادية`,
      grade: $localize`:@@m_6589f55bb252:الصف 7 - 9`,
      subject: $localize`:@@m_fb090c279a7d:اللغة الإنجليزية`,
      categoryId: 'prep',
      price: 5800,
      rating: 4.8,
      reviewsCount: 112,
      lessonsCount: 20,
      duration: $localize`:@@m_6e8ab6de038f:10 ساعات`,
      thumbnail:
        'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=600&auto=format&fit=crop',
      description: $localize`:@@m_5d1a2f0f9214:تطوير مهارات القراءة، الكتابة، والقواعد الأساسية لتأهيل الطالب لاختبارات الفصل.`,
      instructor: {
        name: $localize`:@@m_44dcaf6c0e96:أ. سارة محمود`,
        avatar:
          'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=150&auto=format&fit=crop',
      },
    },
  ];

  ngOnInit(): void {
    // التأكد من تشغيل AOS في المتصفح فقط لمنع مشاكل الـ SSR
    if (isPlatformBrowser(this.platformId)) {
      AOS.init({
        duration: 1000,
        once: true,
        mirror: false,
      });
    }
  }

  get filteredCourses(): Course[] {
    if (this.selectedCategory === 'all') {
      return this.courses;
    }
    return this.courses.filter((c) => c.categoryId === this.selectedCategory);
  }

  selectCategory(categoryId: string) {
    this.selectedCategory = categoryId;

    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        AOS.refresh();
      }, 100);
    }
  }

  getEnrollWhatsAppLink(courseTitle: string): string {
    const message = encodeURIComponent($localize`:@@courseEnrollMessage:السلام عليكم، أرغب في التسجيل في كورس: ${courseTitle}:COURSE:`);
    return `https://wa.me/971563306087?text=${message}`;
  }
}
