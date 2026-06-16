import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type { GeneratedAssignment } from "./assignment-types";

const questionGroupSchema = z.object({
  type: z.string(),
  count: z.number(),
});

const inputSchema = z.object({
  className: z.string().min(1),
  subject: z.string().min(1),
  topic: z.string().min(1),
  difficulty: z.string().min(1),

  groups: z.array(questionGroupSchema).min(1),
  prompt: z.string().min(1),
});

const RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    subject: { type: "string" },
    topic: { type: "string" },
    instructions: { type: "array", items: { type: "string" } },
    sections: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          type: { type: "string" },
          instruction: { type: "string" },
          questions: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                number: { type: "number" },
                question: { type: "string" },
                options: { type: "array", items: { type: "string" } },
                marks: { type: "number" },
                answer: { type: "string" },
              },
              required: ["number", "question", "answer"],
            },
          },
        },
        required: ["title", "type", "questions"],
      },
    },
  },
  required: ["title", "subject", "topic", "instructions", "sections"],
} as const;

export const generateAssignment = createServerFn({ method: "POST" })
  .inputValidator(inputSchema)
  .handler(async ({ data }): Promise<GeneratedAssignment> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI is not configured. Missing API key.");

    const systemPrompt =
      "You are an expert CBSE/ICSE school examiner who writes clear, accurate, " +
      "age-appropriate question papers. Always return valid structured JSON only. " +
      "Group questions into sections (Section A, Section B, ...) by question type. " +
      "For MCQ provide exactly 4 options as plain strings WITHOUT a), b) prefixes. " +
      "Assign reasonable marks to each question. Provide a concise correct answer for every question.";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: data.prompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: "assignment", strict: true, schema: RESPONSE_SCHEMA },
        },
      }),
    });

    if (response.status === 429) {
      throw new Error("Too many requests right now. Please wait a moment and try again.");
    }
    if (response.status === 402) {
      throw new Error("AI credits exhausted. Please add credits in your workspace settings.");
    }
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`AI request failed (${response.status}). ${text.slice(0, 200)}`);
    }

    const json = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new Error("The AI returned an empty response. Please try again.");

    let parsed: GeneratedAssignment;
    try {
      parsed = JSON.parse(content) as GeneratedAssignment;
    } catch {
      throw new Error("Could not read the AI response. Please regenerate.");
    }
    return parsed;
  });
