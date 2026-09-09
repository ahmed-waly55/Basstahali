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
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, HeroComponent, SectionHeaderComponent, EducationCardComponent, RouterLink],
  templateUrl: './landing.component.html',
  changeDetection: ChangeDetectionStrategy.Default,
  styleUrl: './landing.component.css',
})
export class LandingComponent implements OnInit, OnDestroy {
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
      quote: 'المنصة ساعدتني أذاكر بسهولة وأحسن مستواي بشكل كبير.',
      name: 'محمد أحمد',
      grade: 'الصف الثاني الثانوي',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed',
    },
    {
      id: 2,
      quote: 'شرح المدرسين رائع والتصحيح الإلكتروني بيوفر وقت كبير.',
      name: 'سارة محمود',
      grade: 'الصف الثالث الإعدادي',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sara',
    },
    {
      id: 3,
      quote: 'واجهة المنصة بسيطة والسهلة والدعم دائماً متعاون.',
      name: 'أحمد علي',
      grade: 'الصف الأول الثانوي',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ali',
    },
    {
      id: 4,
      quote: 'تجربة ممتازة والامتحانات التفاعلية ساعدتني جداً.',
      name: 'منى حسن',
      grade: 'الصف الثالث الثانوي',
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
    this.teacherService.getCurricula()
      .pipe(takeUntil(this.destroy$)) // ربط الاشتراك بـ destroy$ لإلغائه عند الخروج من الصفحة
      .subscribe({
        next: (response: any) => {
          this.curriculaList = response?.data || response || [];
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('خطأ في جلب المناهج:', error);
        }
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
