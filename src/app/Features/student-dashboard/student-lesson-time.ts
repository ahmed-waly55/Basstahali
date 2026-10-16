import type { StudentSession } from '../../core/student/student.models';

/** Clock-only values in the timetable API are Egyptian local time. */
export const STUDENT_SOURCE_TIME_ZONE = 'Africa/Cairo';

export interface StudentLessonTimingOptions {
  now?: number;
  timeZone?: string;
  weekStart?: string | null;
  weekEnd?: string | null;
  selectedDate?: string | null;
}

export interface StudentLessonTiming {
  start: number | null;
  end: number | null;
  canJoin: boolean;
  /** Calendar date and 24-hour clock in the device's time zone. */
  day: string | null;
  time: string | null;
  timeZone: string;
}

interface CalendarDay {
  year: number;
  month: number;
  day: number;
}
interface Clock {
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
}
type WallTime = CalendarDay & Clock;

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
const CLOCK_RANGE_SEPARATOR = /\s*(?:–|—|-|\s+to\s+|\s+إلى\s+|\s+الى\s+)\s*/i;
const formatters = new Map<string, Intl.DateTimeFormat>();

function validTimeZone(value: string | undefined): string | null {
  if (!value) return null;
  try {
    return new Intl.DateTimeFormat('en', { timeZone: value }).resolvedOptions().timeZone;
  } catch {
    return null;
  }
}

export function deviceTimeZone(): string {
  try {
    return (
      validTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone) ?? STUDENT_SOURCE_TIME_ZONE
    );
  } catch {
    return STUDENT_SOURCE_TIME_ZONE;
  }
}

function calendarDay(value: string | null | undefined): CalendarDay | null {
  const match = value?.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T)/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return year >= 1000 &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
    ? { year, month, day }
    : null;
}

function dayEpoch(value: CalendarDay): number {
  return Date.UTC(value.year, value.month - 1, value.day);
}

function dayAfter(value: CalendarDay): CalendarDay {
  const next = new Date(dayEpoch(value) + DAY);
  return { year: next.getUTCFullYear(), month: next.getUTCMonth() + 1, day: next.getUTCDate() };
}

function normalized(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[\u064b-\u065f\u0670\s_.-]/g, '');
}

function clock(value: string | null | undefined, period?: string | null): Clock | null {
  if (!value) return null;
  const text = value.trim().replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x660));
  const match = text.match(/^(\d{1,2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?\s*([^\d]*)$/);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const second = Number(match[3] ?? 0);
  const millisecond = Number((match[4] ?? '').padEnd(3, '0').slice(0, 3));
  const explicitSuffix = normalized(match[5]);
  const suffix = explicitSuffix || normalized(period || '');
  const morning = ['am', 'a', 'ص', 'صباح', 'صباحا', 'صباحاً', 'morning'].includes(suffix);
  const evening = ['pm', 'p', 'م', 'مساء', 'مساءا', 'مساءً', 'evening', 'afternoon'].includes(
    suffix,
  );
  if (suffix && !morning && !evening) return null;
  if (morning || evening) {
    if (explicitSuffix && (hour < 1 || hour > 12)) return null;
    if (hour >= 1 && hour <= 12) hour = (hour % 12) + (evening ? 12 : 0);
  }
  return hour <= 23 && minute <= 59 && second <= 59 ? { hour, minute, second, millisecond } : null;
}

function lessonPeriod(lesson: StudentSession): string | null {
  const range = lesson.timeRange || lesson.timeSlot;
  const values = [lesson.startTime, lesson.endTime, ...(range?.split(CLOCK_RANGE_SEPARATOR) ?? [])];
  // A bare 00 or 13–23 hour establishes a 24-hour pair. Row-level PM describes the
  // start; applying it again to an overnight 01:30 end would extend the lesson by 12h.
  const uses24HourClock = values.some((value) => {
    const text = value?.trim().replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x660));
    const match = text?.match(/^(\d{1,2}):\d{2}(?::\d{2}(?:\.\d{1,9})?)?$/);
    return Boolean(match && clock(text) && (Number(match[1]) === 0 || Number(match[1]) > 12));
  });
  return uses24HourClock ? null : lesson.period;
}

function wallParts(instant: number, timeZone: string): WallTime | null {
  if (!Number.isFinite(instant)) return null;
  try {
    let formatter = formatters.get(timeZone);
    if (!formatter) {
      formatter = new Intl.DateTimeFormat('en-CA-u-ca-iso8601-nu-latn', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
      });
      formatters.set(timeZone, formatter);
    }
    const values: Record<string, number> = {};
    for (const part of formatter.formatToParts(instant)) {
      if (part.type !== 'literal') values[part.type] = Number(part.value);
    }
    return {
      year: values['year'],
      month: values['month'],
      day: values['day'],
      hour: values['hour'],
      minute: values['minute'],
      second: values['second'],
      millisecond: ((instant % 1000) + 1000) % 1000,
    };
  } catch {
    return null;
  }
}

function wallEpoch(value: WallTime): number {
  return Date.UTC(
    value.year,
    value.month - 1,
    value.day,
    value.hour,
    value.minute,
    value.second,
    value.millisecond,
  );
}

/** Resolve against Cairo's offset on this date, rejecting skipped or repeated DST clocks. */
function cairoInstant(value: WallTime): number | null {
  const wall = wallEpoch(value);
  const offsets = new Set<number>();
  for (const hours of [-36, -12, 0, 12, 36]) {
    const sample = wall + hours * 60 * MINUTE;
    const parts = wallParts(sample, STUDENT_SOURCE_TIME_ZONE);
    if (parts) offsets.add(wallEpoch(parts) - sample);
  }
  const candidates = [...offsets]
    .map((offset) => wall - offset)
    .filter((candidate) => {
      const actual = wallParts(candidate, STUDENT_SOURCE_TIME_ZONE);
      return actual !== null && wallEpoch(actual) === wall;
    });
  return candidates.length === 1 ? candidates[0] : null;
}

function timestamp(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = value
    .trim()
    .match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?)(Z|[+-]\d{2}:?\d{2})?$/i);
  if (!match) return null;
  const date = calendarDay(match[1]);
  const time = clock(match[2]);
  if (!date || !time) return null;
  const wall = { ...date, ...time };
  const offset = match[3];
  if (!offset) return cairoInstant(wall);
  if (offset.toUpperCase() === 'Z') return wallEpoch(wall);
  const digits = offset.slice(1).replace(':', '');
  const hours = Number(digits.slice(0, 2));
  const minutes = Number(digits.slice(2));
  if (hours > 14 || minutes > 59 || (hours === 14 && minutes !== 0)) return null;
  return wallEpoch(wall) - (offset[0] === '-' ? -1 : 1) * (hours * 60 + minutes) * MINUTE;
}

function weekday(value: string | null | undefined): number | null {
  if (!value) return null;
  const key = normalized(value).replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي');
  const aliases = [
    ['sunday', 'sun', 'الاحد', 'احد'],
    ['monday', 'mon', 'الاثنين', 'الاثنان', 'اثنين'],
    ['tuesday', 'tue', 'الثلاثاء', 'ثلاثاء'],
    ['wednesday', 'wed', 'الاربعاء', 'اربعاء'],
    ['thursday', 'thu', 'الخميس', 'خميس'],
    ['friday', 'fri', 'الجمعة', 'جمعه', 'جمعة'],
    ['saturday', 'sat', 'السبت', 'سبت'],
  ];
  const index = aliases.findIndex((names) => names.includes(key));
  return index < 0 ? null : index;
}

function lessonDay(
  lesson: StudentSession,
  options: StudentLessonTimingOptions,
): CalendarDay | null {
  if (lesson.date) return calendarDay(lesson.date);
  if (lesson.occurrenceAt) return calendarDay(lesson.occurrenceAt);
  const day = weekday(lesson.dayOfWeek) ?? weekday(lesson.day);
  const selected = calendarDay(options.selectedDate);
  if (selected)
    return day === null || new Date(dayEpoch(selected)).getUTCDay() === day ? selected : null;
  const start = calendarDay(options.weekStart);
  if (!start || day === null) return null;
  const startEpoch = dayEpoch(start);
  const end = calendarDay(options.weekEnd);
  if (options.weekEnd && !end) return null;
  const last = end ? dayEpoch(end) : startEpoch + 6 * DAY;
  if (last < startEpoch || last >= startEpoch + 7 * DAY) return null;
  const candidate = startEpoch + ((day - new Date(startEpoch).getUTCDay() + 7) % 7) * DAY;
  return candidate <= last ? calendarDay(new Date(candidate).toISOString()) : null;
}

function clockRange(
  lesson: StudentSession,
  period: string | null,
): [Clock | null, Clock | null, boolean] {
  const text = lesson.timeRange || lesson.timeSlot;
  if (!text) return [null, null, false];
  const parts = text.split(CLOCK_RANGE_SEPARATOR);
  if (parts.length === 1) return [clock(parts[0], period), null, false];
  if (parts.length !== 2) return [null, null, true];
  return [clock(parts[0], period), clock(parts[1], period), true];
}

function endedStatus(status: string | null): boolean {
  if (!status) return false;
  const key = normalized(status).replace(/[أإآ]/g, 'ا');
  return (
    key.startsWith('cancel') ||
    [
      'completed',
      'complete',
      'finished',
      'ended',
      'expired',
      'missed',
      'absent',
      'postponed',
      'rescheduled',
      'ملغي',
      'ملغية',
      'ملغاه',
      'تمالالغاء',
      'مكتمل',
      'مكتملة',
      'انتهت',
      'منتهي',
      'منتهية',
      'مؤجلة',
    ].includes(key)
  );
}

export function lessonTiming(
  lesson: StudentSession,
  options: StudentLessonTimingOptions = {},
): StudentLessonTiming {
  const timeZone = validTimeZone(options.timeZone) ?? deviceTimeZone();
  const date = lessonDay(lesson, options);
  const period = lessonPeriod(lesson);
  const [rangeStart, rangeEnd, hasRangeEnd] = clockRange(lesson, period);
  const startClock = clock(lesson.startTime, period) ?? rangeStart;
  const endClock = clock(lesson.endTime, period) ?? rangeEnd;
  const suppliedOccurrence = Boolean(
    lesson.occurrenceAt && !/^\d{4}-\d{2}-\d{2}$/.test(lesson.occurrenceAt.trim()),
  );
  let start = suppliedOccurrence ? timestamp(lesson.occurrenceAt) : timestamp(lesson.startTime);
  if (!suppliedOccurrence && start === null && date && startClock) {
    start = cairoInstant({ ...date, ...startClock });
  }
  if (start === null && !suppliedOccurrence && !startClock) start = timestamp(lesson.date);
  let end = timestamp(lesson.endTime);
  if (end === null && endClock && start !== null) {
    const source = wallParts(start, STUDENT_SOURCE_TIME_ZONE);
    if (source) {
      const endDate =
        wallEpoch({ ...source, ...endClock }) < wallEpoch(source) ? dayAfter(source) : source;
      end = cairoInstant({ ...endDate, ...endClock });
    }
  }
  const parts = start === null ? null : wallParts(start, timeZone);
  const sourceDay = start === null ? null : wallParts(start, STUDENT_SOURCE_TIME_ZONE);
  const recurrenceEnd = calendarDay(lesson.recurrenceEndDate);
  const recurrenceInstant = lesson.recurrenceEndDate?.includes('T')
    ? timestamp(lesson.recurrenceEndDate)
    : null;
  const withinRecurrence =
    !lesson.recurrenceEndDate ||
    (recurrenceInstant !== null
      ? start !== null && start <= recurrenceInstant
      : Boolean(
          recurrenceEnd &&
          sourceDay &&
          !lesson.recurrenceEndDate.includes('T') &&
          dayEpoch(sourceDay) <= dayEpoch(recurrenceEnd),
        ));
  const now = options.now ?? Date.now();
  const invalidEnd = Boolean(lesson.endTime || hasRangeEnd) && end === null;
  // Without a known end, only the ten-minute admission window through the start is safe.
  const canJoin =
    start !== null &&
    !invalidEnd &&
    Number.isFinite(now) &&
    !endedStatus(lesson.status) &&
    withinRecurrence &&
    now >= start - 10 * MINUTE &&
    (end === null ? now <= start : end > start && now < end);
  const pad = (value: number) => String(value).padStart(2, '0');
  return {
    start,
    end,
    canJoin,
    day: parts ? `${parts.year}-${pad(parts.month)}-${pad(parts.day)}` : null,
    time: parts ? `${pad(parts.hour)}:${pad(parts.minute)}` : null,
    timeZone,
  };
}
