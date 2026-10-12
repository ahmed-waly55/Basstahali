import { inject } from '@angular/core';
import { PreferencesService } from '../../core/services/preferences.service';
import { TranslatePipe } from '../../core/services/translate.pipe';
import { NgClass } from '@angular/common';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [TranslatePipe, RouterLinkActive, RouterLink],
  templateUrl: './header.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  preferences = inject(PreferencesService);
  isMenuOpen = false;

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
  }
}
