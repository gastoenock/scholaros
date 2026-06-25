import { useMemo, useState } from "react";
import { Link, router } from "@inertiajs/react";
import { DashboardLayout } from "../_components/layout.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select.tsx";
import {
  ArrowLeft, Trash2, BookOpen, Users, Search, Plus, UserCircle, Save,
} from "lucide-react";
import { toast } from "sonner";
import { routerDeleteWithConfirm } from "@/lib/confirm.ts";
import type { StaffMember } from "../staff/page.tsx";
import type { Student } from "../students/page.tsx";
import type { SchoolClass } from "./page.tsx";
import { roomLabel } from "@/lib/rooms.ts";

type SubjectOption = {
  id: number;
  name: string;
  code?: string | null;
  gradeLevel?: string | null;
};

type PageProps = {
  schoolClass: SchoolClass;
  students: Student[];
  availableStudents: Student[];
  subjects: SubjectOption[];
  staff: StaffMember[];
};

function DetailItem({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function ClassShowContent({ schoolClass, students, availableStudents, subjects, staff }: PageProps) {
  const [classTeacherId, setClassTeacherId] = useState<string>(
    schoolClass.classTeacherId ? String(schoolClass.classTeacherId) : "",
  );
  const [subjectIds, setSubjectIds] = useState<number[]>(schoolClass.subjectIds ?? []);
  const [studentSearch, setStudentSearch] = useState("");
  const [addStudentSearch, setAddStudentSearch] = useState("");
  const [selectedToAdd, setSelectedToAdd] = useState<number[]>([]);
  const [savingTeacher, setSavingTeacher] = useState(false);
  const [savingSubjects, setSavingSubjects] = useState(false);
  const [assigningStudents, setAssigningStudents] = useState(false);

  const classTeacher = staff.find((s) => s.id === schoolClass.classTeacherId);

  const filteredStudents = useMemo(() => {
    if (!studentSearch) return students;
    const term = studentSearch.toLowerCase();
    return students.filter(
      (s) =>
        s.firstName.toLowerCase().includes(term) ||
        s.lastName.toLowerCase().includes(term) ||
        s.studentId.toLowerCase().includes(term),
    );
  }, [students, studentSearch]);

  const filteredAvailable = useMemo(() => {
    if (!addStudentSearch) return availableStudents;
    const term = addStudentSearch.toLowerCase();
    return availableStudents.filter(
      (s) =>
        s.firstName.toLowerCase().includes(term) ||
        s.lastName.toLowerCase().includes(term) ||
        s.studentId.toLowerCase().includes(term),
    );
  }, [availableStudents, addStudentSearch]);

  const saveClass = (payload: Record<string, unknown>, onFinish: () => void, successMessage: string) => {
    router.put(`/dashboard/classes/${schoolClass.uuid}`, payload, {
      preserveScroll: true,
      onSuccess: () => toast.success(successMessage),
      onError: () => toast.error("Failed to update class"),
      onFinish,
    });
  };

  const saveTeacher = () => {
    setSavingTeacher(true);
    saveClass(
      { classTeacherId: classTeacherId ? parseInt(classTeacherId, 10) : null },
      () => setSavingTeacher(false),
      "Class teacher updated",
    );
  };

  const toggleSubject = (subjectId: number) => {
    setSubjectIds((prev) =>
      prev.includes(subjectId) ? prev.filter((id) => id !== subjectId) : [...prev, subjectId],
    );
  };

  const saveSubjects = () => {
    setSavingSubjects(true);
    saveClass({ subjectIds }, () => setSavingSubjects(false), "Subjects updated");
  };

  const toggleStudentToAdd = (studentId: number) => {
    setSelectedToAdd((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId],
    );
  };

  const assignStudents = () => {
    if (selectedToAdd.length === 0) return;
    setAssigningStudents(true);
    router.post(
      `/dashboard/classes/${schoolClass.uuid}/students`,
      { studentIds: selectedToAdd },
      {
        preserveScroll: true,
        onSuccess: () => {
          toast.success("Students added to class");
          setSelectedToAdd([]);
          setAddStudentSearch("");
        },
        onError: () => toast.error("Failed to add students"),
        onFinish: () => setAssigningStudents(false),
      },
    );
  };

  const removeStudent = async (student: Student) => {
    await routerDeleteWithConfirm(`/dashboard/classes/${schoolClass.uuid}/students/${student.uuid}`, {
      title: `Remove ${student.firstName} ${student.lastName} from this class?`,
      text: "The student will be unlinked from this class but not deleted.",
      onSuccess: () => toast.success("Student removed from class"),
      onError: () => toast.error("Failed to remove student"),
    });
  };

  const handleDeleteClass = async () => {
    await routerDeleteWithConfirm(`/dashboard/classes/${schoolClass.uuid}`, {
      title: "Delete this class?",
      onSuccess: () => toast.success("Class deleted"),
      onError: () => toast.error("Failed to delete class"),
      preserveScroll: false,
    });
  };

  const classSubjects = subjects.filter((s) => subjectIds.includes(s.id));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="cursor-pointer">
            <Link href="/dashboard/classes"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
          </Button>
          <div>
            <h1 className="text-2xl font-extrabold">{schoolClass.name}</h1>
            <p className="text-muted-foreground text-sm">
              Grade {schoolClass.gradeLevel}{schoolClass.section ? ` · Section ${schoolClass.section}` : ""}
            </p>
          </div>
        </div>
        <Button variant="destructive" size="sm" className="cursor-pointer" onClick={handleDeleteClass}>
          <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete Class
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><UserCircle className="h-4 w-4" /> Class Teacher</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {classTeacher && (
              <p className="text-sm text-muted-foreground">
                Current:{" "}
                <Link href={`/dashboard/staff/${classTeacher.uuid}`} className="font-medium text-foreground hover:underline">
                  {classTeacher.firstName} {classTeacher.lastName}
                </Link>
              </p>
            )}
            <div className="space-y-1.5">
              <Label>Assign Teacher</Label>
              <Select value={classTeacherId || "none"} onValueChange={(v) => setClassTeacherId(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Select class teacher" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No class teacher</SelectItem>
                  {staff.map((member) => (
                    <SelectItem key={member.id} value={String(member.id)}>
                      {member.firstName} {member.lastName} ({member.staffId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" onClick={saveTeacher} disabled={savingTeacher} className="cursor-pointer">
              <Save className="h-3.5 w-3.5 mr-1.5" />
              {savingTeacher ? "Saving..." : "Save Teacher"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4" /> Subjects Undertaken</CardTitle>
          <Button size="sm" onClick={saveSubjects} disabled={savingSubjects} className="cursor-pointer">
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {savingSubjects ? "Saving..." : "Save Subjects"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {classSubjects.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {classSubjects.map((subject) => (
                <Badge key={subject.id} variant="secondary">
                  {subject.name}{subject.code ? ` (${subject.code})` : ""}
                </Badge>
              ))}
            </div>
          )}
          {subjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No subjects available. Add subjects under Academics first.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
              {subjects.map((subject) => (
                <label key={subject.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={subjectIds.includes(subject.id)}
                    onCheckedChange={() => toggleSubject(subject.id)}
                  />
                  <span>{subject.name}{subject.code ? ` (${subject.code})` : ""}</span>
                </label>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" /> Enrolled Students ({students.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search enrolled students..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
            />
          </div>
          {filteredStudents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No students enrolled in this class.</p>
          ) : (
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Name</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Student ID</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-muted/20">
                      <td className="px-3 py-2 font-medium">{student.firstName} {student.lastName}</td>
                      <td className="px-3 py-2 text-muted-foreground font-mono text-xs">{student.studentId}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" asChild className="cursor-pointer h-7">
                            <Link href={`/dashboard/students/${student.uuid}`}>View</Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="cursor-pointer h-7 text-destructive hover:text-destructive"
                            onClick={() => void removeStudent(student)}
                          >
                            Remove
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Students
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search students to add..."
              value={addStudentSearch}
              onChange={(e) => setAddStudentSearch(e.target.value)}
            />
          </div>
          {filteredAvailable.length === 0 ? (
            <p className="text-sm text-muted-foreground">No available students to add.</p>
          ) : (
            <div className="max-h-64 overflow-y-auto border rounded-lg divide-y">
              {filteredAvailable.map((student) => (
                <label
                  key={student.id}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-muted/20 cursor-pointer text-sm"
                >
                  <Checkbox
                    checked={selectedToAdd.includes(student.id)}
                    onCheckedChange={() => toggleStudentToAdd(student.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{student.firstName} {student.lastName}</p>
                    <p className="text-xs text-muted-foreground font-mono">{student.studentId}</p>
                  </div>
                  {student.gradeLevel && (
                    <Badge variant="outline" className="text-xs shrink-0">{student.gradeLevel}</Badge>
                  )}
                </label>
              ))}
            </div>
          )}
          <Button
            onClick={assignStudents}
            disabled={selectedToAdd.length === 0 || assigningStudents}
            className="cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            {assigningStudents ? "Adding..." : `Add ${selectedToAdd.length || ""} Student${selectedToAdd.length === 1 ? "" : "s"}`}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Class Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <DetailItem label="Academic Year" value={schoolClass.academicYear} />
          <DetailItem label="Capacity" value={schoolClass.capacity?.toString()} />
          <DetailItem label="Subjects" value={String(subjectIds.length)} />
          <DetailItem label="Students" value={String(students.length)} />
          <div>
            <p className="text-xs text-muted-foreground">Classroom</p>
            {schoolClass.assignedRoom || schoolClass.room ? (
              <p className="text-sm font-medium">
                {schoolClass.assignedRoom ? roomLabel(schoolClass.assignedRoom) : schoolClass.room}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Not assigned</p>
            )}
            <Link href="/dashboard/rooms" className="text-xs text-primary hover:underline">
              Assign in Room Management →
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ClassShowPage(props: PageProps) {
  return (
    <DashboardLayout>
      <ClassShowContent {...props} />
    </DashboardLayout>
  );
}
