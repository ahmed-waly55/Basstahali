import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';
import { StudentService } from '../../core/student/student.service';
import type {
  StudentAssignment,
  StudentConversation,
  StudentExam,
  StudentMessage,
  StudentPage,
} from '../../core/student/student.models';
import { StudentActivityComponent } from './student-activity.component';

function page<T>(items: T[], extra: Partial<StudentPage<T>> = {}): StudentPage<T> {
  return {
    items,
    pageNumber: null,
    pageSize: null,
    totalCount: null,
    totalPages: null,
    hasPreviousPage: null,
    hasNextPage: null,
    ...extra,
  };
}

const conversation: StudentConversation = {
  id: 'owned-conversation',
  title: 'سؤال عن الدرس',
  subject: null,
  lastMessage: null,
  updatedAt: null,
  unreadCount: 2,
  status: 'Open',
  raw: {},
};

function exam(extra: Partial<StudentExam> = {}): StudentExam {
  return {
    id: 'owned-exam',
    title: 'اختبار المادة',
    subjectName: 'الرياضيات',
    description: null,
    status: null,
    dueDate: null,
    score: null,
    maxScore: null,
    isSubmitted: null,
    submittedAt: null,
    questions: [{ id: 'real-question', text: 'أجب عن السؤال', type: null, options: [] }],
    raw: {},
    ...extra,
  };
}

function assignment(extra: Partial<StudentAssignment> = {}): StudentAssignment {
  return {
    id: 'owned-assignment',
    title: 'واجب المادة',
    description: null,
    subjectName: null,
    dueDate: null,
    status: null,
    grade: null,
    maxGrade: null,
    textAnswer: null,
    fileUrl: null,
    raw: {},
    ...extra,
  };
}

describe('StudentActivityComponent', () => {
  let fixture: ComponentFixture<StudentActivityComponent>;
  let component: StudentActivityComponent;
  let routeData: BehaviorSubject<{ section: string }>;
  let api: ReturnType<typeof mockApi>;

  function mockApi() {
    return {
      getConversations: vi.fn(() => of(page<StudentConversation>([]))),
      getMessages: vi.fn(() => of(page<StudentMessage>([]))),
      sendMessage: vi.fn(() => of<unknown>({})),
      markConversationRead: vi.fn(() => of<unknown>({})),
      getExams: vi.fn(() => of(page<StudentExam>([]))),
      getSubscribedSubjects: vi.fn(() =>
        of([{ id: 'owned-subject', name: 'الرياضيات', nameAr: null, nameEn: null }]),
      ),
      createExam: vi.fn(() => of<unknown>({})),
      submitExam: vi.fn(() => of<unknown>({})),
      getAssignments: vi.fn(() => of(page<StudentAssignment>([]))),
      submitAssignment: vi.fn(() => of<unknown>({})),
    };
  }

  async function render(section = 'messages') {
    routeData.next({ section });
    fixture = TestBed.createComponent(StudentActivityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  }

  beforeEach(async () => {
    api = mockApi();
    routeData = new BehaviorSubject({ section: 'messages' });
    await TestBed.configureTestingModule({
      imports: [StudentActivityComponent],
      providers: [
        { provide: StudentService, useValue: api },
        { provide: ActivatedRoute, useValue: { data: routeData.asObservable() } },
      ],
    }).compileComponents();
  });

  it('performs no writes while opening any activity page', async () => {
    await render();
    routeData.next({ section: 'exams' });
    routeData.next({ section: 'assignments' });
    expect(api.getConversations).toHaveBeenCalledWith(1, 10);
    expect(api.getExams).toHaveBeenCalledOnce();
    expect(api.getAssignments).toHaveBeenCalledOnce();
    for (const write of [
      api.markConversationRead,
      api.sendMessage,
      api.createExam,
      api.submitExam,
      api.submitAssignment,
    ])
      expect(write).not.toHaveBeenCalled();
  });

  it('marks a conversation as read only after the selected thread loads, and skips known read threads', async () => {
    const response = new Subject<StudentPage<StudentMessage>>();
    api.getMessages.mockReturnValueOnce(response);
    await render();
    component.selectConversation(conversation);
    expect(api.markConversationRead).not.toHaveBeenCalled();
    response.next(page([]));
    expect(api.markConversationRead).toHaveBeenCalledExactlyOnceWith('owned-conversation');
    response.complete();
    component.selectConversation({ ...conversation, unreadCount: 0 });
    expect(api.markConversationRead).toHaveBeenCalledOnce();
  });

  it('preserves a failed message, blocks duplicate sends, and cancels a pending send on navigation', async () => {
    const send = new Subject<unknown>();
    api.sendMessage.mockReturnValue(send);
    await render();
    component.selectConversation({ ...conversation, unreadCount: 0 });
    component.messageBody = 'سؤالي الخاص';
    component.sendMessage();
    component.sendMessage();
    expect(api.sendMessage).toHaveBeenCalledExactlyOnceWith('owned-conversation', 'سؤالي الخاص');
    send.error(new Error('Unavailable'));
    expect(component.messageBody).toBe('سؤالي الخاص');
    expect(component.actionError()).not.toBe('');
    const retry = new Subject<unknown>();
    api.sendMessage.mockReturnValue(retry);
    component.sendMessage();
    expect(retry.observers.length).toBe(1);
    routeData.next({ section: 'exams' });
    expect(retry.observers.length).toBe(0);
    expect(component.actionPending()).toBe(false);
  });

  it('renders message bodies as plain text and paginates with the actual API metadata', async () => {
    api.getConversations.mockReturnValue(
      of(page([conversation], { pageNumber: 1, hasNextPage: true })),
    );
    api.getMessages.mockReturnValue(
      of(
        page([
          {
            id: 'message',
            body: '<img src=x onerror=alert(1)>',
            senderName: null,
            senderId: null,
            createdAt: null,
            isMine: null,
            raw: {},
          },
        ]),
      ),
    );
    await render();
    component.selectConversation({ ...conversation, unreadCount: 0 });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.activity-message-body').textContent).toContain(
      '<img src=x onerror=alert(1)>',
    );
    expect(fixture.nativeElement.querySelector('.activity-message-body img')).toBeNull();
    component.changePage(1);
    expect(api.getConversations).toHaveBeenLastCalledWith(2, 10);
  });

  it('cancels an older thread request when a different conversation is selected', async () => {
    const first = new Subject<StudentPage<StudentMessage>>();
    const second = new Subject<StudentPage<StudentMessage>>();
    api.getMessages.mockReturnValueOnce(first).mockReturnValueOnce(second);
    await render();
    component.selectConversation(conversation);
    component.selectConversation({ ...conversation, id: 'second-conversation' });
    expect(first.observers.length).toBe(0);
    first.next(page([]));
    expect(component.selectedConversation()?.id).toBe('second-conversation');
    expect(api.markConversationRead).not.toHaveBeenCalled();
    fixture.destroy();
    expect(second.observers.length).toBe(0);
  });

  it('requires a real subscribed subject and an explicit action before creating an exam', async () => {
    const pending = new Subject<unknown>();
    api.createExam.mockReturnValue(pending);
    await render('exams');
    expect(api.createExam).not.toHaveBeenCalled();
    component.examSubjectId = 'unknown-subject';
    component.createExam();
    expect(api.createExam).not.toHaveBeenCalled();
    component.examSubjectId = 'owned-subject';
    component.examQuestionCount = 5;
    component.examDifficulty = 'Hard';
    component.createExam();
    component.createExam();
    expect(api.createExam).toHaveBeenCalledExactlyOnceWith('owned-subject', 5, 'Hard');
    pending.next({});
    pending.complete();
    expect(api.getExams).toHaveBeenCalledTimes(2);
  });

  it('never invents questions or a score when the exam response is incomplete', async () => {
    await render('exams');
    component.selectExam(exam({ questions: [] }));
    component.submitExam();
    fixture.detectChanges();
    expect(api.submitExam).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('#studentActivityExamHeading')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.activity-score')).toBeNull();
    expect(component.examSubmitted(exam({ score: 0 }))).toBe(true);
    expect(
      component.examCanBeAnswered(
        exam({
          questions: [
            { id: 'duplicate', text: 'One', type: null, options: [] },
            { id: 'duplicate', text: 'Two', type: null, options: [] },
          ],
        }),
      ),
    ).toBe(false);
  });

  it('submits only actual question IDs, preserves failed answers, and prevents a second successful submission', async () => {
    const pending = new Subject<unknown>();
    api.submitExam.mockReturnValueOnce(pending).mockReturnValueOnce(of({}));
    api.getExams.mockReturnValue(of(page([exam()])));
    await render('exams');
    component.selectExam(exam());
    component.submitExam();
    expect(api.submitExam).not.toHaveBeenCalled();
    component.setAnswer('real-question', 'إجابتي');
    component.submitExam();
    component.submitExam();
    expect(api.submitExam).toHaveBeenCalledExactlyOnceWith('owned-exam', [
      { questionId: 'real-question', answer: 'إجابتي' },
    ]);
    pending.error(new Error('Unavailable'));
    expect(component.answers['real-question']).toBe('إجابتي');
    component.submitExam();
    component.submitExam();
    expect(api.submitExam).toHaveBeenCalledTimes(2);
    expect(component.examSubmitted(exam())).toBe(true);
  });

  it('saves a real file as a draft, then uses update mode for a later explicit submission', async () => {
    const pending = new Subject<unknown>();
    api.submitAssignment.mockReturnValueOnce(pending).mockReturnValueOnce(of({}));
    const file = new File(['answer'], 'answer.txt', { type: 'text/plain' });
    await render('assignments');
    component.selectAssignment(assignment());
    component.assignmentFile = file;
    component.saveAssignment(false);
    component.saveAssignment(false);
    expect(api.submitAssignment).toHaveBeenCalledExactlyOnceWith(
      'owned-assignment',
      { textAnswer: '', submit: false, file },
      false,
    );
    pending.next({});
    pending.complete();
    component.assignmentText = 'الإجابة النهائية';
    component.saveAssignment(true);
    expect(api.submitAssignment).toHaveBeenLastCalledWith(
      'owned-assignment',
      { textAnswer: 'الإجابة النهائية', submit: true, file },
      true,
    );
  });

  it('keeps text and selected files after a failed assignment and blocks empty submissions', async () => {
    api.submitAssignment.mockReturnValue(throwError(() => new Error('Unavailable')));
    await render('assignments');
    component.selectAssignment(assignment());
    component.saveAssignment(true);
    expect(api.submitAssignment).not.toHaveBeenCalled();
    const file = new File(['answer'], 'answer.txt');
    component.assignmentText = 'إجابة خاصة';
    component.assignmentFile = file;
    component.saveAssignment(true);
    expect(component.assignmentText).toBe('إجابة خاصة');
    expect(component.assignmentFile).toBe(file);
    expect(component.actionError()).not.toBe('');
  });

  it('allows only HTTPS attachment links without embedded credentials and does not invent dates', async () => {
    await render('assignments');
    for (const value of [
      'javascript:alert(1)',
      'data:text/html,test',
      'http://example.com/file',
      'https://user:pass@example.com/file',
      '/private/file',
    ])
      expect(component.safeFileUrl(value)).toBeNull();
    expect(component.safeFileUrl('https://example.com/answer.pdf')).toBe(
      'https://example.com/answer.pdf',
    );
    expect(component.dateLabel(null)).toBe(component.copy.unavailable);
    expect(component.dateLabel('not-a-date')).toBe(component.copy.unavailable);
  });
});
