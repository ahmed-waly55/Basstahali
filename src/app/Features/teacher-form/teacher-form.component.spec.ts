import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeacherFormComponent } from './teacher-form.component';

describe('TeacherFormComponent', () => {
  let component: TeacherFormComponent;
  let fixture: ComponentFixture<TeacherFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClientTesting()],
      imports: [TeacherFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TeacherFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    TestBed.inject(HttpTestingController)
      .expectOne('https://api.basstahali.com/api/v1/curricula')
      .flush({ data: [] });
    await fixture.whenStable();
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
