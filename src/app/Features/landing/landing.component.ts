import { Component } from '@angular/core';
import { HeroComponent } from "../hero/hero.component";
import { SectionHeaderComponent } from "../../shared/components/section-header/section-header.component";
import { EducationCardComponent } from '../../shared/components/education-card/education-card.component';

@Component({
  selector: 'app-landing',
  imports: [HeroComponent, SectionHeaderComponent , EducationCardComponent],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css',
})
export class LandingComponent {
onSelectStage(stage: string): void {
    console.log('Selected stage:', stage);
  }
}
