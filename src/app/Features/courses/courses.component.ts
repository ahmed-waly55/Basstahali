import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
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
  styleUrl: './courses.component.css',
})
export class CoursesComponent implements OnInit {
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
      price: 299,
      rating: 4.9,
      reviewsCount: 86,
      lessonsCount: 32,
      duration: '18 ساعة',
      thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=600&auto=format&fit=crop',
      description: 'شرح كامل للمنهج شاملاً التفاضل والتكامل، مع حل نماذج الامتحانات السابقة بالتفصيل.',
      instructor: {
        name: 'أ. أحمد سليمان',
        avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=150&auto=format&fit=crop'
      }
    },
    {
      id: 'physics-11',
      title: 'أساسيات الفيزياء وتطبيقاتها - الصف الحادي عشر',
      grade: 'الصف 11',
      subject: 'الفيزياء',
      categoryId: 'secondary',
      price: 249,
      rating: 5.0,
      reviewsCount: 64,
      lessonsCount: 24,
      duration: '14 ساعة',
      thumbnail: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?q=80&w=600&auto=format&fit=crop',
      description: 'تغطية شاملة لمفاهيم الحركة والقوى والطاقة مع تجارب تفاعلية ومسائل محلولة.',
      instructor: {
        name: 'د. محمد الكردي',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop'
      }
    },
    {
      id: 'english-prep',
      title: 'كورس تأسيس واستعداد اختبارات الإنجليزية - المرحلة الإعدادية',
      grade: 'الصف 7 - 9',
      subject: 'اللغة الإنجليزية',
      categoryId: 'prep',
      price: 199,
      rating: 4.8,
      reviewsCount: 112,
      lessonsCount: 20,
      duration: '10 ساعات',
      thumbnail: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=600&auto=format&fit=crop',
      description: 'تطوير مهارات القراءة، الكتابة، والقواعد الأساسية لتأهيل الطالب لاختبارات الفصل.',
      instructor: {
        name: 'أ. سارة محمود',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=150&auto=format&fit=crop'
      }
    }
  ];

  ngOnInit(): void {
    AOS.init({
      duration: 1000, // مدة الحركة بالمللي ثانية
      once: true,     // تشغيل الحركة مرة واحدة فقط أثناء التمرير
    });
  }

  get filteredCourses(): Course[] {
    if (this.selectedCategory === 'all') {
      return this.courses;
    }
    return this.courses.filter(c => c.categoryId === this.selectedCategory);
  }

  selectCategory(categoryId: string) {
    this.selectedCategory = categoryId;

    // إعادة تحديث AOS بعد تصفية العناصر ليتم تطبيق الحركة على الكروت الظاهرة من جديد
    setTimeout(() => {
      AOS.refresh();
    }, 100);
  }

  getEnrollWhatsAppLink(courseTitle: string): string {
    const message = encodeURIComponent(`السلام عليكم، أرغب في التسجيل في كورس: ${courseTitle}`);
    return `https://wa.me/971525250833?text=${message}`;
  }
}
