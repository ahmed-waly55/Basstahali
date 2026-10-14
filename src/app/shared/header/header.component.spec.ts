import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderComponent } from './header.component';
import { PreferencesService } from '../../core/services/preferences.service';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  const language = signal<'ar' | 'en'>('ar');
  const switchingLanguage = signal(false);
  const toggleLanguage = vi.fn();

  beforeEach(async () => {
    language.set('ar');
    switchingLanguage.set(false);
    toggleLanguage.mockClear();
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: PreferencesService,
          useValue: {
            language: language.asReadonly(),
            switchingLanguage: switchingLanguage.asReadonly(),
            dark: signal(false),
            toggleLanguage,
            toggleTheme: vi.fn(),
          },
        },
      ],
      imports: [HeaderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the selected language as the main brand and keeps the other brand visible', async () => {
    expect(fixture.nativeElement.querySelector('.brand-name').textContent).toBe('بسطهالي');
    expect(fixture.nativeElement.querySelector('.brand-subtitle').textContent).toBe('Basstahali');

    language.set('en');
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.brand-name').textContent).toBe('Basstahali');
    expect(fixture.nativeElement.querySelector('.brand-subtitle').textContent).toBe('بسطهالي');
  });

  it('prevents repeated language requests while a switch is in progress', async () => {
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.language-button');
    button.click();
    expect(toggleLanguage).toHaveBeenCalledOnce();

    switchingLanguage.set(true);
    await fixture.whenStable();

    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
    button.click();
    expect(toggleLanguage).toHaveBeenCalledOnce();
  });
});
