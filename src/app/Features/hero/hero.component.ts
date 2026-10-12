import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LiveLessonComponent } from '../../shared/components/live-lesson/live-lesson.component';
import { TranslatePipe } from '../../core/services/translate.pipe';

@Component({
  selector: 'app-hero',
  imports: [LiveLessonComponent, TranslatePipe, RouterLink],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css',
})
export class HeroComponent {}
