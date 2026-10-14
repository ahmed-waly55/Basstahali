import { afterNextRender, Component, DestroyRef, ElementRef, inject, signal } from '@angular/core';

@Component({
  selector: 'app-live-lesson',
  imports: [],
  templateUrl: './live-lesson.component.html',
  styleUrl: './live-lesson.component.css',
  host: { '[class.motion-paused]': 'motionPaused()' },
})
export class LiveLessonComponent {
  readonly messages = {
    m_e904fc08c213: $localize`:@@m_e904fc08c213:حصتك المباشرة، أينما كنت`,
    m_bf191a2e66ac: $localize`:@@m_bf191a2e66ac:معلمك معك خطوة بخطوة`,
    m_8e049b4425e8: $localize`:@@m_8e049b4425e8:طالب يتابع حصة خصوصية مباشرة مع معلمه على اللابتوب`,
    m_e876cfcf685e: $localize`:@@m_e876cfcf685e:تشغيل حركة الصورة`,
    m_e6e04ccf1248: $localize`:@@m_e6e04ccf1248:إيقاف حركة الصورة`,
  };

  private host = inject(ElementRef<HTMLElement>);
  private destroy = inject(DestroyRef);
  readonly motionPaused = signal(false);
  readonly reducedMotion = signal(false);

  toggleMotion(): void {
    this.motionPaused.update((paused) => !paused);
  }

  constructor() {
    afterNextRender(() => {
      const media = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.reducedMotion.set(media.matches);
      let frame = 0;
      const update = () => {
        frame = 0;
        if (this.motionPaused() && !media.matches) return;
        const rect = this.host.nativeElement.getBoundingClientRect();
        const progress = Math.max(
          0,
          Math.min(1, (window.innerHeight - rect.top) / (window.innerHeight + rect.height)),
        );
        this.host.nativeElement.style.setProperty(
          '--lesson-scroll',
          media.matches ? '0.5' : String(progress),
        );
      };
      const scroll = () => {
        if (!frame) frame = requestAnimationFrame(update);
      };
      const preferenceChange = () => {
        this.reducedMotion.set(media.matches);
        scroll();
      };
      const observer = new IntersectionObserver((entries) => {
        this.host.nativeElement.classList.toggle(
          'scene-visible',
          entries.some((entry) => entry.isIntersecting),
        );
      });
      observer.observe(this.host.nativeElement);
      window.addEventListener('scroll', scroll, { passive: true });
      window.addEventListener('resize', scroll, { passive: true });
      media.addEventListener('change', preferenceChange);
      update();
      this.destroy.onDestroy(() => {
        observer.disconnect();
        cancelAnimationFrame(frame);
        window.removeEventListener('scroll', scroll);
        window.removeEventListener('resize', scroll);
        media.removeEventListener('change', preferenceChange);
      });
    });
  }
}
