import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SectionHeaderComponent } from './section-header.component';

describe('SectionHeaderComponent', () => {
  let component: SectionHeaderComponent;
  let fixture: ComponentFixture<SectionHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SectionHeaderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SectionHeaderComponent);
    fixture.componentRef.setInput('title', 'عنوان الاختبار');
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
