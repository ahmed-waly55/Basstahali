import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  LOCALE_ID,
  OnInit,
  PLATFORM_ID,
  computed,
  signal,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize, Subscription } from 'rxjs';
import { StudentService } from '../../core/student/student.service';
import type {
  StudentAssignment,
  StudentConversation,
  StudentExam,
  StudentExamOption,
  StudentExamQuestion,
  StudentMessage,
  StudentPage,
  StudentSubject,
} from '../../core/student/student.models';

type ActivitySection = 'messages' | 'exams' | 'assignments';
type ExamDifficulty = 'Easy' | 'Medium' | 'Hard';

@Component({
  selector: 'app-student-activity',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './student-activity.component.html',
  styleUrl: './student-activity.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentActivityComponent implements OnInit {
  @ViewChild('assignmentFileInput') private assignmentFileInput?: ElementRef<HTMLInputElement>;
  private readonly api = inject(StudentService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly locale = inject(LOCALE_ID);
  private listRequest?: Subscription;
  private detailRequest?: Subscription;
  private subjectsRequest?: Subscription;
  private actionRequest?: Subscription;
  private readRequest?: Subscription;
  private readonly submittedExams = new Set<string>();

  readonly section = signal<ActivitySection>('messages');
  readonly loading = signal(false);
  readonly error = signal('');
  readonly notice = signal('');
  readonly actionError = signal('');
  readonly actionPending = signal(false);
  readonly actionKind = signal('');
  readonly page = signal(1);
  readonly pageSize = 10;
  readonly conversations = signal<StudentPage<StudentConversation> | null>(null);
  readonly exams = signal<StudentPage<StudentExam> | null>(null);
  readonly assignments = signal<StudentPage<StudentAssignment> | null>(null);
  readonly visibleExams = computed(
    () =>
      this.exams()?.items.slice((this.page() - 1) * this.pageSize, this.page() * this.pageSize) ??
      [],
  );
  readonly visibleAssignments = computed(
    () =>
      this.assignments()?.items.slice(
        (this.page() - 1) * this.pageSize,
        this.page() * this.pageSize,
      ) ?? [],
  );

  readonly selectedConversation = signal<StudentConversation | null>(null);
  readonly messages = signal<StudentPage<StudentMessage> | null>(null);
  readonly messageLoading = signal(false);
  readonly messageError = signal('');
  readonly readError = signal('');
  readonly messagePage = signal(1);
  readonly messagePageSize = 30;
  messageBody = '';

  readonly selectedExam = signal<StudentExam | null>(null);
  readonly subjects = signal<StudentSubject[]>([]);
  readonly subjectsLoading = signal(false);
  readonly subjectsError = signal('');
  examSubjectId = '';
  examQuestionCount = 10;
  examDifficulty: ExamDifficulty = 'Easy';
  answers: Record<string, string> = {};

  readonly selectedAssignment = signal<StudentAssignment | null>(null);
  assignmentText = '';
  assignmentFile: File | null = null;
  updateAssignment = false;

  readonly copy = {
    support: $localize`:@@studentActivitySupport:تحتاج مساعدة؟`,
    supportLink: $localize`:@@studentActivitySupportLink:تواصل مع فريق بسطهالي`,
    eyebrow: $localize`:@@studentActivityEyebrow:مساحتي التعليمية`,
    messagesIntro: $localize`:@@studentActivityMessagesIntro:تابع محادثاتك وأرسل أسئلتك في مكان واحد.`,
    examsIntro: $localize`:@@studentActivityExamsIntro:تدرّب على مواد اشتراكك وتابع اختباراتك ونتائجك.`,
    assignmentsIntro: $localize`:@@studentActivityAssignmentsIntro:راجع الواجبات واحفظ إجابتك أو أرسلها للمتابعة.`,
    refresh: $localize`:@@studentActivityRefresh:تحديث`,
    loading: $localize`:@@studentActivityLoading:جارٍ تحميل بياناتك…`,
    retry: $localize`:@@studentActivityRetry:إعادة المحاولة`,
    conversations: $localize`:@@studentActivityConversations:المحادثات`,
    noConversations: $localize`:@@studentActivityNoConversations:لا توجد محادثات لعرضها حاليًا.`,
    retryRead: $localize`:@@studentActivityRetryRead:تحديث حالة القراءة`,
    messagesLoading: $localize`:@@studentActivityMessagesLoading:جارٍ تحميل الرسائل…`,
    retryMessages: $localize`:@@studentActivityRetryMessages:إعادة تحميل الرسائل`,
    noMessages: $localize`:@@studentActivityNoMessages:لا توجد رسائل في هذه المحادثة بعد.`,
    previousMessages: $localize`:@@studentActivityPreviousMessages:السابق`,
    nextMessages: $localize`:@@studentActivityNextMessages:التالي`,
    conversationClosed: $localize`:@@studentActivityConversationClosed:هذه المحادثة مغلقة للرسائل الجديدة.`,
    yourMessage: $localize`:@@studentActivityYourMessage:رسالتك`,
    sendingMessage: $localize`:@@studentActivitySendingMessage:جارٍ الإرسال…`,
    sendMessage: $localize`:@@studentActivitySendMessage:إرسال الرسالة`,
    chooseConversation: $localize`:@@studentActivityChooseConversation:اختر محادثة`,
    chooseConversationHelp: $localize`:@@studentActivityChooseConversationHelp:ستظهر الرسائل هنا بعد اختيار محادثة من قائمتك.`,
    createHeading: $localize`:@@studentActivityCreateHeading:اختبار تدريبي جديد`,
    createHelp: $localize`:@@studentActivityCreateHelp:اختر مادة من مواد اشتراكك، وحدد عدد الأسئلة ومستوى الصعوبة.`,
    subjectsLoading: $localize`:@@studentActivitySubjectsLoading:جارٍ تحميل المواد…`,
    retrySubjects: $localize`:@@studentActivityRetrySubjects:إعادة تحميل المواد`,
    noExamSubjects: $localize`:@@studentActivityNoExamSubjects:لم تتوفر مواد مرتبطة باشتراكك لإنشاء اختبار. يمكنك متابعة الاختبارات الموجودة أدناه.`,
    examSubject: $localize`:@@studentActivityExamSubject:المادة`,
    chooseSubject: $localize`:@@studentActivityChooseSubject:اختر من مواد اشتراكك`,
    questionCount: $localize`:@@studentActivityQuestionCount:عدد الأسئلة`,
    difficulty: $localize`:@@studentActivityDifficulty:الصعوبة`,
    easy: $localize`:@@studentActivityEasy:سهل`,
    medium: $localize`:@@studentActivityMedium:متوسط`,
    hard: $localize`:@@studentActivityHard:صعب`,
    creatingExam: $localize`:@@studentActivityCreatingExam:جارٍ الإنشاء…`,
    createExam: $localize`:@@studentActivityCreateExam:إنشاء الاختبار`,
    noExams: $localize`:@@studentActivityNoExams:لا توجد اختبارات في حسابك حاليًا.`,
    openExam: $localize`:@@studentActivityOpenExam:عرض الاختبار`,
    closeExam: $localize`:@@studentActivityCloseExam:إغلاق التفاصيل`,
    examAlreadySent: $localize`:@@studentActivityExamAlreadySent:تم إرسال إجابات هذا الاختبار.`,
    submittingExam: $localize`:@@studentActivitySubmittingExam:جارٍ إرسال الإجابات…`,
    submitExam: $localize`:@@studentActivitySubmitExam:إرسال الإجابات`,
    examQuestionsUnavailable: $localize`:@@studentActivityExamQuestionsUnavailable:أسئلة هذا الاختبار غير متاحة للإجابة في حسابك حاليًا. حدّث القائمة أو تواصل مع الدعم للمساعدة.`,
    noAssignments: $localize`:@@studentActivityNoAssignments:لا توجد واجبات لعرضها حاليًا.`,
    openAssignment: $localize`:@@studentActivityOpenAssignment:عرض الواجب`,
    closeAssignment: $localize`:@@studentActivityCloseAssignment:إغلاق التفاصيل`,
    attachedFile: $localize`:@@studentActivityAttachedFile:فتح الملف المرفق`,
    assignmentAnswer: $localize`:@@studentActivityAssignmentAnswer:إجابتك`,
    assignmentFile: $localize`:@@studentActivityAssignmentFile:إرفاق ملف للإجابة`,
    updateAssignment: $localize`:@@studentActivityUpdateAssignment:لدي إجابة سابقة لهذا الواجب وأريد تحديثها`,
    assignmentHelp: $localize`:@@studentActivityAssignmentHelp:اكتب إجابتك أو أرفق ملفًا. حفظ المسودة يتيح لك إرسال الإجابة لاحقًا.`,
    savingDraft: $localize`:@@studentActivitySavingDraft:جارٍ الحفظ…`,
    saveDraft: $localize`:@@studentActivitySaveDraft:حفظ المسودة`,
    submittingAssignment: $localize`:@@studentActivitySubmittingAssignment:جارٍ إرسال الإجابة…`,
    submitAssignment: $localize`:@@studentActivitySubmitAssignment:إرسال الإجابة`,
    assignmentUnavailable: $localize`:@@studentActivityAssignmentUnavailable:بيانات هذا الواجب غير مكتملة للإرسال. حدّث القائمة أو تواصل مع الدعم.`,
    previousPage: $localize`:@@studentActivityPreviousPage:السابق`,
    nextPage: $localize`:@@studentActivityNextPage:التالي`,
    messagePages: $localize`:@@studentActivityMessagePages:صفحات الرسائل`,
    listPages: $localize`:@@studentActivityListPages:صفحات القائمة`,
    messagesTitle: $localize`:@@studentActivityMessagesTitle:الرسائل`,
    examsTitle: $localize`:@@studentActivityExamsTitle:اختباراتي`,
    assignmentsTitle: $localize`:@@studentActivityAssignmentsTitle:الواجبات`,
    conversation: $localize`:@@studentActivityConversationFallback:محادثة`,
    exam: $localize`:@@studentActivityExamFallback:اختبار`,
    assignment: $localize`:@@studentActivityAssignmentFallback:واجب دراسي`,
    sender: $localize`:@@studentActivitySenderFallback:المرسل`,
    you: $localize`:@@studentActivityYou:أنت`,
    unavailable: $localize`:@@studentActivityUnavailable:غير متاح`,
    loadFailed: $localize`:@@studentActivityLoadFailed:تعذر تحميل البيانات. أعد المحاولة.`,
    messageFailed: $localize`:@@studentActivityMessageFailed:تعذر إرسال الرسالة. احتفظنا بالنص لتعيد المحاولة.`,
    messageSent: $localize`:@@studentActivityMessageSent:تم إرسال رسالتك.`,
    readFailed: $localize`:@@studentActivityReadFailed:تعذر تحديث حالة قراءة المحادثة.`,
    examFailed: $localize`:@@studentActivityExamFailed:تعذر إرسال الإجابات. احتفظنا بإجاباتك لتعيد المحاولة.`,
    examSent: $localize`:@@studentActivityExamSent:تم إرسال إجاباتك. ستظهر النتيجة عند إتاحتها من المنصة.`,
    createFailed: $localize`:@@studentActivityCreateFailed:تعذر إنشاء الاختبار. راجع الخيارات وأعد المحاولة.`,
    examCreated: $localize`:@@studentActivityExamCreated:تم إنشاء الاختبار. حدّث القائمة لعرض الاختبار إذا لم يظهر بعد.`,
    subjectsFailed: $localize`:@@studentActivitySubjectsFailed:تعذر تحميل مواد اشتراكك.`,
    saveFailed: $localize`:@@studentActivitySaveFailed:تعذر حفظ الإجابة. احتفظنا بالنص والملف لتعيد المحاولة.`,
    draftSaved: $localize`:@@studentActivityDraftSaved:تم حفظ المسودة.`,
    assignmentSent: $localize`:@@studentActivityAssignmentSent:تم إرسال إجابة الواجب.`,
  };

  constructor() {
    this.destroyRef.onDestroy(() => this.cancelRequests());
  }

  ngOnInit(): void {
    this.route.data.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data) => {
      this.cancelRequests();
      this.reset();
      const section = data['section'];
      this.section.set(section === 'exams' || section === 'assignments' ? section : 'messages');
      if (this.browser) {
        this.fetchList();
        if (this.section() === 'exams') this.loadSubjects();
      }
    });
  }

  title(): string {
    return this.section() === 'messages'
      ? this.copy.messagesTitle
      : this.section() === 'exams'
        ? this.copy.examsTitle
        : this.copy.assignmentsTitle;
  }

  reload(): void {
    if (!this.actionPending()) this.fetchList();
  }

  changePage(direction: number): void {
    if (this.loading() || this.actionPending()) return;
    const next = this.page() + direction;
    if (next < 1 || (direction > 0 && !this.hasNextPage())) return;
    this.page.set(next);
    if (this.section() === 'messages') this.fetchList();
  }

  hasNextPage(): boolean {
    if (this.section() === 'messages')
      return this.nextPage(this.conversations(), this.page(), this.pageSize);
    const count =
      this.section() === 'exams' ? this.exams()?.items.length : this.assignments()?.items.length;
    return (count ?? 0) > this.page() * this.pageSize;
  }

  pageLabel(value: number): string {
    return $localize`:@@studentActivityPage:الصفحة ${value}:page:`;
  }

  unreadLabel(count: number): string {
    return $localize`:@@studentActivityUnread:${count}:count: غير مقروءة`;
  }

  dueDateLabel(value: string): string {
    return $localize`:@@studentActivityDueDate:الموعد: ${this.dateLabel(value)}:date:`;
  }

  scoreLabel(score: number, maximum: number | null): string {
    return maximum === null
      ? $localize`:@@studentActivityScore:الدرجة: ${score}:score:`
      : $localize`:@@studentActivityScoreWithMax:الدرجة: ${score}:score: / ${maximum}:max:`;
  }

  conversationTitle(conversation: StudentConversation): string {
    return conversation.title || conversation.subject || this.copy.conversation;
  }

  selectConversation(conversation: StudentConversation): void {
    if (!conversation.id || this.actionPending()) return;
    this.detailRequest?.unsubscribe();
    this.readRequest?.unsubscribe();
    this.selectedConversation.set(conversation);
    this.messages.set(null);
    this.messageBody = '';
    this.notice.set('');
    this.actionError.set('');
    this.readError.set('');
    this.loadMessages(1, true);
  }

  loadMessages(page = this.messagePage(), markRead = false): void {
    const conversation = this.selectedConversation();
    if (!conversation?.id || this.actionPending() || page < 1) return;
    if (
      page > this.messagePage() &&
      !this.nextPage(this.messages(), this.messagePage(), this.messagePageSize)
    )
      return;
    this.detailRequest?.unsubscribe();
    this.messagePage.set(page);
    this.messageLoading.set(true);
    this.messageError.set('');
    this.detailRequest = this.api
      .getMessages(conversation.id, page, this.messagePageSize)
      .pipe(finalize(() => this.messageLoading.set(false)))
      .subscribe({
        next: (result) => {
          this.messages.set(result);
          if (result.pageNumber !== null && result.pageNumber >= 1)
            this.messagePage.set(result.pageNumber);
          if (markRead && conversation.unreadCount !== 0) this.markRead();
        },
        error: () => this.messageError.set(this.copy.loadFailed),
      });
  }

  hasMoreMessages(): boolean {
    return this.nextPage(this.messages(), this.messagePage(), this.messagePageSize);
  }

  markRead(): void {
    const conversation = this.selectedConversation();
    if (!conversation?.id) return;
    this.readRequest?.unsubscribe();
    this.readError.set('');
    this.readRequest = this.api.markConversationRead(conversation.id).subscribe({
      next: () => {
        this.selectedConversation.update((value) => (value ? { ...value, unreadCount: 0 } : value));
        this.conversations.update((value) =>
          value
            ? {
                ...value,
                items: value.items.map((item) =>
                  item.id === conversation.id ? { ...item, unreadCount: 0 } : item,
                ),
              }
            : value,
        );
      },
      error: () => this.readError.set(this.copy.readFailed),
    });
  }

  conversationClosed(): boolean {
    return ['closed', 'resolved', 'archived'].includes(
      this.selectedConversation()?.status?.toLowerCase() ?? '',
    );
  }

  sendMessage(): void {
    const conversation = this.selectedConversation();
    const body = this.messageBody.trim();
    if (!conversation?.id || !body || this.actionPending() || this.conversationClosed()) return;
    this.beginAction('message');
    this.actionRequest = this.api
      .sendMessage(conversation.id, body)
      .pipe(finalize(() => this.actionPending.set(false)))
      .subscribe({
        next: () => {
          this.messageBody = '';
          this.notice.set(this.copy.messageSent);
          this.actionPending.set(false);
          this.loadMessages(1);
          this.fetchList();
        },
        error: () => this.actionError.set(this.copy.messageFailed),
      });
  }

  loadSubjects(): void {
    if (!this.browser) return;
    this.subjectsRequest?.unsubscribe();
    this.subjectsLoading.set(true);
    this.subjectsError.set('');
    this.subjectsRequest = this.api
      .getSubscribedSubjects()
      .pipe(finalize(() => this.subjectsLoading.set(false)))
      .subscribe({
        next: (items) => {
          this.subjects.set(items);
          if (!items.some((item) => item.id === this.examSubjectId)) this.examSubjectId = '';
        },
        error: () => this.subjectsError.set(this.copy.subjectsFailed),
      });
  }

  subjectName(subject: StudentSubject): string {
    return (
      (this.locale.startsWith('en')
        ? subject.nameEn || subject.nameAr
        : subject.nameAr || subject.nameEn) ||
      subject.name ||
      this.copy.unavailable
    );
  }

  createExam(): void {
    if (
      this.actionPending() ||
      !this.subjects().some((subject) => subject.id === this.examSubjectId)
    )
      return;
    if (
      !Number.isInteger(Number(this.examQuestionCount)) ||
      Number(this.examQuestionCount) < 1 ||
      !['Easy', 'Medium', 'Hard'].includes(this.examDifficulty)
    )
      return;
    this.beginAction('create');
    this.actionRequest = this.api
      .createExam(this.examSubjectId, Number(this.examQuestionCount), this.examDifficulty)
      .pipe(finalize(() => this.actionPending.set(false)))
      .subscribe({
        next: () => {
          this.notice.set(this.copy.examCreated);
          this.page.set(1);
          this.fetchList();
        },
        error: () => this.actionError.set(this.copy.createFailed),
      });
  }

  selectExam(exam: StudentExam): void {
    if (this.actionPending()) return;
    this.selectedExam.set(exam);
    this.answers = {};
    this.actionError.set('');
    this.notice.set('');
  }

  examSubmitted(exam: StudentExam): boolean {
    return Boolean(
      exam.isSubmitted ||
      exam.submittedAt ||
      (exam.id && this.submittedExams.has(exam.id)) ||
      exam.score !== null ||
      ['submitted', 'completed', 'graded', 'finished'].includes(exam.status?.toLowerCase() ?? ''),
    );
  }

  examCanBeAnswered(exam: StudentExam): boolean {
    const ids = exam.questions.map((question) => question.id).filter(Boolean);
    return Boolean(
      exam.id &&
      exam.questions.length &&
      ids.length === exam.questions.length &&
      new Set(ids).size === ids.length &&
      exam.questions.every((question) => question.text) &&
      !this.examSubmitted(exam) &&
      !['closed', 'cancelled', 'canceled', 'expired'].includes(exam.status?.toLowerCase() ?? ''),
    );
  }

  optionValue(option: StudentExamOption): string | null {
    return option.value || option.text;
  }

  questionHasOptions(question: StudentExamQuestion): boolean {
    return (
      question.options.length > 0 &&
      question.options.every((option) => option.text && this.optionValue(option))
    );
  }

  setAnswer(questionId: string, answer: string): void {
    this.answers = { ...this.answers, [questionId]: answer };
  }

  allQuestionsAnswered(exam: StudentExam): boolean {
    return (
      this.examCanBeAnswered(exam) &&
      exam.questions.every((question) => question.id && this.answers[question.id]?.trim())
    );
  }

  submitExam(): void {
    const exam = this.selectedExam();
    if (!exam?.id || this.actionPending() || !this.allQuestionsAnswered(exam)) return;
    const id = exam.id;
    const answers = exam.questions.map((question) => ({
      questionId: question.id!,
      answer: this.answers[question.id!].trim(),
    }));
    this.beginAction('exam');
    this.actionRequest = this.api
      .submitExam(id, answers)
      .pipe(finalize(() => this.actionPending.set(false)))
      .subscribe({
        next: () => {
          this.submittedExams.add(id);
          this.notice.set(this.copy.examSent);
          this.fetchList();
        },
        error: () => this.actionError.set(this.copy.examFailed),
      });
  }

  selectAssignment(assignment: StudentAssignment): void {
    if (this.actionPending()) return;
    this.selectedAssignment.set(assignment);
    this.assignmentText = assignment.textAnswer ?? '';
    this.assignmentFile = null;
    if (this.assignmentFileInput) this.assignmentFileInput.nativeElement.value = '';
    this.updateAssignment =
      assignment.textAnswer !== null ||
      assignment.fileUrl !== null ||
      Boolean(assignment.raw['submission']);
    this.notice.set('');
    this.actionError.set('');
  }

  chooseFile(event: Event): void {
    this.assignmentFile = (event.target as HTMLInputElement).files?.item(0) ?? null;
  }

  assignmentHasAnswer(): boolean {
    return Boolean(
      this.assignmentText.trim() ||
      this.assignmentFile ||
      (this.updateAssignment && this.selectedAssignment()?.fileUrl),
    );
  }

  saveAssignment(submit: boolean): void {
    const assignment = this.selectedAssignment();
    if (!assignment?.id || this.actionPending() || !this.assignmentHasAnswer()) return;
    this.beginAction(submit ? 'assignment' : 'draft');
    this.actionRequest = this.api
      .submitAssignment(
        assignment.id,
        {
          textAnswer: this.assignmentText,
          submit,
          ...(this.assignmentFile ? { file: this.assignmentFile } : {}),
        },
        this.updateAssignment,
      )
      .pipe(finalize(() => this.actionPending.set(false)))
      .subscribe({
        next: () => {
          this.updateAssignment = true;
          this.notice.set(submit ? this.copy.assignmentSent : this.copy.draftSaved);
          this.fetchList();
        },
        error: () => this.actionError.set(this.copy.saveFailed),
      });
  }

  safeFileUrl(value: string | null): string | null {
    if (!value) return null;
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
    } catch {
      return null;
    }
  }

  dateLabel(value: string | null): string {
    if (!value) return this.copy.unavailable;
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? this.copy.unavailable
      : new Intl.DateTimeFormat(this.locale.startsWith('en') ? 'en' : 'ar', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(date);
  }

  private fetchList(): void {
    this.listRequest?.unsubscribe();
    this.loading.set(true);
    this.error.set('');
    const fail = () => this.error.set(this.copy.loadFailed);
    const done = () => this.loading.set(false);
    if (this.section() === 'messages') {
      this.listRequest = this.api
        .getConversations(this.page(), this.pageSize)
        .pipe(finalize(done))
        .subscribe({
          next: (result) => {
            this.conversations.set(result);
            if (result.pageNumber !== null && result.pageNumber >= 1)
              this.page.set(result.pageNumber);
          },
          error: fail,
        });
    } else if (this.section() === 'exams') {
      this.listRequest = this.api
        .getExams()
        .pipe(finalize(done))
        .subscribe({
          next: (result) => {
            this.exams.set(result);
            this.clampPage(result.items.length);
            const id = this.selectedExam()?.id;
            if (id) this.selectedExam.set(result.items.find((exam) => exam.id === id) ?? null);
          },
          error: fail,
        });
    } else {
      this.listRequest = this.api
        .getAssignments()
        .pipe(finalize(done))
        .subscribe({
          next: (result) => {
            this.assignments.set(result);
            this.clampPage(result.items.length);
          },
          error: fail,
        });
    }
  }

  private nextPage<T>(result: StudentPage<T> | null, page: number, size: number): boolean {
    if (!result) return false;
    if (result.hasNextPage !== null) return result.hasNextPage;
    if (result.totalPages !== null) return page < result.totalPages;
    if (result.totalCount !== null) return page * size < result.totalCount;
    return result.items.length >= size;
  }

  private clampPage(count: number): void {
    this.page.set(Math.min(this.page(), Math.max(1, Math.ceil(count / this.pageSize))));
  }

  private beginAction(kind: string): void {
    this.actionPending.set(true);
    this.actionKind.set(kind);
    this.actionError.set('');
    this.notice.set('');
  }

  private cancelRequests(): void {
    this.listRequest?.unsubscribe();
    this.detailRequest?.unsubscribe();
    this.subjectsRequest?.unsubscribe();
    this.actionRequest?.unsubscribe();
    this.readRequest?.unsubscribe();
  }

  private reset(): void {
    this.loading.set(false);
    this.error.set('');
    this.notice.set('');
    this.actionError.set('');
    this.actionPending.set(false);
    this.actionKind.set('');
    this.page.set(1);
    this.conversations.set(null);
    this.exams.set(null);
    this.assignments.set(null);
    this.selectedConversation.set(null);
    this.selectedExam.set(null);
    this.selectedAssignment.set(null);
    this.messages.set(null);
    this.subjects.set([]);
    this.messageError.set('');
    this.readError.set('');
    this.messageLoading.set(false);
    this.messagePage.set(1);
    this.subjectsError.set('');
    this.subjectsLoading.set(false);
    this.messageBody = '';
    this.examSubjectId = '';
    this.answers = {};
    this.assignmentText = '';
    this.assignmentFile = null;
    this.updateAssignment = false;
  }
}
