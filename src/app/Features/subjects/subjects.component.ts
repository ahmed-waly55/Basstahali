import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { TeacherService } from '../../core/services/teacher.service';

@Component({
  selector: 'app-subjects',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './subjects.component.html',
  styleUrl: './subjects.component.css'
})
export class SubjectsComponent implements OnInit {

  private teacherService = inject(TeacherService);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  private location = inject(Location);

  // تخزين معرف المرحلة الممرر في الـ URL (:subjectId)
  gradeLevelId: string | null = null;

  // Signal لتخزين المواد وضمان التحديث المباشر مع الـ SSR
  subjects = signal<any[]>([]);

  ngOnInit(): void {
    const paramSource = this.route.snapshot.paramMap.keys.length > 0
      ? this.route.paramMap
      : (this.route.parent?.paramMap ?? this.route.paramMap);

    paramSource
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        // قراءة المعرف الممرر في المسار (مع دعم مسميات بديلة للأمان)
        const id = params.get('subjectId') || params.get('id') || params.get('gradeLevelId');

        if (!id) {
          console.error('Grade level ID not found in route parameters');
          return;
        }

        this.gradeLevelId = id;
        this.fetchSubjects(id);
      });
  }

  private fetchSubjects(gradeLevelId: string): void {
    console.log('Fetching subjects for grade level ID:', gradeLevelId);

    this.teacherService
      .getSubjects(gradeLevelId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          console.log('Subjects API Response:', response);

          // استخراج المصفوفة سواء كانت داخل response.data أو كمصفوفة مباشرة
          const data = response?.data ?? (Array.isArray(response) ? response : []);

          this.subjects.set(data);
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Subjects API Error:', error);
          this.subjects.set([]);
          this.cdr.markForCheck();
        }
      });
  }

  // الرجوع للخلف في تاريخ المتصفح
  goBack(): void {
    this.location.back();
  }
}
