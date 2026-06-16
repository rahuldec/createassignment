export const SUBJECTS = [
  "English",
  "Mathematics",
  "Science",
  "Social Science",
  "Hindi",
  "Computer Science",
  "Other",
] as const;

export const QUESTION_TYPES = [
  "MCQ",
  "Short Answer",
  "Long Answer",
  "Assertion & Reason",
  "True / False",
  "Fill in the Blanks",
] as const;

export const DIFFICULTY_LEVELS = ["Easy", "Medium", "Hard"] as const;

export const BLOOMS_LEVELS = [
  "Remember",
  "Understand",
  "Apply",
  "Analyze",
  "Evaluate",
  "Create",
] as const;

export const CLASSES = Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`);

export type QuestionType = (typeof QUESTION_TYPES)[number];

export interface QuestionGroup {
  id: string;
  type: QuestionType;
  count: number;
}

export interface AssignmentHeader {
  schoolName: string;
  schoolLogo: string | null; // data URL
  examName: string;
  className: string;
  subject: string;
  topic: string;
  maxMarks: string;
  duration: string;
  instructions: string;
}

export interface GenerationConfig {
  className: string;
  subject: string;
  topic: string;
  groups: QuestionGroup[];
  difficulty: string;
  bloomsLevel: string;
}

export interface GeneratedQuestion {
  number: number;
  question: string;
  options?: string[]; // for MCQ
  marks?: number;
  answer: string;
}

export interface GeneratedSection {
  title: string; // e.g. "Section A: Multiple Choice Questions"
  type: string;
  instruction?: string;
  questions: GeneratedQuestion[];
}

export interface GeneratedAssignment {
  title: string;
  subject: string;
  topic: string;
  instructions: string[];
  sections: GeneratedSection[];
}
