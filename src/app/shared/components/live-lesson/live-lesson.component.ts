import { afterNextRender, Component, DestroyRef, ElementRef, inject, signal } from '@angular/core';
import { TranslatePipe } from '../../../core/services/translate.pipe';

@Component({
  selector: 'app-live-lesson',
  imports: [TranslatePipe],
  templateUrl: './live-lesson.component.html',
  styleUrl: './live-lesson.component.css',
  host: { '[class.motion-paused]': 'motionPaused()' },
})
export class LiveLessonComponent {
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
