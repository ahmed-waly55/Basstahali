import { DOCUMENT } from '@angular/common';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { clearTranslations, loadTranslations } from '@angular/localize';
import { RouterStateSnapshot } from '@angular/router';
import { SeoTitleStrategy } from './seo-title.strategy';

describe('SEO metadata', () => {
  beforeEach(() => clearTranslations());
  afterEach(() => clearTranslations());

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
    expect(doc.querySelector('link[hreflang]')).toBeNull();
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
    it(`keeps the same canonical and breadcrumb URLs for ${locale} without invented locale URLs`, () => {
      configure(locale);
      const seo = TestBed.inject(SeoTitleStrategy);
      const doc = TestBed.inject(DOCUMENT);
      const obsoleteAlternate = doc.createElement('link');
      obsoleteAlternate.rel = 'alternate';
      obsoleteAlternate.hreflang = 'en';
      obsoleteAlternate.href = 'https://www.basstahali.com/en/subjects/grade-123';
      doc.head.appendChild(obsoleteAlternate);
      const obsoleteOgAlternate = doc.createElement('meta');
      obsoleteOgAlternate.setAttribute('property', 'og:locale:alternate');
      obsoleteOgAlternate.content = 'en_US';
      doc.head.appendChild(obsoleteOgAlternate);
      seo.updateTitle(snapshot('/subjects/grade-123?campaign=example#materials', 'subjects/:id'));
      const origin = 'https://www.basstahali.com';
      const home = `${origin}/`;
      const canonical = `${origin}/subjects/grade-123`;
      expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(canonical);
      expect(doc.querySelector('meta[property="og:url"]')?.getAttribute('content')).toBe(canonical);
      expect(doc.querySelector('meta[property="og:locale"]')?.getAttribute('content')).toBe(
        locale === 'en' ? 'en_US' : 'ar_AE',
      );
      expect(doc.querySelector('link[hreflang]')).toBeNull();
      expect(doc.querySelector('meta[property="og:locale:alternate"]')).toBeNull();
      const breadcrumbs = JSON.parse(doc.querySelector('#page-breadcrumbs')!.textContent!);
      expect(breadcrumbs.itemListElement.map((entry: { item: string }) => entry.item)).toEqual([
        home,
        `${home}curriculum`,
        canonical,
      ]);
      seo.updateTitle(snapshot('/pricing', 'pricing'));
      expect(doc.querySelector('link[hreflang]')).toBeNull();
    });
  }

  it('uses freshly loaded native translations when the application changes language', () => {
    configure();
    const doc = TestBed.inject(DOCUMENT);
    TestBed.inject(SeoTitleStrategy).updateTitle(snapshot('/privacy', 'privacy'));
    expect(doc.title).toBe('سياسة الخصوصية | بسطهالي');

    loadTranslations({
      m_55ac61564737: 'Privacy policy | Basstahali',
      m_0e99ada47889: 'Read about privacy on Basstahali.',
      m_70b341c96b9c: 'Basstahali',
    });
    TestBed.resetTestingModule();
    configure('en');
    TestBed.inject(SeoTitleStrategy).updateTitle(snapshot('/privacy', 'privacy'));
    expect(doc.title).toBe('Privacy policy | Basstahali');
    expect(doc.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
      'Read about privacy on Basstahali.',
    );
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://www.basstahali.com/privacy',
    );
    expect(doc.querySelector('meta[property="og:locale"]')?.getAttribute('content')).toBe('en_US');
    expect(doc.querySelector('#page-breadcrumbs')?.textContent).toContain('Privacy policy');

    clearTranslations();
    TestBed.resetTestingModule();
    configure();
    TestBed.inject(SeoTitleStrategy).updateTitle(snapshot('/privacy', 'privacy'));
    expect(doc.title).toBe('سياسة الخصوصية | بسطهالي');
    expect(doc.querySelector('meta[property="og:locale"]')?.getAttribute('content')).toBe('ar_AE');
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://www.basstahali.com/privacy',
    );
  });
});
