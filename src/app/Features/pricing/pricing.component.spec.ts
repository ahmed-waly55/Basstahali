import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { VisitorPricingService } from '../../core/services/visitor-pricing.service';

import { PricingComponent } from './pricing.component';

describe('PricingComponent', () => {
  let component: PricingComponent;
  let fixture: ComponentFixture<PricingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
      imports: [PricingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PricingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    TestBed.inject(HttpTestingController)
      .expectOne('/api/visitor-country')
      .flush({ country: 'AE' });
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('converts current and original prices for Egypt while keeping the discount', () => {
    TestBed.inject(VisitorPricingService).country.set('EG');
    fixture.detectChanges();
    expect(renderedPrices()).toEqual([12000, 14400, 16800]);
    const previous = Array.from(fixture.nativeElement.querySelectorAll('s')).map((price) =>
      (price as HTMLElement).textContent?.trim(),
    );
    expect(previous).toEqual(['15000 جنيه مصري', '18000 جنيه مصري', '21000 جنيه مصري']);
    expect(fixture.nativeElement.textContent).toContain('خصم 20%');
    component.selectedCurriculum.set('ministerial');
    fixture.detectChanges();
    expect(renderedPrices()).toEqual([9600, 12000, 14400]);
    const ministerialPrevious = Array.from(fixture.nativeElement.querySelectorAll('s')).map(
      (price) => (price as HTMLElement).textContent?.trim(),
    );
    expect(ministerialPrevious).toEqual(['12000 جنيه مصري', '15000 جنيه مصري', '18000 جنيه مصري']);
  });

  for (const language of ['ar'] as const) {
    it(`uses the Egyptian price and currency in WhatsApp in ${language}`, () => {
      TestBed.inject(VisitorPricingService).country.set('EG');
      fixture.detectChanges();
      const link: HTMLAnchorElement = fixture.nativeElement.querySelector('article a');
      const message = new URL(link.href).searchParams.get('text')!;
      expect(message).toContain(language === 'ar' ? '12000 جنيه مصري' : '12000 EGP');
      expect(message).not.toContain('800 AED');
    });
  }

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

  it('switches to the ministerial offers with their prices before the 20% discount', async () => {
    const buttons = fixture.nativeElement.querySelectorAll('.curriculum-option');
    buttons[1].click();
    await fixture.whenStable();
    expect(renderedPrices()).toEqual([640, 800, 960]);
    const originalPrices = Array.from(fixture.nativeElement.querySelectorAll('s')).map((price) =>
      (price as HTMLElement).textContent?.trim(),
    );
    expect(originalPrices).toEqual(['800 درهم إماراتي', '1000 درهم إماراتي', '1200 درهم إماراتي']);
    expect(fixture.nativeElement.textContent.match(/خصم 20%/g)?.length).toBe(3);
    expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
    expect(buttons[0].getAttribute('aria-pressed')).toBe('false');
  });

  it('keeps the final prices of all six packages exactly 20% below their original prices', () => {
    const plans = component.curricula.flatMap((curriculum) => curriculum.plans);
    expect(plans.length).toBe(6);
    plans.forEach((plan) => {
      expect(plan.previousPrice).toBeDefined();
      expect(plan.price * 100).toBe(plan.previousPrice! * 80);
    });
  });

  for (const language of ['ar'] as const) {
    for (const curriculumId of ['international', 'ministerial'] as const) {
      it(`opens WhatsApp with every ${curriculumId} stage and its exact price in ${language}`, () => {
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
          expect(message).toContain(curriculum.name);
          expect(message).toContain(plan.name);
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
