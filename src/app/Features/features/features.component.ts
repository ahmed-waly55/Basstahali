import { Component, OnInit, AfterViewInit, ChangeDetectionStrategy, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import AOS from 'aos';

@Component({
  selector: 'app-features',
  imports: [],
  templateUrl: './features.component.html',
  changeDetection: ChangeDetectionStrategy.Default,
  styleUrl: './features.component.css',
})
export class FeaturesComponent implements OnInit, AfterViewInit {
  private platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: false,
        offset: 120,
      });
    }
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        AOS.refresh();
      }, 300);
    }
  }
}
