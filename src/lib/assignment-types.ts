export const SUBJECTS = [
  "English",
  "Mathematics",
  "Science",
  "Social Science",
  "Hindi",
  "Punjabi",
  "German",
  "French",
  "Sanskrit",
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
  "Case Study",
  "Source-Based",
  "Match the Following",
] as const;

export const DIFFICULTY_LEVELS = ["Easy", "Medium", "Hard"] as const;

export const DELF_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

export type Curriculum = "cbse" | "delf" | "general";

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
  marks: number; // marks per question
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
  curriculum: Curriculum;
  delfLevel?: string;
}

export interface SubQuestion {
  number: string; // e.g. "(i)"
  question: string;
  options?: string[];
  marks?: number;
  answer: string;
}

export interface MatchPair {
  left: string;
  right: string;
}

export interface GeneratedQuestion {
  number: number;
  question: string;
  options?: string[]; // for MCQ
  marks?: number;
  answer: string;
  passage?: string; // for Case Study / Source-Based
  subQuestions?: SubQuestion[];
  matchPairs?: MatchPair[];
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
