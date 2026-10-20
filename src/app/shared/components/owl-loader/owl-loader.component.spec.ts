import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { LoadingService } from '../../../core/services/loading.service';

import { OwlLoaderComponent } from './owl-loader.component';

describe('OwlLoaderComponent', () => {
  let component: OwlLoaderComponent;
  let fixture: ComponentFixture<OwlLoaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OwlLoaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OwlLoaderComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not flash or appear later when a short request finishes', () => {
    vi.useFakeTimers();
    try {
      const loading = TestBed.inject(LoadingService);
      loading.show();
      vi.advanceTimersByTime(150);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[role="status"]')).toBeNull();
      loading.hide();
      vi.advanceTimersByTime(1000);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[role="status"]')).toBeNull();
    } finally {
      vi.clearAllTimers();
      vi.useRealTimers();
    }
  });

  it('shows for a slow request and stays until all concurrent requests finish', () => {
    vi.useFakeTimers();
    try {
      const loading = TestBed.inject(LoadingService);
      loading.show();
      loading.show();
      vi.advanceTimersByTime(180);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[role="status"]')).not.toBeNull();
      loading.hide();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[role="status"]')).not.toBeNull();
      loading.hide();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[role="status"]')).toBeNull();
    } finally {
      vi.clearAllTimers();
      vi.useRealTimers();
    }
  });
});
