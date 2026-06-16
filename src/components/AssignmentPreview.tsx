import { useEffect, useRef, useState } from "react";
import {
  Printer,
  Copy,
  RefreshCw,
  FileText,
  FileDown,
  Pencil,
  Eye,
  EyeOff,
  FileQuestion,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { exportPdf, exportDocx } from "@/lib/export-utils";
import type { AssignmentHeader, GeneratedAssignment } from "@/lib/assignment-types";

interface Props {
  header: AssignmentHeader;
  assignment: GeneratedAssignment | null;
  loading: boolean;
  editing: boolean;
  setEditing: (v: boolean) => void;
  showAnswerKey: boolean;
  setShowAnswerKey: (v: boolean) => void;
  onRegenerate: () => void;
}

export function AssignmentPreview({
  header,
  assignment,
  loading,
  editing,
  setEditing,
  showAnswerKey,
  setShowAnswerKey,
  onRegenerate,
}: Props) {
  const printRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!loading) {
      setProgress(0);
      return;
    }
    setProgress(8);
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 92) return p;
        // ease out: smaller increments as we approach the cap
        const step = Math.max(1, Math.round((95 - p) / 12));
        return Math.min(92, p + step);
      });
    }, 350);
    return () => clearInterval(timer);
  }, [loading]);

  const handleCopy = async () => {
    if (!printRef.current) return;
    await navigator.clipboard.writeText(printRef.current.innerText);
    toast.success("Assignment copied to clipboard");
  };

  const handlePdf = async () => {
    if (!printRef.current || !assignment) return;
    toast.promise(exportPdf(printRef.current, header, assignment), {
      loading: "Building PDF…",
      success: "PDF downloaded",
      error: "Could not create PDF",
    });
  };

  const handleDocx = async () => {
    if (!assignment) return;
    toast.promise(exportDocx(header, assignment, showAnswerKey), {
      loading: "Building DOCX…",
      success: "DOCX downloaded",
      error: "Could not create DOCX",
    });
  };

  const instructions =
    header.instructions.trim().length > 0
      ? header.instructions.split("\n").filter((l) => l.trim())
      : (assignment?.instructions ?? []);

  if (!assignment) {
    return (
      <div className="flex h-full min-h-[60vh] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
        {loading ? (
          <div className="w-full max-w-sm">
            <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
            <p className="font-medium">Generating your assignment…</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Our AI is writing your questions. Hang tight!
            </p>
            <div className="mt-5">
              <Progress value={progress} />
              <p className="mt-2 text-sm font-semibold text-primary">{progress}%</p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-soft">
              <FileQuestion className="size-8 text-primary" />
            </div>
            <p className="text-lg font-semibold">Your assignment preview</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Fill in the details on the left and click “Generate Assignment”. Your printable
              question paper will appear here.
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="no-print flex flex-wrap items-center gap-2">
        <Button variant={editing ? "default" : "outline"} size="sm" onClick={() => setEditing(!editing)}>
          <Pencil /> {editing ? "Editing" : "Edit"}
        </Button>
        <Button variant="outline" size="sm" onClick={onRegenerate} disabled={loading}>
          <RefreshCw className={loading ? "animate-spin" : ""} /> Regenerate
        </Button>
        <Button variant="outline" size="sm" onClick={handleCopy}>
          <Copy /> Copy
        </Button>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer /> Print
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowAnswerKey(!showAnswerKey)}>
          {showAnswerKey ? <EyeOff /> : <Eye />} Answer Key
        </Button>
        <div className="ml-auto flex gap-2">
          <Button variant="secondary" size="sm" onClick={handlePdf}>
            <FileDown /> PDF
          </Button>
          <Button size="sm" onClick={handleDocx}>
            <FileText /> DOCX
          </Button>
        </div>
      </div>

      {/* Paper */}
      <div
        id="print-area"
        ref={printRef}
        contentEditable={editing}
        suppressContentEditableWarning
        className={`paper-sheet mx-auto max-w-[800px] rounded-xl border border-border bg-white p-8 text-[15px] leading-relaxed text-zinc-900 shadow-card outline-none sm:p-10 ${
          editing ? "ring-2 ring-primary/40" : ""
        }`}
      >
        {/* Header */}
        <div className="border-b-2 border-zinc-800 pb-4 text-center">
          {header.schoolLogo && (
            <img
              src={header.schoolLogo}
              alt="School logo"
              className="mx-auto mb-2 h-16 w-16 object-contain"
            />
          )}
          <h1 className="text-2xl font-bold uppercase tracking-wide text-zinc-900">
            {header.schoolName || "School Name"}
          </h1>
          <p className="mt-1 text-lg font-semibold text-zinc-800">
            {header.examName || assignment.title}
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-sm text-zinc-700">
            {header.className && <span>Class: {header.className}</span>}
            <span>Subject: {header.subject || assignment.subject}</span>
            {(header.topic || assignment.topic) && (
              <span>Topic: {header.topic || assignment.topic}</span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-x-6 gap-y-1 text-sm font-medium text-zinc-800">
            <span>{header.maxMarks ? `Maximum Marks: ${header.maxMarks}` : ""}</span>
            <span>{header.duration ? `Duration: ${header.duration}` : ""}</span>
          </div>
        </div>

        {/* Instructions */}
        {instructions.length > 0 && (
          <div className="mt-4">
            <p className="font-semibold text-zinc-900">General Instructions:</p>
            <ul className="ml-5 mt-1 list-disc space-y-0.5 text-sm text-zinc-700">
              {instructions.map((ins, i) => (
                <li key={i}>{ins.replace(/^[-•\d.]+\s*/, "")}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Sections */}
        {assignment.sections.map((section, si) => (
          <div key={si} className="mt-6">
            <h2 className="mb-1 border-b border-zinc-300 pb-1 text-base font-bold uppercase text-zinc-900">
              {section.title}
            </h2>
            {section.instruction && (
              <p className="mb-2 text-sm italic text-zinc-600">{section.instruction}</p>
            )}
            <ol className="space-y-3">
              {section.questions.map((q, qi) => (
                <li key={qi} className="text-zinc-900">
                  <div className="flex justify-between gap-3">
                    <p className="font-medium">
                      <span className="mr-1 font-semibold">{q.number}.</span>
                      {q.question}
                    </p>
                    {q.marks ? (
                      <span className="shrink-0 text-sm font-semibold text-zinc-600">
                        [{q.marks}]
                      </span>
                    ) : null}
                  </div>
                  {q.options && q.options.length > 0 && (
                    <div className="ml-5 mt-1.5 grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
                      {q.options.map((opt, oi) => (
                        <span key={oi}>
                          ({String.fromCharCode(97 + oi)}) {opt}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </div>
        ))}

        {/* Answer Key */}
        {showAnswerKey && (
          <div className="mt-8 border-t-2 border-dashed border-zinc-400 pt-4">
            <h2 className="mb-3 text-center text-base font-bold uppercase text-zinc-900">
              Answer Key
            </h2>
            {assignment.sections.map((section, si) => (
              <div key={si} className="mb-3">
                <p className="font-semibold text-zinc-800">{section.title}</p>
                <ol className="ml-4 mt-1 space-y-1 text-sm text-zinc-700">
                  {section.questions.map((q, qi) => (
                    <li key={qi}>
                      <span className="font-semibold">{q.number}.</span> {q.answer}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
