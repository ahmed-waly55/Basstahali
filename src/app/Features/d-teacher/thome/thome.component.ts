import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';



interface Session {
  id: number;
  subject: string;
  grade: string;
  studentsCount: number;
  time: string;
  status: 'completed' | 'now' | 'upcoming';
  statusText: string;
  icon: string;
  bgColor: string;
}

interface Assignment {
  title: string;
  grade: string;
  progressText: string;
  daysLeft: string;
  fileType: string;
}

interface Student {
  name: string;
  grade: string;
  status: 'active' | 'absent';
  statusLabel: string;
}

interface UploadedFile {
  title: string;
  grade: string;
  date: string;
  fileType: string;
}

@Component({
  selector: 'app-thome',
  imports: [],
  templateUrl: './thome.component.html',
  styleUrl: './thome.component.css',
})
export class ThomeComponent implements OnInit, OnDestroy{
   isBrowser: boolean = false;

  // إحصائيات المعلم العليا (بدون أرباح)
  totalStudents = 58;
  weeklySessions = '18 / 24';
  uploadedAssignments = 12;
  averageRating = '4.6 / 5';

  // جداول الحصص اليومية
  todaySessions: Session[] = [
    {
      id: 1,
      subject: 'الرياضيات - الجبر',
      grade: 'الصف الثالث الإعدادي',
      studentsCount: 12,
      time: '04:00 م - 05:00 م',
      status: 'completed',
      statusText: 'مكتملة',
      icon: 'fa-square-root-variable',
      bgColor: 'bg-indigo-50 text-indigo-600'
    },
    {
      id: 2,
      subject: 'الرياضيات - الهندسة',
      grade: 'الصف الثاني الإعدادي',
      studentsCount: 15,
      time: '05:30 م - 06:30 م',
      status: 'now',
      statusText: 'الآن',
      icon: 'fa-shapes',
      bgColor: 'bg-amber-50 text-amber-600'
    },
    {
      id: 3,
      subject: 'مراجعة عامة',
      grade: 'الصف الثالث الإعدادي',
      studentsCount: 18,
      time: '07:00 م - 08:00 م',
      status: 'upcoming',
      statusText: 'قادم',
      icon: 'fa-clipboard-list',
      bgColor: 'bg-blue-50 text-blue-600'
    },
    {
      id: 4,
      subject: 'حل مسائل تفاضل',
      grade: 'الصف الأول الثانوي',
      studentsCount: 13,
      time: '08:30 م - 09:30 م',
      status: 'upcoming',
      statusText: 'قادم',
      icon: 'fa-function',
      bgColor: 'bg-purple-50 text-purple-600'
    }
  ];

  // آخر الواجبات
  latestAssignments: Assignment[] = [
    { title: 'واجب الجبر - المعادلات', grade: 'الصف الثالث الإعدادي', progressText: 'تم التسليم: 28 / 30', daysLeft: 'يومين متبقي', fileType: 'PDF' },
    { title: 'واجب الهندسة - الدوائر', grade: 'الصف الثاني الإعدادي', progressText: 'تم التسليم: 15 / 15', daysLeft: '4 أيام متبقي', fileType: 'DOCX' },
    { title: 'مراجعة شاملة على الفصل 3', grade: 'الصف الأول الثانوي', progressText: 'تم التسليم: 13 / 13', daysLeft: '5 أيام متبقي', fileType: 'PDF' }
  ];

  // أحدث الطلاب
  latestStudents: Student[] = [
    { name: 'أحمد محمود', grade: 'الصف الثالث الإعدادي', status: 'active', statusLabel: 'نشط' },
    { name: 'ساره محمد', grade: 'الصف الثاني الإعدادي', status: 'active', statusLabel: 'نشط' },
    { name: 'عبدالله علي', grade: 'الصف الثالث الإعدادي', status: 'absent', statusLabel: 'غياب' }
  ];

  // أحدث الملفات المرفوعة
  latestFiles: UploadedFile[] = [
    { title: 'ملخص الجبر - الفصل الثالث', grade: 'الصف الثالث الإعدادي', date: '02 مايو 2025', fileType: 'PDF' },
    { title: 'تدريبات الهندسة - الدوائر', grade: 'الصف الثاني الإعدادي', date: '01 مايو 2025', fileType: 'DOCX' },
    { title: 'مراجعة شاملة على الفصل 2', grade: 'الصف الأول الثانوي', date: '30 أبريل 2025', fileType: 'PDF' }
  ];

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {}
}
