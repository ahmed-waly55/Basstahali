import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'login', renderMode: RenderMode.Client },
  { path: 'student', renderMode: RenderMode.Client },
  { path: 'student/**', renderMode: RenderMode.Client },
  { path: 'curriculum', renderMode: RenderMode.Server },
  { path: 'teacher-form', renderMode: RenderMode.Server },
  {
    path: 'curriculum/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'subjects/:subjectId',
    renderMode: RenderMode.Server,
  },

  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
