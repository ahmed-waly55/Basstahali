import { Component, Input, OnChanges, SimpleChanges, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TeacherService } from '../../core/services/teacher.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-curriculum-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './curriculum-details.component.html',
  styleUrl: './curriculum-details.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CurriculumDetailsComponent implements OnChanges, OnDestroy {
  private teacherService = inject(TeacherService);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  // استقبال الـ id كـ Input (سواء قادم من الأب أو مربوط مباشرة من الـ Router باستخدام withComponentInputBinding)
  @Input() id!: string;

  gradeLevels: any[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    // يتم تنفذيها فور تغير قيمة الـ id (سواء عند التحميل أو عند حدوث أي تغير/Refresh يمرر الـ id)
    if (changes['id'] && this.id) {
      this.fetchGradeLevels(this.id);
    }
  }

  fetchGradeLevels(curriculumId: string): void {
    this.teacherService.getGradeLevels(curriculumId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          console.log("Grade Levels Response:", response);

          if (Array.isArray(response)) {
            this.gradeLevels = response;
          } else if (response?.data && Array.isArray(response.data)) {
            this.gradeLevels = response.data;
          } else {
            this.gradeLevels = [];
          }

          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('خطأ في جلب المراحل التعليمية:', error);
          this.gradeLevels = [];
          this.cdr.detectChanges();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
