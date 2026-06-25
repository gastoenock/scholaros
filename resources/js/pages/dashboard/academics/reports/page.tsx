import { useEffect, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import { DashboardLayout } from "../../_components/layout.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { AcademicCalendarFields } from "@/components/academic-calendar-fields.tsx";
import {
  defaultSemesterId,
  defaultTermId,
  defaultYearId,
  type SharedWithCalendar,
} from "@/lib/academic-calendar.ts";
import { FileBarChart, FileSpreadsheet, FileText, Printer } from "lucide-react";
import { RichTextEditor, RichTextContent, isRichTextEmpty } from "@/components/rich-text-editor.tsx";
import { toast } from "sonner";

type StudentOption = { id: number; firstName: string; lastName: string; studentId: string; gradeLevel?: string | null; classSection?: string | null };
type ClassOption = { id: number; name: string; gradeLevel: string; section?: string | null };
type SubjectOption = { id: number; name: string; code?: string | null };

type ReportFilters = {
  type: string;
  yearId: number | null;
  semesterId: number | null;
  termId: number | null;
  studentId: number | null;
  classId: number | null;
  subjectId: number | null;
  examId: number | null;
  generate: boolean;
};

type PageProps = {
  classes: ClassOption[];
  students: StudentOption[];
  subjects: SubjectOption[];
  report: Record<string, unknown> | null;
  filters: ReportFilters;
};

function ReportPreview({ report, onSaveComment, commentDraft, setCommentDraft, savingComment }: {
  report: Record<string, unknown>;
  onSaveComment?: () => void;
  commentDraft?: string;
  setCommentDraft?: (value: string) => void;
  savingComment?: boolean;
}) {
  const type = report.type as string;
  const period = report.period as { label?: string };
  const summary = report.summary as Record<string, unknown> | undefined;

  if (type === "student") {
    const student = report.student as { name: string; studentId: string; gradeLevel?: string; classSection?: string };
    const classTeacher = report.classTeacher as { name?: string } | null;
    const rows = report.rows as Array<Record<string, unknown>>;
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold">{student.name}</h2>
          <p className="text-sm text-muted-foreground">{student.studentId} · {student.gradeLevel} {student.classSection}</p>
          {classTeacher?.name && (
            <p className="text-sm text-muted-foreground mt-1">Class Teacher: {classTeacher.name}</p>
          )}
          <p className="text-sm text-muted-foreground mt-1">{period.label}</p>
        </div>
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Stat label="Subjects" value={summary.subjectsTotal ?? rows.length} />
            <Stat label="Scored" value={summary.examsTaken} />
            <Stat label="Average" value={summary.averageScore != null ? `${summary.averageScore}%` : "—"} />
            <Stat label="Passed" value={summary.passed} />
            <Stat label="Failed" value={summary.failed} />
          </div>
        )}
        <ResultsTable
          headers={["Subject", "Exam", "Score", "Grade", "Status"]}
          rows={rows.map((row) => [
            row.subject,
            row.title ?? (row.hasExam ? "—" : "No exam scheduled"),
            row.score != null ? `${row.score}/${row.maxScore ?? "—"}` : "—",
            row.grade ?? "—",
            row.passed == null ? "—" : row.passed ? "Pass" : "Fail",
          ])}
        />
        <div className="space-y-2 print:hidden">
          <Label>Class Teacher Comment</Label>
          <RichTextEditor
            value={commentDraft ?? (report.classTeacherComment as string | undefined) ?? ""}
            onChange={(value) => setCommentDraft?.(value)}
            placeholder="General remarks about the student's performance, conduct, and progress..."
          />
          {onSaveComment && (
            <Button onClick={onSaveComment} disabled={savingComment} className="cursor-pointer">
              {savingComment ? "Saving..." : "Save Comment"}
            </Button>
          )}
        </div>
        {!isRichTextEmpty(commentDraft ?? (report.classTeacherComment as string | undefined)) && (
          <div className="hidden print:block space-y-1">
            <h3 className="font-semibold">Class Teacher Comment</h3>
            <RichTextContent html={commentDraft ?? (report.classTeacherComment as string)} />
          </div>
        )}
      </div>
    );
  }

  if (type === "class") {
    const cls = report.class as { name: string; gradeLevel: string; section?: string };
    const subjects = (report.subjects as Array<{ id: number; name: string; code?: string }>) ?? [];
    const subjectNames = (summary?.subjects as string[] | undefined) ?? subjects.map((s) => s.name);
    const students = report.students as Array<{
      name: string;
      studentNumber: string;
      subjectResults?: Array<{ subject: string; score?: number | null; grade?: string | null; maxScore?: number | null }>;
      averageScore?: number | null;
    }>;
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold">Class Report — {cls.name}</h2>
          <p className="text-sm text-muted-foreground">{period.label}</p>
        </div>
        {summary && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Students" value={summary.studentCount} />
              <Stat label="Class Average" value={summary.classAverage != null ? `${summary.classAverage}%` : "—"} />
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Subjects: </span>
              {subjectNames.join(", ") || "—"}
            </p>
          </>
        )}
        <ResultsTable
          headers={["Student", "ID", ...subjects.map((s) => s.name), "Average"]}
          rows={students.map((s) => [
            s.name,
            s.studentNumber,
            ...(s.subjectResults ?? []).map((r) =>
              r.score != null ? `${r.score}/${r.maxScore ?? "—"}` : "—",
            ),
            s.averageScore != null ? `${s.averageScore}%` : "—",
          ])}
        />
      </div>
    );
  }

  if (type === "subject") {
    const subject = report.subject as { name: string; code?: string };
    const exams = report.exams as Array<{ title: string; className?: string; summary?: Record<string, unknown>; results?: Array<Record<string, unknown>> }>;
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold">Subject Report — {subject.name}</h2>
          <p className="text-sm text-muted-foreground">{period.label}</p>
        </div>
        {exams.map((exam) => (
          <Card key={String(exam.title)}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{exam.title} · {exam.className}</CardTitle>
              {exam.summary && (
                <p className="text-xs text-muted-foreground">
                  Avg: {exam.summary.averageScore ?? "—"}% · Pass rate: {exam.summary.passRate ?? "—"}% · Candidates: {exam.summary.candidates}
                </p>
              )}
            </CardHeader>
            <CardContent>
              <ResultsTable
                headers={["Student", "Score", "Grade", "Remarks"]}
                rows={(exam.results ?? []).map((r) => [r.studentName, r.score, r.grade ?? "—", r.remarks ?? "—"])}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const byClass = report.byClass as Array<Record<string, unknown>>;
  const bySubject = report.bySubject as Array<Record<string, unknown>>;
  const byTerm = report.byTerm as Array<Record<string, unknown>>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Overall Examinations Report</h2>
        <p className="text-sm text-muted-foreground">{period.label}</p>
      </div>
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Stat label="Total Subjects" value={summary.totalSubjects ?? bySubject.length} />
          <Stat label="Total Exams" value={summary.totalExams} />
          <Stat label="Total Results" value={summary.totalResults} />
          <Stat label="School Average" value={summary.schoolAverage != null ? `${summary.schoolAverage}%` : "—"} />
          <Stat label="Pass Rate" value={summary.passRate != null ? `${summary.passRate}%` : "—"} />
        </div>
      )}
      <SectionTable title="By Class" headers={["Class", "Exams", "Results", "Average"]} rows={byClass.map((r) => [r.className, r.examCount, r.resultsCount, r.averageScore ?? "—"])} />
      <SectionTable title="By Subject" headers={["Subject", "Exams", "Results", "Average"]} rows={bySubject.map((r) => [r.subjectName, r.examCount, r.resultsCount, r.averageScore ?? "—"])} />
      <SectionTable title="By Term" headers={["Term", "Semester", "Exams", "Results", "Average"]} rows={byTerm.map((r) => [r.term, r.semester ?? "—", r.examCount, r.resultsCount, r.averageScore ?? "—"])} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{String(value ?? "—")}</p>
    </div>
  );
}

function ResultsTable({ headers, rows }: { headers: string[]; rows: unknown[][] }) {
  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>{headers.map((h) => <th key={h} className="text-left px-3 py-2 font-medium">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={headers.length} className="px-3 py-6 text-center text-muted-foreground">No data</td></tr>
          ) : rows.map((row, i) => (
            <tr key={i} className="border-t">{row.map((cell, j) => <td key={j} className="px-3 py-2">{String(cell ?? "—")}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionTable({ title, headers, rows }: { title: string; headers: string[]; rows: unknown[][] }) {
  return (
    <div className="space-y-2">
      <h3 className="font-semibold">{title}</h3>
      <ResultsTable headers={headers} rows={rows} />
    </div>
  );
}

function ReportsContent({ classes, students, subjects, report, filters }: PageProps) {
  const { academicCalendar } = usePage<SharedWithCalendar>().props;
  const [type, setType] = useState(filters.type || "student");
  const [yearId, setYearId] = useState<number | null>(filters.yearId ?? defaultYearId(academicCalendar));
  const [semesterId, setSemesterId] = useState<number | null>(filters.semesterId ?? defaultSemesterId(academicCalendar, yearId));
  const [termId, setTermId] = useState<number | null>(filters.termId ?? defaultTermId(academicCalendar, yearId, semesterId));
  const [studentId, setStudentId] = useState<string>(filters.studentId ? String(filters.studentId) : "");
  const [classId, setClassId] = useState<string>(filters.classId ? String(filters.classId) : "");
  const [subjectId, setSubjectId] = useState<string>(filters.subjectId ? String(filters.subjectId) : "");
  const [commentDraft, setCommentDraft] = useState("");
  const [savingComment, setSavingComment] = useState(false);

  useEffect(() => {
    if (report?.type === "student") {
      setCommentDraft((report.classTeacherComment as string | undefined) ?? "");
    }
  }, [report]);

  const generate = () => {
    router.get("/dashboard/academics/reports", {
      generate: 1,
      type,
      yearId: yearId ?? undefined,
      semesterId: semesterId ?? undefined,
      termId: termId ?? undefined,
      studentId: studentId || undefined,
      classId: classId || undefined,
      subjectId: subjectId || undefined,
    }, { preserveScroll: true });
  };

  const saveComment = () => {
    if (!studentId || !yearId) return;
    setSavingComment(true);
    router.post("/dashboard/academics/reports/student-comment", {
      studentId: parseInt(studentId, 10),
      yearId,
      semesterId: semesterId ?? undefined,
      termId: termId ?? undefined,
      comment: isRichTextEmpty(commentDraft) ? undefined : commentDraft,
    }, {
      preserveScroll: true,
      onSuccess: () => toast.success("Comment saved"),
      onError: () => toast.error("Failed to save comment"),
      onFinish: () => setSavingComment(false),
    });
  };

  const exportReport = (format: "pdf" | "xlsx" | "docx") => {
    const params = new URLSearchParams({
      format,
      type,
    });

    if (yearId) params.set("yearId", String(yearId));
    if (semesterId) params.set("semesterId", String(semesterId));
    if (termId) params.set("termId", String(termId));
    if (studentId) params.set("studentId", studentId);
    if (classId) params.set("classId", classId);
    if (subjectId) params.set("subjectId", subjectId);

    window.location.href = `/dashboard/academics/reports/export?${params.toString()}`;
  };

  const canExport = type === "overall"
    || (type === "student" && studentId)
    || (type === "class" && classId)
    || (type === "subject" && subjectId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileBarChart className="h-6 w-6 text-primary" />
            Examination Reports
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Student, class, subject, and overall examination reports.</p>
        </div>
        {report && (
          <div className="flex flex-wrap gap-2 print:hidden">
            <Button variant="outline" onClick={() => exportReport("pdf")} disabled={!canExport} className="cursor-pointer">
              <FileText className="h-4 w-4 mr-2" />Export PDF
            </Button>
            <Button variant="outline" onClick={() => exportReport("docx")} disabled={!canExport} className="cursor-pointer">
              <FileText className="h-4 w-4 mr-2" />Export Word
            </Button>
            <Button variant="outline" onClick={() => exportReport("xlsx")} disabled={!canExport} className="cursor-pointer">
              <FileSpreadsheet className="h-4 w-4 mr-2" />Export Excel
            </Button>
            <Button variant="outline" onClick={() => window.print()} className="cursor-pointer">
              <Printer className="h-4 w-4 mr-2" />Print
            </Button>
          </div>
        )}
      </div>

      <Card className="print:hidden">
        <CardHeader><CardTitle className="text-base">Report Builder</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={type} onValueChange={setType}>
            <TabsList>
              <TabsTrigger value="student" className="cursor-pointer">Student</TabsTrigger>
              <TabsTrigger value="class" className="cursor-pointer">Class</TabsTrigger>
              <TabsTrigger value="subject" className="cursor-pointer">Subject</TabsTrigger>
              <TabsTrigger value="overall" className="cursor-pointer">Overall</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <AcademicCalendarFields
              calendar={academicCalendar}
              yearId={yearId}
              semesterId={semesterId}
              termId={termId}
              onYearChange={setYearId}
              onSemesterChange={setSemesterId}
              onTermChange={setTermId}
            />
          </div>

          {type === "student" && (
            <div className="space-y-1.5 max-w-md">
              <Label>Student *</Label>
              <Select value={studentId} onValueChange={setStudentId}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.firstName} {s.lastName} ({s.studentId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {type === "class" && (
            <div className="space-y-1.5 max-w-md">
              <Label>Class *</Label>
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {type === "subject" && (
            <div className="space-y-1.5 max-w-md">
              <Label>Subject *</Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}{s.code ? ` (${s.code})` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button onClick={generate} className="cursor-pointer">Generate Report</Button>
        </CardContent>
      </Card>

      {report && (
        <Card id="report-preview">
          <CardContent className="pt-6">
            <ReportPreview
              report={report}
              commentDraft={commentDraft}
              setCommentDraft={setCommentDraft}
              onSaveComment={report.type === "student" && studentId ? saveComment : undefined}
              savingComment={savingComment}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function AcademicReportsPage(props: PageProps) {
  return (
    <DashboardLayout>
      <ReportsContent {...props} />
    </DashboardLayout>
  );
}
