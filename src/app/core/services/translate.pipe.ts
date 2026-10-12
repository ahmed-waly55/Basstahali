import { inject, Pipe, PipeTransform } from '@angular/core';
import { PreferencesService } from './preferences.service';

@Pipe({ name: 'translate', pure: false })
export class TranslatePipe implements PipeTransform {
  private preferences = inject(PreferencesService);
  transform(value: unknown): string {
    return this.preferences.translate(value);
  }
}
