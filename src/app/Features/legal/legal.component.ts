import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  inject,
  LOCALE_ID,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PRIVACY_DOCUMENT } from './privacy.content';
import { TERMS_DOCUMENT } from './terms.content';

@Component({
  selector: 'app-legal',
  imports: [RouterLink],
  templateUrl: './legal.component.html',
  styleUrl: './legal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegalComponent {
  private browserDocument = inject(DOCUMENT);
  private readonly locale = inject(LOCALE_ID);
  readonly kind =
    inject(ActivatedRoute).snapshot.data['document'] === 'terms' ? 'terms' : 'privacy';
  readonly document = this.kind === 'terms' ? TERMS_DOCUMENT : PRIVACY_DOCUMENT;
  readonly updated = new Intl.DateTimeFormat(this.locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(2026, 9, 14)));
  readonly i18n = {
    m_b598140d68a4: $localize`:@@m_b598140d68a4:مسار الصفحة`,
    m_b986d8fb163c: $localize`:@@m_b986d8fb163c:الرئيسية`,
    m_d398f5116515: $localize`:@@m_d398f5116515:معلومات وسياسات بسطهالي`,
    m_2723fb0ddcdf: $localize`:@@m_2723fb0ddcdf:آخر تحديث`,
    m_f7687b7e329b: $localize`:@@m_f7687b7e329b:صفحات السياسات`,
    m_8b7b36b70cdd: $localize`:@@m_8b7b36b70cdd:سياسة الخصوصية`,
    m_bec6c46de276: $localize`:@@m_bec6c46de276:الشروط والأحكام`,
    m_80b8f8c418da: $localize`:@@m_80b8f8c418da:في هذه الصفحة`,
    m_af97bb006377: $localize`:@@m_af97bb006377:لديك سؤال؟`,
    m_208c0dc965eb: $localize`:@@m_208c0dc965eb:تواصل مع فريق بسطهالي للاستفسار عن السياسات أو تفاصيل الاشتراك.`,
    m_a01613b4c618: $localize`:@@m_a01613b4c618:تواصل معنا عبر واتساب`,
    m_c4bfa628d3e0: $localize`:@@m_c4bfa628d3e0:عرض الباقات والأسعار`,
  };

  constructor() {
    afterNextRender(() => {
      const fragment = this.browserDocument.defaultView?.location.hash.slice(1);
      if (fragment) this.browserDocument.getElementById(fragment)?.scrollIntoView();
    });
  }

  sectionLink(id: string): string {
    const basePath = this.browserDocument.querySelector('base')?.getAttribute('href') ?? '/';
    return `${basePath}${this.kind}#${id}`;
  }

  scrollToSection(event: MouseEvent, id: string): void {
    event.preventDefault();
    const section = this.browserDocument.getElementById(id);
    const reduceMotion = this.browserDocument.defaultView?.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    section?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    section?.focus({ preventScroll: true });
  }
}
