import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, ChangeDetectionStrategy, inject, PLATFORM_ID } from '@angular/core';
import * as AOS from 'aos';

export interface Course {
  id: string;
  title: string;
  subject: string;
  categoryId: 'programming' | 'languages' | 'math';
  price: number;
  thumbnail: string;
  description: string;
}

@Component({
  selector: 'app-courses',
  imports: [CommonModule],
  templateUrl: './courses.component.html',
  changeDetection: ChangeDetectionStrategy.Default,
  styleUrl: './courses.component.css',
})
export class CoursesComponent implements OnInit {
  readonly messages = {
    m_370e5a7c84ab: $localize`:@@m_370e5a7c84ab:المناهج والمسارات التعليمية`,
    m_a0ee55410b16: $localize`:@@m_a0ee55410b16:استكشف`,
    m_cf8fb985b213: $localize`:@@m_cf8fb985b213:أحدث الكورسات والمواد`,
    m_7a5ffd5900ff: $localize`:@@m_7a5ffd5900ff:محتوى تعليمي شامل ومبسط مصمم خصيصاً لمساعدة الطلاب على التفوق الدراسي واجتياز الاختبارات.`,
    m_c5dd280359ea: $localize`:@@m_c5dd280359ea:جنيه مصري`,
    courseDetailsAction: $localize`:@@courseDetailsAction:تفاصيل الكورس`,
    m_0fba16800630: $localize`:@@m_0fba16800630:اشترك الآن`,
    courseLessonsCount: $localize`:@@courseLessonsCount:عدد الحصص`,
    courseLessonsPending: $localize`:@@courseLessonsPending:يُحدَّد عند الحجز`,
    coursePriceFrom: $localize`:@@coursePriceFrom:يبدأ من`,
  };

  private platformId = inject(PLATFORM_ID);

  selectedCategory = 'all';

  categories = [
    { id: 'all', name: $localize`:@@m_11fdef2dc5f8:الكل` },
    { id: 'programming', name: $localize`:@@courseCategoryProgramming:البرمجة` },
    { id: 'languages', name: $localize`:@@courseCategoryLanguages:اللغات` },
    { id: 'math', name: $localize`:@@m_825de8950251:الرياضيات` },
  ];

  courses: Course[] = [
    {
      id: 'programming',
      title: $localize`:@@courseTitleProgramming:كورس البرمجة`,
      subject: $localize`:@@courseCategoryProgramming:البرمجة`,
      categoryId: 'programming',
      price: 5000,
      thumbnail: 'images/courses/programming.webp',
      description: $localize`:@@courseDescriptionProgramming:تعلّم البرمجة وتدرّب على كتابة الأكواد وحل المشكلات.`,
    },
    {
      id: 'english-language',
      title: $localize`:@@courseTitleEnglish:كورس اللغة الإنجليزية`,
      subject: $localize`:@@m_fb090c279a7d:اللغة الإنجليزية`,
      categoryId: 'languages',
      price: 5000,
      thumbnail: 'images/courses/english.webp',
      description: $localize`:@@courseDescriptionEnglish:تدرّب على التواصل باللغة الإنجليزية من خلال المحادثة والقراءة والكتابة.`,
    },
    {
      id: 'german-language',
      title: $localize`:@@courseTitleGerman:كورس اللغة الألمانية`,
      subject: $localize`:@@courseSubjectGerman:اللغة الألمانية`,
      categoryId: 'languages',
      price: 5000,
      thumbnail: 'images/courses/german.webp',
      description: $localize`:@@courseDescriptionGerman:تعلّم اللغة الألمانية وتدرّب على استخدامها في مواقف الحياة اليومية.`,
    },
    {
      id: 'italian-language',
      title: $localize`:@@courseTitleItalian:كورس اللغة الإيطالية`,
      subject: $localize`:@@courseSubjectItalian:اللغة الإيطالية`,
      categoryId: 'languages',
      price: 5000,
      thumbnail: 'images/courses/italian.webp',
      description: $localize`:@@courseDescriptionItalian:تدرّب على فهم اللغة الإيطالية والتعبير بها في محادثات بسيطة.`,
    },
    {
      id: 'french-language',
      title: $localize`:@@courseTitleFrench:كورس اللغة الفرنسية`,
      subject: $localize`:@@courseSubjectFrench:اللغة الفرنسية`,
      categoryId: 'languages',
      price: 5000,
      thumbnail: 'images/courses/french.webp',
      description: $localize`:@@courseDescriptionFrench:تعلّم اللغة الفرنسية من خلال التدريب على المحادثة والقراءة والكتابة.`,
    },
    {
      id: 'arabic-language',
      title: $localize`:@@courseTitleArabic:كورس اللغة العربية`,
      subject: $localize`:@@courseSubjectArabic:اللغة العربية`,
      categoryId: 'languages',
      price: 5000,
      thumbnail: 'images/courses/arabic.webp',
      description: $localize`:@@courseDescriptionArabic:طوّر مهاراتك في القراءة والكتابة والتعبير باللغة العربية.`,
    },
    {
      id: 'math',
      title: $localize`:@@courseTitleMath:كورس الماث`,
      subject: $localize`:@@m_825de8950251:الرياضيات`,
      categoryId: 'math',
      price: 5000,
      thumbnail: 'images/courses/math.webp',
      description: $localize`:@@courseDescriptionMath:تدرّب على فهم الأفكار الرياضية وحل المسائل خطوة بخطوة.`,
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
    const message = encodeURIComponent(
      $localize`:@@courseEnrollMessage:السلام عليكم، أرغب في التسجيل في كورس: ${courseTitle}:COURSE:`,
    );
    return `https://wa.me/971563306087?text=${message}`;
  }

  getDetailsWhatsAppLink(courseTitle: string): string {
    const message = encodeURIComponent(
      $localize`:@@courseDetailsMessage:السلام عليكم، أرغب في معرفة تفاصيل الكورس: ${courseTitle}:COURSE:`,
    );
    return `https://wa.me/971563306087?text=${message}`;
  }
}
