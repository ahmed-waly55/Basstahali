import type { LegalDocument } from './legal-document';

export const TERMS_DOCUMENT: LegalDocument = {
  title: {
    ar: 'الشروط والأحكام',
    en: 'Terms and conditions',
  },
  introduction: {
    ar: 'توضح هذه الشروط كيفية استخدام بسطهالي والاستفسار عن باقات الحصص الخصوصية المباشرة أونلاين وترتيب الاشتراك فيها. يرجى قراءتها والتأكد من تفاصيل الباقة مع فريقنا قبل تأكيد الاشتراك.',
    en: 'These terms explain how to use Basstahali, enquire about live online private lesson packages, and arrange a subscription. Please read them and confirm the package details with our team before confirming your subscription.',
  },
  sections: [
    {
      id: 'educational-use',
      title: {
        ar: 'الاستخدام التعليمي وولي الأمر',
        en: 'Educational use and guardians',
      },
      paragraphs: [
        {
          ar: 'بسطهالي منصة للحصص الخصوصية المباشرة أونلاين، تساعد الطلاب على فهم موادهم الدراسية والتفاعل مع معلميهم. استخدم المنصة ووسائل التواصل المرتبطة بها للأغراض التعليمية وترتيب الحصص.',
          en: 'Basstahali is a platform for live online private lessons that helps students understand their school subjects and interact with their teachers. Use the platform and its associated communication channels for educational purposes and to arrange lessons.',
        },
        {
          ar: 'إذا كان الطالب قاصرًا، يجب أن يتولى ولي أمره تنسيق الاشتراك وتأكيد تفاصيله والتواصل مع الفريق عند الحاجة، مع متابعة استخدام الطالب للمنصة والحصص.',
          en: 'If a student is a minor, their parent or guardian must coordinate the subscription, confirm its details, and contact the team when needed, while overseeing the student’s use of the platform and participation in lessons.',
        },
      ],
    },
    {
      id: 'information-and-applications',
      title: {
        ar: 'صحة البيانات وطلبات انضمام المعلمين',
        en: 'Accurate information and teacher applications',
      },
      paragraphs: [
        {
          ar: 'قدّم بيانات صحيحة عند التواصل أو التسجيل أو طلب الاشتراك، وأبلغ الفريق إذا تغيّرت المعلومات اللازمة لترتيب الحصص أو التواصل معك. حافظ على سرية بيانات تسجيل دخولك.',
          en: 'Provide accurate information when contacting us, registering, or requesting a subscription, and tell the team if information needed to arrange lessons or contact you changes. Keep your login credentials confidential.',
        },
        {
          ar: 'يجب على المتقدم للانضمام إلى هيئة التدريس تقديم معلومات صحيحة عن نفسه والمواد والمناهج التي يرغب في تدريسها. إرسال الطلب أو الحصول على رقم طلب لا يعني قبوله؛ تُعرف نتيجة الطلب من متابعة حالته أو التواصل مع الفريق.',
          en: 'Applicants to join our teachers must provide accurate information about themselves and the subjects and curricula they wish to teach. Submitting an application or receiving an application number does not mean acceptance; the outcome can be checked through application tracking or by contacting the team.',
        },
      ],
    },
    {
      id: 'packages-and-prices',
      title: {
        ar: 'الباقات والأسعار المعروضة',
        en: 'Published packages and prices',
      },
      paragraphs: [
        {
          ar: 'تعرض صفحة الباقات عروض المنهج الانترناشونال والمنهج الوزاري بحسب المرحلة الدراسية. تشمل الباقات المعروضة 4 مواد دراسية ومادة إضافية هدية، مع 8 حصص لكل مادة. تظهر أسعار الباقات للزائر من مصر بالجنيه المصري بسعر تحويل ثابت 15 جنيهًا لكل درهم، وللزائر من باقي الدول بالدرهم الإماراتي.',
          en: 'The packages page presents International curriculum and UAE Ministry curriculum offers by school stage. The published packages include 4 school subjects and 1 extra subject for free, with 8 lessons per subject. Package prices for visitors from Egypt are shown in EGP at a fixed conversion of EGP 15 per AED; visitors from other countries see prices in UAE dirhams.',
        },
        {
          ar: 'راجع تفاصيل الباقة والسعر والعرض الظاهر في صفحة الباقات، ثم أكّد مع الفريق المواد التي ستدرسها والمرحلة والمنهج المناسبين لك قبل الاشتراك.',
          en: 'Review the package details, price, and offer shown on the packages page, then confirm the subjects you will study and the appropriate school stage and curriculum with the team before subscribing.',
        },
      ],
    },
    {
      id: 'subscription-confirmation',
      title: {
        ar: 'ترتيب الاشتراك وتأكيد التفاصيل',
        en: 'Arranging a subscription and confirming details',
      },
      paragraphs: [
        {
          ar: 'زر الاشتراك يفتح واتساب للتواصل مع فريق بسطهالي بشأن الباقة المختارة. قبل أي دفع، تأكد مع الفريق من المواد وعدد الحصص والمواعيد والسعر النهائي للباقة.',
          en: 'The subscription button opens WhatsApp to contact the Basstahali team about the selected package. Before making any payment, confirm the subjects, number of lessons, schedule, and final package price with the team.',
        },
        {
          ar: 'احتفظ بتأكيد تفاصيل الاشتراك والمراسلات المتعلقة به لتتمكن من الرجوع إليها عند ترتيب الحصص أو طلب المساعدة.',
          en: 'Keep your subscription details confirmation and related correspondence so you can refer to them when arranging lessons or requesting help.',
        },
      ],
    },
    {
      id: 'lesson-arrangements',
      title: {
        ar: 'الحصص والمواعيد',
        en: 'Lessons and schedules',
      },
      paragraphs: [
        {
          ar: 'تُرتّب مواعيد الحصص بالتواصل مع الفريق وفق المواد والباقة المتفق عليها. التزم بالمواعيد المؤكدة، وتواصل مبكرًا إذا واجهتك مشكلة في الحضور أو احتجت إلى طلب تغيير الموعد.',
          en: 'Lesson times are arranged with the team according to the agreed subjects and package. Attend at the confirmed times, and contact us early if you have difficulty attending or need to request a schedule change.',
        },
        {
          ar: 'للمشاركة في الحصص المباشرة، جهّز جهازًا مناسبًا واتصالًا بالإنترنت يسمح لك بمتابعة الشرح والتفاعل، وأبلغ الفريق عند وجود مشكلة تقنية تؤثر على حضورك.',
          en: 'To participate in live lessons, prepare a suitable device and an internet connection that allows you to follow the explanation and interact, and tell the team if a technical issue affects your attendance.',
        },
      ],
    },
    {
      id: 'respectful-conduct',
      title: {
        ar: 'احترام الطلاب والمعلمين',
        en: 'Respect for students and teachers',
      },
      paragraphs: [
        {
          ar: 'تعامل باحترام مع المعلمين والطلاب وفريق الدعم. تجنّب الإساءة أو التنمّر أو تعطيل الحصة أو إرسال محتوى غير مناسب، وحافظ على بيئة تساعد الجميع على التعلم.',
          en: 'Treat teachers, students, and the support team respectfully. Avoid abuse, bullying, disrupting lessons, or sending inappropriate content, and help maintain an environment where everyone can learn.',
        },
        {
          ar: 'احترم خصوصية المشاركين، ولا تنشر بيانات التواصل الخاصة بهم أو صورهم أو محادثاتهم دون إذنهم. وجّه الاستفسارات أو المشكلات المتعلقة بالحصة إلى فريق بسطهالي.',
          en: 'Respect participants’ privacy and do not publish their contact details, images, or conversations without their permission. Direct lesson-related questions or issues to the Basstahali team.',
        },
      ],
    },
    {
      id: 'content-and-recording',
      title: {
        ar: 'حقوق المحتوى وتسجيل الحصص',
        en: 'Content rights and lesson recordings',
      },
      paragraphs: [
        {
          ar: 'تظل حقوق المحتوى والمواد التعليمية لأصحابها. استخدم المواد التي تُتاح لك في الحصص لأغراض تعلمك الشخصي، ولا تشاركها أو تعيد نشرها أو تبيعها دون إذن صاحب الحق.',
          en: 'Content and educational materials remain the property of their respective rights holders. Use materials made available to you in lessons for your personal learning, and do not share, republish, or sell them without the rights holder’s permission.',
        },
        {
          ar: 'لا تسجّل الحصص أو تصوّرها أو تشارك تسجيلاتها دون الحصول على إذن من أصحاب المحتوى والمشاركين المعنيين.',
          en: 'Do not record or capture lessons, or share lesson recordings, without permission from the content rights holders and the participants concerned.',
        },
      ],
    },
    {
      id: 'changes-and-support',
      title: {
        ar: 'الإلغاء والتأجيل والاسترداد والتواصل',
        en: 'Cancellation, rescheduling, refunds, and contact',
      },
      paragraphs: [
        {
          ar: 'قبل تأكيد الاشتراك، اطلب من الفريق توضيح شروط الإلغاء والتأجيل والاسترداد التي تنطبق على الباقة التي اخترتها. إذا رغبت في تغيير الاشتراك أو واجهت مشكلة بعد تأكيده، تواصل مع الفريق لشرح طلبك ومراجعة التفاصيل المتفق عليها.',
          en: 'Before confirming your subscription, ask the team to explain the cancellation, rescheduling, and refund conditions that apply to your selected package. If you wish to change your subscription or encounter an issue after confirmation, contact the team to explain your request and review the agreed details.',
        },
        {
          ar: 'للاستفسار عن هذه الشروط أو تفاصيل الاشتراك، تواصل معنا عبر واتساب على +971563306087 أو البريد الإلكتروني support@basstahali.com.',
          en: 'For questions about these terms or subscription details, contact us on WhatsApp at +971563306087 or by email at support@basstahali.com.',
        },
      ],
    },
  ],
};
