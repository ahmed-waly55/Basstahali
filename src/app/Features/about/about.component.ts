import { PreferencesService } from '../../core/services/preferences.service';
import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  inject,
  PLATFORM_ID,
  ChangeDetectionStrategy,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import AOS from 'aos';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [],
  templateUrl: './about.component.html',
  changeDetection: ChangeDetectionStrategy.Default,
  styleUrl: './about.component.css',
})
export class AboutComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly messages = {
    m_550e1a6e8428: $localize`:@@m_550e1a6e8428:منصة تعليمية عربية`,
    m_629d28fb5255: $localize`:@@m_629d28fb5255:من نحن`,
    m_aef2099d8967: $localize`:@@m_aef2099d8967:في`,
    m_70b341c96b9c: $localize`:@@m_70b341c96b9c:بسطهالي`,
    m_ce66c330dee6: $localize`:@@m_ce66c330dee6:نؤمن أن التعلم يجب أن يكون بسيطًا، ممتعًا، ومتوافقًا مع احتياجات كل طالب، لذلك نسعى لبناء تجربة تعليمية حديثة تجمع بين التكنولوجيا وأفضل المعلمين في مكان واحد.`,
    m_b3ab54d33323: $localize`:@@m_b3ab54d33323:قصتنا`,
    m_64334b87da19: $localize`:@@m_64334b87da19:بدأت الفكرة من معاناة الطلاب`,
    m_ca3d1135c158: $localize`:@@m_ca3d1135c158:جاءت فكرة`,
    m_c57df5bd49a6: $localize`:@@m_c57df5bd49a6:من رغبة حقيقية في تقديم تجربة تعليمية مختلفة. لاحظنا أن الكثير من الطلاب يواجهون صعوبة في الوصول إلى محتوى تعليمي منظم، ومدرسين متميزين، ومتابعة مستمرة لمستواهم الدراسي، مما يجعل رحلة التعلم أكثر تعقيدًا.`,
    m_b95e1c7f056d: $localize`:@@m_b95e1c7f056d:لذلك أنشأنا منصة تجمع كل ما يحتاجه الطالب في مكان واحد، بدايةً من الدروس التعليمية والواجبات والاختبارات وحتى متابعة الأداء، لنساعد الطلاب على التعلم بطريقة أسهل، وأكثر تنظيمًا، وأكثر فاعلية.`,
    m_c1b8105ad1f9: $localize`:@@m_c1b8105ad1f9:تعلم أسهل`,
    m_b5e97a869b82: $localize`:@@m_b5e97a869b82:محتوى تعليمي منظم وواضح يساعد الطالب على الفهم بسرعة.`,
    m_1f782c0ec747: $localize`:@@m_1f782c0ec747:متابعة ذكية`,
    m_045139e887f0: $localize`:@@m_045139e887f0:تقارير وإحصائيات دقيقة لمتابعة مستوى الطالب أولًا بأول.`,
    m_2f7c58b3ce2a: $localize`:@@m_2f7c58b3ce2a:نتائج أفضل`,
    m_2fe6c081ea45: $localize`:@@m_2fe6c081ea45:أدوات تعليمية حديثة تساعد الطالب على تحقيق أفضل النتائج.`,
    m_575e2332b05e: $localize`:@@m_575e2332b05e:رؤيتنا ورسالتنا`,
    m_118d336b7441: $localize`:@@m_118d336b7441:نبني مستقبل التعليم الرقمي`,
    m_3ad3619602bd: $localize`:@@m_3ad3619602bd:نسعى لتقديم تجربة تعليمية متكاملة تساعد الطلاب على التعلم بسهولة، وتمكن المعلمين من تقديم محتوى تعليمي متميز داخل بيئة رقمية حديثة.`,
    m_fe1ccd2ebf31: $localize`:@@m_fe1ccd2ebf31:رؤيتنا`,
    m_41c4e99d5744: $localize`:@@m_41c4e99d5744:أن تصبح`,
    m_f24aff809eda: $localize`:@@m_f24aff809eda:المنصة التعليمية الأولى في الوطن العربي، من خلال تقديم تجربة تعلم حديثة تعتمد على التكنولوجيا، وتوفر محتوى تعليمي عالي الجودة يناسب جميع الطلاب.`,
    m_9c36679ec227: $localize`:@@m_9c36679ec227:رسالتنا`,
    m_beb4d0cd6e70: $localize`:@@m_beb4d0cd6e70:تمكين الطلاب من الوصول إلى تعليم متميز في أي وقت ومن أي مكان، مع توفير أدوات ذكية تساعدهم على التطور، وتمكن المعلمين من متابعة تقدم طلابهم بسهولة.`,
    m_733f81a21615: $localize`:@@m_733f81a21615:مميزات المنصة`,
    m_f23766d56fb0: $localize`:@@m_f23766d56fb0:لماذا يختارنا الطلاب؟`,
    m_76911024e48e: $localize`:@@m_76911024e48e:لأننا نوفر تجربة تعليمية متكاملة تجمع بين جودة المحتوى، سهولة الاستخدام، والمتابعة المستمرة لتحقيق أفضل النتائج.`,
    m_fcaf4653205b: $localize`:@@m_fcaf4653205b:دروس بجودة عالية`,
    m_e4175debe428: $localize`:@@m_e4175debe428:محتوى احترافي مقدم بواسطة نخبة من أفضل المعلمين مع شرح مبسط يناسب جميع المستويات.`,
    m_76730e1a40ba: $localize`:@@m_76730e1a40ba:اختبارات تفاعلية`,
    m_015618f508bc: $localize`:@@m_015618f508bc:اختبارات ذكية تساعد الطالب على قياس مستواه والحصول على نتائج فورية مع تحليل الأداء.`,
    m_77e71c2d7cba: $localize`:@@m_77e71c2d7cba:متابعة الأداء`,
    m_bb07c2c47a4d: $localize`:@@m_bb07c2c47a4d:تقارير وإحصائيات دقيقة لمتابعة تقدم الطالب ومعرفة نقاط القوة والجوانب التي تحتاج إلى تطوير.`,
    m_7d6b273c6b53: $localize`:@@m_7d6b273c6b53:نخبة من المعلمين`,
    m_8d246f28bb70: $localize`:@@m_8d246f28bb70:فريق من المعلمين ذوي الخبرة يقدمون محتوى تعليمي متميز يساعد الطلاب على تحقيق أفضل النتائج.`,
    m_90b224ff944b: $localize`:@@m_90b224ff944b:الأسئلة الشائعة`,
    m_9f5d9ed75f12: $localize`:@@m_9f5d9ed75f12:كل ما تريد معرفته عن بسطهالي`,
    m_1e723c79a7d7: $localize`:@@m_1e723c79a7d7:إذا لم تجد إجابة لسؤالك يمكنك التواصل مع فريق الدعم في أي وقت.`,
  };

  readonly preferences = inject(PreferencesService);
  private platformId = inject(PLATFORM_ID);

  private refreshTimer?: ReturnType<typeof setTimeout>;
  openedFaq = 0;

  faqs = [
    {
      question: $localize`:@@m_98df5c78e7dd:ما هي منصة بسطهالي؟`,
      answer: $localize`:@@m_0a5d67f04d14:بسطهالي هي منصة تعليمية إلكترونية تقدم الدروس والواجبات والاختبارات التفاعلية لمساعدة الطلاب على تحسين مستواهم الدراسي.`,
    },
    {
      question: $localize`:@@m_590e36a6c427:هل يمكنني الدراسة من الهاتف المحمول؟`,
      answer: $localize`:@@m_c4d22165438e:نعم، يمكنك استخدام المنصة من الهاتف أو الجهاز اللوحي أو الكمبيوتر.`,
    },
    {
      question: $localize`:@@m_6210bf4bb967:هل جميع المواد الدراسية متوفرة؟`,
      answer: $localize`:@@m_e0d2612f5e85:نوفر المواد الدراسية حسب المنهج والصف الدراسي ويتم إضافة محتوى جديد باستمرار.`,
    },
    {
      question: $localize`:@@m_326ad6d38abc:كيف أتابع تقدمي الدراسي؟`,
      answer: $localize`:@@m_2a51fa2be112:توفر المنصة تقارير وإحصائيات توضح نتائج الاختبارات والواجبات ومستوى التقدم.`,
    },
    {
      question: $localize`:@@m_e68bf79615f2:هل يمكن لولي الأمر متابعة الطالب؟`,
      answer: $localize`:@@m_bbc6465028fa:نعم، يمكن لولي الأمر متابعة مستوى الطالب ونتائجه والاطلاع على التقارير.`,
    },
  ];

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      AOS.init({
        duration: 900,
        once: true,
        offset: 120,
        easing: 'ease-out-cubic',
        mirror: false,
      });
    }
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.refreshTimer = setTimeout(() => {
        AOS.refresh();
      }, 100);
    }
  }

  ngOnDestroy(): void {
    clearTimeout(this.refreshTimer);
  }

  toggleFaq(index: number): void {
    this.openedFaq = this.openedFaq === index ? -1 : index;
  }
}
