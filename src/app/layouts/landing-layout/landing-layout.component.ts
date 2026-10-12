import { TranslatePipe } from '../../core/services/translate.pipe';
import { afterNextRender, Component, ChangeDetectionStrategy } from '@angular/core';
import AOS from 'aos';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-landing-layout',
  imports: [TranslatePipe, HeaderComponent, FooterComponent, RouterOutlet],
  templateUrl: './landing-layout.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './landing-layout.component.css',
})
export class LandingLayoutComponent {
  constructor() {
    afterNextRender(() => {
      AOS.init({ once: true, mirror: false });
    });
  }
}
