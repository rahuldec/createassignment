# Plan: New Question Types, DOCX Export, Header Fields & Curriculum Toggles

This bundles the features discussed across the last few messages into one build.

## 1. New CBSE question types + data model
`src/lib/assignment-types.ts`
- Add to `QUESTION_TYPES`: `Case Study`, `Source-Based`, `Match the Following`.
- Extend `GeneratedQuestion` with optional fields:
  - `passage?: string` — intro text for Case Study / Source-Based
  - `subQuestions?: { number: string; question: string; options?: string[]; marks?: number; answer: string }[]`
  - `matchPairs?: { left: string; right: string }[]`
- Add `DELF_LEVELS = ["A1","A2","B1","B2","C1","C2"]` and `Curriculum = "cbse" | "delf" | "general"`.

## 2. AI generation
`src/lib/assignment.functions.ts`
- Extend `RESPONSE_SCHEMA` so questions can include `passage`, `subQuestions`, and `matchPairs`.
- Add `curriculum` (and optional `delfLevel`) to the input schema.
- Select the system prompt by curriculum: CBSE/NCERT examiner, French DELF/DALF examiner, or a neutral examiner.

`src/lib/prompt-builder.ts`
- Add `curriculum` and `delfLevel` to `GenerationConfig`; branch the prompt wording for cbse / delf / general.

## 3. Settings UI
`src/components/SettingsPanel.tsx`
- Mark **School Name** and **School Logo** as "(optional)".
- Add mutually-exclusive **CBSE/NCERT** (default ON) and **French DELF/DALF** (default OFF) switches in Step 2.
- When DELF/DALF is ON: show a **Level** select (A1–C2) and lock **Subject** to "French" (set and disable the subject select); restore on toggle off. If both off → general curriculum.

`src/routes/index.tsx`
- Add `curriculum` and `delfLevel` to generation state; pass through to `SettingsPanel`, `buildPrompt`, and `generateAssignment`.

## 4. DOCX export
`src/lib/export-utils.ts` (`exportDocx`)
- Render `passage` as an indented italic paragraph above sub-questions.
- Render `subQuestions` as `(i)`, `(ii)`… with marks; sub-options as `a) b) c) d)`.
- Render `matchPairs` as a 2-column `Table` (`WidthType.DXA`, shaded headers, single borders); switch section `children` to `(Paragraph | Table)[]` and import `Table, TableRow, TableCell, WidthType, ShadingType, VerticalAlign`.
- Extend the Answer Key to include sub-question answers and correct match pairings.

## Notes
- All new fields are optional, so existing simple questions render unchanged.
- Uses existing `Switch`/`Select` shadcn components and the existing `docx` dependency — no new packages.
- After building, generate a sample assignment with each new type and confirm the DOCX opens with correct formatting.