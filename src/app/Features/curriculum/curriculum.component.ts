import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timeout } from 'rxjs';
import { TeacherService } from '../../core/services/teacher.service';
import { LearningCatalogComponent, LearningItem, learningItems } from '../../shared/components/learning-catalog/learning-catalog.component';

@Component({
  selector: 'app-curriculum',
  imports: [LearningCatalogComponent],
  templateUrl: './curriculum.component.html',
  styleUrl: './curriculum.component.css',
})
export class CurriculumComponent implements OnInit {
  private service = inject(TeacherService);
  private destroyRef = inject(DestroyRef);
  CurriculmData = signal<LearningItem[]>([]);
  loading = signal(true);
  failed = signal(false);
  ngOnInit(): void { this.getCurriculm(); }
  getCurriculm(): void {
    this.loading.set(true);
    this.failed.set(false);
    this.service.getCurricula().pipe(timeout(12000), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: response => { this.CurriculmData.set(learningItems(response)); this.loading.set(false); },
      error: () => { this.failed.set(true); this.loading.set(false); }
    });
  }
}
