import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../core/services/translate.pipe';

@Component({
  selector: 'app-page-heading',
  imports: [RouterLink, TranslatePipe],
  template: `
    <div class="page-heading">
      <div class="page-container">
        <nav aria-label="Breadcrumb" class="mb-7 flex items-center gap-3 text-sm text-slate-500">
          <a routerLink="/" class="hover:text-purple-700">{{ 'الرئيسية' | translate }}</a
          ><span aria-hidden="true">/</span
          ><span aria-current="page">{{ title() | translate }}</span>
        </nav>
        <p class="eyebrow">
          {{ 'بسطهالي' | translate }} <span aria-hidden="true">/</span>
          {{ 'حصص خصوصية مباشرة أونلاين' | translate }}
        </p>
        <h1>{{ title() | translate }}</h1>
        <p class="page-intro">{{ description() | translate }}</p>
      </div>
    </div>
  `,
})
export class PageHeadingComponent {
  title = input.required<string>();
  description = input('');
}
