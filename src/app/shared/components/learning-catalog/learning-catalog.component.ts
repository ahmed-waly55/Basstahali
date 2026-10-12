import { TranslatePipe } from '../../../core/services/translate.pipe';
import { PreferencesService } from '../../../core/services/preferences.service';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

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
  imports: [TranslatePipe, RouterLink],
  templateUrl: './learning-catalog.component.html',
})
export class LearningCatalogComponent {
  preferences = inject(PreferencesService);
  items = input<LearningItem[]>([]);
  loading = input(false);
  failed = input(false);
  step = input<1 | 2 | 3>(1);
  backLink = input('/curriculum');
  curriculumId = input<string | null>(null);
  retry = output<void>();
  query = signal('');
  title = computed(() => ['المناهج الدراسية', 'المراحل الدراسية', 'المواد الدراسية'][this.step() - 1]);
  description = computed(() => [
    'منهجك، بطريقتك. اختر المنهج الدراسي وابدأ رحلتك مع بسطهالي خطوة بخطوة.',
    'كل مرحلة بداية جديدة. اختر صفك الدراسي للوصول إلى المواد المناسبة لك.',
    'فهم أبسط، وثقة أكبر. اكتشف مواد مرحلتك وتواصل معنا لحجز الحصة المناسبة.'
  ][this.step() - 1]);
  filtered = computed(() => {
    const query = this.normalize(this.query());
    return this.items().filter(item => this.normalize(`${item.nameAr ?? ''} ${item.nameEn ?? ''} ${item.name ?? ''} ${item.code ?? ''}`).includes(query));
  });
  name(item: LearningItem): string { return (this.preferences.language() === 'en' ? item.nameEn || item.nameAr : item.nameAr || item.nameEn) || item.name || (this.preferences.language() === 'en' ? 'Untitled' : 'بدون اسم'); }
  itemDescription(item: LearningItem): string {
    return (this.preferences.language() === 'en' ? item.descriptionEn || item.description : item.descriptionAr || item.description) || '';
  }
  key(item: LearningItem): string | undefined { return item.id || item._id; }
  bookingLink(item: LearningItem): string {
    return 'https://wa.me/971525250833?text=' + encodeURIComponent(`السلام عليكم، أرغب في الاستفسار عن حصص مادة ${this.name(item)} على بسطهالي`);
  }
  private normalize(value: string): string {
    return value.trim().toLowerCase().normalize('NFKD').replace(/[\u064B-\u065F\u0670\u0640]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي');
  }
}
