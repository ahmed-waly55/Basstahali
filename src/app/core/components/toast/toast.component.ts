import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';
import { PreferencesService } from '../../services/preferences.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.css', // ربط ملف الـ CSS الخارجي المستقل
})
export class ToastComponent {
  readonly messages = {
    m_a7193d7d019c: $localize`:@@m_a7193d7d019c:إغلاق التنبيه`,
  };

  toastService = inject(ToastService);
  preferences = inject(PreferencesService);
}
