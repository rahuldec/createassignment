import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
  ImageRun,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
  VerticalAlign,
} from "docx";
import jsPDF from "jspdf";

import type { AssignmentHeader, GeneratedAssignment } from "./assignment-types";

function dataUrlToUint8(dataUrl: string): { data: Uint8Array; type: "png" | "jpg" } {
  const [meta, b64] = dataUrl.split(",");
  const isPng = meta.includes("png");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return { data: bytes, type: isPng ? "png" : "jpg" };
}

function safeName(header: AssignmentHeader, assignment: GeneratedAssignment) {
  const base = `${header.examName || assignment.title || "Assignment"}-${header.subject || ""}`;
  return base.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "") || "Assignment";
}

// Detects characters outside the Latin range (e.g. Devanagari/Hindi) that
// jsPDF's built-in Helvetica font cannot render.
function hasNonLatinText(assignment: GeneratedAssignment, header: AssignmentHeader) {
  const nonLatin = /[^\u0000-\u024F]/; // beyond Latin + Latin Extended-A
  const parts: string[] = [header.subject, header.topic, header.examName, assignment.title];
  for (const s of assignment.sections) {
    parts.push(s.title, s.instruction ?? "");
    for (const q of s.questions) {
      parts.push(q.question, q.answer ?? "", ...(q.options ?? []));
    }
  }
  return parts.some((p) => p && nonLatin.test(p));
}

// Renders the on-screen paper DOM to a multi-page PDF using the browser's own
// fonts. Required for scripts (Hindi, etc.) that jsPDF cannot draw natively.
async function exportPdfFromElement(
  element: HTMLElement,
  header: AssignmentHeader,
  assignment: GeneratedAssignment,
) {
  const { default: html2canvas } = await import("html2canvas");
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
  });

  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 24;
  const imgWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const usableHeight = pageHeight - margin * 2;

  let remaining = imgHeight;
  let position = margin;
  const imgData = canvas.toDataURL("image/jpeg", 0.92);

  // Single tall image sliced across pages.
  if (imgHeight <= usableHeight) {
    pdf.addImage(imgData, "JPEG", margin, position, imgWidth, imgHeight);
  } else {
    let offset = 0;
    while (remaining > 0) {
      pdf.addImage(imgData, "JPEG", margin, margin - offset, imgWidth, imgHeight);
      remaining -= usableHeight;
      offset += usableHeight;
      if (remaining > 0) pdf.addPage();
    }
  }

  pdf.save(`${safeName(header, assignment)}.pdf`);
}

export async function exportPdf(
  element: HTMLElement | null,
  header: AssignmentHeader,
  assignment: GeneratedAssignment,
  includeAnswerKey = false,
) {
  // Hindi (and other non-Latin) text can't be drawn with jsPDF's built-in
  // fonts, so render the live paper DOM to an image instead.
  if (element && hasNonLatinText(assignment, header)) {
    return exportPdfFromElement(element, header, assignment);
  }

  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }
  };

  const writeText = (
    text: string,
    opts: {
      size?: number;
      bold?: boolean;
      align?: "left" | "center";
      indent?: number;
      gap?: number;
      color?: [number, number, number];
    } = {},
  ) => {
    const { size = 11, bold = false, align = "left", indent = 0, gap = 4, color } = opts;
    pdf.setFont("helvetica", bold ? "bold" : "normal");
    pdf.setFontSize(size);
    pdf.setTextColor(...(color ?? [20, 20, 20]));
    const x = align === "center" ? pageWidth / 2 : margin + indent;
    const lines = pdf.splitTextToSize(text, contentWidth - indent);
    const lineHeight = size * 1.35;
    for (const line of lines) {
      ensureSpace(lineHeight);
      pdf.text(line, x, y, { align });
      y += lineHeight;
    }
    y += gap;
  };

  const divider = (gap = 8) => {
    ensureSpace(gap);
    pdf.setDrawColor(120, 120, 120);
    pdf.line(margin, y, pageWidth - margin, y);
    y += gap;
  };

  // Logo
  if (header.schoolLogo) {
    try {
      const fmt = header.schoolLogo.includes("png") ? "PNG" : "JPEG";
      const size = 50;
      ensureSpace(size + 6);
      pdf.addImage(header.schoolLogo, fmt, pageWidth / 2 - size / 2, y, size, size);
      y += size + 8;
    } catch {
      /* ignore bad image */
    }
  }

  // Header
  writeText(header.schoolName || "School Name", { size: 18, bold: true, align: "center", gap: 2 });
  writeText(header.examName || assignment.title, {
    size: 13,
    bold: true,
    align: "center",
    gap: 4,
  });

  const metaLine = [
    header.className && `Class: ${header.className}`,
    `Subject: ${header.subject || assignment.subject}`,
    (header.topic || assignment.topic) && `Topic: ${header.topic || assignment.topic}`,
  ]
    .filter(Boolean)
    .join("    |    ");
  writeText(metaLine, { size: 10, align: "center", gap: 2 });

  const metaLine2 = [
    header.maxMarks && `Maximum Marks: ${header.maxMarks}`,
    header.duration && `Duration: ${header.duration}`,
  ]
    .filter(Boolean)
    .join("    |    ");
  if (metaLine2) writeText(metaLine2, { size: 10, bold: true, align: "center", gap: 4 });
  divider(10);

  // Instructions
  const instructions =
    header.instructions.trim().length > 0
      ? header.instructions.split("\n").filter((l) => l.trim())
      : assignment.instructions;
  if (instructions.length) {
    writeText("General Instructions:", { size: 11, bold: true, gap: 2 });
    instructions.forEach((ins) =>
      writeText(`•  ${ins.replace(/^[-•\d.]+\s*/, "")}`, { size: 10, indent: 10, gap: 2 }),
    );
    y += 4;
  }

  // Sections
  assignment.sections.forEach((section) => {
    y += 6;
    writeText(section.title.toUpperCase(), { size: 12, bold: true, gap: 2 });
    if (section.instruction) writeText(section.instruction, { size: 9.5, gap: 4 });
    section.questions.forEach((q) => {
      const qText = `${q.number}. ${q.question}`;
      const marksText = q.marks ? `[${q.marks}]` : "";
      // question line, leaving room for marks on the right
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.setTextColor(20, 20, 20);
      const lines = pdf.splitTextToSize(qText, contentWidth - 40);
      const lineHeight = 11 * 1.35;
      lines.forEach((line: string, idx: number) => {
        ensureSpace(lineHeight);
        pdf.text(line, margin, y);
        if (idx === 0 && marksText) {
          pdf.setFont("helvetica", "bold");
          pdf.text(marksText, pageWidth - margin, y, { align: "right" });
          pdf.setFont("helvetica", "normal");
        }
        y += lineHeight;
      });
      y += 2;
      if (q.passage) {
        writeText(q.passage, { size: 9.5, indent: 16, gap: 3 });
      }
      if (q.options?.length) {
        q.options.forEach((opt, i) =>
          writeText(`(${String.fromCharCode(97 + i)}) ${opt}`, {
            size: 10,
            indent: 18,
            gap: 1,
          }),
        );
      }
      if (q.matchPairs?.length) {
        writeText("Column A — Column B", { size: 9.5, bold: true, indent: 16, gap: 1 });
        q.matchPairs.forEach((pair) =>
          writeText(`${pair.left}   —   ${pair.right}`, { size: 10, indent: 18, gap: 1 }),
        );
      }
      if (q.subQuestions?.length) {
        q.subQuestions.forEach((sq) => {
          const sm = sq.marks ? `  [${sq.marks}]` : "";
          writeText(`${sq.number} ${sq.question}${sm}`, { size: 10, indent: 18, gap: 1 });
          if (sq.options?.length) {
            sq.options.forEach((opt, i) =>
              writeText(`(${String.fromCharCode(97 + i)}) ${opt}`, {
                size: 9.5,
                indent: 30,
                gap: 1,
              }),
            );
          }
        });
      }
      y += 4;
    });
  });

  // Answer Key
  if (includeAnswerKey) {
    pdf.addPage();
    y = margin;
    writeText("ANSWER KEY", { size: 14, bold: true, align: "center", gap: 6 });
    assignment.sections.forEach((section) => {
      writeText(section.title, { size: 11, bold: true, gap: 2 });
      section.questions.forEach((q) =>
        writeText(`${q.number}. ${q.answer}`, { size: 10, indent: 10, gap: 2 }),
      );
      y += 4;
    });
  }

  pdf.save(`${safeName(header, assignment)}.pdf`);
}

export async function exportDocx(
  header: AssignmentHeader,
  assignment: GeneratedAssignment,
  includeAnswerKey: boolean,
) {
  const children: (Paragraph | Table)[] = [];

  if (header.schoolLogo) {
    try {
      const { data, type } = dataUrlToUint8(header.schoolLogo);
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({
              type,
              data,
              transformation: { width: 70, height: 70 },
              altText: { title: "School Logo", description: "School Logo", name: "logo" },
            }),
          ],
        }),
      );
    } catch {
      /* ignore bad image */
    }
  }

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [new TextRun({ text: header.schoolName || "School Name", bold: true, size: 32 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [
        new TextRun({ text: header.examName || assignment.title, bold: true, size: 26 }),
      ],
    }),
  );

  const metaLine = [
    header.className && `Class: ${header.className}`,
    `Subject: ${header.subject || assignment.subject}`,
    header.topic && `Topic: ${header.topic || assignment.topic}`,
  ]
    .filter(Boolean)
    .join("     ");

  const metaLine2 = [
    header.maxMarks && `Maximum Marks: ${header.maxMarks}`,
    header.duration && `Duration: ${header.duration}`,
  ]
    .filter(Boolean)
    .join("     ");

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: metaLine2 ? 20 : 120 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "888888", space: 6 } },
      children: [new TextRun({ text: metaLine, size: 22 })],
    }),
  );
  if (metaLine2) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [new TextRun({ text: metaLine2, size: 22 })],
      }),
    );
  }

  const instructions =
    header.instructions.trim().length > 0
      ? header.instructions.split("\n").filter((l) => l.trim())
      : assignment.instructions;
  if (instructions.length) {
    children.push(
      new Paragraph({
        spacing: { after: 40 },
        children: [new TextRun({ text: "General Instructions:", bold: true, size: 22 })],
      }),
    );
    instructions.forEach((ins) =>
      children.push(
        new Paragraph({
          spacing: { after: 20 },
          bullet: { level: 0 },
          children: [new TextRun({ text: ins.replace(/^[-•\d.]+\s*/, ""), size: 22 })],
        }),
      ),
    );
  }

  assignment.sections.forEach((section) => {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 220, after: 60 },
        children: [new TextRun({ text: section.title, bold: true, size: 24 })],
      }),
    );
    if (section.instruction) {
      children.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [new TextRun({ text: section.instruction, italics: true, size: 20 })],
        }),
      );
    }
    section.questions.forEach((q) => {
      children.push(
        new Paragraph({
          spacing: { before: 80, after: 20 },
          children: [
            new TextRun({ text: `${q.number}. `, bold: true, size: 22 }),
            new TextRun({ text: q.question, size: 22 }),
            ...(q.marks ? [new TextRun({ text: `   [${q.marks}]`, size: 20, bold: true })] : []),
          ],
        }),
      );
      if (q.passage) {
        children.push(
          new Paragraph({
            indent: { left: 360 },
            spacing: { before: 40, after: 60 },
            border: { left: { style: BorderStyle.SINGLE, size: 12, color: "AAAAAA", space: 8 } },
            children: [new TextRun({ text: q.passage, italics: true, size: 21 })],
          }),
        );
      }
      if (q.options?.length) {
        q.options.forEach((opt, i) =>
          children.push(
            new Paragraph({
              indent: { left: 480 },
              spacing: { after: 10 },
              children: [
                new TextRun({ text: `${String.fromCharCode(97 + i)}) ${opt}`, size: 22 }),
              ],
            }),
          ),
        );
      }
      if (q.matchPairs?.length) {
        children.push(
          new Table({
            width: { size: 8280, type: WidthType.DXA },
            columnWidths: [4140, 4140],
            rows: [
              new TableRow({
                tableHeader: true,
                children: ["Column A", "Column B"].map(
                  (h) =>
                    new TableCell({
                      width: { size: 4140, type: WidthType.DXA },
                      verticalAlign: VerticalAlign.CENTER,
                      shading: { fill: "D5E8F0", type: ShadingType.CLEAR },
                      margins: { top: 60, bottom: 60, left: 120, right: 120 },
                      children: [
                        new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 21 })] }),
                      ],
                    }),
                ),
              }),
              ...q.matchPairs.map(
                (pair) =>
                  new TableRow({
                    children: [pair.left, pair.right].map(
                      (cell) =>
                        new TableCell({
                          width: { size: 4140, type: WidthType.DXA },
                          margins: { top: 60, bottom: 60, left: 120, right: 120 },
                          children: [
                            new Paragraph({ children: [new TextRun({ text: cell, size: 21 })] }),
                          ],
                        }),
                    ),
                  }),
              ),
            ],
          }),
        );
      }
      if (q.subQuestions?.length) {
        q.subQuestions.forEach((sq) => {
          children.push(
            new Paragraph({
              indent: { left: 480 },
              spacing: { before: 30, after: 10 },
              children: [
                new TextRun({ text: `${sq.number} `, bold: true, size: 21 }),
                new TextRun({ text: sq.question, size: 21 }),
                ...(sq.marks
                  ? [new TextRun({ text: `   [${sq.marks}]`, size: 19, bold: true })]
                  : []),
              ],
            }),
          );
          if (sq.options?.length) {
            sq.options.forEach((opt, i) =>
              children.push(
                new Paragraph({
                  indent: { left: 840 },
                  spacing: { after: 8 },
                  children: [
                    new TextRun({ text: `${String.fromCharCode(97 + i)}) ${opt}`, size: 21 }),
                  ],
                }),
              ),
            );
          }
        });
      }
    });
  });

  if (includeAnswerKey) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        pageBreakBefore: true,
        spacing: { after: 80 },
        children: [new TextRun({ text: "Answer Key", bold: true, size: 26 })],
      }),
    );
    assignment.sections.forEach((section) => {
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 40 },
          children: [new TextRun({ text: section.title, bold: true, size: 22 })],
        }),
      );
      section.questions.forEach((q) => {
        children.push(
          new Paragraph({
            spacing: { after: q.subQuestions?.length || q.matchPairs?.length ? 8 : 20 },
            children: [
              new TextRun({ text: `${q.number}. `, bold: true, size: 22 }),
              new TextRun({ text: q.answer, size: 22 }),
            ],
          }),
        );
        if (q.matchPairs?.length) {
          q.matchPairs.forEach((pair) =>
            children.push(
              new Paragraph({
                indent: { left: 480 },
                spacing: { after: 8 },
                children: [
                  new TextRun({ text: `${pair.left} → ${pair.right}`, size: 21 }),
                ],
              }),
            ),
          );
        }
        if (q.subQuestions?.length) {
          q.subQuestions.forEach((sq) =>
            children.push(
              new Paragraph({
                indent: { left: 480 },
                spacing: { after: 8 },
                children: [
                  new TextRun({ text: `${sq.number} `, bold: true, size: 21 }),
                  new TextRun({ text: sq.answer, size: 21 }),
                ],
              }),
            ),
          );
        }
      });
    });
  }

  const doc = new Document({
    styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
    sections: [
      {
        properties: {
          page: { margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeName(header, assignment)}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}
