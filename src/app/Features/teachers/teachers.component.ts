import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectionStrategy } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.Default,
  styleUrl: './teachers.component.css',
})
export class TeachersComponent implements OnInit {
  readonly messages = {
    m_42511e811727: $localize`:@@m_42511e811727:نخبة المعلمين`,
    m_5d49f82ea5e2: $localize`:@@m_5d49f82ea5e2:تعرّف على`,
    m_937a6388d61f: $localize`:@@m_937a6388d61f:معلمينا المميزين`,
    m_3810be9607bc: $localize`:@@m_3810be9607bc:مجموعة من كبار المعلمين المعتمدين والمتميزين في تبسيط المناهج الدراسية وكورسات التأسيس.`,
    m_e77a95f1187f: $localize`:@@m_e77a95f1187f:احجز حصة تجريبية`,
    m_c6c05368e364: $localize`:@@m_c6c05368e364:تقييم`,
  };

  private platformId = inject(PLATFORM_ID);

  selectedCategory = 'all';

  categories = [
    { id: 'all', name: $localize`:@@m_11fdef2dc5f8:الكل` },
    { id: 'math', name: $localize`:@@m_825de8950251:الرياضيات` },
    { id: 'science', name: $localize`:@@m_95f9ba614417:العلوم والفيزياء` },
    { id: 'languages', name: $localize`:@@m_f3ed5f4b2426:اللغات` },
    { id: 'arabic', name: $localize`:@@m_8080ee6f48cc:اللغة العربية` },
  ];

  teachers: Teacher[] = [
    {
      id: 1,
      name: $localize`:@@m_891c08556834:أ. أحمد سليمان`,
      subject: $localize`:@@m_825de8950251:الرياضيات`,
      categoryId: 'math',
      experience: 10,
      rating: 4.9,
      reviewsCount: 128,
      avatar:
        'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400&auto=format&fit=crop',
      bio: $localize`:@@m_745183abfda1:متخصص في تدريس المناهج الإماراتية ومساعدة الطلاب على تفوقهم في القدرات والاختبارات الوطنية.`,
    },
    {
      id: 2,
      name: $localize`:@@m_44dcaf6c0e96:أ. سارة محمود`,
      subject: $localize`:@@m_fb090c279a7d:اللغة الإنجليزية`,
      categoryId: 'languages',
      experience: 8,
      rating: 4.8,
      reviewsCount: 95,
      avatar:
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop',
      bio: $localize`:@@m_34eab978f4b1:خبرة طويلة في تأسيس اللغات والتجهيز لاختبارات IELTS والمحادثة بطرق مبسطة.`,
    },
    {
      id: 3,
      name: $localize`:@@m_e0258574b3da:د. محمد الكردي`,
      subject: $localize`:@@m_241cff48b6b0:الفيزياء والعلوم`,
      categoryId: 'science',
      experience: 12,
      rating: 5.0,
      reviewsCount: 150,
      avatar:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
      bio: $localize`:@@m_ebe1bc9c8688:أسلوب تبسيطي فريد يحول المفاهيم المعقدة إلى تجارب ذهنية وتطبيقات عملية ممتعة.`,
    },
    {
      id: 4,
      name: $localize`:@@m_e2ac7994ecdc:أ. مريم العلي`,
      subject: $localize`:@@m_8080ee6f48cc:اللغة العربية`,
      categoryId: 'arabic',
      experience: 7,
      rating: 4.9,
      reviewsCount: 84,
      avatar:
        'https://images.unsplash.com/photo-1580894732413-801199468593?q=80&w=400&auto=format&fit=crop',
      bio: $localize`:@@m_26d9a3c5ac17:متخصصة في النحو والتأسيس القوي في القراءة والكتابة والفرق بين التعبير والبلاغة.`,
    },
  ];

  ngOnInit(): void {
    // تشغيل AOS فقط إذا كان الكود يعمل في متصفح المستخدم وليس في الخادم (Node.js)
    if (isPlatformBrowser(this.platformId)) {
      AOS.init({
        duration: 800,
        once: true,
        mirror: false,
      });
    }
  }

  get filteredTeachers(): Teacher[] {
    if (this.selectedCategory === 'all') {
      return this.teachers;
    }
    return this.teachers.filter((t) => t.categoryId === this.selectedCategory);
  }

  selectCategory(categoryId: string) {
    this.selectedCategory = categoryId;
  }

  getWhatsAppLink(teacherName: string): string {
    const message = encodeURIComponent(
      $localize`:@@m_923f12161978:السلام عليكم، أرغب في حجز حصة تجريبية مع ${teacherName}:TEACHER_NAME:.`,
    );
    return `https://wa.me/971563306087?text=${message}`;
  }

  experienceLabel(experience: number): string {
    return $localize`:@@m_9d201bb3e2b2:🎓 خبرة ${experience}:EXPERIENCE: سنوات`;
  }
}
