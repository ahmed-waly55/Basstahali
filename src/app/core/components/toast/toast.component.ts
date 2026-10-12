import { TranslatePipe } from '../../services/translate.pipe';
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';
import { PreferencesService } from '../../services/preferences.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [TranslatePipe, CommonModule],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.css', // ربط ملف الـ CSS الخارجي المستقل
})
export class ToastComponent {
  toastService = inject(ToastService);
  preferences = inject(PreferencesService);
}
