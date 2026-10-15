import {
  createStudentCopy,
  localStudentDay,
  safeLessonLink,
  studentDate,
  studentStatus,
  validStudentDay,
} from './student-ui';

describe('student portal display boundaries', () => {
  it('only exposes absolute HTTPS lesson links without embedded credentials', () => {
    expect(safeLessonLink('https://meet.example.com/lesson?code=abc')).toBe(
      'https://meet.example.com/lesson?code=abc',
    );
    for (const value of [
      null,
      '',
      '/lesson',
      '//meet.example.com/lesson',
      'http://meet.example.com',
      'javascript:alert(1)',
      'data:text/html,hello',
      'https://user:password@meet.example.com',
    ]) {
      expect(safeLessonLink(value)).toBeNull();
    }
  });

  it('uses local calendar fields when preparing a daily schedule request', () => {
    const date = new Date(2026, 9, 15, 0, 5);
    expect(localStudentDay(date)).toBe('2026-10-15');
  });

  it('accepts real calendar dates and rejects rolled over or partial dates', () => {
    expect(validStudentDay('2028-02-29')).toBe(true);
    for (const value of ['2026-02-29', '2026-02-30', '2026-13-01', '2026-10', ''])
      expect(validStudentDay(value)).toBe(false);
  });

  it('keeps missing or invalid data explicit instead of manufacturing a date or status', () => {
    const unavailable = createStudentCopy().notProvided;
    expect(studentDate(null, 'ar')).toBe(unavailable);
    expect(studentDate('2026-02-30', 'ar')).toBe(unavailable);
    expect(studentStatus('0')).toBe(unavailable);
    expect(studentStatus('A service-provided status')).toBe('A service-provided status');
  });
});
