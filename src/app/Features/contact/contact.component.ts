import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contact',
  imports: [CommonModule, FormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css',
})
export class ContactComponent {
  formData = {
    name: '',
    phone: '',
    email: '',
    subject: 'general',
    message: ''
  };

  isSubmitting = false;

  onSubmit() {
    this.isSubmitting = true;

    // محاكاة إرسال البيانات لسيرفر
    setTimeout(() => {
      console.log('Form Submitted:', this.formData);
      alert('تم إرسال رسالتك بنجاح! سنقوم بالتواصل معك قريباً.');

      // إعادة تعيين النموذج
      this.formData = {
        name: '',
        phone: '',
        email: '',
        subject: 'general',
        message: ''
      };
      this.isSubmitting = false;
    }, 1200);
  }
}
