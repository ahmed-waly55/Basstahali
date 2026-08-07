import { isPlatformBrowser, NgClass } from '@angular/common';
import {
  Component,
  ElementRef,
  inject,
  OnDestroy,
  PLATFORM_ID,
  signal,
  viewChild,
  afterNextRender,
  ChangeDetectionStrategy,
} from '@angular/core';
import { RouterLink } from '@angular/router';

interface Stat {
  target: number;
  current: number;
  prefix?: string;
  suffix?: string;
  label: string;
  decimals?: number;
  colorClass: string;
}

interface Feature {
  icon: string;
  title: string;
  desc: string;
  isHighlighted?: boolean;
}

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [NgClass, RouterLink],
  templateUrl: './hero.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './hero.component.css',
})
export class HeroComponent implements OnDestroy {
  private platformId = inject(PLATFORM_ID);

  statsContainer = viewChild<ElementRef<HTMLDivElement>>('statsContainer');

  stats = signal<Stat[]>([
    { target: 500, current: 0, prefix: '+', label: 'طالب', colorClass: 'text-[#4F2DB7]' },
    { target: 100, current: 0, prefix: '+', label: 'مدرس', colorClass: 'text-[#4F2DB7]' },
    { target: 500, current: 0, prefix: '+', label: 'كورس', colorClass: 'text-[#4F2DB7]' },
    { target: 98, current: 0, suffix: '%', label: 'رضاء العملاء', colorClass: 'text-[#F9B400]' }, // 👈 تم حذف decimals: 1
  ]);

  features = signal<Feature[]>([
    { icon: 'fa-calendar-days', title: 'تنظيم الحصص', desc: 'جدول ذكي مع تنبيهات للحصص والدروس.' },
    {
      icon: 'fa-clipboard-check',
      title: 'واجبات إلكترونية',
      desc: 'حل الواجبات واستلام التصحيح مباشرة.',
    },
    { icon: 'fa-chart-line', title: 'متابعة الأداء', desc: 'تقارير وإحصائيات لمستوى الطالب.' },
    { icon: 'fa-book-open', title: 'مكتبة الدروس', desc: 'فيديوهات وملفات PDF في مكان واحد.' },
    {
      icon: 'fa-user-graduate',
      title: 'أفضل المدرسين',
      desc: 'نخبة من أفضل المدرسين في الإمارات.',
    },
    {
      icon: 'fa-users',
      title: 'متابعة ولي الأمر',
      desc: 'متابعة مستمرة للحضور والدرجات والواجبات.',
      isHighlighted: true,
    },
  ]);

  private observer?: IntersectionObserver;

  constructor() {
    afterNextRender(() => {
      this.initIntersectionObserver();
    });
  }

  private initIntersectionObserver(): void {
    if (!isPlatformBrowser(this.platformId) || typeof IntersectionObserver === 'undefined') {
      this.showFinalValues();
      return;
    }

    const container = this.statsContainer()?.nativeElement;

    if (container) {
      this.observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            this.startCounter();
            this.observer?.disconnect();
          }
        },
        { threshold: 0.3 },
      );
      this.observer.observe(container);
    }
  }

  private startCounter(): void {
    const duration = 2000;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 2);

      this.stats.update((items) =>
        items.map((stat) => {
          const rawValue = stat.target * easeProgress;
          return {
            ...stat,
            current: stat.decimals
              ? parseFloat(rawValue.toFixed(stat.decimals))
              : Math.floor(rawValue),
          };
        }),
      );

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.showFinalValues();
      }
    };

    requestAnimationFrame(animate);
  }

  private showFinalValues(): void {
    this.stats.update((items) => items.map((stat) => ({ ...stat, current: stat.target })));
  }

  formatValue(stat: Stat): string {
    if (stat.target >= 1000) {
      const kValue = (stat.current / 1000).toFixed(stat.current >= 10000 ? 0 : 1);
      return `${stat.prefix ?? ''}${kValue}K${stat.suffix ?? ''}`;
    }
    return `${stat.prefix ?? ''}${stat.current}${stat.suffix ?? ''}`;
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
