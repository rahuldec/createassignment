import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
  ImageRun,
  BorderStyle,
} from "docx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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

export async function exportPdf(
  element: HTMLElement,
  header: AssignmentHeader,
  assignment: GeneratedAssignment,
) {
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
  });
  const imgData = canvas.toDataURL("image/jpeg", 0.95);
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 24;
  const imgWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let remaining = imgHeight;
  let position = margin;
  // Single-image multipage slicing
  if (imgHeight <= pageHeight - margin * 2) {
    pdf.addImage(imgData, "JPEG", margin, margin, imgWidth, imgHeight);
  } else {
    let pageNum = 0;
    while (remaining > 0) {
      if (pageNum > 0) pdf.addPage();
      const sourceY = (pageNum * (pageHeight - margin * 2) * canvas.width) / imgWidth;
      const sliceHeightPx = ((pageHeight - margin * 2) * canvas.width) / imgWidth;
      const sliceCanvas = document.createElement("canvas");
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = Math.min(sliceHeightPx, canvas.height - sourceY);
      const ctx = sliceCanvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
        ctx.drawImage(
          canvas,
          0,
          sourceY,
          canvas.width,
          sliceCanvas.height,
          0,
          0,
          canvas.width,
          sliceCanvas.height,
        );
      }
      const sliceData = sliceCanvas.toDataURL("image/jpeg", 0.95);
      const sliceImgHeight = (sliceCanvas.height * imgWidth) / canvas.width;
      pdf.addImage(sliceData, "JPEG", margin, margin, imgWidth, sliceImgHeight);
      remaining -= pageHeight - margin * 2;
      pageNum++;
      position = margin;
    }
  }
  void position;
  pdf.save(`${safeName(header, assignment)}.pdf`);
}

export async function exportDocx(
  header: AssignmentHeader,
  assignment: GeneratedAssignment,
  includeAnswerKey: boolean,
) {
  const children: Paragraph[] = [];

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
      section.questions.forEach((q) =>
        children.push(
          new Paragraph({
            spacing: { after: 20 },
            children: [
              new TextRun({ text: `${q.number}. `, bold: true, size: 22 }),
              new TextRun({ text: q.answer, size: 22 }),
            ],
          }),
        ),
      );
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
