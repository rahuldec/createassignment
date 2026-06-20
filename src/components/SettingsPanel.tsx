import { useRef, useState } from "react";
import { Upload, X, Sparkles, Loader2, ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CLASSES,
  SUBJECTS,
  QUESTION_TYPES,
  DIFFICULTY_LEVELS,
  DELF_LEVELS,
  type AssignmentHeader,
  type Curriculum,
  type QuestionType,
} from "@/lib/assignment-types";

interface GenState {
  difficulty: string;
  curriculum: Curriculum;
  delfLevel: string;
  config: Record<string, { count: number; marks: number }>;
}

interface Props {
  header: AssignmentHeader;
  setHeader: (h: AssignmentHeader) => void;
  gen: GenState;
  setGen: (g: GenState) => void;
  onGenerate: () => void;
  loading: boolean;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function SectionCard({
  title,
  step,
  children,
}: {
  title: string;
  step: number;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-primary text-xs font-bold text-primary-foreground">
          {step}
        </span>
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

const STEPS = [
  { id: 1, label: "Curriculum" },
  { id: 2, label: "Header" },
  { id: 3, label: "Questions" },
] as const;

function Stepper({ step, setStep }: { step: number; setStep: (n: number) => void }) {
  return (
    <div className="flex items-center px-1 pb-1">
      {STEPS.map((s, i) => (
        <div key={s.id} className="flex flex-1 items-center last:flex-none">
          <button
            type="button"
            onClick={() => setStep(s.id)}
            className="flex flex-col items-center gap-1.5"
          >
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                step === s.id
                  ? "bg-gradient-primary text-primary-foreground"
                  : step > s.id
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {s.id}
            </span>
            <span
              className={`text-[11px] font-medium ${
                step === s.id ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {s.label}
            </span>
          </button>
          {i < STEPS.length - 1 && (
            <div
              className={`mx-1.5 h-0.5 flex-1 rounded-full transition-colors ${
                step > s.id ? "bg-primary/40" : "bg-border"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export function SettingsPanel({ header, setHeader, gen, setGen, onGenerate, loading }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);

  const handleLogo = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setHeader({ ...header, schoolLogo: reader.result as string });
    reader.readAsDataURL(file);
  };

  const setField = (type: QuestionType, field: "count" | "marks", value: number) => {
    const prev = gen.config[type] ?? { count: 0, marks: 1 };
    setGen({
      ...gen,
      config: { ...gen.config, [type]: { ...prev, [field]: Math.max(field === "marks" ? 1 : 0, value) } },
    });
  };

  const setCurriculum = (next: Curriculum) => {
    if (next === "delf") {
      setGen({ ...gen, curriculum: "delf" });
      setHeader({ ...header, subject: "French" });
    } else {
      setGen({ ...gen, curriculum: next });
    }
  };

  const delfActive = gen.curriculum === "delf";
  const cbseActive = gen.curriculum === "cbse";

  const totalQuestions = Object.values(gen.config).reduce((a, v) => a + (v.count || 0), 0);
  const totalMarks = Object.values(gen.config).reduce(
    (a, v) => a + (v.count || 0) * (v.marks || 0),
    0,
  );

  return (
    <div className="space-y-5">
      <Stepper step={step} setStep={setStep} />

      <div key={step} className="step-fade">
      {step === 1 && (
      <SectionCard title="Curriculum" step={1}>
        <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">CBSE / NCERT</p>
              <p className="text-xs text-muted-foreground">Questions from CBSE curriculum</p>
            </div>
            <Switch
              checked={cbseActive}
              onCheckedChange={(v) => setCurriculum(v ? "cbse" : "general")}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">French DELF / DALF</p>
              <p className="text-xs text-muted-foreground">Subject locks to French</p>
            </div>
            <Switch
              checked={delfActive}
              onCheckedChange={(v) => setCurriculum(v ? "delf" : "cbse")}
            />
          </div>
          {delfActive && (
            <Field label="DELF / DALF Level">
              <Select
                value={gen.delfLevel}
                onValueChange={(v) => setGen({ ...gen, delfLevel: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DELF_LEVELS.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        </div>
      </SectionCard>
      )}

      {step === 2 && (
      <SectionCard title="Assignment Header" step={2}>
        <Field label="School / Institute Name (optional)">
          <Input
            placeholder="e.g. Springfield Public School / Institute"
            value={header.schoolName}
            onChange={(e) => setHeader({ ...header, schoolName: e.target.value })}
          />
        </Field>

        <Field label="School Logo (optional)">
          {header.schoolLogo ? (
            <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-2.5">
              <img
                src={header.schoolLogo}
                alt="School logo preview"
                className="h-12 w-12 rounded-lg object-contain"
              />
              <span className="flex-1 text-sm text-muted-foreground">Logo uploaded</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setHeader({ ...header, schoolLogo: null })}
              >
                <X />
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 py-4 text-sm text-muted-foreground transition-colors hover:bg-muted/60"
            >
              <Upload className="size-4" /> Upload logo
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleLogo(e.target.files?.[0])}
          />
        </Field>

        <Field label="Test Name">
          <Input
            placeholder="e.g. Unit Test 1"
            value={header.examName}
            onChange={(e) => setHeader({ ...header, examName: e.target.value })}
          />
        </Field>

        {!delfActive && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Class">
              <Select
                value={header.className}
                onValueChange={(v) => setHeader({ ...header, className: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {CLASSES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Subject">
              <Select
                value={(SUBJECTS as readonly string[]).includes(header.subject) ? header.subject : "Other"}
                onValueChange={(v) =>
                  setHeader({ ...header, subject: v === "Other" ? "" : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        )}

        {delfActive && (
          <Field label="Subject">
            <Input value="French" disabled />
          </Field>
        )}

        {!delfActive && !(SUBJECTS as readonly string[]).includes(header.subject) && (
          <Field label="Custom Subject Name">
            <Input
              placeholder="e.g. Environmental Studies"
              value={header.subject}
              onChange={(e) => setHeader({ ...header, subject: e.target.value })}
            />
          </Field>
        )}

        <Field label="Topic / Chapter Name">
          <Input
            placeholder={delfActive ? "e.g. La famille, Les vacances" : "e.g. Force and Pressure"}
            value={header.topic}
            onChange={(e) => setHeader({ ...header, topic: e.target.value })}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Maximum Marks">
            <Input
              type="number"
              placeholder="e.g. 40"
              value={header.maxMarks}
              onChange={(e) => setHeader({ ...header, maxMarks: e.target.value })}
            />
          </Field>
          <Field label="Duration (optional)">
            <Input
              placeholder="e.g. 1 hour"
              value={header.duration}
              onChange={(e) => setHeader({ ...header, duration: e.target.value })}
            />
          </Field>
        </div>

        <Field label="Instructions">
          <Textarea
            rows={3}
            placeholder="e.g. All questions are compulsory. Write neatly."
            value={header.instructions}
            onChange={(e) => setHeader({ ...header, instructions: e.target.value })}
          />
        </Field>
      </SectionCard>
      )}

      {step === 3 && (
      <SectionCard title="Question Configuration" step={3}>
        <div>
          <div className="mb-2 grid grid-cols-[1fr_auto_auto] items-center gap-2">
            <Label className="text-xs font-medium text-muted-foreground">Question Type</Label>
            <Label className="w-14 text-center text-xs font-medium text-muted-foreground">Qty</Label>
            <Label className="w-14 text-center text-xs font-medium text-muted-foreground">
              Marks
            </Label>
          </div>
          <div className="space-y-2">
            {QUESTION_TYPES.map((type) => {
              const cfg = gen.config[type] ?? { count: 0, marks: 1 };
              return (
                <div
                  key={type}
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2"
                >
                  <span className="text-xs font-medium leading-tight">{type}</span>
                  <Input
                    type="number"
                    min={0}
                    value={cfg.count}
                    onChange={(e) => setField(type, "count", parseInt(e.target.value) || 0)}
                    className="h-8 w-14 text-center"
                  />
                  <Input
                    type="number"
                    min={1}
                    value={cfg.marks}
                    onChange={(e) => setField(type, "marks", parseInt(e.target.value) || 1)}
                    className="h-8 w-14 text-center"
                  />
                </div>
              );
            })}
          </div>
          <p className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>
              Total questions:{" "}
              <span className="font-semibold text-foreground">{totalQuestions}</span>
            </span>
            <span>
              Total marks: <span className="font-semibold text-foreground">{totalMarks}</span>
            </span>
          </p>
        </div>

        <Field label="Difficulty Level">
          <Select value={gen.difficulty} onValueChange={(v) => setGen({ ...gen, difficulty: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DIFFICULTY_LEVELS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </SectionCard>
      )}
      </div>

      <div className="flex gap-2">
        {step > 1 && (
          <Button
            variant="outline"
            size="lg"
            className="flex-none"
            onClick={() => setStep(step - 1)}
          >
            <ChevronLeft /> Back
          </Button>
        )}
        {step < 3 ? (
          <Button size="lg" className="flex-1 text-base" onClick={() => setStep(step + 1)}>
            Next
          </Button>
        ) : (
          <Button
            variant="hero"
            size="lg"
            className="flex-1 text-base"
            onClick={onGenerate}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" /> Generating…
              </>
            ) : (
              <>
                <Sparkles /> Generate Assignment
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
