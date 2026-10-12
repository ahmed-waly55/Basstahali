import { TranslatePipe } from '../../core/services/translate.pipe';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  imports: [TranslatePipe, RouterLink, FormsModule],
  templateUrl: './footer.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './footer.component.css',
})
export class FooterComponent {
  email: string = '';
  currentYear: number = new Date().getFullYear();

  subscribeNewsletter() {
    if (this.email) {
      console.log('Subscribed with email:', this.email);
      this.email = '';
    }
  }
}
