import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import type { StudentSession } from '../../core/student/student.models';
import { StudentService } from '../../core/student/student.service';
import { StudentOverviewComponent } from './student-overview.component';
import { StudentTimetableService } from './student-timetable.service';

describe('StudentOverviewComponent local lesson times', () => {
  it('shows Dubai time and follows the same admission window as the timetable and banner', () => {
    const start = Date.parse('2026-12-01T17:00:00Z');
    const now = signal(start - 10 * 60_000 - 1);
    const lesson = {
      date: '2026-12-01',
      startTime: '19:00:00',
      endTime: '20:00:00',
      subjectName: 'الرياضيات',
      classLink: 'https://meet.example.com/lesson',
      raw: {},
    } as StudentSession;
    const api = {
      getDashboard: vi.fn(() => of({ stats: [] })),
      getDailySchedule: vi.fn(() => of({ items: [lesson] })),
    };
    TestBed.configureTestingModule({
      imports: [StudentOverviewComponent],
      providers: [
        { provide: AuthService, useValue: { user: signal(null) } },
        { provide: StudentService, useValue: api },
        { provide: StudentTimetableService, useValue: { now, timeZone: signal('Asia/Dubai') } },
      ],
    });
    const fixture = TestBed.createComponent(StudentOverviewComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.rows()[0].timing.time).toBe('21:00');
    expect(fixture.nativeElement.querySelector('.student-lesson-actions a')).toBeNull();
    now.set(start - 10 * 60_000);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('.student-lesson-actions a')?.getAttribute('href'),
    ).toBe(lesson.classLink);
    now.set(start + 60 * 60_000);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.student-lesson-actions a')).toBeNull();
    expect(api.getDailySchedule).toHaveBeenCalledTimes(1);
  });
});
