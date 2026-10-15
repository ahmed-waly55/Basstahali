import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LandingComponent } from './landing.component';

describe('LandingComponent', () => {
  let component: LandingComponent;
  let fixture: ComponentFixture<LandingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClientTesting()],
      imports: [LandingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LandingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    TestBed.inject(HttpTestingController)
      .expectOne('https://api.basstahali.com/api/v1/curricula')
      .flush({ data: [] });
    await fixture.whenStable();
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  const endpoint = 'https://api.basstahali.com/api/v1/curricula';
  const curricula = [
    { _id: 'api-one', nameAr: 'المنهج الأول' },
    { _id: 'api-two', nameAr: 'المنهج الثاني' },
    { _id: 'api-three', nameAr: 'المنهج الثالث' },
  ];

  it('refreshes a one-item response with every curriculum returned by the API', async () => {
    component.fetchCurricula();
    TestBed.inject(HttpTestingController)
      .expectOne(endpoint)
      .flush({ data: curricula.slice(0, 1) });
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelectorAll('a[href^="/curriculum/"]').length).toBe(1);
    component.fetchCurricula();
    TestBed.inject(HttpTestingController).expectOne(endpoint).flush({ data: curricula });
    await fixture.whenStable();
    const links: HTMLAnchorElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('a[href^="/curriculum/"]'),
    );
    expect(links.length).toBe(3);
    expect(links.map((link) => link.getAttribute('href'))).toEqual(
      curricula.map((item) => '/curriculum/' + item._id),
    );
    curricula.forEach((item) => expect(fixture.nativeElement.textContent).toContain(item.nameAr));
  });

  it('shows a failed request and allows a fresh retry instead of silently dropping curricula', async () => {
    component.fetchCurricula();
    TestBed.inject(HttpTestingController)
      .expectOne(endpoint)
      .flush({}, { status: 503, statusText: 'Unavailable' });
    await fixture.whenStable();
    const retry: HTMLButtonElement = fixture.nativeElement.querySelector('[role="alert"] button');
    expect(retry).toBeTruthy();
    retry.click();
    TestBed.inject(HttpTestingController).expectOne(endpoint).flush({ data: curricula });
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
    expect(component.curriculaList).toEqual(curricula);
  });

  it('cancels an older refresh before loading the latest curriculum response', async () => {
    component.fetchCurricula();
    const previous = TestBed.inject(HttpTestingController).expectOne(endpoint);
    component.fetchCurricula();
    expect(previous.cancelled).toBe(true);
    TestBed.inject(HttpTestingController).expectOne(endpoint).flush({ data: curricula });
    await fixture.whenStable();
    expect(component.curriculaList).toEqual(curricula);
    expect(component.curriculaLoading).toBe(false);
    expect(component.curriculaFailed).toBe(false);
  });
});
