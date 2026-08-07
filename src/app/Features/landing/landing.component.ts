import {
  Component,
  ElementRef,
  OnInit,
  OnDestroy,
  ViewChild,
  inject,
  PLATFORM_ID,
  ChangeDetectionStrategy,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HeroComponent } from '../hero/hero.component';
import { SectionHeaderComponent } from '../../shared/components/section-header/section-header.component';
import { EducationCardComponent } from '../../shared/components/education-card/education-card.component';
import AOS from 'aos';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [HeroComponent, SectionHeaderComponent, EducationCardComponent, RouterLink],
  templateUrl: './landing.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './landing.component.css',
})
export class LandingComponent implements OnInit, OnDestroy {
  @ViewChild('sliderTrack') sliderTrack!: ElementRef<HTMLDivElement>;

  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);

  autoPlayInterval: any;
  scrollStep = 300;

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
      quote: 'واجهة المنصة بسيطة وسهلة والدعم دائماً متعاون.',
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
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.stopAutoPlay();
    }
  }

  onSelectCurriculum(type: string): void {
    switch (type) {
      case 'uae':
        this.router.navigate(['/curriculum/uae']);
        break;

      case 'courses':
        this.router.navigate(['/courses']);
        break;

      default:
        this.router.navigate(['/']);
        break;
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
