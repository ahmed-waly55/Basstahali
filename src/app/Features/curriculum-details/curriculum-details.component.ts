import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, combineLatest, map, of, startWith, Subject, switchMap, timeout } from 'rxjs';
import { TeacherService } from '../../core/services/teacher.service';
import { LearningCatalogComponent, LearningItem, learningItems } from '../../shared/components/learning-catalog/learning-catalog.component';

@Component({
  selector: 'app-curriculum-details',
  imports: [LearningCatalogComponent],
  templateUrl: './curriculum-details.component.html',
})
export class CurriculumDetailsComponent implements OnInit {
  private service = inject(TeacherService);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private retryRequests = new Subject<void>();
  id: string | null = null;
  gradeLevels = signal<LearningItem[]>([]);
  loading = signal(true);
  failed = signal(false);
  ngOnInit(): void {
    combineLatest([this.route.paramMap, this.retryRequests.pipe(startWith(undefined))]).pipe(
      switchMap(([params]) => {
        this.id = params.get('id');
        return this.request();
      }), takeUntilDestroyed(this.destroyRef)
    ).subscribe(result => this.complete(result));
  }
  private request() {
    if (!this.id) return of({ items: [] as LearningItem[], failed: true });
    this.loading.set(true);
    this.failed.set(false);
    return this.service.getGradeLevels(this.id!).pipe(timeout(12000),
      map(response => ({ items: learningItems(response), failed: false })),
      catchError(() => of({ items: [] as LearningItem[], failed: true })));
  }
  private complete(result: {items: LearningItem[]; failed: boolean}) {
    this.gradeLevels.set(result.items); this.failed.set(result.failed); this.loading.set(false);
  }
  retry(): void { this.retryRequests.next(); }
}
