import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  catchError,
  combineLatest,
  forkJoin,
  map,
  of,
  startWith,
  Subject,
  switchMap,
  timeout,
} from 'rxjs';
import { TeacherService } from '../../core/services/teacher.service';
import { PreferencesService } from '../../core/services/preferences.service';
import {
  LearningItem,
  learningItems,
} from '../../shared/components/learning-catalog/learning-catalog.component';
import {
  subjectBookingAriaLabel,
  subjectBookingLink,
} from '../../shared/components/learning-catalog/subject-booking';

@Component({
  selector: 'app-subjects',
  imports: [RouterLink],
  templateUrl: './subjects.component.html',
  styleUrl: './subjects.component.css',
})
export class SubjectsComponent implements OnInit {
  readonly messages = {
    m_fcc5af28cc61: $localize`:@@m_fcc5af28cc61:عودة للمراحل`,
    m_aa2d5b333df8: $localize`:@@m_aa2d5b333df8:المواد الدراسية`,
    m_61d2d6667029: $localize`:@@m_61d2d6667029:اختر المادة الدراسية للاطلاع على الكورسات والمعلمين المتاحين`,
    m_cee8f138e31b: $localize`:@@m_cee8f138e31b:جارٍ التحميل...`,
    m_e0465a89fde9: $localize`:@@m_e0465a89fde9:تعذر تحميل البيانات`,
    m_c736c9f1496a: $localize`:@@m_c736c9f1496a:حاول مرة أخرى بعد التأكد من اتصالك بالإنترنت.`,
    m_2e47b5f289f1: $localize`:@@m_2e47b5f289f1:إعادة المحاولة`,
    m_7f4924f6db25: $localize`:@@m_7f4924f6db25:استكشف شروحات ومراجعات المادة وأفضل المدرسين المعتمدين.`,
    m_1e4c02d0094d: $localize`:@@m_1e4c02d0094d:تصفح المادة`,
    m_5a8a2f79d0dd: $localize`:@@m_5a8a2f79d0dd:لا توجد مواد دراسية`,
    m_538347e9fa1c: $localize`:@@m_538347e9fa1c:لم يتم إضافة مواد دراسية لهذه المرحلة حتى الآن، يرجى المحاولة لاحقاً أو اختيار مرحلة أخرى.`,
    m_17540430bc8a: $localize`:@@m_17540430bc8a:العودة للمراحل السابقة`,
  };

  preferences = inject(PreferencesService);
  private service = inject(TeacherService);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private retryRequests = new Subject<void>();
  gradeLevelId: string | null = null;
  backLink = signal('/curriculum');
  subjects = signal<LearningItem[]>([]);
  loading = signal(true);
  failed = signal(false);
  grade = signal<LearningItem | null>(null);
  curriculum = signal<LearningItem | null>(null);
  readonly bookingLabel = $localize`:@@subjectBookingAction:احجز المادة عبر واتساب`;
  bookingLink(subject: LearningItem): string {
    return subjectBookingLink(this.preferences.itemName(subject), {
      gradeName: this.grade() ? this.preferences.itemName(this.grade()!) : undefined,
      curriculumName: this.curriculum() ? this.preferences.itemName(this.curriculum()!) : undefined,
    });
  }
  bookingAriaLabel(subject: LearningItem): string {
    return subjectBookingAriaLabel(this.preferences.itemName(subject));
  }
  itemDescription(item: LearningItem): string {
    return (
      (this.preferences.language() === 'en'
        ? item.descriptionEn || item.description
        : item.descriptionAr || item.description) || ''
    );
  }
  ngOnInit(): void {
    combineLatest([this.route.paramMap, this.route.queryParamMap])
      .pipe(
        switchMap(([params, query]) => {
          const curriculumId = query.get('curriculum');
          const gradeId = params.get('subjectId');
          this.backLink.set(
            curriculumId ? '/curriculum/' + encodeURIComponent(curriculumId) : '/curriculum',
          );
          this.grade.set(null);
          this.curriculum.set(null);
          if (!curriculumId || !gradeId) return of({ grade: null, curriculum: null });
          return forkJoin({
            curricula: this.service.getCurricula().pipe(
              timeout(12000),
              map(learningItems),
              catchError(() => of([])),
            ),
            grades: this.service.getGradeLevels(curriculumId).pipe(
              timeout(12000),
              map(learningItems),
              catchError(() => of([])),
            ),
          }).pipe(
            map(({ curricula, grades }) => ({
              curriculum: curricula.find((item) => (item.id || item._id) === curriculumId) ?? null,
              grade: grades.find((item) => (item.id || item._id) === gradeId) ?? null,
            })),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((context) => {
        this.grade.set(context.grade);
        this.curriculum.set(context.curriculum);
      });
    combineLatest([this.route.paramMap, this.retryRequests.pipe(startWith(undefined))])
      .pipe(
        switchMap(([params]) => {
          this.gradeLevelId = params.get('subjectId');
          return this.request();
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => this.complete(result));
  }
  private request() {
    if (!this.gradeLevelId) return of({ items: [] as LearningItem[], failed: true });
    this.loading.set(true);
    this.failed.set(false);
    return this.service.getSubjects(this.gradeLevelId!).pipe(
      timeout(12000),
      map((response) => ({ items: learningItems(response), failed: false })),
      catchError(() => of({ items: [] as LearningItem[], failed: true })),
    );
  }
  private complete(result: { items: LearningItem[]; failed: boolean }) {
    this.subjects.set(result.items);
    this.failed.set(result.failed);
    this.loading.set(false);
  }
  retry(): void {
    this.retryRequests.next();
  }
}
