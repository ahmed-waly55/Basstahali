import { TranslatePipe } from '../../../core/services/translate.pipe';
import { Component, inject, PLATFORM_ID } from '@angular/core';
import { LoadingService } from '../../../core/services/loading.service';
import { AsyncPipe, isPlatformBrowser } from '@angular/common';
import { distinctUntilChanged, map, of, switchMap, timer } from 'rxjs';

@Component({
  selector: 'app-owl-loader',
  imports: [TranslatePipe, AsyncPipe],
  templateUrl: './owl-loader.component.html',
  styleUrl: './owl-loader.component.css',
})
export class OwlLoaderComponent {
  private readonly loadingService = inject(LoadingService);
  // Short requests finish without a flash; cancellation also cancels the pending reveal.
  readonly visible$ = isPlatformBrowser(inject(PLATFORM_ID))
    ? this.loadingService.isLoading$.pipe(
        distinctUntilChanged(),
        switchMap((loading) => (loading ? timer(180).pipe(map(() => true)) : of(false))),
      )
    : of(false);
}
