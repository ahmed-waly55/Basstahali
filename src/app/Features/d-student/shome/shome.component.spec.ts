import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShomeComponent } from './shome.component';

describe('ShomeComponent', () => {
  let component: ShomeComponent;
  let fixture: ComponentFixture<ShomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShomeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ShomeComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
