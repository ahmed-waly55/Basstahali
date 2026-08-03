import { Component, input, output } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-education-card',
  standalone: true,
  imports: [NgClass],
  templateUrl: './education-card.component.html',
  styleUrl: './education-card.component.css',
})
export class EducationCardComponent {

  title = input.required<string>();
  subtitle = input.required<string>();

  buttonText = input('استكشف المنهج');

  iconBg = input('bg-indigo-100');

  iconColor = input('text-indigo-600');

  glowColor = input('bg-indigo-300');

  borderColor = input('hover:border-indigo-300');

  lineColor = input('bg-indigo-500');

  buttonColor = input(
    'border-indigo-500 text-indigo-600 hover:bg-indigo-600 hover:text-white'
  );

  explore = output<void>();

  onExploreClick() {
    this.explore.emit();
  }

}
