import type { StudentSession } from '../../core/student/student.models';
import { deviceTimeZone, lessonTiming, STUDENT_SOURCE_TIME_ZONE } from './student-lesson-time';

function lesson(overrides: Partial<StudentSession> = {}): StudentSession {
  return {
    id: 'lesson',
    studentId: null,
    teacherName: null,
    subjectName: 'Math',
    date: '2026-10-16',
    day: null,
    dayOfWeek: null,
    startTime: '19:00',
    endTime: '20:00',
    timeRange: null,
    timeSlot: null,
    period: null,
    recurrenceType: 'Once',
    recurrenceEndDate: null,
    classLink: 'https://meet.example.com/lesson',
    status: 'Scheduled',
    occurrenceAt: null,
    courseName: null,
    paymentStatus: null,
    raw: {},
    ...overrides,
  };
}

describe('student lesson device time and admission window', () => {
  it('uses Cairo as the API clock source and a valid device zone', () => {
    expect(STUDENT_SOURCE_TIME_ZONE).toBe('Africa/Cairo');
    expect(() => new Intl.DateTimeFormat('en', { timeZone: deviceTimeZone() })).not.toThrow();
    expect(lessonTiming(lesson(), { timeZone: 'invalid-zone' }).timeZone).toBe(deviceTimeZone());
  });

  it('converts an Egyptian summer clock to the UAE device clock', () => {
    const result = lessonTiming(lesson(), { timeZone: 'Asia/Dubai' });
    expect(result.start).toBe(Date.parse('2026-10-16T16:00:00Z'));
    expect(result.end).toBe(Date.parse('2026-10-16T17:00:00Z'));
    expect(result.day).toBe('2026-10-16');
    expect(result.time).toBe('20:00');
  });

  it('uses the Cairo winter offset on the occurrence date rather than the current offset', () => {
    const result = lessonTiming(lesson({ date: '2026-12-16' }), {
      now: Date.parse('2026-07-01T00:00:00Z'),
      timeZone: 'Asia/Dubai',
    });
    expect(result.start).toBe(Date.parse('2026-12-16T17:00:00Z'));
    expect(result.time).toBe('21:00');
  });

  it('keeps Egyptian times unchanged for a Cairo device', () => {
    const result = lessonTiming(lesson(), { timeZone: 'Africa/Cairo' });
    expect(result.time).toBe('19:00');
    expect(result.day).toBe('2026-10-16');
  });

  it('moves the displayed day when a device time zone crosses midnight', () => {
    const result = lessonTiming(lesson({ startTime: '23:30', endTime: '00:30' }), {
      timeZone: 'Asia/Dubai',
      now: Date.parse('2026-10-16T20:30:00Z'),
    });
    expect(result.day).toBe('2026-10-17');
    expect(result.time).toBe('00:30');
    expect(result.end).toBe(Date.parse('2026-10-16T21:30:00Z'));
    expect(result.canJoin).toBe(true);
  });

  it('does not apply a redundant evening period to a 24-hour overnight end', () => {
    const value = lesson({ startTime: '23:30', endTime: '01:30', period: 'Evening' });
    const end = Date.parse('2026-10-16T22:30:00Z');
    const result = lessonTiming(value, { now: end - 1, timeZone: 'Asia/Dubai' });
    expect(result.start).toBe(Date.parse('2026-10-16T20:30:00Z'));
    expect(result.end).toBe(end);
    expect(result.canJoin).toBe(true);
    expect(lessonTiming(value, { now: end }).canJoin).toBe(false);
    expect(
      lessonTiming(lesson({ startTime: '19:00', endTime: '01:30', period: 'Evening' })).end,
    ).toBe(end);
  });

  it.each(['timeRange', 'timeSlot'] as const)(
    'preserves the 24-hour overnight end in %s with a redundant period',
    (field) => {
      const result = lessonTiming(
        lesson({ startTime: null, endTime: null, [field]: '23:30 – 01:30', period: 'مساء' }),
      );
      expect(result.start).toBe(Date.parse('2026-10-16T20:30:00Z'));
      expect(result.end).toBe(Date.parse('2026-10-16T22:30:00Z'));
    },
  );

  it('honors an explicit UTC occurrence even when the date and source clock disagree', () => {
    const result = lessonTiming(lesson({ occurrenceAt: '2026-10-16T18:00:00Z' }), {
      timeZone: 'Asia/Dubai',
    });
    expect(result.start).toBe(Date.parse('2026-10-16T18:00:00Z'));
    expect(result.time).toBe('22:00');
  });

  it('honors an explicit offset and never converts it as a naive Cairo clock', () => {
    const result = lessonTiming(lesson({ occurrenceAt: '2026-10-16T19:00:00+04:00' }), {
      timeZone: 'Africa/Cairo',
    });
    expect(result.start).toBe(Date.parse('2026-10-16T15:00:00Z'));
    expect(result.time).toBe('18:00');
  });

  it('interprets a naive occurrence as Cairo rather than the device clock', () => {
    const result = lessonTiming(lesson({ occurrenceAt: '2026-12-16T19:00:00' }), {
      timeZone: 'Asia/Dubai',
    });
    expect(result.start).toBe(Date.parse('2026-12-16T17:00:00Z'));
    expect(result.time).toBe('21:00');
  });

  it('opens at exactly ten minutes before start and closes exactly at the end', () => {
    const start = Date.parse('2026-10-16T16:00:00Z');
    const end = Date.parse('2026-10-16T17:00:00Z');
    expect(lessonTiming(lesson(), { now: start - 600_001 }).canJoin).toBe(false);
    expect(lessonTiming(lesson(), { now: start - 600_000 }).canJoin).toBe(true);
    expect(lessonTiming(lesson(), { now: start }).canJoin).toBe(true);
    expect(lessonTiming(lesson(), { now: end - 1 }).canJoin).toBe(true);
    expect(lessonTiming(lesson(), { now: end }).canJoin).toBe(false);
  });

  it.each(['Canceled', 'CancelledByTeacher', 'Completed', 'Ended', 'Postponed', 'ملغية', 'مكتملة'])(
    'does not admit a lesson with terminal status %s',
    (status) => {
      expect(
        lessonTiming(lesson({ status }), {
          now: Date.parse('2026-10-16T16:00:00Z'),
        }).canJoin,
      ).toBe(false);
    },
  );

  it('does not invent a duration when the API omitted the lesson end', () => {
    const value = lesson({ endTime: null });
    const start = Date.parse('2026-10-16T16:00:00Z');
    expect(lessonTiming(value, { now: start - 600_000 }).canJoin).toBe(true);
    expect(lessonTiming(value, { now: start }).canJoin).toBe(true);
    expect(lessonTiming(value, { now: start + 1 }).canJoin).toBe(false);
    expect(lessonTiming(value).end).toBeNull();
  });

  it('does not admit a malformed end time or an end that equals start', () => {
    const now = Date.parse('2026-10-16T15:55:00Z');
    expect(lessonTiming(lesson({ endTime: 'not a clock' }), { now }).canJoin).toBe(false);
    expect(lessonTiming(lesson({ endTime: '19:00' }), { now }).canJoin).toBe(false);
    expect(
      lessonTiming(lesson({ endTime: null, timeRange: '19:00 - invalid' }), { now }).canJoin,
    ).toBe(false);
  });

  it('resolves a weekly weekday from the returned week, including Arabic names', () => {
    const result = lessonTiming(
      lesson({
        date: null,
        dayOfWeek: null,
        day: 'السبت',
        startTime: null,
        endTime: null,
        timeSlot: '07:00-08:00',
        period: 'مساء',
        recurrenceType: 'Weekly',
      }),
      { weekStart: '2026-10-11', weekEnd: '2026-10-17', timeZone: 'Asia/Dubai' },
    );
    expect(result.start).toBe(Date.parse('2026-10-17T16:00:00Z'));
    expect(result.end).toBe(Date.parse('2026-10-17T17:00:00Z'));
    expect(result.day).toBe('2026-10-17');
    expect(result.time).toBe('20:00');
  });

  it('accepts explicit AM/PM ranges and source 24-hour clocks with a redundant period', () => {
    const ranged = lessonTiming(
      lesson({
        startTime: null,
        endTime: null,
        timeRange: '07:00 PM – 08:00 PM',
        period: 'Morning',
      }),
    );
    const redundant = lessonTiming(lesson({ period: 'Evening' }));
    expect(ranged.start).toBe(Date.parse('2026-10-16T16:00:00Z'));
    expect(ranged.end).toBe(Date.parse('2026-10-16T17:00:00Z'));
    expect(redundant.start).toBe(ranged.start);
    expect(
      lessonTiming(lesson({ startTime: '00:30', endTime: '01:30', period: 'Morning' })).start,
    ).toBe(Date.parse('2026-10-15T21:30:00Z'));
  });

  it('uses the selected source date for undated daily rows without inventing another weekday', () => {
    const value = lesson({ date: null, dayOfWeek: 'Friday' });
    expect(lessonTiming(value, { selectedDate: '2026-10-16' }).start).toBe(
      Date.parse('2026-10-16T16:00:00Z'),
    );
    expect(lessonTiming(value, { selectedDate: '2026-10-17' }).start).toBeNull();
  });

  it('never gives undated weekly rows an invented current date or a two-week ambiguity', () => {
    const value = lesson({ date: null, dayOfWeek: 'Friday', recurrenceType: 'Weekly' });
    expect(lessonTiming(value).start).toBeNull();
    expect(
      lessonTiming(value, { weekStart: '2026-10-11', weekEnd: '2026-10-24' }).start,
    ).toBeNull();
    expect(
      lessonTiming(value, { weekStart: '2026-10-11', weekEnd: '2026-10-15' }).start,
    ).toBeNull();
  });

  it('does not admit a recurring row after its final recurrence date', () => {
    expect(
      lessonTiming(lesson({ recurrenceType: 'Weekly', recurrenceEndDate: '2026-10-15' }), {
        now: Date.parse('2026-10-16T15:55:00Z'),
      }).canJoin,
    ).toBe(false);
    expect(
      lessonTiming(lesson({ recurrenceEndDate: '2026-10-16T15:00:00Z' }), {
        now: Date.parse('2026-10-16T15:55:00Z'),
      }).canJoin,
    ).toBe(false);
  });

  it.each(['2026-02-30', '2026-13-16', 'not a date'])(
    'rejects invalid calendar date %s without browser normalization',
    (date) => {
      const result = lessonTiming(lesson({ date }), { now: Date.parse('2026-10-16T16:00:00Z') });
      expect(result.start).toBeNull();
      expect(result.canJoin).toBe(false);
      expect(lessonTiming(lesson({ date }), { selectedDate: '2026-10-16' }).start).toBeNull();
    },
  );

  it.each([
    '2026-02-30T19:00:00Z',
    '2026-10-16T25:00:00Z',
    '2026-10-16T19:00:00+15:00',
    'invalid occurrence',
  ])(
    'does not hide a malformed authoritative occurrence with a clock alias: %s',
    (occurrenceAt) => {
      const result = lessonTiming(lesson({ occurrenceAt }), {
        now: Date.parse('2026-10-16T16:00:00Z'),
      });
      expect(result.start).toBeNull();
      expect(result.canJoin).toBe(false);
    },
  );

  it('rejects skipped and repeated Cairo clocks at daylight saving transitions', () => {
    expect(
      lessonTiming(lesson({ date: '2026-04-24', startTime: '00:30', endTime: null })).start,
    ).toBeNull();
    expect(
      lessonTiming(lesson({ date: '2026-10-29', startTime: '23:30', endTime: null })).start,
    ).toBeNull();
  });
});
