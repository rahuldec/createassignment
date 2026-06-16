import type { GenerationConfig } from "./assignment-types";

export function buildPrompt(config: GenerationConfig): string {
  const parts = config.groups
    .filter((g) => g.count > 0)
    .map((g) => `${g.count} ${g.type} question${g.count > 1 ? "s" : ""}`);

  const questionsSentence =
    parts.length > 0 ? `Generate ${parts.join(", ")}.` : "Generate a balanced set of questions.";

  const blooms = config.bloomsLevel
    ? ` Target Bloom's taxonomy level: ${config.bloomsLevel}.`
    : "";

  return (
    `Create a ${config.className} ${config.subject} assignment on the topic ` +
    `"${config.topic}". ${questionsSentence} Difficulty level ${config.difficulty}.${blooms} ` +
    `Include an answer key separately for every question. Follow CBSE style and use ` +
    `age-appropriate language for the selected class.`
  );
}
