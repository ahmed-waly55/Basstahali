import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { DestroyRef, Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Observable, defer, finalize, shareReplay, tap } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { StudentHomeSchedule } from '../../core/student/student.models';
import { StudentService } from '../../core/student/student.service';
import { deviceTimeZone } from './student-lesson-time';

/** One timetable and clock for the authenticated shell and all its child pages. */
@Injectable({ providedIn: 'root' })
export class StudentTimetableService {
  private readonly api = inject(StudentService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly clock = signal(Date.now());
  private readonly zone = signal(deviceTimeZone());
  private readonly schedule = signal<StudentHomeSchedule | null>(null);
  readonly now = this.clock.asReadonly();
  readonly timeZone = this.zone.asReadonly();
  readonly home = this.schedule.asReadonly();
  private request?: Observable<StudentHomeSchedule>;
  private pending = false;
  private revision = 0;

  constructor() {
    const view = this.document.defaultView;
    if (!this.browser || !view) return;
    const synchronize = () => {
      this.clock.set(Date.now());
      this.zone.set(deviceTimeZone());
    };
    const visible = () => {
      if (this.document.visibilityState === 'visible') synchronize();
    };
    const timer = view.setInterval(() => this.clock.set(Date.now()), 1_000);
    view.addEventListener('focus', synchronize);
    this.document.addEventListener('visibilitychange', visible);
    this.destroyRef.onDestroy(() => {
      view.clearInterval(timer);
      view.removeEventListener('focus', synchronize);
      this.document.removeEventListener('visibilitychange', visible);
    });
  }

  fullSchedule(force = false): Observable<StudentHomeSchedule> {
    if (!this.auth.hasSession()) {
      this.revision++;
      this.pending = false;
      this.request = undefined;
      this.schedule.set(null);
      return EMPTY;
    }
    // Focus, automatic refresh and the schedule page may ask for the same response together.
    // A forced refresh joins an existing request instead of creating a competing older response.
    if (this.request && (!force || this.pending)) return this.request;
    const revision = ++this.revision;
    this.pending = true;
    const request = defer(() => this.api.getHomeSchedule()).pipe(
      takeUntilDestroyed(this.destroyRef),
      tap({
        next: (home) => {
          if (revision === this.revision && this.auth.hasSession()) this.schedule.set(home);
        },
        error: () => {
          if (revision === this.revision) this.request = undefined;
          // Keep a successfully loaded timetable visible during a transient refresh failure.
        },
      }),
      finalize(() => {
        if (revision === this.revision) this.pending = false;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    this.request = request;
    return request;
  }
}
