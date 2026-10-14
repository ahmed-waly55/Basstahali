import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LiveLessonComponent } from '../../shared/components/live-lesson/live-lesson.component';

@Component({
  selector: 'app-hero',
  imports: [LiveLessonComponent, RouterLink],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css',
})
export class HeroComponent {
  readonly messages = {
    m_68bec9ba1925: $localize`:@@m_68bec9ba1925:حصص خصوصية مباشرة أونلاين`,
    m_95a966298ef2: $localize`:@@m_95a966298ef2:تعلّم بطريقة`,
    m_d45f133f0ef5: $localize`:@@m_d45f133f0ef5:أذكى`,
    m_f3c3b73b8039: $localize`:@@m_f3c3b73b8039:مع`,
    m_70b341c96b9c: $localize`:@@m_70b341c96b9c:بسطهالي`,
    m_3e9667c28bdc: $localize`:@@m_3e9667c28bdc:تعلّم مع معلمك في حصص خصوصية مباشرة أونلاين، بشرح مبسط للمناهج الخليجية وتفاعل ومتابعة تناسب احتياجك الدراسي.`,
    m_aba6c5b565c5: $localize`:@@m_aba6c5b565c5:استكشف المناهج الدراسية`,
    m_e77a95f1187f: $localize`:@@m_e77a95f1187f:احجز حصة تجريبية`,
    m_f449cfcc4709: $localize`:@@m_f449cfcc4709:شرح مباشر · تفاعل حقيقي · فهم أبسط`,
  };
}
