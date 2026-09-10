import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-education-card',
  standalone: true,
  imports: [NgClass],
  templateUrl: './education-card.component.html',
  styleUrl: './education-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EducationCardComponent {
  // البيانات الأساسية
  title = input.required<string>();
  subtitle = input<string>('');
  buttonText = input<string>('عرض التفاصيل');
  badge = input<string | null>(null);

  // درجات البنفسجي الهادئة والراقية
  iconBg = input<string>('bg-[#f4f0fa] group-hover:bg-[#3b236d]');
  iconColor = input<string>('text-[#3b236d] group-hover:text-white');
  borderColor = input<string>('hover:border-[#3b236d]/30');
  buttonBg = input<string>('bg-[#3b236d]');       // تم تغيير خلفية الزرار للبنفسجي
  buttonTextColor = input<string>('text-white');  // نص الزرار أبيض واضح

  // خط سفلي ديكوري اختياري
  showBottomLine = input<boolean>(false);
  lineColor = input<string>('bg-[#3b236d]');

  explore = output<void>();

  onExploreClick(): void {
    this.explore.emit();
  }
}
