export interface SubjectBookingContext {
  gradeName?: string;
  curriculumName?: string;
}

export function subjectBookingLink(
  subjectName: string,
  context: SubjectBookingContext = {},
): string {
  const lines = [
    $localize`:@@subjectBookingMessage:السلام عليكم، أرغب في حجز مادة ${subjectName}:SUBJECT: على منصة بسطهالي.`,
  ];
  if (context.gradeName) {
    lines.push($localize`:@@subjectBookingGrade:المرحلة: ${context.gradeName}:GRADE:`);
  }
  if (context.curriculumName) {
    lines.push(
      $localize`:@@subjectBookingCurriculum:المنهج: ${context.curriculumName}:CURRICULUM:`,
    );
  }
  return 'https://wa.me/971563306087?text=' + encodeURIComponent(lines.join('\n'));
}

export function subjectBookingAriaLabel(subjectName: string): string {
  return $localize`:@@subjectBookingAria:احجز مادة ${subjectName}:SUBJECT: عبر واتساب`;
}
