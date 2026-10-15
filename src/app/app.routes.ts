import { Routes } from '@angular/router';
import { studentGuard } from './core/auth/auth.guard';

export function createRoutes(): Routes {
  return [
    {
      path: 'student',
      canActivate: [studentGuard],
      canActivateChild: [studentGuard],
      loadComponent: () =>
        import('./Features/student-dashboard/student-shell.component').then(
          (m) => m.StudentShellComponent,
        ),
      title: $localize`:@@studentDashboardSeoTitle:لوحة الطالب | بسطهالي`,
      children: [
        {
          path: '',
          pathMatch: 'full',
          loadComponent: () =>
            import('./Features/student-dashboard/student-overview.component').then(
              (m) => m.StudentOverviewComponent,
            ),
        },
        {
          path: 'schedule',
          loadComponent: () =>
            import('./Features/student-dashboard/student-schedule.component').then(
              (m) => m.StudentScheduleComponent,
            ),
        },
        {
          path: 'courses',
          loadComponent: () =>
            import('./Features/student-dashboard/student-courses.component').then(
              (m) => m.StudentCoursesComponent,
            ),
        },
        {
          path: 'profile',
          loadComponent: () =>
            import('./Features/student-dashboard/student-profile.component').then(
              (m) => m.StudentProfileComponent,
            ),
        },
        ...(['messages', 'exams', 'assignments'] as const).map((section) => ({
          path: section,
          data: { section },
          loadComponent: () =>
            import('./Features/student-activity/student-activity.component').then(
              (m) => m.StudentActivityComponent,
            ),
        })),
        { path: '**', redirectTo: '' },
      ],
    },
    // Landing Layout
    {
      path: '',
      loadComponent: () =>
        import('./layouts/landing-layout/landing-layout.component').then(
          (m) => m.LandingLayoutComponent,
        ),
      title: $localize`:@@m_7753e57af83a:بسطهالي | منصة تعليمية ذكية لشرح المناهج الدراسية`,
      children: [
        {
          path: 'login',
          loadComponent: () =>
            import('./Features/login/login.component').then((m) => m.LoginComponent),
          title: $localize`:@@authLoginSeoTitle:تسجيل الدخول | بسطهالي`,
        },
        {
          path: '',
          loadComponent: () =>
            import('./Features/landing/landing.component').then((m) => m.LandingComponent),
        },
        {
          path: 'about',
          loadComponent: () =>
            import('./Features/about/about.component').then((m) => m.AboutComponent),
        },
        {
          path: 'courses',
          loadComponent: () =>
            import('./Features/courses/courses.component').then((m) => m.CoursesComponent),
          title: $localize`:@@m_069ebefa6d9b:بسطهالي | الدورات التعليمية`,
        },
        {
          path: 'teachers',
          loadComponent: () =>
            import('./Features/teachers/teachers.component').then((m) => m.TeachersComponent),
          title: $localize`:@@m_b35fc6460fd6:بسطهالي | المدرسين`,
        },
        {
          path: 'contact',
          loadComponent: () =>
            import('./Features/contact/contact.component').then((m) => m.ContactComponent),
          title: $localize`:@@m_e6f562d1a4fb:بسطهالي | تواصل معنا`,
        },
        {
          path: 'pricing',
          loadComponent: () =>
            import('./Features/pricing/pricing.component').then((m) => m.PricingComponent),
          title: $localize`:@@m_daf607e9a7e6:بسطهالي | خطط الاشتراك`,
        },
        {
          path: 'privacy',
          loadComponent: () =>
            import('./Features/legal/legal.component').then((m) => m.LegalComponent),
          data: { document: 'privacy' },
          title: $localize`:@@m_55ac61564737:سياسة الخصوصية | بسطهالي`,
        },
        {
          path: 'terms',
          loadComponent: () =>
            import('./Features/legal/legal.component').then((m) => m.LegalComponent),
          data: { document: 'terms' },
          title: $localize`:@@m_dd16c0c56bb1:الشروط والأحكام | بسطهالي`,
        },
        {
          path: 'curriculum',
          loadComponent: () =>
            import('./Features/curriculum/curriculum.component').then((m) => m.CurriculumComponent),
          title: $localize`:@@m_7918eec1b680:بسطهالي | المناهج الدراسية`,
        },
        {
          path: 'curriculum/:id',
          loadComponent: () =>
            import('./Features/curriculum-details/curriculum-details.component').then(
              (m) => m.CurriculumDetailsComponent,
            ),
          title: $localize`:@@m_40ee6fa3c738:بسطهالي | تفاصيل المنهج`,
        },
        {
          path: 'features',
          loadComponent: () =>
            import('./Features/features/features.component').then((m) => m.FeaturesComponent),
          title: $localize`:@@m_5b50ccab86d7:بسطهالي | مميزات المنصة`,
        },
        {
          path: 'teacher-form',
          loadComponent: () =>
            import('./Features/teacher-form/teacher-form.component').then(
              (m) => m.TeacherFormComponent,
            ),
          title: $localize`:@@m_9feeb9e44e0e:بسطهالي | المنهاج الدراسية `,
        },
        {
          path: 'subjects/:subjectId',
          loadComponent: () =>
            import('./Features/subjects/subjects.component').then((m) => m.SubjectsComponent),
          title: $localize`:@@m_f086ce8440c2:بسطهالي | المواد الدراسية`,
        },
      ],
    },

    // Not Found
    {
      path: '**',
      loadComponent: () =>
        import('./shared/not-found/not-found.component').then((m) => m.NotFoundComponent),
    },
  ];
}
