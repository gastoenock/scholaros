import { useMemo, useState } from "react";
import { router } from "@inertiajs/react";
import { DashboardLayout } from "../_components/layout.tsx";
import { useCurrentSchool } from "../_components/use-current-school.ts";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { toast } from "sonner";
import { motion } from "motion/react";
import {
  BookOpen, Plus, Pencil, Trash2, ClipboardList, Video,
  GraduationCap, CheckCircle2, BarChart3, ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import type { StaffMember } from "../staff/page.tsx";
import type { Student } from "../students/page.tsx";
import type { School } from "@/lib/types.ts";

function letterGrade(score: number, max: number): string {
  const pct = (score / max) * 100;
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B";
  if (pct >= 60) return "C";
  if (pct >= 50) return "D";
  return "F";
}

type Subject = { id: number; name: string; code?: string | null; gradeLevel?: string | null; teacherId?: number | null; description?: string | null };
type SchoolClass = { id: number; name: string; gradeLevel?: string | null; section?: string | null };
type Assignment = { id: number; classId: number; subjectId: number; teacherId: number; title: string; description?: string | null; dueDate: string; maxScore: number; type: string };
type Exam = { id: number; classId: number; subjectId: number; title: string; examDate: string; startTime?: string | null; endTime?: string | null; maxScore: number; passingScore?: number | null; term?: string | null; academicYear: string; venue?: string | null };
type ExamResult = { id: number; examId: number; studentId: number; score: number; grade?: string | null; studentName: string; studentIdLabel?: string };
type OnlineClass = { id: number; classId: number; subjectId?: number | null; teacherId: number; title: string; zoomLink: string; meetingId?: string | null; passcode?: string | null; scheduledAt: string; durationMinutes?: number | null; status: string };
type Submission = { id: number; assignmentId: number; studentId: number; score?: number | null; feedback?: string | null; status: string; studentName: string };

type PageProps = {
  subjects: Subject[];
  assignments: Assignment[];
  exams: Exam[];
  examResults: ExamResult[];
  onlineClasses: OnlineClass[];
  submissions: Submission[];
  classes: SchoolClass[];
  staff: StaffMember[];
  students: Student[];
  school: School | null;
};

function SubjectsTab({ subjects, staff }: Pick<PageProps, "subjects" | "staff">) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [form, setForm] = useState({ name: "", code: "", gradeLevel: "", description: "" });
  const [teacherId, setTeacherId] = useState("");

  const handleSave = () => {
    const payload = {
      name: form.name,
      code: form.code || undefined,
      gradeLevel: form.gradeLevel || undefined,
      description: form.description || undefined,
      teacherId: teacherId && teacherId !== "none" ? parseInt(teacherId, 10) : null,
    };
    const options = {
      preserveScroll: true,
      onSuccess: () => { toast.success(editing ? "Subject updated" : "Subject created"); setOpen(false); },
      onError: () => toast.error("Failed to save subject"),
    };
    if (editing) {
      router.put(`/dashboard/academics/subjects/${editing.id}`, payload, options);
    } else {
      router.post("/dashboard/academics/subjects", payload, options);
    }
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this subject?")) return;
    router.delete(`/dashboard/academics/subjects/${id}`, { preserveScroll: true, onSuccess: () => toast.success("Subject removed") });
  };

  const openEdit = (s: Subject) => {
    setEditing(s);
    setTeacherId(s.teacherId ? String(s.teacherId) : "none");
    setForm({ name: s.name, code: s.code ?? "", gradeLevel: s.gradeLevel ?? "", description: s.description ?? "" });
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => { setEditing(null); setForm({ name: "", code: "", gradeLevel: "", description: "" }); setTeacherId(""); setOpen(true); }} className="cursor-pointer">
          <Plus className="h-4 w-4 mr-1.5" />Add Subject
        </Button>
      </div>
      {subjects.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No subjects yet.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((s) => {
            const teacher = staff.find((t) => t.id === s.teacherId);
            return (
              <Card key={s.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold">{s.name}</p>
                      {s.code && <Badge variant="secondary" className="text-xs mt-1">{s.code}</Badge>}
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => openEdit(s)} className="p-1.5 rounded hover:bg-muted cursor-pointer"><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></button>
                      <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded hover:bg-red-50 hover:text-red-600 cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                  {s.gradeLevel && <p className="text-xs text-muted-foreground">Grade {s.gradeLevel}</p>}
                  {teacher && <p className="text-xs text-muted-foreground">Teacher: {teacher.firstName} {teacher.lastName}</p>}
                  {s.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.description}</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Subject" : "Add Subject"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Mathematics" /></div>
              <div className="space-y-1.5"><Label>Code</Label><Input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} placeholder="e.g. MATH101" /></div>
            </div>
            <div className="space-y-1.5"><Label>Grade Level</Label><Input value={form.gradeLevel} onChange={(e) => setForm((p) => ({ ...p, gradeLevel: e.target.value }))} placeholder="e.g. 10" /></div>
            <div className="space-y-1.5">
              <Label>Teacher</Label>
              <Select value={teacherId} onValueChange={setTeacherId}>
                <SelectTrigger><SelectValue placeholder="Assign teacher…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {staff.filter((t) => t.role === "teacher").map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>{t.firstName} {t.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="min-h-[80px]" /></div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)} className="cursor-pointer">Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name} className="cursor-pointer">{editing ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AssignmentsTab({ assignments, classes, subjects, staff, submissions }: Pick<PageProps, "assignments" | "classes" | "subjects" | "staff" | "submissions">) {
  const [open, setOpen] = useState(false);
  const [gradingOpen, setGradingOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<number | null>(null);
  const [form, setForm] = useState({ classId: "", subjectId: "", teacherId: "", title: "", description: "", dueDate: "", maxScore: "100", type: "homework" as const });
  const [scores, setScores] = useState<Record<string, string>>({});
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});

  const assignmentSubmissions = useMemo(
    () => (selectedAssignment ? submissions.filter((s) => s.assignmentId === selectedAssignment) : []),
    [submissions, selectedAssignment],
  );

  const handleCreate = () => {
    if (!form.classId || !form.subjectId || !form.teacherId || !form.title) return;
    router.post("/dashboard/academics/assignments", {
      classId: parseInt(form.classId, 10),
      subjectId: parseInt(form.subjectId, 10),
      teacherId: parseInt(form.teacherId, 10),
      title: form.title,
      description: form.description || undefined,
      dueDate: form.dueDate,
      maxScore: parseInt(form.maxScore, 10) || 100,
      type: form.type,
    }, { preserveScroll: true, onSuccess: () => { toast.success("Assignment created"); setOpen(false); }, onError: () => toast.error("Failed to create assignment") });
  };

  const handleGrade = (subId: number) => {
    router.put(`/dashboard/academics/submissions/${subId}`, {
      score: parseFloat(scores[String(subId)] ?? "0"),
      feedback: feedbacks[String(subId)],
    }, { preserveScroll: true, onSuccess: () => toast.success("Graded") });
  };

  const typeColors: Record<string, string> = {
    homework: "bg-blue-100 text-blue-700", classwork: "bg-green-100 text-green-700",
    project: "bg-purple-100 text-purple-700", quiz: "bg-amber-100 text-amber-700",
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setOpen(true)} className="cursor-pointer"><Plus className="h-4 w-4 mr-1.5" />New Assignment</Button>
      </div>
      {assignments.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No assignments yet.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => {
            const cls = classes.find((c) => c.id === a.classId);
            const sub = subjects.find((s) => s.id === a.subjectId);
            return (
              <Card key={a.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[a.type] ?? ""}`}>{a.type}</span>
                        <p className="font-semibold text-sm">{a.title}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{cls?.name ?? "—"} · {sub?.name ?? "—"} · Due: {a.dueDate}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="secondary" onClick={() => { setSelectedAssignment(a.id); setGradingOpen(true); }} className="cursor-pointer">
                        <ClipboardList className="h-3.5 w-3.5 mr-1" /> Grade
                      </Button>
                      <button onClick={() => router.delete(`/dashboard/academics/assignments/${a.id}`, { preserveScroll: true })} className="p-1.5 rounded hover:bg-red-50 hover:text-red-600 cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>New Assignment</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Class *</Label>
                <Select value={form.classId} onValueChange={(v) => setForm((p) => ({ ...p, classId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select class…" /></SelectTrigger>
                  <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Subject *</Label>
                <Select value={form.subjectId} onValueChange={(v) => setForm((p) => ({ ...p, subjectId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select subject…" /></SelectTrigger>
                  <SelectContent>{subjects.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v as typeof form.type }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["homework", "classwork", "project", "quiz"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Teacher *</Label>
                <Select value={form.teacherId} onValueChange={(v) => setForm((p) => ({ ...p, teacherId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Assign teacher…" /></SelectTrigger>
                  <SelectContent>{staff.filter((t) => t.role === "teacher").map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.firstName} {t.lastName}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Due Date</Label><Input type="date" value={form.dueDate} onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Max Score</Label><Input type="number" value={form.maxScore} onChange={(e) => setForm((p) => ({ ...p, maxScore: e.target.value }))} /></div>
            </div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="min-h-[80px]" /></div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)} className="cursor-pointer">Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.title || !form.classId || !form.subjectId || !form.teacherId} className="cursor-pointer">Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={gradingOpen} onOpenChange={setGradingOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>Grade Submissions</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto py-2">
            {assignmentSubmissions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No submissions yet.</p>
            ) : (
              assignmentSubmissions.map((s) => (
                <div key={s.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{s.studentName}</p>
                    <Badge variant={s.status === "graded" ? "default" : "secondary"} className="capitalize">{s.status}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1"><Label className="text-xs">Score</Label><Input type="number" defaultValue={s.score ?? ""} onChange={(e) => setScores((p) => ({ ...p, [String(s.id)]: e.target.value }))} className="h-8" /></div>
                    <div className="space-y-1"><Label className="text-xs">Feedback</Label><Input defaultValue={s.feedback ?? ""} onChange={(e) => setFeedbacks((p) => ({ ...p, [String(s.id)]: e.target.value }))} className="h-8" /></div>
                  </div>
                  <Button size="sm" onClick={() => handleGrade(s.id)} className="cursor-pointer"><CheckCircle2 className="h-3.5 w-3.5 mr-1" />Save Grade</Button>
                </div>
              ))
            )}
          </div>
          <DialogFooter><Button variant="secondary" onClick={() => setGradingOpen(false)} className="cursor-pointer">Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ExamsTab({ exams, classes, subjects, students, examResults }: Pick<PageProps, "exams" | "classes" | "subjects" | "students" | "examResults">) {
  const [open, setOpen] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [form, setForm] = useState({ classId: "", subjectId: "", title: "", examDate: "", startTime: "", endTime: "", maxScore: "100", passingScore: "50", term: "Term 1", academicYear: "2024-2025", venue: "" });
  const [resultScores, setResultScores] = useState<Record<string, string>>({});

  const examResultsForSelected = useMemo(
    () => (selectedExam ? examResults.filter((r) => r.examId === selectedExam.id) : []),
    [examResults, selectedExam],
  );

  const classStudentsForExam = useMemo(() => {
    if (!selectedExam) return [];
    const cls = classes.find((c) => c.id === selectedExam.classId);
    return students.filter((s) => s.classSection === cls?.name);
  }, [selectedExam, classes, students]);

  const handleCreate = () => {
    if (!form.classId || !form.subjectId || !form.title || !form.examDate) return;
    router.post("/dashboard/academics/exams", {
      classId: parseInt(form.classId, 10),
      subjectId: parseInt(form.subjectId, 10),
      title: form.title,
      examDate: form.examDate,
      startTime: form.startTime || undefined,
      endTime: form.endTime || undefined,
      maxScore: parseInt(form.maxScore, 10) || 100,
      passingScore: parseInt(form.passingScore, 10) || undefined,
      term: form.term || undefined,
      academicYear: form.academicYear,
      venue: form.venue || undefined,
    }, { preserveScroll: true, onSuccess: () => { toast.success("Exam created"); setOpen(false); }, onError: () => toast.error("Failed to create exam") });
  };

  const handleBulkSave = () => {
    if (!selectedExam) return;
    const results = classStudentsForExam.map((s) => ({
      studentId: s.id,
      score: parseFloat(resultScores[String(s.id)] ?? "0"),
      grade: letterGrade(parseFloat(resultScores[String(s.id)] ?? "0"), selectedExam.maxScore),
    }));
    router.post(`/dashboard/academics/exams/${selectedExam.id}/results`, { results }, {
      preserveScroll: true,
      onSuccess: () => { toast.success("Results saved"); setResultsOpen(false); },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setOpen(true)} className="cursor-pointer"><Plus className="h-4 w-4 mr-1.5" />Schedule Exam</Button>
      </div>
      {exams.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No exams scheduled.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {exams.map((e) => {
            const cls = classes.find((c) => c.id === e.classId);
            const sub = subjects.find((s) => s.id === e.subjectId);
            return (
              <Card key={e.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">{e.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{cls?.name ?? "—"} · {sub?.name ?? "—"} · {e.examDate}</p>
                      <div className="flex gap-2 mt-1">
                        {e.term && <Badge variant="secondary" className="text-xs">{e.term}</Badge>}
                        <Badge variant="outline" className="text-xs">Max: {e.maxScore}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="secondary" onClick={() => { setSelectedExam(e); setResultScores({}); setResultsOpen(true); }} className="cursor-pointer">
                        <ClipboardList className="h-3.5 w-3.5 mr-1" />Results
                      </Button>
                      <button onClick={() => router.delete(`/dashboard/academics/exams/${e.id}`, { preserveScroll: true })} className="p-1.5 rounded hover:bg-red-50 hover:text-red-600 cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Schedule Exam</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Class *</Label>
                <Select value={form.classId} onValueChange={(v) => setForm((p) => ({ ...p, classId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select class…" /></SelectTrigger>
                  <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Subject *</Label>
                <Select value={form.subjectId} onValueChange={(v) => setForm((p) => ({ ...p, subjectId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select subject…" /></SelectTrigger>
                  <SelectContent>{subjects.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Exam Date *</Label><Input type="date" value={form.examDate} onChange={(e) => setForm((p) => ({ ...p, examDate: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Venue</Label><Input value={form.venue} onChange={(e) => setForm((p) => ({ ...p, venue: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Max Score</Label><Input type="number" value={form.maxScore} onChange={(e) => setForm((p) => ({ ...p, maxScore: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Passing Score</Label><Input type="number" value={form.passingScore} onChange={(e) => setForm((p) => ({ ...p, passingScore: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)} className="cursor-pointer">Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.title || !form.classId || !form.subjectId || !form.examDate} className="cursor-pointer">Create Exam</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={resultsOpen} onOpenChange={setResultsOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>Enter Results — {selectedExam?.title}</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto py-2">
            {examResultsForSelected.length > 0 && (
              <div className="mb-4 rounded-lg overflow-hidden border">
                <table className="w-full text-sm">
                  <thead><tr className="bg-muted/30 border-b"><th className="text-left px-3 py-2">Student</th><th className="text-left px-3 py-2">Score</th><th className="text-left px-3 py-2">Grade</th></tr></thead>
                  <tbody>
                    {examResultsForSelected.map((r) => (
                      <tr key={r.id} className="border-b last:border-0">
                        <td className="px-3 py-2">{r.studentName}</td>
                        <td className="px-3 py-2 font-semibold">{r.score}/{selectedExam?.maxScore}</td>
                        <td className="px-3 py-2"><Badge className="text-xs">{r.grade ?? letterGrade(r.score, selectedExam?.maxScore ?? 100)}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Enter / Update Scores</p>
            {classStudentsForExam.map((s) => (
              <div key={s.id} className="flex items-center gap-3">
                <span className="text-sm flex-1">{s.firstName} {s.lastName}</span>
                <Input type="number" className="w-24 h-8" placeholder="Score" value={resultScores[String(s.id)] ?? ""} onChange={(e) => setResultScores((p) => ({ ...p, [String(s.id)]: e.target.value }))} />
                <span className="text-xs text-muted-foreground w-8">{resultScores[String(s.id)] ? letterGrade(parseFloat(resultScores[String(s.id)]), selectedExam?.maxScore ?? 100) : "—"}</span>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setResultsOpen(false)} className="cursor-pointer">Close</Button>
            <Button onClick={handleBulkSave} disabled={classStudentsForExam.length === 0} className="cursor-pointer">Save Results</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OnlineClassesTab({ onlineClasses, classes, subjects, staff }: Pick<PageProps, "onlineClasses" | "classes" | "subjects" | "staff">) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ classId: "", subjectId: "", teacherId: "", title: "", zoomLink: "", meetingId: "", passcode: "", scheduledAt: "", durationMinutes: "60", isRecurring: false });

  const handleCreate = () => {
    if (!form.classId || !form.teacherId || !form.title || !form.zoomLink) return;
    router.post("/dashboard/academics/online-classes", {
      classId: parseInt(form.classId, 10),
      subjectId: form.subjectId ? parseInt(form.subjectId, 10) : undefined,
      teacherId: parseInt(form.teacherId, 10),
      title: form.title,
      zoomLink: form.zoomLink,
      meetingId: form.meetingId || undefined,
      passcode: form.passcode || undefined,
      scheduledAt: form.scheduledAt,
      durationMinutes: parseInt(form.durationMinutes, 10) || 60,
      isRecurring: form.isRecurring,
    }, { preserveScroll: true, onSuccess: () => { toast.success("Online class scheduled"); setOpen(false); }, onError: () => toast.error("Failed to schedule class") });
  };

  const statusColors: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-700", live: "bg-green-100 text-green-700",
    completed: "bg-gray-100 text-gray-700", cancelled: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setOpen(true)} className="cursor-pointer"><Plus className="h-4 w-4 mr-1.5" />Schedule Class</Button>
      </div>
      {onlineClasses.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No online classes scheduled.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {onlineClasses.map((oc) => {
            const cls = classes.find((c) => c.id === oc.classId);
            const teacher = staff.find((t) => t.id === oc.teacherId);
            return (
              <Card key={oc.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[oc.status]}`}>{oc.status}</span>
                        <p className="font-semibold text-sm">{oc.title}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{cls?.name ?? "—"} · {teacher ? `${teacher.firstName} ${teacher.lastName}` : "—"} · {oc.scheduledAt}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <a href={oc.zoomLink} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" className="cursor-pointer"><ExternalLink className="h-3.5 w-3.5 mr-1" />Join</Button>
                      </a>
                      {oc.status === "scheduled" && (
                        <Button size="sm" variant="secondary" onClick={() => router.put(`/dashboard/academics/online-classes/${oc.id}`, { status: "live" }, { preserveScroll: true })} className="cursor-pointer">Go Live</Button>
                      )}
                      <button onClick={() => router.delete(`/dashboard/academics/online-classes/${oc.id}`, { preserveScroll: true })} className="p-1.5 rounded hover:bg-red-50 hover:text-red-600 cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Schedule Online Class</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Class *</Label>
                <Select value={form.classId} onValueChange={(v) => setForm((p) => ({ ...p, classId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select class…" /></SelectTrigger>
                  <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Teacher *</Label>
                <Select value={form.teacherId} onValueChange={(v) => setForm((p) => ({ ...p, teacherId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Assign teacher…" /></SelectTrigger>
                  <SelectContent>{staff.filter((t) => t.role === "teacher").map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.firstName} {t.lastName}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label>Zoom Link *</Label><Input value={form.zoomLink} onChange={(e) => setForm((p) => ({ ...p, zoomLink: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Scheduled At</Label><Input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm((p) => ({ ...p, scheduledAt: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Duration (min)</Label><Input type="number" value={form.durationMinutes} onChange={(e) => setForm((p) => ({ ...p, durationMinutes: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)} className="cursor-pointer">Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.title || !form.classId || !form.teacherId || !form.zoomLink} className="cursor-pointer">Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AnalyticsTab({ exams, subjects, classes }: Pick<PageProps, "exams" | "subjects" | "classes">) {
  const subjectStats = subjects.map((s) => ({
    name: s.name,
    examCount: exams.filter((e) => e.subjectId === s.id).length,
  })).filter((s) => s.examCount > 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Classes", value: classes.length, icon: GraduationCap, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
          { label: "Subjects", value: subjects.length, icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
          { label: "Exams Scheduled", value: exams.length, icon: ClipboardList, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                <stat.icon className={`h-4.5 w-4.5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Exams by Subject</CardTitle></CardHeader>
        <CardContent>
          {subjectStats.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">No exam data yet.</p>
          ) : (
            <div className="space-y-3">
              {subjectStats.map((s) => (
                <div key={s.name} className="flex items-center gap-3">
                  <p className="text-sm w-32 shrink-0 truncate">{s.name}</p>
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div className="bg-primary rounded-full h-2" style={{ width: `${Math.min((s.examCount / Math.max(...subjectStats.map((x) => x.examCount))) * 100, 100)}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground w-16 text-right">{s.examCount} exam{s.examCount !== 1 ? "s" : ""}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Upcoming Exams</CardTitle></CardHeader>
        <CardContent>
          {exams.filter((e) => e.examDate >= format(new Date(), "yyyy-MM-dd")).length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No upcoming exams.</p>
          ) : (
            <div className="space-y-2">
              {exams.filter((e) => e.examDate >= format(new Date(), "yyyy-MM-dd")).sort((a, b) => a.examDate.localeCompare(b.examDate)).slice(0, 5).map((e) => {
                const cls = classes.find((c) => c.id === e.classId);
                const sub = subjects.find((s) => s.id === e.subjectId);
                return (
                  <div key={e.id} className="flex items-center justify-between text-sm">
                    <div><p className="font-medium">{e.title}</p><p className="text-xs text-muted-foreground">{cls?.name ?? "—"} · {sub?.name ?? "—"}</p></div>
                    <Badge variant="outline" className="text-xs">{e.examDate}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AcademicsContent(props: PageProps) {
  const { schoolId } = useCurrentSchool();

  if (!schoolId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">No school linked to your account.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-extrabold flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-primary" /> Academics & Exams
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Subjects, assignments, exams, grading, online classes, and performance analytics</p>
      </motion.div>
      <Tabs defaultValue="subjects">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="subjects" className="cursor-pointer"><BookOpen className="h-3.5 w-3.5 mr-1.5" />Subjects</TabsTrigger>
          <TabsTrigger value="assignments" className="cursor-pointer"><ClipboardList className="h-3.5 w-3.5 mr-1.5" />Assignments</TabsTrigger>
          <TabsTrigger value="exams" className="cursor-pointer"><GraduationCap className="h-3.5 w-3.5 mr-1.5" />Exams</TabsTrigger>
          <TabsTrigger value="online" className="cursor-pointer"><Video className="h-3.5 w-3.5 mr-1.5" />Online Classes</TabsTrigger>
          <TabsTrigger value="analytics" className="cursor-pointer"><BarChart3 className="h-3.5 w-3.5 mr-1.5" />Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="subjects" className="mt-4"><SubjectsTab subjects={props.subjects} staff={props.staff} /></TabsContent>
        <TabsContent value="assignments" className="mt-4"><AssignmentsTab assignments={props.assignments} classes={props.classes} subjects={props.subjects} staff={props.staff} submissions={props.submissions} /></TabsContent>
        <TabsContent value="exams" className="mt-4"><ExamsTab exams={props.exams} classes={props.classes} subjects={props.subjects} students={props.students} examResults={props.examResults} /></TabsContent>
        <TabsContent value="online" className="mt-4"><OnlineClassesTab onlineClasses={props.onlineClasses} classes={props.classes} subjects={props.subjects} staff={props.staff} /></TabsContent>
        <TabsContent value="analytics" className="mt-4"><AnalyticsTab exams={props.exams} subjects={props.subjects} classes={props.classes} /></TabsContent>
      </Tabs>
    </div>
  );
}

export default function AcademicsPage(props: PageProps) {
  return (
    <DashboardLayout>
      <AcademicsContent {...props} />
    </DashboardLayout>
  );
}
