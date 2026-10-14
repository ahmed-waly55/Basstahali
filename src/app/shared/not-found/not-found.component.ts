import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  templateUrl: './not-found.component.html',
  changeDetection: ChangeDetectionStrategy.Default,
  styleUrl: './not-found.component.css',
})
export class NotFoundComponent {
  readonly messages = {
    m_7299fd5cbe92: $localize`:@@m_7299fd5cbe92:الصفحة غير موجودة`,
    m_973513694f91: $localize`:@@m_973513694f91:يبدو أن الصفحة التي تبحث عنها غير موجودة أو تم نقلها.`,
    m_3fb5312625d8: $localize`:@@m_3fb5312625d8:العودة للرئيسية`,
    m_988638232136: $localize`:@@m_988638232136:تواصل معنا`,
  };
}
