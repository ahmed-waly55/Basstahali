import { TranslatePipe } from '../../../core/services/translate.pipe';
import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-section-header',
  imports: [TranslatePipe],
  templateUrl: './section-header.component.html',
  changeDetection: ChangeDetectionStrategy.Default,
  styleUrl: './section-header.component.css',
})
export class SectionHeaderComponent {
  title = input.required<string>();
}
