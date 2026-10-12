import { TranslatePipe } from '../../core/services/translate.pipe';
import { PreferencesService } from '../../core/services/preferences.service';
import { learningItems } from '../../shared/components/learning-catalog/learning-catalog.component';
import {
  Component,
  ElementRef,
  OnInit,
  OnDestroy,
  ViewChild,
  inject,
  PLATFORM_ID,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HeroComponent } from '../hero/hero.component';
import { SectionHeaderComponent } from '../../shared/components/section-header/section-header.component';
import { EducationCardComponent } from '../../shared/components/education-card/education-card.component';
import AOS from 'aos';
import { TeacherService } from '../../core/services/teacher.service';
import { Subject, takeUntil, timeout } from 'rxjs';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    TranslatePipe,
    CommonModule,
    HeroComponent,
    SectionHeaderComponent,
    EducationCardComponent,
    RouterLink,
  ],
  templateUrl: './landing.component.html',
  changeDetection: ChangeDetectionStrategy.Default,
  styleUrl: './landing.component.css',
})
export class LandingComponent implements OnInit, OnDestroy {
  preferences = inject(PreferencesService);
  @ViewChild('sliderTrack') sliderTrack!: ElementRef<HTMLDivElement>;

  private teacherService = inject(TeacherService);
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>(); // Subject لإيقاف الاشتراكات

  autoPlayInterval: any;
  scrollStep = 300;

  curriculaList: any[] = [];

  testimonials = [
    {
      id: 1,
      quote: 'المدرس في بسطهالي يشرح لي بصبر وبطريقة واضحة، وإذا ما فهمت يعيدها لي لين توصل الفكرة.',
      name: 'محمد أحمد',
      grade: 'المرحلة الثانوية',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed',
    },
    {
      id: 2,
      quote: 'مواعيد الحصص مرتبة وواضحة، وأعرف وش عندي من دروس. سهل عليّ أتابع بدون لخبطة.',
      name: 'سارة محمود',
      grade: 'المرحلة المتوسطة',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sara',
    },
    {
      id: 3,
      quote: 'أقدر أسأل المدرس براحة، ويتابع معي ويقول لي وش أحتاج أراجع قبل الحصة الجاية.',
      name: 'أحمد علي',
      grade: 'المرحلة الثانوية',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ali',
    },
    {
      id: 4,
      quote: 'الشرح مبسّط والمتابعة بين الحصص واضحة، وأعرف وش فهمت ووش أحتاج أراجع.',
      name: 'منى حسن',
      grade: 'المرحلة الثانوية',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mona',
    },
  ];

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      AOS.init({
        duration: 700,
        once: false,
        offset: 100,
        easing: 'ease-in-out',
      });

      if (
        typeof window.matchMedia !== 'function' ||
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      )
        this.startAutoPlay();
    }

    this.fetchCurricula();
  }

  // تنفيذ الـ ngOnDestroy وإغلاق الاشتراكات بداخلها لتنظيف الذاكرة
  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.stopAutoPlay();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  fetchCurricula(): void {
    this.teacherService
      .getCurricula()
      .pipe(timeout(12000), takeUntil(this.destroy$)) // ربط الاشتراك بـ destroy$ لإلغائه عند الخروج من الصفحة
      .subscribe({
        next: (response: any) => {
          this.curriculaList = learningItems(response);
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('خطأ في جلب المناهج:', error);
        },
      });
  }

  onSelectCurriculum(curriculumId: string): void {
    if (curriculumId) {
      this.router.navigate(['/curriculum', curriculumId]);
    } else {
      this.router.navigate(['/courses']);
    }
  }

  startAutoPlay(): void {
    this.stopAutoPlay();
    this.autoPlayInterval = setInterval(() => {
      this.scrollLeft();
    }, 3500);
  }

  stopAutoPlay(): void {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
    }
  }

  scrollLeft(): void {
    if (!this.sliderTrack) return;
    const el = this.sliderTrack.nativeElement;

    if (Math.abs(el.scrollLeft) + el.clientWidth >= el.scrollWidth - 15) {
      el.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      el.scrollBy({ left: -this.scrollStep, behavior: 'smooth' });
    }
  }

  scrollRight(): void {
    if (!this.sliderTrack) return;
    const el = this.sliderTrack.nativeElement;

    if (Math.abs(el.scrollLeft) <= 15) {
      el.scrollTo({ left: -el.scrollWidth, behavior: 'smooth' });
    } else {
      el.scrollBy({ left: this.scrollStep, behavior: 'smooth' });
    }
  }
}
