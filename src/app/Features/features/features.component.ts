import { Component, OnInit, AfterViewInit } from '@angular/core';
import AOS from 'aos';

@Component({
  selector: 'app-features',
  imports: [],
  templateUrl: './features.component.html',
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
