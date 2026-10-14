import { isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import * as AOS from 'aos';
import { VisitorPricingService } from '../../core/services/visitor-pricing.service';

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
  imports: [],
  templateUrl: './pricing.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './pricing.component.css',
})
export class PricingComponent implements OnInit {
  readonly messages = {
    m_cc7c628c0943: $localize`:@@m_cc7c628c0943:باقات الحصص المباشرة`,
    m_f08dbdfff820: $localize`:@@m_f08dbdfff820:اختر`,
    m_99839e1179a7: $localize`:@@m_99839e1179a7:الباقة المناسبة لك`,
    m_277a62a440ec: $localize`:@@m_277a62a440ec:4 مواد + مادة هدية، و8 حصص لكل مادة.`,
    m_48e0ece017eb: $localize`:@@m_48e0ece017eb:أسعار مصر بالجنيه المصري، بسعر ثابت 15 جنيهًا لكل درهم.`,
    m_692fc0d89aa0: $localize`:@@m_692fc0d89aa0:باقة 4 مواد + مادة هدية`,
    m_b596c59ccd7f: $localize`:@@m_b596c59ccd7f:بدلاً من`,
    m_d80c2c9d5035: $localize`:@@m_d80c2c9d5035:خصم 20%`,
    m_5500f35d67a3: $localize`:@@m_5500f35d67a3:اشترك عبر واتساب`,
    m_7babcfaf69c7: $localize`:@@m_7babcfaf69c7:اختر باقتك للتواصل معنا مباشرة عبر واتساب وإتمام الاشتراك.`,
    m_3d2fb6a4d73c: $localize`:@@m_3d2fb6a4d73c:اختر المنهج`,
  };

  private platformId = inject(PLATFORM_ID);
  readonly pricing = inject(VisitorPricingService);

  readonly curricula: readonly CurriculumOffer[] = [
    {
      id: 'international',
      name: $localize`:@@m_6e69637a22ec:المنهج الانترناشونال`,
      plans: [
        {
          id: 'primary',
          name: $localize`:@@m_36d9c98fcafd:المرحلة الابتدائية`,
          price: 800,
          previousPrice: 1000,
        },
        {
          id: 'middle',
          name: $localize`:@@m_667eb688d965:المرحلة المتوسطة`,
          price: 960,
          previousPrice: 1200,
        },
        {
          id: 'secondary',
          name: $localize`:@@m_2b7e1606aeba:المرحلة الثانوية`,
          price: 1120,
          previousPrice: 1400,
        },
      ],
    },
    {
      id: 'ministerial',
      name: $localize`:@@m_eef96d9971e1:المنهج الوزاري`,
      plans: [
        {
          id: 'primary',
          name: $localize`:@@m_36d9c98fcafd:المرحلة الابتدائية`,
          price: 640,
          previousPrice: 800,
        },
        {
          id: 'middle',
          name: $localize`:@@m_667eb688d965:المرحلة المتوسطة`,
          price: 800,
          previousPrice: 1000,
        },
        {
          id: 'secondary',
          name: $localize`:@@m_2b7e1606aeba:المرحلة الثانوية`,
          price: 960,
          previousPrice: 1200,
        },
      ],
    },
  ];
  readonly selectedCurriculum = signal<CurriculumId>('international');
  readonly activeCurriculum = computed(() =>
    this.curricula.find((curriculum) => curriculum.id === this.selectedCurriculum())!,
  );
  readonly features = [
    $localize`:@@m_5e686ab66049:4 مواد دراسية`,
    $localize`:@@m_4fdaa3026c04:مادة إضافية هدية`,
    $localize`:@@m_eea6aa3b02f5:8 حصص لكل مادة`,
  ];

  constructor() {
    afterNextRender(() => this.pricing.detectDeviceTimeZone());
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      AOS.init({ duration: 800, once: true, mirror: false });
    }
  }

  getSubscribeLink(plan: PricingPlan): string {
    const curriculum = this.activeCurriculum().name;
    const stage = plan.name;
    const price = this.pricing.amount(plan.price);
    const currency = this.pricing.currencyLabel();
    const message = $localize`:@@pricingWhatsapp:السلام عليكم، أرغب في الاشتراك في باقة بسطهالي ${curriculum}:CURRICULUM:، ${stage}:STAGE:، بسعر ${price}:PRICE: ${currency}:CURRENCY:: 4 مواد + مادة هدية، و8 حصص لكل مادة.`;
    return `https://wa.me/971563306087?text=${encodeURIComponent(message)}`;
  }
}
