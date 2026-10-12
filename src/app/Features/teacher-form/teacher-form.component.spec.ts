import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeacherFormComponent } from './teacher-form.component';

describe('TeacherFormComponent', () => {
  let component: TeacherFormComponent;
  let fixture: ComponentFixture<TeacherFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([])],
      imports: [TeacherFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TeacherFormComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
