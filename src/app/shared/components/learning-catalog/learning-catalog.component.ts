import { PreferencesService } from '../../../core/services/preferences.service';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { subjectBookingAriaLabel, subjectBookingLink } from './subject-booking';

export interface LearningItem {
  id?: string;
  _id?: string;
  nameAr?: string;
  nameEn?: string;
  name?: string;
  description?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  code?: string;
}

export function learningItems(response: unknown): LearningItem[] {
  const body = response as { res?: unknown; data?: unknown } | null;
  const items = body?.res ?? body?.data ?? response;
  return Array.isArray(items) ? items : [];
}

@Component({
  selector: 'app-learning-catalog',
  imports: [RouterLink],
  templateUrl: './learning-catalog.component.html',
})
export class LearningCatalogComponent {
  readonly messages = {
    m_b986d8fb163c: $localize`:@@m_b986d8fb163c:الرئيسية`,
    m_1ea7464560c3: $localize`:@@m_1ea7464560c3:المناهج الدراسية`,
    m_e56a7b103ef6: $localize`:@@m_e56a7b103ef6:المراحل الدراسية`,
    m_33fe9feecbfc: $localize`:@@m_33fe9feecbfc:العودة للمناهج`,
    m_fc0f6f348438: $localize`:@@m_fc0f6f348438:العودة للمراحل`,
    m_17f5a7b2b1e1: $localize`:@@m_17f5a7b2b1e1:اختر المنهج المناسب لك`,
    m_9568ca9a2b18: $localize`:@@m_9568ca9a2b18:في أي صف تدرس؟`,
    m_e8d4848d70d7: $localize`:@@m_e8d4848d70d7:ماذا تريد أن تتعلم؟`,
    m_aa7099e27834: $localize`:@@m_aa7099e27834:من`,
    m_fe30fd1d6cb8: $localize`:@@m_fe30fd1d6cb8:متاح للتصفح`,
    m_b7cd28953c33: $localize`:@@m_b7cd28953c33:بحث في`,
    m_730c04f9f7c9: $localize`:@@m_730c04f9f7c9:جاري تحميل`,
    m_e0465a89fde9: $localize`:@@m_e0465a89fde9:تعذر تحميل البيانات`,
    m_c736c9f1496a: $localize`:@@m_c736c9f1496a:حاول مرة أخرى بعد التأكد من اتصالك بالإنترنت.`,
    m_2e47b5f289f1: $localize`:@@m_2e47b5f289f1:إعادة المحاولة`,
    m_3a6bbb407f01: $localize`:@@m_3a6bbb407f01:منهج دراسي`,
    m_ff11d6178d73: $localize`:@@m_ff11d6178d73:مرحلة دراسية`,
    m_7ea037d430bc: $localize`:@@m_7ea037d430bc:مادة دراسية`,
    m_29fc2ee50825: $localize`:@@m_29fc2ee50825:تعرّف على المراحل الدراسية واختر ما يناسب رحلتك التعليمية.`,
    m_a26265e1c5e4: $localize`:@@m_a26265e1c5e4:كل مواد صفك في مكان واحد، لخطوة أسهل نحو التفوق.`,
    m_08f70f3decd3: $localize`:@@m_08f70f3decd3:شرح مبسط ومتابعة تساعدك على فهم المادة بثقة.`,
    m_27873d8c70fc: $localize`:@@m_27873d8c70fc:استكشف المراحل`,
    m_718591f8c558: $localize`:@@m_718591f8c558:استكشف المواد`,
    m_15f659f6da6d: $localize`:@@m_15f659f6da6d:استفسر عن الحصص`,
    m_8d88b0583d4d: $localize`:@@m_8d88b0583d4d:لا توجد نتائج مطابقة`,
    m_fca727a94d64: $localize`:@@m_fca727a94d64:لا توجد بيانات متاحة حاليًا`,
    m_9c11c23a1864: $localize`:@@m_9c11c23a1864:جرّب اسمًا آخر أو اعرض كل النتائج.`,
    m_f2e0d175e64f: $localize`:@@m_f2e0d175e64f:يمكنك العودة لاحقًا أو التواصل معنا لمعرفة الخيارات المتاحة.`,
    m_d36294e5abb3: $localize`:@@m_d36294e5abb3:عرض الكل`,
    m_24ad3009f7b1: $localize`:@@m_24ad3009f7b1:محتاج مساعدة في اختيارك؟`,
    m_9216e40a4838: $localize`:@@m_9216e40a4838:فريق بسطهالي معك لاختيار المنهج والحصة المناسبة لاحتياجك.`,
    m_988638232136: $localize`:@@m_988638232136:تواصل معنا`,
    m_b598140d68a4: $localize`:@@m_b598140d68a4:مسار الصفحة`,
    m_2cadbb3d0c3c: $localize`:@@m_2cadbb3d0c3c:خطوات اختيار المادة`,
    m_fc86abfa98de: $localize`:@@m_fc86abfa98de:اكتب الاسم هنا…`,
    m_ea2000f61b88: $localize`:@@m_ea2000f61b88:عرض مراحل `,
    m_9464e5061743: $localize`:@@m_9464e5061743:عرض مواد `,
    m_0a0cd68992bf: $localize`:@@m_0a0cd68992bf:استفسر عن حصص `,
  };

  readonly stepLabels = [
    $localize`:@@catalogStepCurriculum:المنهج`,
    $localize`:@@catalogStepGrade:المرحلة`,
    $localize`:@@catalogStepSubject:المادة`,
  ];
  preferences = inject(PreferencesService);
  items = input<LearningItem[]>([]);
  loading = input(false);
  failed = input(false);
  step = input<1 | 2 | 3>(1);
  backLink = input('/curriculum');
  curriculumId = input<string | null>(null);
  gradeName = input<string | undefined>(undefined);
  curriculumName = input<string | undefined>(undefined);
  readonly bookingLabel = $localize`:@@subjectBookingAction:احجز المادة عبر واتساب`;
  retry = output<void>();
  query = signal('');
  title = computed(
    () =>
      [
        $localize`:@@m_1ea7464560c3:المناهج الدراسية`,
        $localize`:@@m_e56a7b103ef6:المراحل الدراسية`,
        $localize`:@@m_aa2d5b333df8:المواد الدراسية`,
      ][this.step() - 1],
  );
  description = computed(
    () =>
      [
        $localize`:@@m_099c60df29f8:منهجك، بطريقتك. اختر المنهج الدراسي وابدأ رحلتك مع بسطهالي خطوة بخطوة.`,
        $localize`:@@m_352bf616a99b:كل مرحلة بداية جديدة. اختر صفك الدراسي للوصول إلى المواد المناسبة لك.`,
        $localize`:@@m_f469eaa7f455:فهم أبسط، وثقة أكبر. اكتشف مواد مرحلتك وتواصل معنا لحجز الحصة المناسبة.`,
      ][this.step() - 1],
  );
  filtered = computed(() => {
    const query = this.normalize(this.query());
    return this.items().filter((item) =>
      this.normalize(
        `${item.nameAr ?? ''} ${item.nameEn ?? ''} ${item.name ?? ''} ${item.code ?? ''}`,
      ).includes(query),
    );
  });
  name(item: LearningItem): string {
    return (
      (this.preferences.language() === 'en'
        ? item.nameEn || item.nameAr
        : item.nameAr || item.nameEn) ||
      item.name ||
      $localize`:@@m_4093b51f686a:بدون اسم`
    );
  }
  itemDescription(item: LearningItem): string {
    return (
      (this.preferences.language() === 'en'
        ? item.descriptionEn || item.description
        : item.descriptionAr || item.description) || ''
    );
  }
  key(item: LearningItem): string | undefined {
    return item.id || item._id;
  }
  bookingLink(item: LearningItem): string {
    return subjectBookingLink(this.name(item), {
      gradeName: this.gradeName(),
      curriculumName: this.curriculumName(),
    });
  }
  bookingAriaLabel(item: LearningItem): string {
    return subjectBookingAriaLabel(this.name(item));
  }
  private normalize(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
      .replace(/[أإآ]/g, 'ا')
      .replace(/ى/g, 'ي');
  }
}
