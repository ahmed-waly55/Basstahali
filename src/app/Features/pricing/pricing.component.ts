import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import * as AOS from 'aos';

export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  isPopular: boolean;
  buttonText: string;
  features: PlanFeature[];
}

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pricing.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './pricing.component.css',
})
export class PricingComponent implements OnInit {
  isAnnual = false;

  plans: PricingPlan[] = [
    {
      id: 'basic',
      name: 'الباقة الأساسية',
      description: 'مثالية للطلاب الراغبين في متابعة مادة واحدة والحل التفاعلي.',
      monthlyPrice: 149,
      annualPrice: 119,
      isPopular: false,
      buttonText: 'اشترك في الأساسية',
      features: [
        { text: 'الوصول لمادة دراسية واحدة من اختيارك', included: true },
        { text: 'جدول حصص أسبوعي وتنبيهات مخصصة', included: true },
        { text: 'رفع الواجبات والتصحيح الإلكتروني', included: true },
        { text: 'تقارير أداء دورية', included: false },
        { text: 'متابعة مباشرة مع معلم الخاص', included: false },
      ],
    },
    {
      id: 'pro',
      name: 'الباقة الشاملة',
      description: 'الباقة الأكثر اختياراً لمتابعة جميع المواد مع متابعة ولي الأمر.',
      monthlyPrice: 299,
      annualPrice: 239,
      isPopular: true,
      buttonText: 'اشترك في الباقة الشاملة',
      features: [
        { text: 'الوصول لكافة المواد والمناهج الدراسية', included: true },
        { text: 'جدول حصص ذكي مع إشعارات وتنبيهات', included: true },
        { text: 'رفع الواجبات وتصحيح فوري ملاحظات', included: true },
        { text: 'لوحة متابعة خاصة لولي الأمر وتقارير أداء', included: true },
        { text: 'حذف الإعلانات والوصول للمواد الإثرائية', included: true },
      ],
    },
    {
      id: 'vip',
      name: 'باقة التفوق (VIP)',
      description: 'تغطية شاملة بالإضافة لحصص تفاعلية فردية ومدرس خاص.',
      monthlyPrice: 499,
      annualPrice: 399,
      isPopular: false,
      buttonText: 'اشترك في باقة التفوق',
      features: [
        { text: 'جميع مميزات الباقة الشاملة بالكامل', included: true },
        { text: 'حصص مراجعة مباشرة خاصة قبل الامتحانات', included: true },
        { text: 'معلم خاص للرد على الاستفسارات 24/7', included: true },
        { text: 'نماذج امتحانات محلولة ومراجعات ليلة الامتحان', included: true },
        { text: 'جلسات استشارية دورية مع ولي الأمر', included: true },
      ],
    },
  ];

  ngOnInit(): void {
    AOS.init({
      duration: 800,
      once: true,
    });
  }

  toggleBilling() {
    this.isAnnual = !this.isAnnual;
  }

  getSubscribeLink(planName: string): string {
    const cycle = this.isAnnual ? 'السنوي' : 'الشهري';
    const message = encodeURIComponent(
      `السلام عليكم، أرغب في الاشتراك في ${planName} بالنظام ${cycle}.`,
    );
    return `https://wa.me/971525250833?text=${message}`;
  }
}
