import type { GenerationConfig } from "./assignment-types";

export function buildPrompt(config: GenerationConfig): string {
  const parts = config.groups
    .filter((g) => g.count > 0)
    .map(
      (g) =>
        `${g.count} ${g.type} question${g.count > 1 ? "s" : ""} worth ${g.marks} mark${
          g.marks > 1 ? "s" : ""
        } each`,
    );

  const questionsSentence =
    parts.length > 0 ? `Generate ${parts.join(", ")}.` : "Generate a balanced set of questions.";

  const formatNote =
    `For "Case Study" and "Source-Based" questions, include a "passage" field with the ` +
    `case/source text and a "subQuestions" array of follow-up questions (each with number ` +
    `like "(i)", question, optional options, marks and answer). ` +
    `For "Match the Following" questions, include a "matchPairs" array of { left, right } ` +
    `objects (Column A to Column B) and put the correct pairing in the "answer" field.`;

  let curriculumSentence: string;
  if (config.curriculum === "delf") {
    const level = config.delfLevel || "B1";
    curriculumSentence =
      `Generate French DELF/DALF ${level} style questions following the official DELF/DALF exam ` +
      `format and competencies (compréhension écrite/orale, production écrite, etc.). ` +
      `Write the questions in French appropriate for level ${level}.`;
  } else if (config.curriculum === "general") {
    curriculumSentence =
      `Follow a general school curriculum and use age-appropriate language for the selected class.`;
  } else {
    curriculumSentence =
      `Follow CBSE style and use age-appropriate language for the selected class.`;
  }

  return (
    `Create a ${config.className} ${config.subject} assignment on the topic ` +
    `"${config.topic}". ${questionsSentence} Difficulty level ${config.difficulty}. ` +
    `Assign exactly the specified marks to each question and reflect them in the "marks" field. ` +
    `${formatNote} ` +
    `Include an answer key separately for every question. ${curriculumSentence}`
  );
}
