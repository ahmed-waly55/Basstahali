import type { StudentSession } from '../../core/student/student.models';
import { lessonTiming } from './student-lesson-time';
import { createStudentCopy, safeLessonLink } from './student-ui';

export function studentSourceDay(now = Date.now()): string {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  return ['year', 'month', 'day']
    .map((type) => parts.find((part) => part.type === type)!.value)
    .join('-');
}

export function studentTimeZoneLabel(timeZone: string, locale: string, now: number): string {
  return (
    new Intl.DateTimeFormat(locale, { timeZone, timeZoneName: 'long' })
      .formatToParts(now)
      .find((part) => part.type === 'timeZoneName')?.value ?? timeZone
  );
}

export function lessonPresentation(
  lesson: StudentSession,
  options: Parameters<typeof lessonTiming>[1],
  locale: string,
) {
  const timing = lessonTiming(lesson, options);
  const copy = createStudentCopy();
  const timeFormat = new Intl.DateTimeFormat(locale, {
    timeZone: timing.timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    numberingSystem: 'latn',
  });
  const parts = timing.start === null ? [] : timeFormat.formatToParts(timing.start);
  const clock = parts
    .filter((part) => part.type !== 'dayPeriod')
    .map((part) => part.value)
    .join('')
    .trim();
  const period = parts.find((part) => part.type === 'dayPeriod')?.value ?? '';
  const dayFormat = new Intl.DateTimeFormat(locale, {
    timeZone: timing.timeZone,
    weekday: 'long',
  });
  const suppliedDay = lesson.dayOfWeek || lesson.day;
  const weekday = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ].indexOf(suppliedDay?.trim().toLowerCase() ?? '');
  const day =
    timing.start !== null
      ? dayFormat.format(timing.start)
      : weekday < 0
        ? suppliedDay || copy.notProvided
        : new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: 'UTC' }).format(
            new Date(Date.UTC(2024, 0, 7 + weekday)),
          );
  const date =
    timing.start === null
      ? null
      : new Intl.DateTimeFormat(locale, {
          timeZone: timing.timeZone,
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }).format(timing.start);
  return {
    lesson,
    timing,
    day,
    date,
    clock: clock || copy.timePending,
    period,
    end: timing.end === null ? null : timeFormat.format(timing.end),
    time:
      timing.start === null
        ? copy.timePending
        : [
            timeFormat.format(timing.start),
            timing.end === null ? null : timeFormat.format(timing.end),
          ]
            .filter(Boolean)
            .join(' – '),
    joinLink: timing.canJoin ? safeLessonLink(lesson.classLink) : null,
  };
}
