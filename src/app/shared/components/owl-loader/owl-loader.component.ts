import { Component } from '@angular/core';
import { LoadingService } from '../../../core/services/loading.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-owl-loader',
  imports: [CommonModule],
  templateUrl: './owl-loader.component.html',
  styleUrl: './owl-loader.component.css',
})
export class OwlLoaderComponent {
  constructor(public loadingService: LoadingService) {}
}
