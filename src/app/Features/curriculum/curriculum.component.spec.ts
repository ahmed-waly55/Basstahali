import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { CurriculumComponent } from './curriculum.component';

describe('CurriculumComponent', () => {
  const url = `${environment.baseUrl}/api/v1/curricula`;
  const curricula = [
    { id: 'international', nameAr: 'المنهج الدولي', nameEn: 'International curriculum' },
    { id: 'ministerial', nameAr: 'المنهج الوزاري', nameEn: 'Ministerial curriculum' },
    { id: 'british', nameAr: 'المنهج البريطاني', nameEn: 'British curriculum' },
  ];
  let component: CurriculumComponent;
  let fixture: ComponentFixture<CurriculumComponent>;
  let backend: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClientTesting()],
      imports: [CurriculumComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CurriculumComponent);
    component = fixture.componentInstance;
    backend = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => backend.verify());

  it('renders every API curriculum with its own stages link', () => {
    backend.expectOne(url).flush({ success: true, data: curricula });
    fixture.detectChanges();

    const cards = Array.from(fixture.nativeElement.querySelectorAll('h2')) as HTMLElement[];
    expect(cards.map((card) => card.textContent?.trim())).toEqual(
      curricula.map((curriculum) => curriculum.nameAr),
    );
    const links = Array.from(fixture.nativeElement.querySelectorAll('a')) as HTMLAnchorElement[];
    expect(links.map((link) => link.getAttribute('href'))).toEqual(
      curricula.map((curriculum) => `/curriculum/${curriculum.id}`),
    );
    expect(component.loading()).toBe(false);
    expect(component.failed()).toBe(false);
  });

  it('fetches again on retry and replaces a previous one-item response with the full catalogue', () => {
    backend.expectOne(url).flush({ success: true, data: curricula.slice(0, 1) });
    expect(component.CurriculmData()).toHaveLength(1);

    component.getCurriculm();
    backend.expectOne(url).flush({ success: true, data: curricula });

    expect(component.CurriculmData()).toEqual(curricula);
  });

  it('cancels the previous load so an older response cannot replace the latest catalogue', () => {
    const previous = backend.expectOne(url);
    component.getCurriculm();
    expect(previous.cancelled).toBe(true);

    backend.expectOne(url).flush({ success: true, data: curricula });
    expect(component.CurriculmData()).toEqual(curricula);
    expect(component.loading()).toBe(false);
    expect(component.failed()).toBe(false);
  });

  it('recovers from a failed API request through the retry action', () => {
    backend.expectOne(url).flush({}, { status: 503, statusText: 'Unavailable' });
    expect(component.failed()).toBe(true);
    expect(component.loading()).toBe(false);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    expect(component.failed()).toBe(false);
    expect(component.loading()).toBe(true);
    backend.expectOne(url).flush({ success: true, data: curricula });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('h2')).toHaveLength(3);
    expect(component.failed()).toBe(false);
  });
});
