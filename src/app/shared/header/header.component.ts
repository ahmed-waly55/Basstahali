import { ElementRef, HostListener, inject } from '@angular/core';
import { PreferencesService } from '../../core/services/preferences.service';
import { TranslatePipe } from '../../core/services/translate.pipe';
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
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly desktopBreakpoint = 1120;
  preferences = inject(PreferencesService);
  isMenuOpen = false;

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

  @HostListener('document:keydown.escape')
  closeMenuOnEscape(): void {
    if (!this.isMenuOpen) return;
    this.closeMenu();
    this.element.nativeElement.querySelector<HTMLButtonElement>('.menu-button')?.focus();
  }

  @HostListener('window:resize', ['$event'])
  closeMenuOnDesktop(event: Event): void {
    if ((event.target as Window).innerWidth >= this.desktopBreakpoint) this.closeMenu();
  }
}
