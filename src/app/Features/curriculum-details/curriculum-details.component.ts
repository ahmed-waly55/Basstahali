import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, combineLatest, map, of, startWith, Subject, switchMap, timeout } from 'rxjs';
import { TeacherService } from '../../core/services/teacher.service';
import { PreferencesService } from '../../core/services/preferences.service';
import {
  LearningItem,
  learningItems,
} from '../../shared/components/learning-catalog/learning-catalog.component';

@Component({
  selector: 'app-curriculum-details',
  imports: [RouterLink],
  templateUrl: './curriculum-details.component.html',
})
export class CurriculumDetailsComponent implements OnInit {
  readonly messages = {
    m_a9fe55e11e10: $localize`:@@m_a9fe55e11e10:عودة للمناهج`,
    m_e56a7b103ef6: $localize`:@@m_e56a7b103ef6:المراحل الدراسية`,
    m_8463b885352e: $localize`:@@m_8463b885352e:اختر المرحلة الدراسية المناسبة لك للاطلاع على كافة المواد`,
    m_cee8f138e31b: $localize`:@@m_cee8f138e31b:جارٍ التحميل...`,
    m_e0465a89fde9: $localize`:@@m_e0465a89fde9:تعذر تحميل البيانات`,
    m_c736c9f1496a: $localize`:@@m_c736c9f1496a:حاول مرة أخرى بعد التأكد من اتصالك بالإنترنت.`,
    m_2e47b5f289f1: $localize`:@@m_2e47b5f289f1:إعادة المحاولة`,
    m_903e510c1f81: $localize`:@@m_903e510c1f81:استكشف المواد والمقررات الدراسية المتاحة لهذه المرحلة.`,
    m_77b90efee27e: $localize`:@@m_77b90efee27e:عرض المواد`,
    m_7aad98c6764d: $localize`:@@m_7aad98c6764d:لا توجد مراحل دراسية`,
    m_aaa04a0ad894: $localize`:@@m_aaa04a0ad894:لم يتم العثور على مراحل دراسية لهذا المنهج حالياً، يرجى التحقق من المنهج المختار.`,
    m_33fe9feecbfc: $localize`:@@m_33fe9feecbfc:العودة للمناهج`,
  };

  preferences = inject(PreferencesService);
  private service = inject(TeacherService);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private retryRequests = new Subject<void>();
  id: string | null = null;
  gradeLevels = signal<LearningItem[]>([]);
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
    combineLatest([this.route.paramMap, this.retryRequests.pipe(startWith(undefined))])
      .pipe(
        switchMap(([params]) => {
          this.id = params.get('id');
          return this.request();
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => this.complete(result));
  }
  private request() {
    if (!this.id) return of({ items: [] as LearningItem[], failed: true });
    this.loading.set(true);
    this.failed.set(false);
    return this.service.getGradeLevels(this.id!).pipe(
      timeout(12000),
      map((response) => ({ items: learningItems(response), failed: false })),
      catchError(() => of({ items: [] as LearningItem[], failed: true })),
    );
  }
  private complete(result: { items: LearningItem[]; failed: boolean }) {
    this.gradeLevels.set(result.items);
    this.failed.set(result.failed);
    this.loading.set(false);
  }
  retry(): void {
    this.retryRequests.next();
  }
}
