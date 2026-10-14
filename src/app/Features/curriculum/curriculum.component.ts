import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timeout } from 'rxjs';
import { RouterLink } from '@angular/router';
import { TeacherService } from '../../core/services/teacher.service';
import { PreferencesService } from '../../core/services/preferences.service';
import {
  LearningItem,
  learningItems,
} from '../../shared/components/learning-catalog/learning-catalog.component';

@Component({
  selector: 'app-curriculum',
  imports: [RouterLink],
  templateUrl: './curriculum.component.html',
  styleUrl: './curriculum.component.css',
})
export class CurriculumComponent implements OnInit {
  readonly messages = {
    m_1ea7464560c3: $localize`:@@m_1ea7464560c3:المناهج الدراسية`,
    m_5c5d07d4d933: $localize`:@@m_5c5d07d4d933:اختر المنهج المناسب لك للبدء في رحلة التعلم مع بسطهالي`,
    m_cee8f138e31b: $localize`:@@m_cee8f138e31b:جارٍ التحميل...`,
    m_e0465a89fde9: $localize`:@@m_e0465a89fde9:تعذر تحميل البيانات`,
    m_c736c9f1496a: $localize`:@@m_c736c9f1496a:حاول مرة أخرى بعد التأكد من اتصالك بالإنترنت.`,
    m_2e47b5f289f1: $localize`:@@m_2e47b5f289f1:إعادة المحاولة`,
    m_a7f5f8c5721a: $localize`:@@m_a7f5f8c5721a:استكشف المقررات والمراحل التعليمية المتوافقة مع هذا المنهج.`,
    m_69b7747432b9: $localize`:@@m_69b7747432b9:عرض المراحل الدراسية`,
    m_4d255e9aaa04: $localize`:@@m_4d255e9aaa04:لا توجد مناهج متاحة`,
    m_7d7ecb52137b: $localize`:@@m_7d7ecb52137b:لم يتم العثور على مناهج دراسية حالياً، أو جاري تحميل البيانات...`,
  };

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
