import type { StudentSession } from '../../core/student/student.models';
import {
  lessonPresentation,
  studentSourceDay,
  studentTimeZoneLabel,
} from './student-lesson-display';

const lesson = {
  date: '2026-12-01',
  startTime: '23:30:00',
  endTime: '00:30:00',
  classLink: 'https://meet.example.com/lesson',
  raw: {},
} as StudentSession;

describe('student timetable presentation', () => {
  it('converts Cairo clock times and the calendar day together in Dubai', () => {
    const row = lessonPresentation(lesson, { timeZone: 'Asia/Dubai' }, 'en');
    expect(row.timing.day).toBe('2026-12-02');
    expect(row.day).toBe('Wednesday');
    expect(row.clock).toBe('01:30');
    expect(row.period).toBe('AM');
    expect(row.end).toBe('02:30 AM');
    expect(row.date).toContain('Dec');
    expect(row.date).toContain('2');
  });

  it('uses the Egyptian calendar date for the API filter near device midnight', () => {
    expect(studentSourceDay(Date.parse('2026-12-01T20:30:00Z'))).toBe('2026-12-01');
    expect(studentSourceDay(Date.parse('2026-07-01T21:30:00Z'))).toBe('2026-07-02');
  });

  it('names the time zone in the chosen language and only exposes safe links in the admission window', () => {
    const now = Date.parse('2026-12-01T21:20:00Z');
    const options = { now, timeZone: 'Asia/Dubai' };
    expect(studentTimeZoneLabel('Asia/Dubai', 'en', now)).toContain('Gulf');
    expect(lessonPresentation(lesson, options, 'ar').joinLink).toBe(lesson.classLink);
    expect(
      lessonPresentation({ ...lesson, classLink: 'javascript:alert(1)' }, options, 'ar').joinLink,
    ).toBeNull();
    expect(lessonPresentation(lesson, { ...options, now: now - 1 }, 'ar').joinLink).toBeNull();
  });
});
