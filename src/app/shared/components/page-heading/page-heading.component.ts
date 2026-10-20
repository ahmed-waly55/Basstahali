import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-page-heading',
  imports: [RouterLink],
  template: `
    <div class="page-heading">
      <div class="page-container">
        <nav aria-label="Breadcrumb" class="mb-7 flex items-center gap-3 text-sm text-slate-500">
          <a routerLink="/" class="hover:text-purple-700">{{ messages.m_b986d8fb163c }}</a
          ><span aria-hidden="true">/</span><span aria-current="page">{{ title() }}</span>
        </nav>
        <p class="eyebrow">
          {{ messages.m_70b341c96b9c }} <span aria-hidden="true">/</span>
          {{ messages.m_68bec9ba1925 }}
        </p>
        <h1>{{ title() }}</h1>
        <p class="page-intro">{{ description() }}</p>
      </div>
    </div>
  `,
})
export class PageHeadingComponent {
  readonly messages = {
    m_b986d8fb163c: $localize`:@@m_b986d8fb163c:الرئيسية`,
    m_70b341c96b9c: $localize`:@@m_70b341c96b9c:بسطهالي`,
    m_68bec9ba1925: $localize`:@@m_68bec9ba1925:حصص خصوصية مباشرة أونلاين`,
  };

  title = input.required<string>();
  description = input('');
}
