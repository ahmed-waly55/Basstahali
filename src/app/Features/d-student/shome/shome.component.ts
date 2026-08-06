import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';

interface Session {
  id: number;
  subject: string;
  teacher: string;
  icon: string;
  bgColor: string;
  startTime: Date;
  endTime: Date;
  countdownText?: string;
  canJoin?: boolean;
  meetingUrl?: string;
  dayLabel?: string;
}

interface StudentAssignment {
  title: string;
  subject: string;
  deadline: string;
  statusText: string;
  fileType: string;
}


@Component({
  selector: 'app-shome',
  imports: [CommonModule],
  templateUrl: './shome.component.html',
  styleUrl: './shome.component.css',
})
export class ShomeComponent implements OnInit, OnDestroy {
   isBrowser: boolean = false;

  // إحصائيات الطالب العلوية
  totalAttendedSessions = 24;
  completedAssignmentsCount = 10;
  pendingExamsCount = 2;
  studentAverageGrade = '95%';

  // قائمة الحصص القادمة
  upcomingSessions: Session[] = [];

  // الواجبات المطلوبة من الطالب
  pendingAssignments: StudentAssignment[] = [
    { title: 'واجب المعادلات التفاضلية', subject: 'الرياضيات المتقدمة', deadline: 'متبقي يومين', statusText: 'قيد الحل', fileType: 'PDF' },
    { title: 'بحث قواعد اللغة الإنكليزية', subject: 'اللغة الإنجليزية', deadline: 'متبقي 4 أيام', statusText: 'قيد الحل', fileType: 'DOCX' }
  ];

  private timerInterval: any;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      const currentTime = Date.now();

      this.upcomingSessions = [
        {
          id: 1,
          subject: 'الرياضيات المتقدمة',
          teacher: 'أ. أحمد خالد',
          icon: 'fa-calculator',
          bgColor: 'bg-indigo-50 text-indigo-600',
          startTime: new Date(currentTime + 8 * 60 * 1000),
          endTime: new Date(currentTime + 68 * 60 * 1000),
          meetingUrl: 'https://zoom.us/j/example1',
          countdownText: 'جاري التحميل...',
          canJoin: false,
          dayLabel: 'اليوم'
        },
        {
          id: 2,
          subject: 'اللغة الإنجليزية',
          teacher: 'أ. سارة محمود',
          icon: 'fa-font',
          bgColor: 'bg-teal-50 text-teal-600',
          startTime: new Date(currentTime + 25 * 60 * 60 * 1000),
          endTime: new Date(currentTime + 28 * 60 * 60 * 1000),
          meetingUrl: 'https://zoom.us/j/example2',
          countdownText: 'جاري التحميل...',
          canJoin: false,
          dayLabel: 'بكره'
        },
        {
          id: 3,
          subject: 'الفيزياء الحديثة',
          teacher: 'أ. محمد إبراهيم',
          icon: 'fa-atom',
          bgColor: 'bg-rose-50 text-rose-600',
          startTime: new Date(currentTime + 75 * 60 * 60 * 1000),
          endTime: new Date(currentTime + 80 * 60 * 60 * 1000),
          meetingUrl: 'https://zoom.us/j/example3',
          countdownText: 'جاري التحميل...',
          canJoin: false,
          dayLabel: 'قريباً'
        }
      ];

      this.updateCountdowns();
      this.timerInterval = setInterval(() => {
        this.updateCountdowns();
      }, 1000);
    }
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  getDayLabel(date: Date): string {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'اليوم';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'بكره';
    } else {
      return `${date.getDate()}/${date.getMonth() + 1}`;
    }
  }

  updateCountdowns(): void {
    const now = new Date().getTime();

    this.upcomingSessions.forEach(session => {
      session.dayLabel = this.getDayLabel(session.startTime);
      const start = session.startTime.getTime();
      const end = session.endTime.getTime();
      const diffMs = start - now;

      if (diffMs <= 10 * 60 * 1000 && now <= end) {
        session.canJoin = true;
        session.countdownText = now >= start ? 'الحصة جارية الآن' : 'متاحة للدخول الآن';
      } else if (diffMs > 0) {
        session.canJoin = false;

        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

        if (hours > 0) {
          session.countdownText = `يبدأ خلال ${hours} س و ${minutes} د`;
        } else {
          const pad = (n: number) => n < 10 ? '0' + n : n;
          session.countdownText = `يبدأ خلال ${pad(minutes)}:${pad(seconds)}`;
        }
      } else {
        session.canJoin = false;
        session.countdownText = 'انتهت الحصة';
      }
    });
  }

  joinSession(url?: string): void {
    if (url && this.isBrowser) {
      window.open(url, '_blank');
    }
  }
}
