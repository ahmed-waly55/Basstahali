import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import * as AOS from 'aos';
import { PreferencesService } from '../../core/services/preferences.service';
import { TranslatePipe } from '../../core/services/translate.pipe';

type CurriculumId = 'international' | 'ministerial';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  previousPrice?: number;
}

interface CurriculumOffer {
  id: CurriculumId;
  name: string;
  plans: readonly PricingPlan[];
}

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './pricing.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './pricing.component.css',
})
export class PricingComponent implements OnInit {
  private platformId = inject(PLATFORM_ID);
  private preferences = inject(PreferencesService);

  readonly curricula: readonly CurriculumOffer[] = [
    {
      id: 'international',
      name: 'المنهج الانترناشونال',
      plans: [
        { id: 'primary', name: 'المرحلة الابتدائية', price: 800, previousPrice: 1000 },
        { id: 'middle', name: 'المرحلة المتوسطة', price: 960, previousPrice: 1200 },
        { id: 'secondary', name: 'المرحلة الثانوية', price: 1120, previousPrice: 1400 },
      ],
    },
    {
      id: 'ministerial',
      name: 'المنهج الوزاري',
      plans: [
        { id: 'primary', name: 'المرحلة الابتدائية', price: 640 },
        { id: 'middle', name: 'المرحلة المتوسطة', price: 800 },
        { id: 'secondary', name: 'المرحلة الثانوية', price: 960 },
      ],
    },
  ];
  readonly selectedCurriculum = signal<CurriculumId>('international');
  readonly activeCurriculum = computed(() =>
    this.curricula.find((curriculum) => curriculum.id === this.selectedCurriculum())!,
  );
  readonly features = ['4 مواد دراسية', 'مادة إضافية هدية', '8 حصص لكل مادة'];

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      AOS.init({ duration: 800, once: true, mirror: false });
    }
  }

  getSubscribeLink(plan: PricingPlan): string {
    const curriculum = this.preferences.translate(this.activeCurriculum().name);
    const stage = this.preferences.translate(plan.name);
    const message =
      this.preferences.language() === 'en'
        ? `Hello, I would like to subscribe to the Basstahali ${curriculum} package for ${stage}: ${plan.price} AED, 4 subjects + 1 free subject, with 8 lessons per subject.`
        : `السلام عليكم، أرغب في الاشتراك في باقة بسطهالي للمنهج ${curriculum.replace('المنهج ', '')}، ${stage}، بسعر ${plan.price} درهم إماراتي: 4 مواد + مادة هدية، و8 حصص لكل مادة.`;
    return `https://wa.me/971563306087?text=${encodeURIComponent(message)}`;
  }
}
