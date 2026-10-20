import { afterNextRender, Component, ChangeDetectionStrategy } from '@angular/core';
import AOS from 'aos';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-landing-layout',
  imports: [HeaderComponent, FooterComponent, RouterOutlet],
  templateUrl: './landing-layout.component.html',
  changeDetection: ChangeDetectionStrategy.Default,
  styleUrl: './landing-layout.component.css',
})
export class LandingLayoutComponent {
  readonly messages = {
    m_f3323560539a: $localize`:@@m_f3323560539a:تواصل معنا مباشرة`,
    m_a01613b4c618: $localize`:@@m_a01613b4c618:تواصل معنا عبر واتساب`,
  };

  readonly whatsAppLink = `https://wa.me/971563306087?text=${encodeURIComponent(
    $localize`:@@m_82d08494ad78:السلام عليكم، أرغب في الاستفسار عن الخدمات.`,
  )}`;

  constructor() {
    afterNextRender(() => {
      AOS.init({ once: true, mirror: false });
    });
  }
}
