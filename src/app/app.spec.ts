import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    localStorage.removeItem('devtools');
    await TestBed.configureTestingModule({ imports: [App] }).compileComponents();
  });
  afterEach(() => localStorage.removeItem('devtools'));

  it('should create the app', () => {
    expect(TestBed.createComponent(App).componentInstance).toBeTruthy();
  });

  it('preserves the right-click and developer shortcut restrictions', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const menu = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    fixture.nativeElement.dispatchEvent(menu);
    expect(menu.defaultPrevented).toBe(true);
    for (const options of [{ key: 'F12' }, { key: 'I', ctrlKey: true, shiftKey: true }, { key: 'u', ctrlKey: true }]) {
      const event = new KeyboardEvent('keydown', { ...options, cancelable: true });
      window.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
    }
  });
});
