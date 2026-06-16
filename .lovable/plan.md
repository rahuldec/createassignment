## Update AI Prompt to Require CBSE/NCERT Textbook-Based Questions

### Problem
The current system prompt tells the AI to act as a "CBSE/ICSE school examiner" but does not explicitly instruct it to generate questions from official CBSE/NCERT textbooks. This can lead to generic or off-curriculum questions.

### Change
Update the `systemPrompt` string in `src/lib/assignment.functions.ts` to:
1. Remove "ICSE" reference (keep only CBSE focus as requested).
2. Add an explicit instruction: "Generate all questions and content directly from the CBSE curriculum and prescribed NCERT books."

### Scope
- Single file: `src/lib/assignment.functions.ts` (line 67-72)
- No UI changes, no schema changes, no new dependencies.

### Acceptance Criteria
- The system prompt mentions CBSE and NCERT textbooks explicitly.
- The AI generates questions aligned with the CBSE curriculum for the selected class/subject/topic.