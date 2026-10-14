import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LearningCatalogComponent, learningItems } from './learning-catalog.component';
import { PreferencesService } from '../../../core/services/preferences.service';
import { LOCALE_ID } from '@angular/core';

describe('Learning catalog', () => {
  it('reads supported API envelopes without inventing entries', () => {
    const items = [{ id: 'api-id', nameAr: 'الرياضيات' }];
    expect(learningItems({ data: items })).toEqual(items);
    expect(learningItems({ res: items })).toEqual(items);
    expect(learningItems(items)).toEqual(items);
    expect(learningItems({ data: null })).toEqual([]);
  });
  it('searches Arabic names without requiring diacritics or hamza', () => {
    TestBed.configureTestingModule({
      imports: [LearningCatalogComponent],
      providers: [provideRouter([])],
    });
    const fixture = TestBed.createComponent(LearningCatalogComponent);
    fixture.componentRef.setInput('items', [
      { id: '1', nameAr: 'المنهج الإماراتي', nameEn: 'UAE curriculum' },
      { id: '2', nameAr: 'السعودي' },
    ]);
    fixture.componentInstance.query.set('امارات');
    expect(fixture.componentInstance.filtered().map((item) => item.id)).toEqual(['1']);
    expect(fixture.componentInstance.name(fixture.componentInstance.filtered()[0])).toBe(
      'المنهج الإماراتي',
    );
  });
  it('uses API English names in the native English locale', () => {
    TestBed.configureTestingModule({
      imports: [LearningCatalogComponent],
      providers: [provideRouter([]), { provide: LOCALE_ID, useValue: 'en' }],
    });
    const fixture = TestBed.createComponent(LearningCatalogComponent);
    expect(TestBed.inject(PreferencesService).language()).toBe('en');
    expect(fixture.componentInstance.name({ nameAr: 'الرياضيات', nameEn: 'Mathematics' })).toBe(
      'Mathematics',
    );
  });
  it('distinguishes failed requests from an empty successful response', () => {
    TestBed.configureTestingModule({
      imports: [LearningCatalogComponent],
      providers: [provideRouter([])],
    });
    const fixture = TestBed.createComponent(LearningCatalogComponent);
    fixture.componentRef.setInput('failed', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeTruthy();
    fixture.componentRef.setInput('failed', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('لا توجد بيانات متاحة حاليًا');
  });
});
