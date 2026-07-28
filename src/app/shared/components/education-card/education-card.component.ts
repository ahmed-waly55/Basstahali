import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-education-card',
  imports: [],
  templateUrl: './education-card.component.html',
  styleUrl: './education-card.component.css',
})
export class EducationCardComponent {
  title = input.required<string>();
  subtitle = input.required<string>();
  imageSrc = input.required<string>();
  imageAlt = input<string>('stage icon');
  buttonText = input<string>('استكشف');
  bgColor = input<string>('bg-[#f3f0ff]');

  explore = output<void>();

  onExploreClick(): void {
    this.explore.emit();
  }
}
