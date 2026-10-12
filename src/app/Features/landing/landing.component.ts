import { Component, ChangeDetectorRef, DestroyRef, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timeout } from 'rxjs';
import { PreferencesService } from '../../core/services/preferences.service';
import { TeacherService } from '../../core/services/teacher.service';
import { TranslatePipe } from '../../core/services/translate.pipe';
import {
  learningItems,
  LearningItem,
} from '../../shared/components/learning-catalog/learning-catalog.component';
import { HeroComponent } from '../hero/hero.component';

@Component({
  selector: 'app-landing',
  imports: [TranslatePipe, HeroComponent, RouterLink],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css',
})
export class LandingComponent implements OnInit {
  preferences = inject(PreferencesService);
  private service = inject(TeacherService);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  curriculaList: LearningItem[] = [];
  ngOnInit(): void {
    this.service
      .getCurricula()
      .pipe(timeout(12000), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.curriculaList = learningItems(response);
          this.cdr.markForCheck();
        },
        error: () => {
          this.curriculaList = [];
          this.cdr.markForCheck();
        },
      });
  }
}
