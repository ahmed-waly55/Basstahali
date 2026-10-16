import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  LOCALE_ID,
  PLATFORM_ID,
  computed,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/auth/auth.service';
import { lessonTiming } from './student-lesson-time';
import { StudentTimetableService } from './student-timetable.service';
import { createStudentCopy, safeLessonLink } from './student-ui';

@Component({
  selector: 'app-student-lesson-banner',
  templateUrl: './student-lesson-banner.component.html',
  styleUrl: './student-lesson-banner.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentLessonBannerComponent {
  private readonly auth = inject(AuthService);
  private readonly timetable = inject(StudentTimetableService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly locale = inject(LOCALE_ID);
  readonly copy = createStudentCopy();
  readonly bannerCopy = {
    notices: $localize`:@@student_lessonBannerNotices:تنبيهات الحصص المتاحة`,
    starting: $localize`:@@student_lessonBannerStarting:حصتك تبدأ قريبًا`,
    live: $localize`:@@student_lessonBannerLive:حصتك جارية الآن`,
    timeZone: $localize`:@@student_lessonBannerTimeZone:بتوقيت جهازك`,
  };
  readonly lessons = computed(() => {
    if (!this.auth.hasSession()) return [];
    const home = this.timetable.home();
    if (!home) return [];
    const now = this.timetable.now();
    const timeZone = this.timetable.timeZone();
    return home.items
      .map((lesson) => ({
        lesson,
        href: safeLessonLink(lesson.classLink),
        timing: lessonTiming(lesson, {
          now,
          timeZone,
          weekStart: home.weekStart,
          weekEnd: home.weekEnd,
        }),
      }))
      .filter((item) => item.href && item.timing.canJoin && item.timing.start !== null)
      .sort((first, second) => first.timing.start! - second.timing.start!)
      .map((item) => ({
        ...item,
        label: item.timing.start! > now ? this.bannerCopy.starting : this.bannerCopy.live,
        dateTime: new Date(item.timing.start!).toISOString(),
        time: new Intl.DateTimeFormat(this.locale, {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          timeZone: item.timing.timeZone,
        }).format(item.timing.start!),
      }));
  });

  constructor() {
    const view = this.document.defaultView;
    if (!this.browser || !view) return;
    const refresh = () => this.refresh(true);
    const visible = () => {
      if (this.document.visibilityState === 'visible') refresh();
    };
    this.refresh();
    const timer = view.setInterval(() => {
      if (this.document.visibilityState === 'visible') refresh();
    }, 60_000);
    view.addEventListener('focus', refresh);
    this.document.addEventListener('visibilitychange', visible);
    this.destroyRef.onDestroy(() => {
      view.clearInterval(timer);
      view.removeEventListener('focus', refresh);
      this.document.removeEventListener('visibilitychange', visible);
    });
  }

  private refresh(force = false): void {
    if (!this.auth.hasSession()) return;
    this.timetable
      .fullSchedule(force)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: () => undefined });
  }
}
