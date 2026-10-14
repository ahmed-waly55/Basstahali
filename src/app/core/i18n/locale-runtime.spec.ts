import { ApplicationRef, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { clearTranslations } from '@angular/localize';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Runtime = typeof import('./locale-runtime');

@Component({
  selector: 'locale-form-test',
  imports: [FormsModule],
  template: '<form><input name="parent" [(ngModel)]="parentName"></form>',
})
class LocaleFormFixture {
  parentName = '';
}

describe('Native Angular runtime locale switching', () => {
  let runtime: Runtime;
  let fetchCatalog: ReturnType<typeof vi.fn>;

  function application(): ApplicationRef {
    return {
      destroy: vi.fn(),
      whenStable: () => Promise.resolve(),
      onDestroy: vi.fn(),
    } as unknown as ApplicationRef;
  }

  beforeEach(async () => {
    vi.resetModules();
    localStorage.removeItem('basstahali-language');
    document.body.innerHTML = '<app-root ng-version="20" ngh="0"></app-root>';
    fetchCatalog = vi.fn(async (url: string) => ({
      ok: true,
      json: async () => ({
        locale: url.includes('/en.') ? 'en' : 'ar',
        translations: { runtime_test: url.includes('/en.') ? 'English message' : 'رسالة عربية' },
      }),
    }));
    vi.stubGlobal('fetch', fetchCatalog);
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);
      return 0;
    });
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    runtime = await import('./locale-runtime');
  });

  afterEach(() => {
    clearTranslations();
    localStorage.removeItem('basstahali-language');
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('uses the stored English language at startup without hydrating Arabic markup', async () => {
    localStorage.setItem('basstahali-language', 'en');
    const bootstrap = vi.fn(async () => application());
    runtime.registerLocaleBootstrap(bootstrap);
    await runtime.startLocaleApplication();
    expect(fetchCatalog).toHaveBeenCalledWith(
      '/i118/en.json',
      expect.objectContaining({ credentials: 'same-origin' }),
    );
    expect(bootstrap).toHaveBeenCalledWith('en', false);
    expect($localize`:@@runtime_test:رسالة عربية`).toBe('English message');
  });

  it('changes language in place, clears hydration metadata, stores the choice, and caches catalogs', async () => {
    const previousApp = application();
    const bootstrap = vi
      .fn()
      .mockResolvedValueOnce(previousApp)
      .mockImplementation(async () => application());
    runtime.registerLocaleBootstrap(bootstrap);
    await runtime.startLocaleApplication();
    const url = location.href;
    await runtime.switchApplicationLanguage('en');
    expect(previousApp.destroy).toHaveBeenCalledOnce();
    expect(bootstrap.mock.calls).toEqual([
      ['ar', true],
      ['en', false],
    ]);
    expect(location.href).toBe(url);
    expect(document.querySelector('app-root')?.hasAttribute('ngh')).toBe(false);
    expect(localStorage.getItem('basstahali-language')).toBe('en');
    expect(runtime.switchingLanguage()).toBe(false);
    await runtime.switchApplicationLanguage('ar');
    await runtime.switchApplicationLanguage('en');
    expect(fetchCatalog).toHaveBeenCalledTimes(2);
  });

  it('keeps the current app and preference if the requested catalog is unavailable or invalid', async () => {
    const previousApp = application();
    const bootstrap = vi.fn(async () => previousApp);
    runtime.registerLocaleBootstrap(bootstrap);
    await runtime.startLocaleApplication();
    fetchCatalog.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ locale: 'ar', translations: [] }),
    });
    await expect(runtime.switchApplicationLanguage('en')).rejects.toThrow(
      'Invalid en translation catalog',
    );
    expect(previousApp.destroy).not.toHaveBeenCalled();
    expect(bootstrap).toHaveBeenCalledOnce();
    expect(localStorage.getItem('basstahali-language')).toBeNull();
    expect(runtime.switchingLanguage()).toBe(false);
  });

  it('rolls back translations and view when a new application cannot bootstrap', async () => {
    const previousApp = application();
    const bootstrap = vi
      .fn()
      .mockResolvedValueOnce(previousApp)
      .mockRejectedValueOnce(new Error('Bootstrap failed'))
      .mockResolvedValueOnce(application());
    runtime.registerLocaleBootstrap(bootstrap);
    await runtime.startLocaleApplication();
    await expect(runtime.switchApplicationLanguage('en')).rejects.toThrow('Bootstrap failed');
    expect(bootstrap.mock.calls).toEqual([
      ['ar', true],
      ['en', false],
      ['ar', false],
    ]);
    expect($localize`:@@runtime_test:رسالة عربية`).toBe('رسالة عربية');
    expect(localStorage.getItem('basstahali-language')).toBeNull();
  });

  it('boots Arabic source messages if an initial stored-language catalog cannot be loaded', async () => {
    localStorage.setItem('basstahali-language', 'en');
    fetchCatalog.mockRejectedValueOnce(new Error('Offline'));
    const bootstrap = vi.fn(async () => application());
    runtime.registerLocaleBootstrap(bootstrap);
    await runtime.startLocaleApplication();
    expect(bootstrap).toHaveBeenCalledWith('ar', true);
    expect($localize`:@@runtime_test:رسالة عربية`).toBe('رسالة عربية');
  });

  it('restores form values, selection, checked state, focus, and pricing curriculum without storing form data', async () => {
    const markup =
      '<input id="student" name="student"><textarea name="message"></textarea>' +
      '<select id="stage"><option value="primary">Primary</option><option value="secondary">Secondary</option></select>' +
      '<input id="consent" type="checkbox"><button aria-controls="pricing-plans" aria-pressed="true"></button>' +
      '<button aria-controls="pricing-plans" aria-pressed="false"></button>';
    const bootstrap = vi.fn(async () => {
      document.querySelector('app-root')!.innerHTML = markup;
      const buttons = document.querySelectorAll('button');
      buttons[1].addEventListener('click', () => {
        buttons[0].setAttribute('aria-pressed', 'false');
        buttons[1].setAttribute('aria-pressed', 'true');
      });
      return application();
    });
    runtime.registerLocaleBootstrap(bootstrap);
    await runtime.startLocaleApplication();
    const student = document.querySelector<HTMLInputElement>('#student')!;
    student.value = 'Private name';
    student.focus();
    student.setSelectionRange(2, 5);
    document.querySelector<HTMLTextAreaElement>('textarea')!.value = 'Private message';
    document.querySelector<HTMLSelectElement>('#stage')!.value = 'secondary';
    document.querySelector<HTMLInputElement>('#consent')!.checked = true;
    document.querySelectorAll<HTMLButtonElement>('button')[1].click();
    await runtime.switchApplicationLanguage('en');
    await vi.waitFor(() =>
      expect(document.querySelector<HTMLInputElement>('#student')!.value).toBe('Private name'),
    );
    const restored = document.querySelector<HTMLInputElement>('#student')!;
    expect(restored.value).toBe('Private name');
    expect(restored.selectionStart).toBe(2);
    expect(document.activeElement).toBe(restored);
    expect(document.querySelector<HTMLTextAreaElement>('textarea')!.value).toBe('Private message');
    expect(document.querySelector<HTMLSelectElement>('#stage')!.value).toBe('secondary');
    expect(document.querySelector<HTMLInputElement>('#consent')!.checked).toBe(true);
    expect(document.querySelectorAll('button')[1].getAttribute('aria-pressed')).toBe('true');
    expect(localStorage.getItem('basstahali-language')).toBe('en');
    expect(JSON.stringify(localStorage)).not.toContain('Private');
  });

  it('restores a dependent API select when its options arrive after the locale switch', async () => {
    let starts = 0;
    const bootstrap = vi.fn(async () => {
      starts++;
      document.querySelector('app-root')!.innerHTML =
        '<select id="grade"><option value="">Choose</option></select>';
      if (starts === 1) {
        document
          .querySelector('select')!
          .insertAdjacentHTML('beforeend', '<option value="grade-api-id">Grade</option>');
      }
      return application();
    });
    runtime.registerLocaleBootstrap(bootstrap);
    await runtime.startLocaleApplication();
    document.querySelector<HTMLSelectElement>('select')!.value = 'grade-api-id';
    await runtime.switchApplicationLanguage('en');
    const grade = document.querySelector<HTMLSelectElement>('select')!;
    expect(grade.value).toBe('');
    grade.insertAdjacentHTML('beforeend', '<option value="grade-api-id">API grade</option>');
    await vi.waitFor(() => expect(grade.value).toBe('grade-api-id'));
  });

  it('restores the Angular NgModel value after an asynchronously rendered route registers its NgForm controls', async () => {
    await TestBed.configureTestingModule({ imports: [LocaleFormFixture] }).compileComponents();
    let starts = 0;
    let latestFixture: ComponentFixture<LocaleFormFixture> | undefined;
    runtime.registerLocaleBootstrap(async () => {
      const app = application();
      let mounted: ComponentFixture<LocaleFormFixture> | undefined;
      const render = () => {
        mounted = TestBed.createComponent(LocaleFormFixture);
        latestFixture = mounted;
        document.querySelector('app-root')!.append(mounted.nativeElement);
        mounted.detectChanges();
      };
      if (++starts === 1) render();
      else setTimeout(render, 0);
      app.destroy = () => mounted?.destroy();
      return app;
    });
    await runtime.startLocaleApplication();
    await latestFixture!.whenStable();
    const input = document.querySelector<HTMLInputElement>('input[name="parent"]')!;
    input.value = 'Test Parent';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await latestFixture!.whenStable();
    expect(latestFixture!.componentInstance.parentName).toBe('Test Parent');
    await runtime.switchApplicationLanguage('en');
    await vi.waitFor(
      () => {
        expect(document.querySelector<HTMLInputElement>('input[name="parent"]')?.value).toBe(
          'Test Parent',
        );
        expect(latestFixture!.componentInstance.parentName).toBe('Test Parent');
      },
      { timeout: 500, interval: 10 },
    );
  });
});
