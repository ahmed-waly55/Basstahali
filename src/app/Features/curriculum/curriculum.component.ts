import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { TeacherService } from '../../core/services/teacher.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-curriculum',
  imports: [RouterLink],
  templateUrl: './curriculum.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './curriculum.component.css',
})
export class CurriculumComponent implements OnInit{
  ngOnInit(): void {
    this.getCurriculm()
  }
  private _TeacherService =inject(TeacherService)
  CurriculmData:any = []

getCurriculm() {
    this._TeacherService.getCurricula().subscribe({
      next: (data: any) => {
        // console.log('استجابة الـ API الكاملة:', data);

        this.CurriculmData = data?.res || data?.data || data || [];
      },
      error: (err) => {
        // console.error('خطأ:', err);
        this.CurriculmData = [];
      }
    });
  }

}
