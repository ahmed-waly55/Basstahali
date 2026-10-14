import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubjectsComponent } from './subjects.component';

describe('SubjectsComponent', () => {
  let component: SubjectsComponent;
  let fixture: ComponentFixture<SubjectsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([])],
      imports: [SubjectsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SubjectsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('opens WhatsApp booking with the selected API subject and available API context', () => {
    component.subjects.set([{ id: 'private-subject-id', nameAr: 'الرياضيات' }]);
    component.grade.set({ id: 'private-grade-id', nameAr: 'الصف السادس' });
    component.curriculum.set({ id: 'private-curriculum-id', nameAr: 'المنهج الإماراتي' });
    component.loading.set(false);
    component.failed.set(false);
    fixture.detectChanges();
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a.subject-booking');
    expect(link).toBeTruthy();
    expect(link.target).toBe('_blank');
    const url = new URL(link.href);
    expect(url.origin + url.pathname).toBe('https://wa.me/971563306087');
    expect(url.searchParams.get('text')).toContain('الرياضيات');
    expect(url.searchParams.get('text')).toContain('الصف السادس');
    expect(url.searchParams.get('text')).toContain('المنهج الإماراتي');
    expect(link.href).not.toContain('private-');
    expect(link.getAttribute('aria-label')).toContain('الرياضيات');
  });
});
