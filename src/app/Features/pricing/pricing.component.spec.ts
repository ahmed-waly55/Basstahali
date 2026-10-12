import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PreferencesService } from '../../core/services/preferences.service';

import { PricingComponent } from './pricing.component';

describe('PricingComponent', () => {
  let component: PricingComponent;
  let fixture: ComponentFixture<PricingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([])],
      imports: [PricingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PricingComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
    TestBed.inject(PreferencesService).language.set('ar');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  function renderedPrices(): number[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.plan-price')).map((price) =>
      Number((price as HTMLElement).textContent),
    );
  }

  it('shows the international offers and their original prices without a billing period', () => {
    expect(renderedPrices()).toEqual([800, 960, 1120]);
    const originalPrices = Array.from(fixture.nativeElement.querySelectorAll('s')).map((price) =>
      (price as HTMLElement).textContent?.trim(),
    );
    expect(originalPrices).toEqual(['1000 درهم إماراتي', '1200 درهم إماراتي', '1400 درهم إماراتي']);
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('4 مواد + مادة هدية');
    expect(fixture.nativeElement.querySelectorAll('article li').length).toBe(9);
    expect(text).toContain('8 حصص لكل مادة');
    expect(text).not.toMatch(/قريباً|جنية|شهري|سنوي/);
  });

  it('switches to the ministerial offers without inventing previous prices', async () => {
    const buttons = fixture.nativeElement.querySelectorAll('.curriculum-option');
    buttons[1].click();
    await fixture.whenStable();
    expect(renderedPrices()).toEqual([640, 800, 960]);
    expect(fixture.nativeElement.querySelectorAll('s').length).toBe(0);
    expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
    expect(buttons[0].getAttribute('aria-pressed')).toBe('false');
  });

  for (const language of ['ar', 'en'] as const) {
    for (const curriculumId of ['international', 'ministerial'] as const) {
      it(`opens WhatsApp with every ${curriculumId} stage and its exact price in ${language}`, () => {
        const preferences = TestBed.inject(PreferencesService);
        preferences.language.set(language);
        component.selectedCurriculum.set(curriculumId);
        fixture.detectChanges();
        const curriculum = component.activeCurriculum();
        const links: HTMLAnchorElement[] = Array.from(
          fixture.nativeElement.querySelectorAll('article a'),
        );
        expect(links.length).toBe(3);
        curriculum.plans.forEach((plan, index) => {
          const url = new URL(links[index].href);
          expect(url.origin + url.pathname).toBe('https://wa.me/971563306087');
          expect(links[index].target).toBe('_blank');
          expect(links[index].rel).toContain('noopener');
          const message = url.searchParams.get('text')!;
          expect(message).toContain(preferences.translate(curriculum.name).replace('المنهج ', ''));
          expect(message).toContain(preferences.translate(plan.name));
          expect(message).toContain(`${plan.price} ${language === 'ar' ? 'درهم إماراتي' : 'AED'}`);
          expect(message).toContain(
            language === 'ar' ? '4 مواد + مادة هدية' : '4 subjects + 1 free subject',
          );
          expect(message).toContain(language === 'ar' ? '8 حصص لكل مادة' : '8 lessons per subject');
          expect(message).not.toMatch(/شهري|سنوي|monthly|annual|yearly/i);
          expect(links[index].textContent).toContain(
            language === 'ar' ? 'اشترك عبر واتساب' : 'Subscribe via WhatsApp',
          );
        });
      });
    }
  }
});
