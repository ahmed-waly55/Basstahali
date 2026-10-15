import { PreferencesService } from '../../core/services/preferences.service';
import {
  LearningItem,
  learningItems,
} from '../../shared/components/learning-catalog/learning-catalog.component';
import {
  Component,
  ElementRef,
  OnInit,
  OnDestroy,
  ViewChild,
  inject,
  PLATFORM_ID,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HeroComponent } from '../hero/hero.component';
import { SectionHeaderComponent } from '../../shared/components/section-header/section-header.component';
import { EducationCardComponent } from '../../shared/components/education-card/education-card.component';
import AOS from 'aos';
import { TeacherService } from '../../core/services/teacher.service';
import { Subject, Subscription, takeUntil, timeout } from 'rxjs';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    HeroComponent,
    SectionHeaderComponent,
    EducationCardComponent,
    RouterLink,
  ],
  templateUrl: './landing.component.html',
  changeDetection: ChangeDetectionStrategy.Default,
  styleUrl: './landing.component.css',
})
export class LandingComponent implements OnInit, OnDestroy {
  readonly trialBookingLink =
    'https://wa.me/971563306087?text=' +
    encodeURIComponent(
      $localize`:@@landingTrialMessage:السلام عليكم، أرغب في حجز أول حصة تجريبية مجانية.`,
    );

  readonly messages = {
    m_cee8f138e31b: $localize`:@@m_cee8f138e31b:جارٍ التحميل...`,
    m_e0465a89fde9: $localize`:@@m_e0465a89fde9:تعذر تحميل البيانات`,
    m_c736c9f1496a: $localize`:@@m_c736c9f1496a:حاول مرة أخرى بعد التأكد من اتصالك بالإنترنت.`,
    m_2e47b5f289f1: $localize`:@@m_2e47b5f289f1:إعادة المحاولة`,
    m_4d255e9aaa04: $localize`:@@m_4d255e9aaa04:لا توجد مناهج متاحة`,
    m_4dc778bb0709: $localize`:@@m_4dc778bb0709:لماذا بسطهالي؟`,
    m_ef1f81cc2219: $localize`:@@m_ef1f81cc2219:كل ما يحتاجه الطالب...`,
    m_149eab48f8d5: $localize`:@@m_149eab48f8d5:في مكان واحد`,
    m_bc25e99f9ae0: $localize`:@@m_bc25e99f9ae0:منصة متكاملة تساعد الطالب وولي الأمر على متابعة العملية التعليمية بسهولة.`,
    m_df67c0ff5d15: $localize`:@@m_df67c0ff5d15:جدول الحصص`,
    m_3196feca54ae: $localize`:@@m_3196feca54ae:تنظيم كامل للحصص والمواعيد.`,
    m_cc40179ce00c: $localize`:@@m_cc40179ce00c:إشعارات ذكية`,
    m_8d63fdbb70ec: $localize`:@@m_8d63fdbb70ec:تنبيهات قبل الحصص والواجبات.`,
    m_2dca077cc935: $localize`:@@m_2dca077cc935:رفع الواجبات`,
    m_fe7466316c5b: $localize`:@@m_fe7466316c5b:رفع سريع وسهل للواجبات.`,
    m_10bd43535d5c: $localize`:@@m_10bd43535d5c:تصحيح إلكتروني`,
    m_7cb12f66df00: $localize`:@@m_7cb12f66df00:تصحيح فوري مع ملاحظات المعلم.`,
    m_93253eaf4991: $localize`:@@m_93253eaf4991:متابعة ولي الأمر`,
    m_81e5a00e0c5a: $localize`:@@m_81e5a00e0c5a:متابعة مستمرة لمستوى الأبناء.`,
    m_a2991806009f: $localize`:@@m_a2991806009f:تقارير الأداء`,
    m_4c202b92e8cc: $localize`:@@m_4c202b92e8cc:تحليل كامل لتقدم الطالب.`,
    m_7127659cb735: $localize`:@@m_7127659cb735:🎁 عرض لفترة محدودة`,
    m_6dc1b1365af6: $localize`:@@m_6dc1b1365af6:جرّب أول حصة`,
    m_fb97e075faae: $localize`:@@m_fb97e075faae:مجانًا`,
    m_14e4a20dfd7c: $localize`:@@m_14e4a20dfd7c:احجز حصتك التجريبية المجانية وتعرّف على أسلوب الشرح قبل الاشتراك.`,
    m_8f7716d77474: $localize`:@@m_8f7716d77474:احجز الآن عبر واتساب`,
    m_84a67ee91b0f: $localize`:@@m_84a67ee91b0f:كيف تبدأ معنا؟`,
    m_9602e81690c9: $localize`:@@m_9602e81690c9:ابدأ رحلتك التعليمية في`,
    m_5324c02ad8af: $localize`:@@m_5324c02ad8af:4 خطوات`,
    m_29499543fd3e: $localize`:@@m_29499543fd3e:التسجيل في منصة بسطهالي لا يستغرق سوى دقائق قليلة، لتنطلق بعدها في تجربة تعليمية سلسة وممتعة.`,
    m_e27bdf84c680: $localize`:@@m_e27bdf84c680:أنشئ حسابك`,
    m_bdc93726daf6: $localize`:@@m_bdc93726daf6:قم بإنشاء حسابك الجديد بسهولة أو اطلب التسجيل المباشر عبر خدمة الواتساب.`,
    m_3d2fb6a4d73c: $localize`:@@m_3d2fb6a4d73c:اختر المنهج`,
    m_7016c886ae15: $localize`:@@m_7016c886ae15:حدد الدولة، المنهج، والمرحلة الدراسية لتظهر لك الدروس والمواد المخصصة لك.`,
    m_67f49e701485: $localize`:@@m_67f49e701485:فعّل اشتراكك`,
    m_67cf62749c77: $localize`:@@m_67cf62749c77:اختر الباقة المناسبة لاحتياجاتك وأكمل عملية الاشتراك بخطوات آمنة وسريعة.`,
    m_e04f5380ec6a: $localize`:@@m_e04f5380ec6a:ابدأ التعلم`,
    m_df5c55d4e104: $localize`:@@m_df5c55d4e104:شاهد الشروحات التفاعلية، احضر الحصص، وأنجز الواجبات بسهولة للتفوق.`,
    m_8dc5631ffac6: $localize`:@@m_8dc5631ffac6:سجل حسابك الآن عبر الواتساب`,
    m_526d124bec7b: $localize`:@@m_526d124bec7b:شرح واضح، مواعيد مرتبة ومتابعة للدروس؛ تفاصيل تهمك كولي أمر.`,
    m_d0c08f94b14b: $localize`:@@m_d0c08f94b14b:تواصل معنا على واتساب`,
    m_4c00a66d7eae: $localize`:@@m_4c00a66d7eae:نحن هنا لمساعدتك والإجابة على استفساراتك`,
    m_988638232136: $localize`:@@m_988638232136:تواصل معنا`,
    m_48b4fb1a68d2: $localize`:@@m_48b4fb1a68d2:المناهج الدراسية و الكورسات`,
    m_173cce3ff639: $localize`:@@m_173cce3ff639:المنهج الدراسي`,
    m_33dca1b609ba: $localize`:@@m_33dca1b609ba:جميع المراحل الدراسية وفق أفضل المناهج مع نخبة من المدرسين.`,
    m_5b82b7079a31: $localize`:@@m_5b82b7079a31:الكورسات`,
    m_a73730be0c2b: $localize`:@@m_a73730be0c2b:كورسات في اللغات، البرمجة، المهارات، والمواد الإثرائية لجميع الأعمار.`,
    m_733f81a21615: $localize`:@@m_733f81a21615:مميزات المنصة`,
    m_70b341c96b9c: $localize`:@@m_70b341c96b9c:بسطهالي`,
    m_4df49eb87a01: $localize`:@@m_4df49eb87a01:ماذا يقول طلابنا؟`,
    m_a784688c7932: $localize`:@@m_a784688c7932:عرض الآراء السابقة`,
    m_0926efa89f4b: $localize`:@@m_0926efa89f4b:عرض الآراء التالية`,
    parentFeedbackIllustrativeLabel: $localize`:@@parentFeedbackIllustrativeLabel:مثال توضيحي، وليس شهادة فعلية`,
  };

  preferences = inject(PreferencesService);
  @ViewChild('sliderTrack') sliderTrack!: ElementRef<HTMLDivElement>;

  private teacherService = inject(TeacherService);
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>(); // Subject لإيقاف الاشتراكات
  private curriculaRequest?: Subscription;

  autoPlayInterval: any;
  scrollStep = 300;

  curriculaList: LearningItem[] = [];
  curriculaLoading = true;
  curriculaFailed = false;

  readonly testimonials = [
    {
      id: 1,
      quote: $localize`:@@parentFeedbackMohammed:الحمد لله محمد مبسوط، وغدًا بإذن الله نتفق على الرياضيات والأحياء.`,
      name: $localize`:@@parentMotherMohammed:أم محمد`,
      role: $localize`:@@parentFeedbackRole:ولية أمر`,
      isIllustrative: false,
    },
    {
      id: 2,
      quote: $localize`:@@parentFeedbackMaha:وايد مشكورين على الحصة، معلمة مها مثل العسل ما شاء الله.`,
      name: $localize`:@@parentMotherHarib:أم حارب`,
      role: $localize`:@@parentFeedbackRole:ولية أمر`,
      isIllustrative: false,
    },
    {
      id: 3,
      quote: $localize`:@@parentFeedbackRakan:راكان كان مبسوط مع المهندسة.`,
      name: $localize`:@@parentMotherRakan:أم راكان`,
      role: $localize`:@@parentFeedbackRole:ولية أمر`,
      isIllustrative: false,
    },
    {
      id: 4,
      quote: $localize`:@@parentDraftHamdanQuote:وايد مشكورين، المعلمة ما قصّرت وشرحها واضح، الله يعطيها العافية.`,
      name: $localize`:@@parentDraftHamdanName:أم حمدان`,
      isIllustrative: true,
    },
    {
      id: 5,
      quote: $localize`:@@parentDraftLilyQuote:الحمد لله كانت مرتاحة في الحصة، وقدرت تسأل عن اللي ما فهمته.`,
      name: $localize`:@@parentDraftLilyName:أم لي لي`,
      isIllustrative: true,
    },
    {
      id: 6,
      quote: $localize`:@@parentDraftHalaQuote:شرح المهندسة حلو وبهدوء، يعطيكم العافية.`,
      name: $localize`:@@parentDraftHalaName:أم حلا`,
      isIllustrative: true,
    },
    {
      id: 7,
      quote: $localize`:@@parentDraftMohammedQuote:مشكورين على ترتيب الموعد، الوقت كان مناسب لنا.`,
      name: $localize`:@@parentDraftMohammedName:محمد`,
      isIllustrative: true,
    },
    {
      id: 8,
      quote: $localize`:@@parentDraftMariamQuote:ما قصّرتوا في الرد والمتابعة، جزاكم الله خير.`,
      name: $localize`:@@parentDraftMariamName:مريم علي`,
      isIllustrative: true,
    },
  ];

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      AOS.init({
        duration: 700,
        once: true,
        mirror: false,
        offset: 100,
        easing: 'ease-in-out',
      });

      if (
        typeof window.matchMedia !== 'function' ||
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      )
        this.startAutoPlay();
    }

    this.fetchCurricula();
  }

  // تنفيذ الـ ngOnDestroy وإغلاق الاشتراكات بداخلها لتنظيف الذاكرة
  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.stopAutoPlay();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  fetchCurricula(): void {
    this.curriculaRequest?.unsubscribe();
    this.curriculaLoading = true;
    this.curriculaFailed = false;
    this.curriculaList = [];
    this.cdr.markForCheck();
    this.curriculaRequest = this.teacherService
      .getCurricula()
      .pipe(timeout(12000), takeUntil(this.destroy$)) // ربط الاشتراك بـ destroy$ لإلغائه عند الخروج من الصفحة
      .subscribe({
        next: (response) => {
          this.curriculaList = learningItems(response);
          this.curriculaLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.curriculaFailed = true;
          this.curriculaLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  onSelectCurriculum(curriculumId: string): void {
    if (curriculumId) {
      this.router.navigate(['/curriculum', curriculumId]);
    } else {
      this.router.navigate(['/courses']);
    }
  }

  startAutoPlay(): void {
    this.stopAutoPlay();
    this.autoPlayInterval = setInterval(() => {
      this.scrollLeft();
    }, 3500);
  }

  stopAutoPlay(): void {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
    }
  }

  scrollLeft(): void {
    if (!this.sliderTrack) return;
    const el = this.sliderTrack.nativeElement;

    if (Math.abs(el.scrollLeft) + el.clientWidth >= el.scrollWidth - 15) {
      el.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      const direction = this.preferences.language() === 'ar' ? -1 : 1;
      el.scrollBy({ left: direction * this.scrollStep, behavior: 'smooth' });
    }
  }

  scrollRight(): void {
    if (!this.sliderTrack) return;
    const el = this.sliderTrack.nativeElement;

    if (Math.abs(el.scrollLeft) <= 15) {
      const direction = this.preferences.language() === 'ar' ? -1 : 1;
      el.scrollTo({ left: direction * el.scrollWidth, behavior: 'smooth' });
    } else {
      const direction = this.preferences.language() === 'ar' ? -1 : 1;
      el.scrollBy({ left: -direction * this.scrollStep, behavior: 'smooth' });
    }
  }
}
