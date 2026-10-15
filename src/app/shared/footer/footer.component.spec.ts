import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([])],
      imports: [FooterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('links the curricula quick link to curricula instead of courses', () => {
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a[href="/curriculum"]');
    expect(link).toBeTruthy();
    expect(link.textContent).toContain('المناهج الدراسية');
    expect(fixture.nativeElement.querySelector('a[href="/courses"]')).toBeNull();
  });
});
