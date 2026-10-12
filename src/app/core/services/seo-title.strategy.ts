import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

const pages: Record<string, [string, string]> = {
  '': ['بسطهالي | حصص أونلاين وشرح مبسط للمناهج الدراسية', 'بسطهالي منصة تعليمية أونلاين لشرح المناهج الخليجية، مع حصص مباشرة ومعلمين متخصصين ومتابعة تساعد الطلاب على الفهم والتفوق.'],
  about: ['عن بسطهالي | منصة تعليمية للمناهج الخليجية', 'تعرّف على بسطهالي ورسالتنا في تبسيط المناهج الدراسية وتقديم حصص أونلاين ومتابعة تعليمية للطلاب.'],
  curriculum: ['المناهج الدراسية | بسطهالي', 'استكشف المناهج الدراسية على بسطهالي واختر منهجك للوصول إلى المراحل والمواد الدراسية والحصص المناسبة لك.'],
  courses: ['الدورات والحصص التعليمية | بسطهالي', 'استكشف الدورات والحصص التعليمية على بسطهالي وتواصل معنا لاختيار الحصة المناسبة لاحتياجك الدراسي.'],
  teachers: ['المعلمون والحصص الأونلاين | بسطهالي', 'تعرّف على معلمي بسطهالي وتواصل معنا لحجز حصص تعليمية أونلاين تناسب منهجك ومرحلتك الدراسية.'],
  pricing: ['خطط الاشتراك والحصص | بسطهالي', 'تعرّف على خطط الاشتراك في بسطهالي واختر الحصص والمتابعة المناسبة لرحلتك التعليمية.'],
  features: ['مميزات منصة بسطهالي التعليمية', 'اكتشف مميزات بسطهالي في تبسيط الشرح والمتابعة التعليمية والتواصل مع المعلمين لدعم رحلة التعلم.'],
  contact: ['تواصل مع بسطهالي | الاستفسار عن الحصص', 'تواصل مع فريق بسطهالي للاستفسار عن المناهج والحصص الأونلاين والاشتراكات التعليمية.'],
  'teacher-form': ['انضم كمعلم إلى بسطهالي', 'قدّم طلب الانضمام إلى فريق معلمي بسطهالي وتابع حالة طلبك عبر المنصة.'],
};

@Injectable()
export class SeoTitleStrategy extends TitleStrategy {
  private document = inject(DOCUMENT);
  private title = inject(Title);
  private meta = inject(Meta);
  override updateTitle(snapshot: RouterStateSnapshot): void {
    const path = snapshot.url.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
    const section = path.split('/')[1] || '';
    let page = pages[section];
    if (section === 'curriculum' && path.split('/').length === 3) {
      page = ['المراحل الدراسية | بسطهالي', 'اختر المرحلة والصف الدراسي على بسطهالي للوصول إلى المواد الدراسية المناسبة لمنهجك.'];
    } else if (section === 'subjects' && path.split('/').length === 3) {
      page = ['المواد الدراسية | بسطهالي', 'استكشف مواد صفك الدراسي على بسطهالي وتواصل معنا للاستفسار عن الشروحات والحصص الأونلاين.'];
    }
    let leaf = snapshot.root;
    while (leaf.firstChild) leaf = leaf.firstChild;
    const notFound = leaf.routeConfig?.path === '**' || !page;
    const [title, description] = notFound ? ['الصفحة غير موجودة | بسطهالي', 'الصفحة المطلوبة غير موجودة. استكشف المناهج والحصص التعليمية على بسطهالي.'] : page;
    const url = 'https://www.basstahali.com' + path;
    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ name: 'robots', content: notFound ? 'noindex, follow' : 'index, follow' });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    let canonical = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) { canonical = this.document.createElement('link'); canonical.rel = 'canonical'; this.document.head.appendChild(canonical); }
    canonical.href = url;
    this.document.getElementById('page-breadcrumbs')?.remove();
    if (path !== '/' && !notFound) {
      const entries = [{ '@type': 'ListItem', position: 1, name: 'بسطهالي', item: 'https://www.basstahali.com/' }];
      if (section === 'subjects' || (section === 'curriculum' && path.split('/').length === 3)) {
        entries.push({ '@type': 'ListItem', position: 2, name: 'المناهج الدراسية', item: 'https://www.basstahali.com/curriculum' });
      }
      entries.push({ '@type': 'ListItem', position: entries.length + 1, name: title.split(' | ')[0], item: url });
      const script = this.document.createElement('script');
      script.id = 'page-breadcrumbs'; script.type = 'application/ld+json';
      script.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: entries }).replace(/</g, '\\u003c');
      this.document.head.appendChild(script);
    }
  }
}
