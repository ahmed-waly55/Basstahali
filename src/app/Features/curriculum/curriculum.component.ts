import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timeout } from 'rxjs';
import { RouterLink } from '@angular/router';
import { TeacherService } from '../../core/services/teacher.service';
import { PreferencesService } from '../../core/services/preferences.service';
import { TranslatePipe } from '../../core/services/translate.pipe';
import {
  LearningItem,
  learningItems,
} from '../../shared/components/learning-catalog/learning-catalog.component';

@Component({
  selector: 'app-curriculum',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './curriculum.component.html',
  styleUrl: './curriculum.component.css',
})
export class CurriculumComponent implements OnInit {
  preferences = inject(PreferencesService);
  private service = inject(TeacherService);
  private destroyRef = inject(DestroyRef);
  CurriculmData = signal<LearningItem[]>([]);
  loading = signal(true);
  failed = signal(false);
  itemDescription(item: LearningItem): string {
    return (
      (this.preferences.language() === 'en'
        ? item.descriptionEn || item.description
        : item.descriptionAr || item.description) || ''
    );
  }
  ngOnInit(): void {
    this.getCurriculm();
  }
  getCurriculm(): void {
    this.loading.set(true);
    this.failed.set(false);
    this.service
      .getCurricula()
      .pipe(timeout(12000), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.CurriculmData.set(learningItems(response));
          this.loading.set(false);
        },
        error: () => {
          this.failed.set(true);
          this.loading.set(false);
        },
      });
  }
}
