export interface LegalSection {
  id: string;
  title: string;
  paragraphs: readonly string[];
}

export interface LegalDocument {
  title: string;
  introduction: string;
  sections: readonly LegalSection[];
}
