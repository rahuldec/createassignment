from zipfile import ZipFile
import re

zip_path='/mnt/data/createassignment-main (1).zip'
with ZipFile(zip_path) as z:
    path='createassignment-main/src/routes/index.tsx'
    txt=z.read(path).decode('utf-8')

txt=txt.replace(
    'import { GraduationCap } from "lucide-react";',
    'import { GraduationCap, Sparkles, FileText, Download } from "lucide-react";'
)

txt=txt.replace(
    '{ title: "Assignment Generator for Teachers — AI Question Papers" },',
    '{ title: "Create School Assignments Online | CBSE & NCERT Assignment Generator" },'
)

txt=txt.replace(
    'Create professional school assignments and question papers (Class 1–12) in seconds with AI. Export to PDF and DOCX. No sign-up required.',
    'Generate CBSE and NCERT assignments, worksheets, MCQs and question papers online for Classes 1–12. Free AI Assignment Generator for teachers.'
)

hero = '''
      <section className="border-b bg-gradient-to-b from-blue-50 via-white to-white">
        <div className="mx-auto max-w-6xl px-6 py-14 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm font-medium shadow-sm">
            <Sparkles className="h-4 w-4" />
            AI Powered Assignment Generator
          </div>

          <h2 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-slate-900 md:text-6xl">
            Create School Assignments in Seconds
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
            Generate CBSE & NCERT aligned worksheets, MCQs, short-answer,
            long-answer and exam-ready question papers for Classes 1–12.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700">✓ Classes 1–12</span>
            <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-700">✓ Printable PDF</span>
            <span className="rounded-full bg-purple-100 px-4 py-2 text-sm font-medium text-purple-700">✓ No Sign-up Required</span>
            <span className="rounded-full bg-orange-100 px-4 py-2 text-sm font-medium text-orange-700">✓ CBSE & NCERT</span>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <FileText className="mx-auto mb-3 h-8 w-8 text-blue-600" />
              <h3 className="font-semibold">Multiple Question Types</h3>
              <p className="mt-2 text-sm text-slate-600">MCQ, True/False, Short Answer and Long Answer questions.</p>
            </div>

            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <Sparkles className="mx-auto mb-3 h-8 w-8 text-blue-600" />
              <h3 className="font-semibold">AI Generated</h3>
              <p className="mt-2 text-sm text-slate-600">Unique assignments generated instantly from your topic.</p>
            </div>

            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <Download className="mx-auto mb-3 h-8 w-8 text-blue-600" />
              <h3 className="font-semibold">Export Ready</h3>
              <p className="mt-2 text-sm text-slate-600">Download professional PDF and DOCX files for printing.</p>
            </div>
          </div>
        </div>
      </section>
'''
txt=txt.replace('</header>\n\n      <main', '</header>\n'+hero+'\n      <main')

out='/mnt/data/index.tsx'
open(out,'w').write(txt)
print(out)
