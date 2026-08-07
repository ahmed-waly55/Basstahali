import { Component, OnInit, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';
import AOS from 'aos';

@Component({
  selector: 'app-features',
  imports: [],
  templateUrl: './features.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './features.component.css',
})
export class FeaturesComponent implements OnInit, AfterViewInit {
  ngOnInit(): void {
    AOS.init({
      duration: 800,
      easing: 'ease-in-out',
      once: false,
      offset: 120,
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      AOS.refresh();
    }, 300);
  }
}
