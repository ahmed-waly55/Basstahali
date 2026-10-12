import type { LegalDocument } from './legal-document';

export const PRIVACY_DOCUMENT: LegalDocument = {
  title: {
    ar: 'سياسة الخصوصية',
    en: 'Privacy policy',
  },
  introduction: {
    ar: 'توضح هذه الصفحة المعلومات التي يقدمها المستخدم عبر موقع بسطهالي، وكيفية التواصل وحفظ تفضيلات التصفح واستخدام الخدمات الخارجية. نهدف إلى مساعدة ولي الأمر والمدرس على فهم المعلومات التي يختار مشاركتها أثناء استخدام الموقع.',
    en: 'This page explains the information users provide through the Basstahali website, how contact options work, how browsing preferences are saved, and how external services are used. It helps parents and teachers understand the information they choose to share when using the website.',
  },
  sections: [
    {
      id: 'information-you-provide',
      title: {
        ar: 'المعلومات التي تقدمها',
        en: 'Information you provide',
      },
      paragraphs: [
        {
          ar: 'يطلب نموذج الانضمام للمدرسين الاسم الكامل، البريد الإلكتروني، كلمة المرور، رقم واتساب، طريقة استلام المستحقات وبيانات الحساب، إلى جانب المنهج والمرحلة الدراسية والمواد التي يدرسها المدرس.',
          en: 'The teacher application form asks for a full name, email address, password, WhatsApp number, payout method and payout account details, as well as the curriculum, school stage and subjects the teacher teaches.',
        },
        {
          ar: 'عند إرسال نموذج الانضمام، تُرسل المعلومات التي أدخلتها إلى بسطهالي ضمن طلبك. يرجى تقديم بيانات صحيحة والاقتصار على المعلومات المطلوبة في حقول النموذج.',
          en: 'When you submit the teacher application form, the information you entered is sent to Basstahali as part of your application. Please provide accurate details and limit your submission to the information requested by the form.',
        },
      ],
    },
    {
      id: 'application-information',
      title: {
        ar: 'بيانات طلب الانضمام ومتابعته',
        en: 'Application information and status',
      },
      paragraphs: [
        {
          ar: 'تُرفق بيانات المدرس وتخصصاته وبيانات استلام المستحقات بطلب الانضمام. اختيار المنهج والمرحلة والمواد يساعد على تحديد ما يقدمه المدرس، ولا يحتاج تصفح قوائم المناهج العامة إلى إرسال نموذج انضمام.',
          en: 'Teacher details, teaching selections and payout information are included in the application. Curriculum, stage and subject selections identify what the teacher offers. Browsing the public curriculum lists does not require submitting a teacher application.',
        },
        {
          ar: 'تعرض صفحة متابعة الطلب الحالة التي تعيدها الخدمة عند الاستعلام برقم الطلب. قد تتطلب الخدمة رقم واتساب المسجل للتحقق من الاستعلام. احتفظ برقم طلبك وتجنب نشره مع بياناتك الشخصية في أماكن عامة.',
          en: 'The application status page displays the status returned by the service when checking an application number. The service may require the registered WhatsApp number to validate the enquiry. Keep your application number and avoid posting it alongside your personal information in public places.',
        },
      ],
    },
    {
      id: 'contact-and-whatsapp',
      title: {
        ar: 'التواصل عبر البريد وواتساب',
        en: 'Contact by email and WhatsApp',
      },
      paragraphs: [
        {
          ar: 'يتيح نموذج التواصل إدخال الاسم ورقم الهاتف والبريد الإلكتروني وموضوع الرسالة ونصها. زر النموذج يفتح مسودة في تطبيق البريد لديك إلى support@basstahali.com، ويضع بيانات النموذج في الرسالة. يمكنك مراجعتها قبل إرسالها من تطبيق البريد؛ الموقع لا يرسل الرسالة نيابةً عنك.',
          en: 'The contact form lets you enter a name, phone number, email address, subject and message. Its button opens a draft addressed to support@basstahali.com in your email application and includes the form details in the message. You can review it before sending it from your email application; the website does not send the message on your behalf.',
        },
        {
          ar: 'تنتقل روابط الاستفسار والاشتراك إلى واتساب على الرقم +971 56 330 6087، وقد تتضمن رسالة جاهزة عن الباقة أو الخدمة التي اخترتها. راجع الرسالة قبل إرسالها. استخدام البريد وواتساب يخضع أيضًا لسياسات وإعدادات مزودي هذه الخدمات.',
          en: 'Enquiry and subscription links open WhatsApp for +971 56 330 6087 and may include a prepared message about the package or service you selected. Review the message before sending it. Email and WhatsApp use is also subject to those providers’ policies and settings.',
        },
      ],
    },
    {
      id: 'browser-preferences',
      title: {
        ar: 'تفضيلات اللغة والمظهر',
        en: 'Language and appearance preferences',
      },
      paragraphs: [
        {
          ar: 'يحفظ الموقع تفضيل اللغة العربية أو الإنجليزية وتفضيل المظهر الفاتح أو الداكن في التخزين المحلي لمتصفحك، حتى يحتفظ بهذه الاختيارات عند الزيارة التالية من المتصفح نفسه.',
          en: 'The website saves your Arabic or English language preference and your light or dark appearance preference in your browser’s local storage, so these choices can be kept for your next visit using the same browser.',
        },
        {
          ar: 'يمكنك تغيير هذه التفضيلات من أدوات الموقع أو إزالة بيانات الموقع من إعدادات المتصفح. إزالة بيانات المتصفح تعيد ضبط التفضيلات المحلية، ولا تحذف طلبات الانضمام التي سبق إرسالها إلى الخدمة.',
          en: 'You can change these preferences using the website controls or remove website data in your browser settings. Removing browser data resets local preferences and does not delete applications already submitted to the service.',
        },
      ],
    },
    {
      id: 'external-services',
      title: {
        ar: 'المحتوى والروابط الخارجية',
        en: 'External content and links',
      },
      paragraphs: [
        {
          ar: 'قد تُحمّل بعض الصور والأيقونات وملفات العرض من خدمات خارجية، منها DiceBear وUnsplash وcdnjs. تتضمن الصفحة أيضًا ملفًا خارجيًا من Google AdSense. تحميل مورد خارجي ينشئ اتصالًا بمزوده، وقد يتضمن طلب التحميل معلومات مثل عنوان الشبكة ونوع المتصفح؛ تخضع معالجة هذه الطلبات لسياسة المزود.',
          en: 'Some images, icons and display resources may load from external services, including DiceBear, Unsplash and cdnjs. The page also includes an external Google AdSense script. Loading an external resource creates a connection to its provider, and the request may include information such as a network address and browser type. The provider’s policy governs its processing of these requests.',
        },
        {
          ar: 'قد تستخدم الخدمات الخارجية ملفات تعريف الارتباط وفق سياساتها وإعداداتها. يمكنك إدارة هذه الملفات أو حظرها من إعدادات المتصفح، مع مراعاة أن بعض وظائف الخدمات الخارجية قد تتأثر.',
          en: 'External services may use cookies according to their policies and settings. You can manage or block these cookies in your browser settings, although this may affect some features of external services.',
        },
        {
          ar: 'روابط Facebook وInstagram وTikTok وWhatsApp تنقلك إلى خدمات خارج موقع بسطهالي. راجع سياسة الخصوصية وإعدادات المشاركة في الخدمة الخارجية قبل إرسال معلومات شخصية أو متابعة الحسابات من خلالها.',
          en: 'Facebook, Instagram, TikTok and WhatsApp links take you to services outside the Basstahali website. Review the external service’s privacy policy and sharing settings before sending personal information or following accounts through it.',
        },
      ],
    },
    {
      id: 'students-and-parents',
      title: {
        ar: 'الطلاب القاصرون ومشاركة ولي الأمر',
        en: 'Younger students and parental involvement',
      },
      paragraphs: [
        {
          ar: 'لأن الخدمة التعليمية قد يستخدمها طلاب قاصرون، نشجع ولي الأمر على المشاركة في اختيار الحصص ومراجعة التواصل والحجز، ومساعدة الطالب على تحديد المعلومات المناسبة للمشاركة.',
          en: 'Because the learning service may be used by younger students, we encourage parents or guardians to take part in choosing lessons, reviewing communications and bookings, and helping students decide what information is appropriate to share.',
        },
        {
          ar: 'اكتفِ بالمعلومات اللازمة للاستفسار أو ترتيب الدراسة. تجنب إرسال صور خاصة للطالب أو وثائق هوية أو معلومات صحية حساسة عبر الرسائل، وراجع ما يشاركه الطالب مع الخدمات الخارجية.',
          en: 'Share only the information needed for an enquiry or to arrange learning. Avoid sending private student images, identity documents or sensitive health information through messages, and review what the student shares with external services.',
        },
      ],
    },
    {
      id: 'careful-sharing',
      title: {
        ar: 'مشاركة المعلومات بعناية',
        en: 'Sharing information carefully',
      },
      paragraphs: [
        {
          ar: 'استخدم كلمة مرور لا تستخدمها لحسابات أخرى، ولا ترسلها عبر البريد أو واتساب. أدخل بيانات استلام المستحقات المطلوبة في حقول نموذج المدرس، وتجنب إدخال كلمات مرور الخدمات المالية أو الرموز السرية للبطاقات.',
          en: 'Use a password that you do not use for other accounts, and do not send it by email or WhatsApp. Enter the requested payout information in the teacher form fields, and avoid entering passwords for financial services or card PINs.',
        },
      ],
    },
    {
      id: 'privacy-enquiries',
      title: {
        ar: 'الاستفسارات وطلب تصحيح البيانات',
        en: 'Enquiries and requests to correct information',
      },
      paragraphs: [
        {
          ar: 'إذا كان لديك سؤال عن هذه الصفحة أو رغبت في طلب تصحيح معلومات قدمتها، تواصل عبر support@basstahali.com أو واتساب +971 56 330 6087. اشرح موضوع طلبك والتصحيح المطلوب بإيجاز، واذكر رقم الطلب عند الحاجة دون إرفاق كلمة مرور أو معلومات مالية حساسة.',
          en: 'If you have a question about this page or would like to request a correction to information you provided, contact support@basstahali.com or WhatsApp +971 56 330 6087. Briefly explain your request and the correction you are seeking, and include an application number when needed without attaching a password or sensitive financial information.',
        },
      ],
    },
  ],
};
