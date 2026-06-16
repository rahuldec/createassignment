# Plan: Settings & Generation Improvements

## 1. New subjects + custom subject entry
- Add **Punjabi, German, French, Sanskrit** to the `SUBJECTS` list in `src/lib/assignment-types.ts` (keeping "Other").
- In `SettingsPanel.tsx`, when the Subject select value is **"Other"**, show an extra text input so the teacher can type a custom subject name. The typed value becomes the effective subject used for generation and the preview header.

## 2. Remove Bloom's Level
- Remove the Bloom's Level select from `SettingsPanel.tsx`.
- Remove `bloomsLevel` from the `GenState`, from `initialGen` in `src/routes/index.tsx`, and stop passing it to `buildPrompt` / `generateAssignment`.
- Remove `BLOOMS_LEVELS` usage (can keep the constant or delete it). Difficulty stays.

## 3. Remove the "AI builds the prompt" helper line
- Delete the footer text "AI builds the prompt for you — no prompt writing needed." at the bottom of `SettingsPanel.tsx`.

## 4. Marks per question type
- Change question configuration so each question type has both a **count** and **marks per question** (e.g. MCQ × 5 questions, 1 mark each; Short Answer × 3, 2 marks each).
- Update `GenState.counts` into a richer structure (e.g. `groups: { type, count, marks }`) and update `buildPrompt` to tell the AI exactly how many marks each question carries.
- The server already returns per-question `marks`; the prompt will now instruct the model to assign the specified marks so the preview/exports show correct marks like `[1]`, `[2]`.
- Show a live **Total marks** alongside Total questions, and optionally auto-fill Maximum Marks.

## 5. Generating progress in the preview (with %)
- While `loading` is true, `AssignmentPreview.tsx` shows an animated progress indicator with a climbing percentage (e.g. 0→90% on a timer, jumps to 100% when the result arrives) using the existing `Progress` component, plus a "Generating your assignment…" message.
- The percentage is simulated client-side (the AI call doesn't stream progress): it advances smoothly and caps near 90% until the response resolves, then completes. Implemented with a small interval/`useEffect` in the preview component.

## Technical notes
- Files touched: `src/lib/assignment-types.ts`, `src/lib/prompt-builder.ts`, `src/components/SettingsPanel.tsx`, `src/components/AssignmentPreview.tsx`, `src/routes/index.tsx`. Server function signature (`assignment.functions.ts`) only changes if we drop `bloomsLevel` from its input schema — will make it optional/removed safely.
- No backend/Cloud changes needed.
