import { ElementRef, HostListener, inject } from '@angular/core';
import { PreferencesService } from '../../core/services/preferences.service';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [RouterLinkActive, RouterLink],
  templateUrl: './header.component.html',
  changeDetection: ChangeDetectionStrategy.Default,
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  readonly messages = {
    m_b986d8fb163c: $localize`:@@m_b986d8fb163c:الرئيسية`,
    m_1ea7464560c3: $localize`:@@m_1ea7464560c3:المناهج الدراسية`,
    m_5b82b7079a31: $localize`:@@m_5b82b7079a31:الكورسات`,
    m_43edaf712d07: $localize`:@@m_43edaf712d07:المدرسين`,
    m_ec15ec94c35d: $localize`:@@m_ec15ec94c35d:المميزات`,
    m_d3d452110c4d: $localize`:@@m_d3d452110c4d:الأسعار`,
    m_629d28fb5255: $localize`:@@m_629d28fb5255:من نحن`,
    m_404841693fc2: $localize`:@@m_404841693fc2:عربي`,
    m_8c6117b67c8b: $localize`:@@m_8c6117b67c8b:تسجيل الدخول`,
    m_cb75b65677d5: $localize`:@@m_cb75b65677d5:القائمة الرئيسية`,
    m_2aaf2c72e715: $localize`:@@m_2aaf2c72e715:التبديل إلى العربية`,
    m_d77b19407de9: $localize`:@@m_d77b19407de9:تبديل الوضع الداكن`,
    m_988638232136: $localize`:@@m_988638232136:تواصل معنا`,
  };

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
