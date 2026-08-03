import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import * as AOS from 'aos';

export interface Teacher {
  id: number;
  name: string;
  subject: string;
  categoryId: string;
  experience: number;
  rating: number;
  reviewsCount: number;
  avatar: string;
  bio: string;
}

@Component({
  selector: 'app-teachers',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './teachers.component.html',
  styleUrl: './teachers.component.css',
})
export class TeachersComponent implements OnInit {
  private platformId = inject(PLATFORM_ID);

  selectedCategory = 'all';

  categories = [
    { id: 'all', name: 'الكل' },
    { id: 'math', name: 'الرياضيات' },
    { id: 'science', name: 'العلوم والفيزياء' },
    { id: 'languages', name: 'اللغات' },
    { id: 'arabic', name: 'اللغة العربية' },
  ];

  teachers: Teacher[] = [
    {
      id: 1,
      name: 'أ. أحمد سليمان',
      subject: 'الرياضيات',
      categoryId: 'math',
      experience: 10,
      rating: 4.9,
      reviewsCount: 128,
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400&auto=format&fit=crop',
      bio: 'متخصص في تدريس المناهج الإماراتية ومساعدة الطلاب على تفوقهم في القدرات والاختبارات الوطنية.'
    },
    {
      id: 2,
      name: 'أ. سارة محمود',
      subject: 'اللغة الإنجليزية',
      categoryId: 'languages',
      experience: 8,
      rating: 4.8,
      reviewsCount: 95,
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop',
      bio: 'خبرة طويلة في تأسيس اللغات والتجهيز لاختبارات IELTS والمحادثة بطرق مبسطة.'
    },
    {
      id: 3,
      name: 'د. محمد الكردي',
      subject: 'الفيزياء والعلوم',
      categoryId: 'science',
      experience: 12,
      rating: 5.0,
      reviewsCount: 150,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
      bio: 'أسلوب تبسيطي فريد يحول المفاهيم المعقدة إلى تجارب ذهنية وتطبيقات عملية ممتعة.'
    },
    {
      id: 4,
      name: 'أ. مريم العلي',
      subject: 'اللغة العربية',
      categoryId: 'arabic',
      experience: 7,
      rating: 4.9,
      reviewsCount: 84,
      avatar: 'https://images.unsplash.com/photo-1580894732413-801199468593?q=80&w=400&auto=format&fit=crop',
      bio: 'متخصصة في النحو والتأسيس القوي في القراءة والكتابة والفرق بين التعبير والبلاغة.'
    }
  ];

  ngOnInit(): void {
    // تشغيل AOS فقط إذا كان الكود يعمل في متصفح المستخدم وليس في الخادم (Node.js)
    if (isPlatformBrowser(this.platformId)) {
      AOS.init({
        duration: 800,
        once: true,
      });
    }
  }

  get filteredTeachers(): Teacher[] {
    if (this.selectedCategory === 'all') {
      return this.teachers;
    }
    return this.teachers.filter(t => t.categoryId === this.selectedCategory);
  }

  selectCategory(categoryId: string) {
    this.selectedCategory = categoryId;
  }

  getWhatsAppLink(teacherName: string): string {
    const message = encodeURIComponent(`السلام عليكم، أرغب في حجز حصة تجريبية مع ${teacherName}.`);
    return `https://wa.me/971525250833?text=${message}`;
  }
}
