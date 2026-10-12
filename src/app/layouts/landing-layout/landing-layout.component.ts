import { TranslatePipe } from '../../core/services/translate.pipe';
import { Component, ChangeDetectionStrategy } from '@angular/core';
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
export class LandingLayoutComponent {}
