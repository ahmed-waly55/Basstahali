import {
  Component,
  OnInit,
  AfterViewInit,
  ChangeDetectionStrategy,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import AOS from 'aos';

@Component({
  selector: 'app-features',
  imports: [],
  templateUrl: './features.component.html',
  changeDetection: ChangeDetectionStrategy.Default,
  styleUrl: './features.component.css',
})
export class FeaturesComponent implements OnInit, AfterViewInit {
  readonly messages = {
    m_3e2613344fbb: $localize`:@@m_3e2613344fbb:✨ مميزات المنصة`,
    m_2289557b218d: $localize`:@@m_2289557b218d:تعلم بطريقة`,
    m_8294fdc18a04: $localize`:@@m_8294fdc18a04:حديثة وذكية`,
    m_3b74128c572d: $localize`:@@m_3b74128c572d:منصة متكاملة تساعدك على الدراسة بسهولة مع أفضل الأدوات التعليمية.`,
    m_873fb428db5d: $localize`:@@m_873fb428db5d:حصص مباشرة`,
    m_27ffc1784766: $localize`:@@m_27ffc1784766:تابع الحصص مع معلمك مباشرة وتفاعل أثناء الشرح.`,
    m_83553bb62e39: $localize`:@@m_83553bb62e39:الواجبات والاختبارات`,
    m_98d37e226f0f: $localize`:@@m_98d37e226f0f:تطبيقات وواجبات تفاعلية بعد كل درس للتأكد من فهمك للأنشطة.`,
    m_0dbdbfbe4184: $localize`:@@m_0dbdbfbe4184:أسعار مميزة`,
    m_2b35a9f797f9: $localize`:@@m_2b35a9f797f9:اشتراكات وأسعار تنافسية تناسب الجميع مع باقات توفيرية مختلفة.`,
    m_b96bdff59215: $localize`:@@m_b96bdff59215:إعادة مشاهدة الدروس`,
    m_d5bd81c94107: $localize`:@@m_d5bd81c94107:يمكنك مراجعة الدرس أكثر من مرة في أي وقت يناسبك.`,
    m_77e71c2d7cba: $localize`:@@m_77e71c2d7cba:متابعة الأداء`,
    m_3dc492fe034a: $localize`:@@m_3dc492fe034a:تقارير دورية توضح مستواك وتساعدك على التطور المستمر.`,
    m_96eec79d41e9: $localize`:@@m_96eec79d41e9:تجربة تعليمية احترافية`,
    m_2dbd66a10c32: $localize`:@@m_2dbd66a10c32:كل ما تحتاجه داخل مكان واحد لتبدأ رحلتك التعليمية بثقة.`,
    m_ed8bdd1c116a: $localize`:@@m_ed8bdd1c116a:⭐ لماذا تختار بسطهالي؟`,
    m_239b3af2cb54: $localize`:@@m_239b3af2cb54:أكثر من مجرد`,
    m_0591fbe12437: $localize`:@@m_0591fbe12437:منصة تعليمية`,
    m_fc9b9b9f1159: $localize`:@@m_fc9b9b9f1159:نوفر لك بيئة تعليمية متكاملة تجمع بين الجودة، السهولة، والتقنيات الحديثة لتجعل التعلم أكثر متعة وفاعلية.`,
    m_0351acf03aef: $localize`:@@m_0351acf03aef:محتوى منظم`,
    m_0f212632a5f9: $localize`:@@m_0f212632a5f9:كل شيء مرتب لتصل للمعلومة بسرعة.`,
    m_ce201836cbdc: $localize`:@@m_ce201836cbdc:خطط أسعار مرنة`,
    m_909668fb0616: $localize`:@@m_909668fb0616:باقات تناسب ميزانيتك مع إمكانية التجديد والشراء بسهولة.`,
    m_2f7c58b3ce2a: $localize`:@@m_2f7c58b3ce2a:نتائج أفضل`,
    m_0e279d290714: $localize`:@@m_0e279d290714:ساعد نفسك على تحقيق أفضل أداء باستمرار.`,
  };

  private platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true,
        mirror: false,
        offset: 120,
      });
    }
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        AOS.refresh();
      }, 300);
    }
  }
}
