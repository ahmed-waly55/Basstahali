import { DOCUMENT } from '@angular/common';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RouterStateSnapshot } from '@angular/router';
import { SeoTitleStrategy } from './seo-title.strategy';

describe('SEO metadata', () => {
  function snapshot(url: string, path: string) {
    return {
      url,
      root: { firstChild: null, routeConfig: { path } },
    } as unknown as RouterStateSnapshot;
  }

  function configure(locale = 'ar') {
    TestBed.configureTestingModule({
      providers: [SeoTitleStrategy, { provide: LOCALE_ID, useValue: locale }],
    });
  }

  it('uses a page-specific canonical without query parameters and replaces breadcrumbs', () => {
    configure();
    const seo = TestBed.inject(SeoTitleStrategy);
    const doc = TestBed.inject(DOCUMENT);
    seo.updateTitle(snapshot('/curriculum/abc?source=test', 'curriculum/:id'));
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://www.basstahali.com/curriculum/abc',
    );
    expect(doc.title).toBe('المراحل الدراسية | بسطهالي');
    seo.updateTitle(snapshot('/contact', 'contact'));
    expect(doc.querySelectorAll('#page-breadcrumbs').length).toBe(1);
    expect(doc.querySelector('meta[name="description"]')?.getAttribute('content')).toContain(
      'تواصل',
    );
  });
  it('keeps missing pages out of the index and restores indexing after navigation', () => {
    configure();
    const seo = TestBed.inject(SeoTitleStrategy);
    const doc = TestBed.inject(DOCUMENT);
    seo.updateTitle(snapshot('/missing', '**'));
    expect(doc.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
      'noindex, follow',
    );
    expect(doc.querySelector('link[hreflang]')).toBeNull();
    seo.updateTitle(snapshot('/', ''));
    expect(doc.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('index, follow');
    expect(doc.querySelector('#page-breadcrumbs')).toBeNull();
    expect(doc.querySelectorAll('link[hreflang]').length).toBe(3);
  });

  for (const [path, title] of [
    ['privacy', 'سياسة الخصوصية'],
    ['terms', 'الشروط والأحكام'],
  ]) {
    it(`indexes the ${path} page with its own title and canonical`, () => {
      configure();
      const seo = TestBed.inject(SeoTitleStrategy);
      const doc = TestBed.inject(DOCUMENT);
      seo.updateTitle(snapshot(`/${path}?source=footer#section`, path));
      expect(doc.title).toBe(`${title} | بسطهالي`);
      expect(doc.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
        'index, follow',
      );
      expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
        `https://www.basstahali.com/${path}`,
      );
      expect(doc.querySelector('#page-breadcrumbs')?.textContent).toContain(title);
    });
  }

  for (const locale of ['ar', 'en']) {
    it(`advertises both languages and keeps ${locale} canonicals and breadcrumb URLs together`, () => {
      configure(locale);
      const seo = TestBed.inject(SeoTitleStrategy);
      const doc = TestBed.inject(DOCUMENT);
      seo.updateTitle(snapshot('/subjects/grade-123?campaign=example#materials', 'subjects/:id'));
      const origin = 'https://www.basstahali.com';
      const home = `${origin}${locale === 'en' ? '/en/' : '/'}`;
      const canonical = `${origin}${locale === 'en' ? '/en' : ''}/subjects/grade-123`;
      expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(canonical);
      expect(doc.querySelector('meta[property="og:url"]')?.getAttribute('content')).toBe(canonical);
      expect(doc.querySelector('meta[property="og:locale"]')?.getAttribute('content')).toBe(
        locale === 'en' ? 'en_US' : 'ar_AE',
      );
      expect(doc.querySelector('link[hreflang="ar"]')?.getAttribute('href')).toBe(
        `${origin}/subjects/grade-123`,
      );
      expect(doc.querySelector('link[hreflang="en"]')?.getAttribute('href')).toBe(
        `${origin}/en/subjects/grade-123`,
      );
      expect(doc.querySelector('link[hreflang="x-default"]')?.getAttribute('href')).toBe(
        `${origin}/subjects/grade-123`,
      );
      const breadcrumbs = JSON.parse(doc.querySelector('#page-breadcrumbs')!.textContent!);
      expect(breadcrumbs.itemListElement.map((entry: { item: string }) => entry.item)).toEqual([
        home,
        `${home}curriculum`,
        canonical,
      ]);
      seo.updateTitle(snapshot('/pricing', 'pricing'));
      expect(doc.querySelectorAll('link[hreflang]').length).toBe(3);
    });
  }

  it('uses one English prefix and a stable English home URL', () => {
    configure('en-US');
    const seo = TestBed.inject(SeoTitleStrategy);
    const doc = TestBed.inject(DOCUMENT);
    seo.updateTitle(snapshot('/en/privacy/', 'privacy'));
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://www.basstahali.com/en/privacy',
    );
    seo.updateTitle(snapshot('/en/', ''));
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://www.basstahali.com/en/',
    );
    expect(doc.querySelector('#page-breadcrumbs')).toBeNull();
  });
});
