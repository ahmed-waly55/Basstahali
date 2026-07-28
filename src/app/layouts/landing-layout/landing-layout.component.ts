import { Component } from '@angular/core';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-landing-layout',
  imports: [HeaderComponent, FooterComponent, RouterOutlet],
  templateUrl: './landing-layout.component.html',
  styleUrl: './landing-layout.component.css',
})
export class LandingLayoutComponent {

}
