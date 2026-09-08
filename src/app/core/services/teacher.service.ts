import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';

// واجهة البيانات (TypeScript Interfaces) لضمان صحة البيانات المطابقة للـ API
export interface TeacherFormRequest {
  fullName: string;
  email: string;
  password: string;
  whatsAppNumber: string;
  payoutMethod: string;
  payoutAccount: string;
  curriculumId: string;
  gradeLevelId: string;
  subjectIds: string[];
}

@Injectable({
  providedIn: 'root', // لجعل الخدمة متاحة في كل التطبيق تلقائياً
})
export class TeacherService {

  constructor(private http: HttpClient) {}

  /**
   * POST: إرسال نموذج تسجيل مدرس جديد
   */
  submitTeacherForm(formData: TeacherFormRequest): Observable<any> {
    return this.http.post<any>(`${environment.baseUrl}/api/v1/teacher-forms`, formData);
  }

  /**
   * GET: متابعة حالة الطلب باستخدام معرف الطلب (requestId)
   */
  getRequestStatus(requestId: string): Observable<any> {
    return this.http.get<any>(`${environment.baseUrl}/api/v1/teacher-forms/${requestId}/status`);
  }

  /**
   * GET: جلب قائمة المناهج الدراسية
   */
  getCurricula(): Observable<any> {
    return this.http.get<any>(`${environment.baseUrl}/api/v1/curricula`);
  }

  /**
   * GET: جلب المراحل التعليمية التابعة لمنهج معين
   */
  getGradeLevels(curriculumId: string): Observable<any> {
    return this.http.get<any>(`${environment.baseUrl}/api/v1/curricula/${curriculumId}/grade-levels`);
  }

  /**
   * GET: جلب المواد الدراسية التابعة لمرحلة تعليمية معينة
   */
  getSubjects(gradeLevelId: string): Observable<any> {
    return this.http.get<any>(`${environment.baseUrl}/api/v1/grade-levels/${gradeLevelId}/subjects`);
  }
}
