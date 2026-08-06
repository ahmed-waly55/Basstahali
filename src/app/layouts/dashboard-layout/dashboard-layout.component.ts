import { Component, ElementRef, HostListener, inject, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [NgClass, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './dashboard-layout.component.html'
})
export class DashboardLayoutComponent implements OnInit {
  private elementRef = inject(ElementRef);

  userRole: 'teacher' | 'student' = 'teacher';

  currentDate: string = '';
  userAvatar: string = 'assets/avatar.jpg';
  defaultAvatar: string = 'https://ui-avatars.com/api/?name=محمد&background=3b2d82&color=fff';

  isSidebarOpen: boolean = false;
  isCollapsed: boolean = false;
  isNotificationsOpen: boolean = false;
  isMessagesOpen: boolean = false;

  teacherNavItems: NavItem[] = [
    { label: 'الرئيسية', route: '/dashboard', icon: 'home' },
    { label: 'طلابي', route: '/dashboard/students', icon: 'users' },
    { label: 'جدول الحصص', route: '/dashboard/schedule', icon: 'calendar' },
    { label: 'الواجبات', route: '/dashboard/homework', icon: 'clipboard' },
    { label: 'المواد التعليمية', route: '/dashboard/courses', icon: 'folder' },
    { label: 'الاختبارات', route: '/dashboard/exams', icon: 'quiz' },
    { label: 'التقارير', route: '/dashboard/reports', icon: 'chart' },
    { label: 'الحسابات', route: '/dashboard/finance', icon: 'wallet' },
    { label: 'الإشعارات', route: '/dashboard/notifications', icon: 'bell' },
    { label: 'الإعدادات', route: '/dashboard/settings', icon: 'settings' }
  ];

  studentNavItems: NavItem[] = [
    { label: 'الرئيسية', route: '/dashboard/home', icon: 'home' },
    { label: 'حصصي', route: '/dashboard/my-classes', icon: 'calendar' },
    { label: 'المواد التعليمية', route: '/dashboard/courses', icon: 'book' },
    { label: 'الواجبات', route: '/dashboard/homework', icon: 'clipboard' },
    { label: 'الاختبارات', route: '/dashboard/exams', icon: 'quiz' },
    { label: 'الملفات', route: '/dashboard/files', icon: 'folder' },
    { label: 'الرصيد والفواتير', route: '/dashboard/billing', icon: 'wallet' },
    { label: 'تقارير الأداء', route: '/dashboard/performance', icon: 'chart' },
    { label: 'الإشعارات', route: '/dashboard/notifications', icon: 'bell' },
    { label: 'الملف الشخصي', route: '/dashboard/profile', icon: 'user' }
  ];

  get currentNavItems(): NavItem[] {
    return this.userRole === 'teacher' ? this.teacherNavItems : this.studentNavItems;
  }

  ngOnInit(): void {
    this.setAutomaticDate();
  }

  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
  }

  setAutomaticDate(): void {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    };
    this.currentDate = today.toLocaleDateString('ar-EG', options);
  }

  onImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = this.defaultAvatar;
  }

  toggleNotifications(event: MouseEvent): void {
    event.stopPropagation();
    this.isNotificationsOpen = !this.isNotificationsOpen;
    if (this.isNotificationsOpen) this.isMessagesOpen = false;
  }

  toggleMessages(event: MouseEvent): void {
    event.stopPropagation();
    this.isMessagesOpen = !this.isMessagesOpen;
    if (this.isMessagesOpen) this.isNotificationsOpen = false;
  }

  logout(): void {
    console.log('تسجيل الخروج');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!this.elementRef.nativeElement.contains(target)) {
      this.isNotificationsOpen = false;
      this.isMessagesOpen = false;
    }
  }
}
