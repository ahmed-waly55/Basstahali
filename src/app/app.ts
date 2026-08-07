import { Component, signal, ChangeDetectionStrategy, inject, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './core/components/toast/toast.component';
import { ToastService } from './core/services/toast.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('منصة بسطهالي');
  private toastService = inject(ToastService);

  // دالة للتحقق مما إذا كان مسموحاً بفتح أدوات المطورين من الـ localStorage
  private isDevToolsAllowed(): boolean {
    // التأكد من أن الكود يعمل في المتصفح وليس على السيرفر (SSR)
    if (typeof window === 'undefined') return false;

    // يمكنك تعديل المفتاح حسب ما تخزنه في الـ localStorage (مثلاً 'devtools' أو 'allowDev')
    return localStorage.getItem('devtools') === 'true';
  }

  // 1. إلغاء النقر بالزر الأيمن (إلا لو مسموح به)
  @HostListener('contextmenu', ['$event'])
  onRightClick(event: MouseEvent) {
    if (this.isDevToolsAllowed()) {
      return; // السماح بالكليك يمين إذا كانت القيمة true
    }

    event.preventDefault();
    this.toastService.show('عذراً، النقر بالزر الأيمن غير مسموح به.', 'warning', 'تنبيه أمني');
  }

  // 2. منع اختصارات لوحة المفاتيح الخاصة بأدوات المطورين (إلا لو مسموح به)
  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (this.isDevToolsAllowed()) {
      return; // السماح بالاختصارات إذا كانت القيمة true
    }

    // منع زر F12
    if (event.key === 'F12') {
      event.preventDefault();
      this.toastService.show('أدوات المطورين محظورة في هذا الموقع!', 'error', 'تنبيه أمني');
    }

    // منع اختصارات Ctrl + Shift + (I, J, C) أو Ctrl + U
    if (
      (event.ctrlKey && event.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(event.key)) ||
      (event.ctrlKey && ['U', 'u'].includes(event.key))
    ) {
      event.preventDefault();
      this.toastService.show('هذا الإجراء غير مسموح به!', 'error', 'تنبيه أمني');
    }
  }
}
