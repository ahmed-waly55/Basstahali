import { DOCUMENT } from '@angular/common';
import { inject, Injectable, LOCALE_ID } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

const pageMetadata: Record<string, () => [string, string]> = {
  login: () => [
    $localize`:@@authLoginSeoTitle:تسجيل الدخول | بسطهالي`,
    $localize`:@@authLoginSeoDescription:سجّل الدخول إلى حساب الطالب في بسطهالي لمتابعة حصصك وكورساتك وواجباتك.`,
  ],
  student: () => [
    $localize`:@@studentDashboardSeoTitle:لوحة الطالب | بسطهالي`,
    $localize`:@@studentDashboardSeoDescription:مساحتك لمتابعة الحصص والكورسات والواجبات والاختبارات والتواصل مع المعلمين على بسطهالي.`,
  ],
  '': () => [
    $localize`:@@m_f12f3ea7ff7d:بسطهالي | حصص أونلاين وشرح مبسط للمناهج الدراسية`,
    $localize`:@@m_15abae32d48b:بسطهالي منصة تعليمية أونلاين لشرح المناهج الخليجية، مع حصص مباشرة ومعلمين متخصصين ومتابعة تساعد الطلاب على الفهم والتفوق.`,
  ],
  about: () => [
    $localize`:@@m_7f11203def7a:عن بسطهالي | منصة تعليمية للمناهج الخليجية`,
    $localize`:@@m_a356a56cde09:تعرّف على بسطهالي ورسالتنا في تبسيط المناهج الدراسية وتقديم حصص أونلاين ومتابعة تعليمية للطلاب.`,
  ],
  curriculum: () => [
    $localize`:@@m_bc12097aab75:المناهج الدراسية | بسطهالي`,
    $localize`:@@m_13a48af1623b:استكشف المناهج الدراسية على بسطهالي واختر منهجك للوصول إلى المراحل والمواد الدراسية والحصص المناسبة لك.`,
  ],
  courses: () => [
    $localize`:@@coursesSeoTitle:كورسات اللغات والبرمجة والماث | بسطهالي`,
    $localize`:@@coursesSeoDescription:كورسات الإنجليزية والألمانية والإيطالية والفرنسية والعربية والبرمجة والماث مع بسطهالي، في حصص مباشرة أونلاين بأسعار تبدأ من 5000 جنيه مصري. احجز عبر واتساب.`,
  ],
  teachers: () => [
    $localize`:@@m_0427fec64ea7:المعلمون والحصص الأونلاين | بسطهالي`,
    $localize`:@@m_49645387dc69:تعرّف على معلمي بسطهالي وتواصل معنا لحجز حصص تعليمية أونلاين تناسب منهجك ومرحلتك الدراسية.`,
  ],
  pricing: () => [
    $localize`:@@m_ec1f5a01a8eb:باقات الحصص للمنهج الانترناشونال والوزاري | بسطهالي`,
    $localize`:@@m_1278d3c02b66:باقات بسطهالي للمنهج الانترناشونال والوزاري: 4 مواد ومادة هدية، و8 حصص لكل مادة، بأسعار تبدأ من 640 درهم إماراتي. اشترك مباشرة عبر واتساب.`,
  ],
  features: () => [
    $localize`:@@m_bec6ce12f4dc:مميزات منصة بسطهالي التعليمية`,
    $localize`:@@m_3011e3c6829c:اكتشف مميزات بسطهالي في تبسيط الشرح والمتابعة التعليمية والتواصل مع المعلمين لدعم رحلة التعلم.`,
  ],
  contact: () => [
    $localize`:@@m_d9ccfb4b572f:تواصل مع بسطهالي | الاستفسار عن الحصص`,
    $localize`:@@m_e5add1196391:تواصل مع فريق بسطهالي للاستفسار عن المناهج والحصص الأونلاين والاشتراكات التعليمية.`,
  ],
  privacy: () => [
    $localize`:@@m_55ac61564737:سياسة الخصوصية | بسطهالي`,
    $localize`:@@m_0e99ada47889:تعرّف على بيانات التسجيل والتواصل وتفضيلات اللغة والمظهر في بسطهالي، والخدمات الخارجية وطرق التواصل بشأن خصوصيتك.`,
  ],
  terms: () => [
    $localize`:@@m_dd16c0c56bb1:الشروط والأحكام | بسطهالي`,
    $localize`:@@m_0655c0c1e36f:اطّلع على شروط استخدام بسطهالي والحصص الأونلاين، وتفاصيل الاشتراك والتواصل بشأن المواعيد والإلغاء والمتابعة.`,
  ],
  'teacher-form': () => [
    $localize`:@@m_70ae199b58d2:انضم كمعلم إلى بسطهالي`,
    $localize`:@@m_439ac974363a:قدّم طلب الانضمام إلى فريق معلمي بسطهالي وتابع حالة طلبك عبر المنصة.`,
  ],
};

@Injectable()
export class SeoTitleStrategy extends TitleStrategy {
  private readonly document = inject(DOCUMENT);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly english = inject(LOCALE_ID).startsWith('en');
  private readonly origin = 'https://www.basstahali.com';

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const path = snapshot.url.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
    const section = path.split('/')[1] || '';
    let page = pageMetadata[section]?.();
    if (section === 'curriculum' && path.split('/').length === 3) {
      page = [
        $localize`:@@m_f8a6a577545b:المراحل الدراسية | بسطهالي`,
        $localize`:@@m_59354bda7c94:اختر المرحلة والصف الدراسي على بسطهالي للوصول إلى المواد الدراسية المناسبة لمنهجك.`,
      ];
    } else if (section === 'subjects' && path.split('/').length === 3) {
      page = [
        $localize`:@@m_c14ab189dff7:المواد الدراسية | بسطهالي`,
        $localize`:@@m_17b9403cb86c:استكشف مواد صفك الدراسي على بسطهالي وتواصل معنا للاستفسار عن الشروحات والحصص الأونلاين.`,
      ];
    }
    let leaf = snapshot.root;
    while (leaf.firstChild) leaf = leaf.firstChild;
    const notFound = leaf.routeConfig?.path === '**' || !page;
    const privatePage = section === 'student' || section === 'login';
    const [title, description] = notFound
      ? [
          $localize`:@@m_df57cf4af71a:الصفحة غير موجودة | بسطهالي`,
          $localize`:@@m_cb26f571b00c:الصفحة المطلوبة غير موجودة. استكشف المناهج والحصص التعليمية على بسطهالي.`,
        ]
      : page;
    const url = this.origin + path;
    const homeUrl = this.origin + '/';

    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({
      name: 'robots',
      content: privatePage ? 'noindex, nofollow' : notFound ? 'noindex, follow' : 'index, follow',
    });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:locale', content: this.english ? 'en_US' : 'ar_AE' });
    this.document
      .querySelectorAll('meta[property="og:locale:alternate"]')
      .forEach((tag) => tag.remove());
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    let canonical = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = this.document.createElement('link');
      canonical.rel = 'canonical';
      this.document.head.appendChild(canonical);
    }
    canonical.href = url;

    this.document
      .querySelectorAll('link[rel="alternate"][hreflang]')
      .forEach((link) => link.remove());

    this.document.getElementById('page-breadcrumbs')?.remove();
    if (path !== '/' && !notFound && !privatePage) {
      const entries = [
        {
          '@type': 'ListItem',
          position: 1,
          name: $localize`:@@m_70b341c96b9c:بسطهالي`,
          item: homeUrl,
        },
      ];
      if (section === 'subjects' || (section === 'curriculum' && path.split('/').length === 3)) {
        entries.push({
          '@type': 'ListItem',
          position: 2,
          name: $localize`:@@m_1ea7464560c3:المناهج الدراسية`,
          item: homeUrl + 'curriculum',
        });
      }
      entries.push({
        '@type': 'ListItem',
        position: entries.length + 1,
        name: title.split(' | ')[0],
        item: url,
      });
      const script = this.document.createElement('script');
      script.id = 'page-breadcrumbs';
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: entries,
      }).replace(/</g, '\\u003c');
      this.document.head.appendChild(script);
    }
  }
}
