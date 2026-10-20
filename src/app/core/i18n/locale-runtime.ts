import { ApplicationRef, signal } from '@angular/core';
import { clearTranslations, loadTranslations } from '@angular/localize';

export type ApplicationLocale = 'ar' | 'en';
type LocaleBootstrap = (locale: ApplicationLocale, hydrate: boolean) => Promise<ApplicationRef>;
type TranslationCatalog = Record<string, string>;
type FormControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
interface ControlSnapshot {
  tag: string;
  type: string;
  id: string;
  name: string;
  controlName: string;
  index: number;
  value: string;
  checked: boolean;
  selected: string[];
  focused: boolean;
  selectionStart: number | null;
  selectionEnd: number | null;
}
interface ViewSnapshot {
  controls: ControlSnapshot[];
  curriculumIndex: number;
}

const languageStorageKey = 'basstahali-language';
const catalogs = new Map<ApplicationLocale, TranslationCatalog>();
const switching = signal(false);

/** A language change rebuilds the Angular view tree without navigating the browser. */
export const switchingLanguage = switching.asReadonly();

let bootstrapLocale: LocaleBootstrap | undefined;
let activeApp: ApplicationRef | undefined;
let activeLocale: ApplicationLocale = 'ar';
let startup: Promise<ApplicationRef> | undefined;
let transition: Promise<void> | undefined;

export function registerLocaleBootstrap(callback: LocaleBootstrap): void {
  bootstrapLocale = callback;
}

export function readStoredLanguage(): ApplicationLocale {
  try {
    return localStorage.getItem(languageStorageKey) === 'en' ? 'en' : 'ar';
  } catch {
    return 'ar';
  }
}

function rememberLanguage(locale: ApplicationLocale): void {
  try {
    localStorage.setItem(languageStorageKey, locale);
  } catch {
    // The current selection still works when browser storage is unavailable.
  }
}

async function readCatalog(locale: ApplicationLocale): Promise<TranslationCatalog> {
  const existing = catalogs.get(locale);
  if (existing) return existing;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(`/i118/${locale}.json`, {
      credentials: 'same-origin',
      cache: 'no-cache',
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Unable to load the ${locale} translation catalog.`);
    const catalog: unknown = await response.json();
    if (
      !catalog ||
      typeof catalog !== 'object' ||
      !('locale' in catalog) ||
      catalog.locale !== locale ||
      !('translations' in catalog) ||
      !catalog.translations ||
      typeof catalog.translations !== 'object' ||
      Array.isArray(catalog.translations)
    ) {
      throw new Error(`Invalid ${locale} translation catalog.`);
    }

    const translations: TranslationCatalog = Object.create(null);
    for (const [id, text] of Object.entries(catalog.translations)) {
      if (typeof text !== 'string') throw new Error(`Invalid translation for ${id}.`);
      translations[id] = text;
    }
    catalogs.set(locale, translations);
    return translations;
  } finally {
    clearTimeout(timeout);
  }
}

function applyCatalog(translations: TranslationCatalog): void {
  clearTranslations();
  if (Object.keys(translations).length) loadTranslations(translations);
}

function bootstrap(locale: ApplicationLocale, hydrate: boolean): Promise<ApplicationRef> {
  if (!bootstrapLocale) throw new Error('The locale bootstrap callback has not been registered.');
  return bootstrapLocale(locale, hydrate);
}

export function startLocaleApplication(): Promise<ApplicationRef> {
  startup ??= startApplication();
  return startup;
}

async function startApplication(): Promise<ApplicationRef> {
  let locale = readStoredLanguage();
  let translations: TranslationCatalog;
  try {
    translations = await readCatalog(locale);
  } catch {
    // Arabic source messages keep the application usable if catalogs cannot be fetched.
    locale = 'ar';
    translations = {};
  }
  applyCatalog(translations);
  activeApp = await bootstrap(locale, locale === 'ar');
  activeLocale = locale;
  return activeApp;
}

function createCleanRoot(): HTMLElement {
  const previousRoot = document.querySelector('app-root');
  const root = document.createElement('app-root');
  if (previousRoot) previousRoot.replaceWith(root);
  else document.body.append(root);
  return root;
}

function restoreScroll(app: ApplicationRef, x: number, y: number): void {
  void app.whenStable().then(
    () => {
      if (activeApp !== app) return;
      requestAnimationFrame(() => {
        if (activeApp === app) window.scrollTo(x, y);
      });
    },
    () => {
      /* The previous application may have been destroyed during restoration. */
    },
  );
}

function formControls(): FormControl[] {
  return Array.from(
    document.querySelectorAll<FormControl>('app-root input, app-root select, app-root textarea'),
  ).filter((control) => !(control instanceof HTMLInputElement && control.type === 'file'));
}

function snapshotView(): ViewSnapshot {
  const controls = formControls();
  return {
    controls: controls.map((control, index) => ({
      tag: control.tagName,
      type: control.type,
      id: control.id,
      name: control.name,
      controlName: control.getAttribute('formControlName') ?? '',
      index,
      value: control.value,
      checked: control instanceof HTMLInputElement && control.checked,
      selected:
        control instanceof HTMLSelectElement
          ? Array.from(control.selectedOptions, (option) => option.value)
          : [],
      focused: document.activeElement === control,
      selectionStart:
        control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement
          ? control.selectionStart
          : null,
      selectionEnd:
        control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement
          ? control.selectionEnd
          : null,
    })),
    curriculumIndex: Array.from(
      document.querySelectorAll('button[aria-controls="pricing-plans"][aria-pressed]'),
    ).findIndex((button) => button.getAttribute('aria-pressed') === 'true'),
  };
}

function restoreView(app: ApplicationRef, snapshot: ViewSnapshot): void {
  const pending = new Set(snapshot.controls);
  const awaitingAcceptance = new Map<ControlSnapshot, FormControl>();
  let curriculumPending = snapshot.curriculumIndex >= 0;
  let stopped = false;
  let restoreTask: ReturnType<typeof setTimeout> | undefined;
  let verifyTask: ReturnType<typeof setTimeout> | undefined;
  const root = document.querySelector('app-root');
  if (!root) return;

  // NgForm registers NgModel controls in a microtask after creating their DOM nodes.
  // A later task lets Angular finish registration before replaying input events.
  const observer = new MutationObserver(scheduleRestore);
  const timeout = setTimeout(stop, 12_000);
  function stop(): void {
    stopped = true;
    observer.disconnect();
    clearTimeout(timeout);
    clearTimeout(restoreTask);
    clearTimeout(verifyTask);
    // Release any in-memory form values, including private fields, after restoration.
    pending.clear();
    awaitingAcceptance.clear();
    snapshot.controls.length = 0;
  }
  function scheduleRestore(): void {
    if (stopped || restoreTask !== undefined) return;
    restoreTask = setTimeout(() => {
      restoreTask = undefined;
      restore();
    }, 0);
  }
  function verifyAcceptance(): void {
    verifyTask = undefined;
    if (activeApp !== app) return stop();
    let retry = false;
    for (const [saved, control] of awaitingAcceptance) {
      const accepted =
        control.isConnected &&
        (control instanceof HTMLInputElement && ['checkbox', 'radio'].includes(control.type)
          ? control.checked === saved.checked
          : control.value === saved.value &&
            (!(control instanceof HTMLSelectElement) ||
              (saved.selected.length === control.selectedOptions.length &&
                saved.selected.every((value) =>
                  Array.from(control.selectedOptions).some((option) => option.value === value),
                ))));
      awaitingAcceptance.delete(saved);
      if (accepted) pending.delete(saved);
      else retry = true;
    }
    if (!pending.size && !curriculumPending) stop();
    else if (retry) scheduleRestore();
  }
  function restore(): void {
    if (activeApp !== app) return stop();
    const controls = formControls();
    for (const saved of pending) {
      if (awaitingAcceptance.has(saved)) continue;
      const control = controls.find((candidate, index) =>
        saved.id
          ? candidate.id === saved.id
          : saved.name
            ? candidate.name === saved.name &&
              (!['radio', 'checkbox'].includes(saved.type) || candidate.value === saved.value)
            : saved.controlName
              ? candidate.getAttribute('formControlName') === saved.controlName
              : index === saved.index &&
                candidate.tagName === saved.tag &&
                candidate.type === saved.type,
      );
      if (!control) continue;
      if (control instanceof HTMLSelectElement) {
        if (
          !saved.selected.every((value) =>
            Array.from(control.options).some((option) => option.value === value),
          )
        )
          continue;
        for (const option of control.options)
          option.selected = saved.selected.includes(option.value);
        if (control.value !== saved.value) control.value = saved.value;
        control.dispatchEvent(new Event('change', { bubbles: true }));
      } else if (
        control instanceof HTMLInputElement &&
        ['checkbox', 'radio'].includes(control.type)
      ) {
        if (control.checked !== saved.checked) {
          control.checked = saved.checked;
          control.dispatchEvent(new Event('change', { bubbles: true }));
        }
      } else if (control.value !== saved.value) {
        control.value = saved.value;
        control.dispatchEvent(new Event('input', { bubbles: true }));
        control.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (saved.focused) {
        control.focus({ preventScroll: true });
        if (
          (control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement) &&
          saved.selectionStart !== null
        ) {
          control.setSelectionRange(saved.selectionStart, saved.selectionEnd);
        }
      }
      awaitingAcceptance.set(saved, control);
    }
    if (curriculumPending) {
      const button = document.querySelectorAll<HTMLButtonElement>(
        'button[aria-controls="pricing-plans"][aria-pressed]',
      )[snapshot.curriculumIndex];
      if (button) {
        if (button.getAttribute('aria-pressed') !== 'true') button.click();
        curriculumPending = false;
      }
    }
    if (awaitingAcceptance.size && verifyTask === undefined)
      verifyTask = setTimeout(verifyAcceptance, 0);
    else if (!pending.size && !curriculumPending) stop();
  }
  observer.observe(root, { childList: true, subtree: true });
  app.onDestroy(stop);
  scheduleRestore();
}

/** Load the new locale first, so a failed request never destroys the current application. */
export function switchApplicationLanguage(target: ApplicationLocale): Promise<void> {
  if (transition) return transition;
  if (target === activeLocale) return Promise.resolve();
  switching.set(true);
  transition = changeLanguage(target).finally(() => {
    transition = undefined;
    switching.set(false);
  });
  return transition;
}

async function changeLanguage(target: ApplicationLocale): Promise<void> {
  if (!activeApp) throw new Error('The application has not started.');
  const translations = await readCatalog(target);
  const previousLocale = activeLocale;
  const previousTranslations = catalogs.get(previousLocale) ?? {};
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  const view = snapshotView();

  activeApp.destroy();
  activeApp = undefined;
  createCleanRoot();
  try {
    applyCatalog(translations);
    activeApp = await bootstrap(target, false);
    activeLocale = target;
    rememberLanguage(target);
    restoreView(activeApp, view);
    restoreScroll(activeApp, scrollX, scrollY);
  } catch (error) {
    // Restore the previous view if a new locale cannot be bootstrapped.
    activeApp?.destroy();
    activeApp = undefined;
    createCleanRoot();
    applyCatalog(previousTranslations);
    try {
      activeApp = await bootstrap(previousLocale, false);
      activeLocale = previousLocale;
      restoreView(activeApp, view);
      restoreScroll(activeApp, scrollX, scrollY);
    } catch (rollbackError) {
      showRecovery(previousLocale, previousTranslations, scrollX, scrollY);
      throw new AggregateError([error, rollbackError], 'Unable to restore the application locale.');
    }
    throw error;
  }
}

function showRecovery(
  locale: ApplicationLocale,
  translations: TranslationCatalog,
  scrollX: number,
  scrollY: number,
): void {
  const root = createCleanRoot();
  const message = document.createElement('p');
  message.setAttribute('role', 'alert');
  message.textContent = $localize`:@@m_e0465a89fde9:تعذر تحميل البيانات`;
  const retry = document.createElement('button');
  retry.type = 'button';
  retry.textContent = $localize`:@@m_2e47b5f289f1:إعادة المحاولة`;
  retry.addEventListener('click', () => {
    retry.disabled = true;
    applyCatalog(translations);
    createCleanRoot();
    void bootstrap(locale, false).then(
      (app) => {
        activeApp = app;
        activeLocale = locale;
        restoreScroll(app, scrollX, scrollY);
      },
      () => showRecovery(locale, translations, scrollX, scrollY),
    );
  });
  root.append(message, retry);
}
