import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { TeacherService } from '../../core/services/teacher.service';

@Component({
  selector: 'app-curriculum-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './curriculum-details.component.html'
})
export class CurriculumDetailsComponent implements OnInit {

  private teacherService = inject(TeacherService);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  id: string | null = null;

  // تحويل البيانات إلى Signal لضمان تحديث الـ View فوراً مع SSR
  gradeLevels = signal<any[]>([]);

  ngOnInit(): void {
    const paramSource = this.route.snapshot.paramMap.keys.length > 0
      ? this.route.paramMap
      : (this.route.parent?.paramMap ?? this.route.paramMap);

    paramSource
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const curriculumId = params.get('id') || params.get('curriculumId');

        if (!curriculumId) {
          console.error('Curriculum ID not found');
          return;
        }

        this.id = curriculumId;
        this.fetchGradeLevels(curriculumId);
      });
  }

  private fetchGradeLevels(curriculumId: string): void {
    this.teacherService
      .getGradeLevels(curriculumId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          const data = response?.data ?? (Array.isArray(response) ? response : []);

          // تحديث الـ Signal
          this.gradeLevels.set(data);

          // إخطار Angular صراحةً بوجود تحديث للواجهة
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Grade Levels API Error:', error);
          this.gradeLevels.set([]);
          this.cdr.markForCheck();
        }
      });
  }
}
