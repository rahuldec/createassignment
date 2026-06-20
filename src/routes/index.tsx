import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GraduationCap, CheckCircle2 } from "lucide-react";
import { Toaster, toast } from "sonner";

import { SettingsPanel } from "@/components/SettingsPanel";
import { AssignmentPreview } from "@/components/AssignmentPreview";
import { generateAssignment } from "@/lib/assignment.functions";
import { buildPrompt } from "@/lib/prompt-builder";
import type { AssignmentHeader, GeneratedAssignment, QuestionGroup } from "@/lib/assignment-types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Assignment Generator for Teachers — AI Question Papers" },
      {
        name: "description",
        content:
          "Create professional school assignments and question papers (Class 1–12) in seconds with AI. Export to PDF and DOCX. No sign-up required.",
      },
      { property: "og:title", content: "Assignment Generator for Teachers" },
      {
        property: "og:description",
        content:
          "Generate CBSE-style question papers with AI and download print-ready PDF or DOCX files.",
      },
    ],
  }),
  component: Index,
});

const initialHeader: AssignmentHeader = {
  schoolName: "",
  schoolLogo: null,
  examName: "",
  className: "Class 8",
  subject: "Science",
  topic: "",
  maxMarks: "",
  duration: "",
  instructions: "All questions are compulsory.\nWrite answers neatly.",
};

const initialGen = {
  difficulty: "Medium",
  curriculum: "cbse" as "cbse" | "delf" | "general",
  delfLevel: "B1",
  config: {
    MCQ: { count: 5, marks: 1 },
    "Short Answer": { count: 3, marks: 2 },
  } as Record<string, { count: number; marks: number }>,
};

// Option B: rotating word shown in the compact sticky header, in place of
// the static "Assignment Generator" title. Cycles every 2.2s.
const HEADER_WORDS = ["Assignment", "Homework", "Class Test", "Worksheet"];

function useRotatingWord(words: string[], intervalMs = 2200) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % words.length), intervalMs);
    return () => clearInterval(id);
  }, [words, intervalMs]);
  return words[index];
}

function Index() {
  const [header, setHeader] = useState<AssignmentHeader>(initialHeader);
  const [gen, setGen] = useState(initialGen);
  const [assignment, setAssignment] = useState<GeneratedAssignment | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const rotatingWord = useRotatingWord(HEADER_WORDS);

  const runGeneration = async () => {
    const groups: QuestionGroup[] = Object.entries(gen.config)
      .filter(([, v]) => v.count > 0)
      .map(([type, v], i) => ({
        id: String(i),
        type: type as QuestionGroup["type"],
        count: v.count,
        marks: v.marks,
      }));

    if (!header.topic.trim()) {
      toast.error("Please enter a topic / chapter name.");
      return;
    }
    if (groups.length === 0) {
      toast.error("Add at least one question type with a count above 0.");
      return;
    }

    setLoading(true);
    setEditing(false);
    try {
      const prompt = buildPrompt({
        className: header.className,
        subject: header.subject,
        topic: header.topic,
        difficulty: gen.difficulty,
        curriculum: gen.curriculum,
        delfLevel: gen.delfLevel,
        groups,
      });
      const result = await generateAssignment({
        data: {
          className: header.className,
          subject: header.subject,
          topic: header.topic,
          difficulty: gen.difficulty,
          curriculum: gen.curriculum,
          delfLevel: gen.delfLevel,
          groups: groups.map((g) => ({ type: g.type, count: g.count })),
          prompt,
        },
      });
      setAssignment(result);
      toast.success("Assignment generated!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-notebook">
      <Toaster richColors position="top-center" />

      <header className="no-print sticky top-0 z-10 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1500px] items-center gap-3 px-4 py-3.5 sm:px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary shadow-card">
            <GraduationCap className="size-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">
              Generate a perfect{" "}
              <span key={rotatingWord} className="text-gradient header-word-fade">
                {rotatingWord}
              </span>
            </h1>
            <p className="text-xs text-muted-foreground">AI question papers for teachers</p>
          </div>

          <div className="mx-2 hidden flex-1 items-center justify-center gap-2 text-xs font-medium text-muted-foreground sm:flex">
            <span>Assignment · Homework · Class Test · Worksheet</span>
            <span className="text-border">|</span>
            <span className="text-secondary-foreground">CBSE · IELTS · DELF/DALF</span>
          </div>

          <div className="ml-auto hidden items-center gap-2 sm:flex">
            <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
              <CheckCircle2 className="size-3.5" />
              Free forever
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1500px] grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[420px_1fr]">
        <div className="no-print lg:sticky lg:top-[76px] lg:h-[calc(100vh-100px)] lg:overflow-y-auto lg:pr-1">
          <SettingsPanel
            header={header}
            setHeader={setHeader}
            gen={gen}
            setGen={setGen}
            onGenerate={runGeneration}
            loading={loading}
          />
        </div>

        <div>
          <AssignmentPreview
            header={header}
            assignment={assignment}
            loading={loading}
            editing={editing}
            setEditing={setEditing}
            showAnswerKey={showAnswerKey}
            setShowAnswerKey={setShowAnswerKey}
            onRegenerate={runGeneration}
          />
        </div>
      </main>

      <style>{`
        @keyframes headerWordFade {
          from { opacity: 0; transform: translateY(3px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .header-word-fade { display: inline-block; animation: headerWordFade 0.35s ease; }
        @media (prefers-reduced-motion: reduce) {
          .header-word-fade { animation: none; }
        }
      `}</style>
    </div>
  );
}
