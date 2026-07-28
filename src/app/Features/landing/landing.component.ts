import { Component } from '@angular/core';
import { HeroComponent } from "../hero/hero.component";

@Component({
  selector: 'app-landing',
  imports: [HeroComponent],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css',
})
export class LandingComponent {

}
