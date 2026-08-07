import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
  title?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  // مصفوفة لتخزين جميع التنبيهات النشطة
  toasts = signal<ToastMessage[]>([]);
  private counter = 0;

  show(message: string, type: ToastType = 'info', title?: string) {
    const id = ++this.counter;
    const newToast: ToastMessage = { id, message, type, title };

    // إضافة التنبيه الجديد للمصفوفة
    this.toasts.update(current => [...current, newToast]);

    // إخفاء التنبيه تلقائياً بعد 4 ثوانٍ
    setTimeout(() => {
      this.remove(id);
    }, 4000);
  }

  remove(id: number) {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }
}
