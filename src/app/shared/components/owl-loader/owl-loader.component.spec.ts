import { ComponentFixture, TestBed } from '@angular/core/testing';

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
});
