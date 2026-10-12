export interface LegalText {
  ar: string;
  en: string;
}

export interface LegalSection {
  id: string;
  title: LegalText;
  paragraphs: readonly LegalText[];
}

export interface LegalDocument {
  title: LegalText;
  introduction: LegalText;
  sections: readonly LegalSection[];
}
