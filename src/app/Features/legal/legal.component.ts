import { DOCUMENT } from '@angular/common';
import { afterNextRender, ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PreferencesService } from '../../core/services/preferences.service';
import { TranslatePipe } from '../../core/services/translate.pipe';
import type { LegalText } from './legal-document';
import { PRIVACY_DOCUMENT } from './privacy.content';
import { TERMS_DOCUMENT } from './terms.content';

@Component({
  selector: 'app-legal',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './legal.component.html',
  styleUrl: './legal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegalComponent {
  private browserDocument = inject(DOCUMENT);
  private preferences = inject(PreferencesService);
  readonly kind =
    inject(ActivatedRoute).snapshot.data['document'] === 'terms' ? 'terms' : 'privacy';
  readonly document = this.kind === 'terms' ? TERMS_DOCUMENT : PRIVACY_DOCUMENT;
  readonly updated = { ar: '12 أكتوبر 2026', en: '12 October 2026' };

  constructor() {
    afterNextRender(() => {
      const fragment = this.browserDocument.defaultView?.location.hash.slice(1);
      if (fragment) this.browserDocument.getElementById(fragment)?.scrollIntoView();
    });
  }

  text(value: LegalText): string {
    return value[this.preferences.language()];
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
