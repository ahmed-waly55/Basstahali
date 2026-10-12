import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { RouterStateSnapshot } from '@angular/router';
import { SeoTitleStrategy } from './seo-title.strategy';

describe('SEO metadata', () => {
  function snapshot(url: string, path: string) {
    return { url, root: { firstChild: null, routeConfig: { path } } } as unknown as RouterStateSnapshot;
  }
  it('uses a page-specific canonical without query parameters and replaces breadcrumbs', () => {
    TestBed.configureTestingModule({ providers: [SeoTitleStrategy] });
    const seo = TestBed.inject(SeoTitleStrategy);
    const doc = TestBed.inject(DOCUMENT);
    seo.updateTitle(snapshot('/curriculum/abc?source=test', 'curriculum/:id'));
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://www.basstahali.com/curriculum/abc');
    expect(doc.title).toBe('المراحل الدراسية | بسطهالي');
    seo.updateTitle(snapshot('/contact', 'contact'));
    expect(doc.querySelectorAll('#page-breadcrumbs').length).toBe(1);
    expect(doc.querySelector('meta[name="description"]')?.getAttribute('content')).toContain('تواصل');
  });
  it('keeps missing pages out of the index and restores indexing after navigation', () => {
    TestBed.configureTestingModule({ providers: [SeoTitleStrategy] });
    const seo = TestBed.inject(SeoTitleStrategy);
    const doc = TestBed.inject(DOCUMENT);
    seo.updateTitle(snapshot('/missing', '**'));
    expect(doc.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex, follow');
    seo.updateTitle(snapshot('/', ''));
    expect(doc.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('index, follow');
    expect(doc.querySelector('#page-breadcrumbs')).toBeNull();
  });
});
