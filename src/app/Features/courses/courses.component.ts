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
  private platformId = inject(PLATFORM_ID);

  selectedCategory = 'all';

  categories = [
    { id: 'all', name: 'الكل' },
    { id: 'secondary', name: 'المرحلة الثانوية' },
    { id: 'prep', name: 'المرحلة الإعدادية' },
    { id: 'primary', name: 'المرحلة الابتدائية' },
  ];

  courses: Course[] = [
    {
      id: 'math-12-adv',
      title: 'شرح مادة الرياضيات المتقدمة - الصف الثاني عشر',
      grade: 'الصف 12 متقدم',
      subject: 'الرياضيات',
      categoryId: 'secondary',
      price: 6500,
      rating: 4.9,
      reviewsCount: 86,
      lessonsCount: 32,
      duration: '18 ساعة',
      thumbnail:
        'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=600&auto=format&fit=crop',
      description:
        'شرح كامل للمنهج شاملاً التفاضل والتكامل، مع حل نماذج الامتحانات السابقة بالتفصيل.',
      instructor: {
        name: 'أ. أحمد سليمان',
        avatar:
          'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=150&auto=format&fit=crop',
      },
    },
    {
      id: 'physics-11',
      title: 'أساسيات الفيزياء وتطبيقاتها - الصف الحادي عشر',
      grade: 'الصف 11',
      subject: 'الفيزياء',
      categoryId: 'secondary',
      price: 4999,
      rating: 5.0,
      reviewsCount: 64,
      lessonsCount: 24,
      duration: '14 ساعة',
      thumbnail:
        'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?q=80&w=600&auto=format&fit=crop',
      description: 'تغطية شاملة لمفاهيم الحركة والقوى والطاقة مع تجارب تفاعلية ومسائل محلولة.',
      instructor: {
        name: 'د. محمد الكردي',
        avatar:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop',
      },
    },
    {
      id: 'english-prep',
      title: 'كورس تأسيس واستعداد اختبارات الإنجليزية - المرحلة الإعدادية',
      grade: 'الصف 7 - 9',
      subject: 'اللغة الإنجليزية',
      categoryId: 'prep',
      price: 5800,
      rating: 4.8,
      reviewsCount: 112,
      lessonsCount: 20,
      duration: '10 ساعات',
      thumbnail:
        'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=600&auto=format&fit=crop',
      description:
        'تطوير مهارات القراءة، الكتابة، والقواعد الأساسية لتأهيل الطالب لاختبارات الفصل.',
      instructor: {
        name: 'أ. سارة محمود',
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
    const message = encodeURIComponent(`السلام عليكم، أرغب في التسجيل في كورس: ${courseTitle}`);
    return `https://wa.me/971525250833?text=${message}`;
  }
}
