import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, combineLatest, map, of, startWith, Subject, switchMap, timeout } from 'rxjs';
import { TeacherService } from '../../core/services/teacher.service';
import { LearningCatalogComponent, LearningItem, learningItems } from '../../shared/components/learning-catalog/learning-catalog.component';

@Component({
  selector: 'app-subjects',
  imports: [LearningCatalogComponent],
  templateUrl: './subjects.component.html',
  styleUrl: './subjects.component.css',
})
export class SubjectsComponent implements OnInit {
  private service = inject(TeacherService);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private retryRequests = new Subject<void>();
  gradeLevelId: string | null = null;
  backLink = signal('/curriculum');
  subjects = signal<LearningItem[]>([]);
  loading = signal(true);
  failed = signal(false);
  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const curriculum = params.get('curriculum');
      this.backLink.set(curriculum ? '/curriculum/' + encodeURIComponent(curriculum) : '/curriculum');
    });
    combineLatest([this.route.paramMap, this.retryRequests.pipe(startWith(undefined))]).pipe(switchMap(([params]) => {
      this.gradeLevelId = params.get('subjectId');
      return this.request();
    }), takeUntilDestroyed(this.destroyRef)).subscribe(result => this.complete(result));
  }
  private request() {
    if (!this.gradeLevelId) return of({ items: [] as LearningItem[], failed: true });
    this.loading.set(true); this.failed.set(false);
    return this.service.getSubjects(this.gradeLevelId!).pipe(timeout(12000),
      map(response => ({ items: learningItems(response), failed: false })),
      catchError(() => of({ items: [] as LearningItem[], failed: true })));
  }
  private complete(result: {items: LearningItem[]; failed: boolean}) {
    this.subjects.set(result.items); this.failed.set(result.failed); this.loading.set(false);
  }
  retry(): void { this.retryRequests.next(); }
}
