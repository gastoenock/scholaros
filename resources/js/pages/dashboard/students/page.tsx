import { useMemo, useState, useEffect } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import { DashboardLayout } from "../_components/layout.tsx";
import { useCurrentSchool } from "../_components/use-current-school.ts";
import { AcademicYearField } from "@/components/academic-calendar-fields.tsx";
import { defaultYearId, type SharedWithCalendar } from "@/lib/academic-calendar.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog.tsx";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select.tsx";
import {
  Users, Plus, Search, Eye, Pencil, Trash2,
  Phone, Mail, MapPin, Calendar, User, HeartPulse,
} from "lucide-react";
import { toast } from "sonner";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty.tsx";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import type { Branch, School } from "@/lib/types.ts";
import { routerDeleteWithConfirm } from "@/lib/confirm.ts";

const GRADES = ["Pre-K", "Kindergarten", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5",
  "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];

type Guardian = {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  occupation?: string;
  isEmergencyContact: boolean;
};

export type Student = {
  id: number;
  uuid: string;
  schoolId: number;
  schoolBranchId?: number | null;
  classId?: number | null;
  firstName: string;
  lastName: string;
  dateOfBirth?: string | null;
  gender?: "male" | "female" | "other" | null;
  nationality?: string | null;
  religion?: string | null;
  bloodGroup?: string | null;
  studentId: string;
  gradeLevel?: string | null;
  classSection?: string | null;
  enrollmentDate?: string | null;
  academicYear?: string | null;
  academicYearId?: number | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  email?: string | null;
  phone?: string | null;
  guardians?: Guardian[] | null;
  status: string;
  medicalNotes?: string | null;
  createdAt: string;
};

type Stats = {
  total: number;
  active: number;
  byGrade: Record<string, number>;
};

const studentSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  gradeLevel: z.string().optional(),
  classSection: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  nationality: z.string().optional(),
  bloodGroup: z.string().optional(),
  medicalNotes: z.string().optional(),
  enrollmentDate: z.string().optional(),
  guardians: z.array(z.object({
    name: z.string().min(1, "Required"),
    relationship: z.string().min(1, "Required"),
    phone: z.string().min(1, "Required"),
    email: z.string().optional(),
    occupation: z.string().optional(),
    isEmergencyContact: z.boolean(),
  })).optional(),
});
type StudentFormData = z.infer<typeof studentSchema>;

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700 border-green-200",
  inactive: "bg-gray-100 text-gray-600 border-gray-200",
  graduated: "bg-blue-100 text-blue-700 border-blue-200",
  transferred: "bg-purple-100 text-purple-700 border-purple-200",
  suspended: "bg-red-100 text-red-700 border-red-200",
};

function StudentFormDialog({
  open,
  onClose,
  editStudent,
  branches,
}: {
  open: boolean;
  onClose: () => void;
  editStudent?: Student | null;
  branches: Branch[];
}) {
  const isEdit = !!editStudent;
  const { academicCalendar } = usePage<SharedWithCalendar>().props;
  const [academicYearId, setAcademicYearId] = useState<number | null>(() =>
    editStudent?.academicYearId ?? defaultYearId(academicCalendar),
  );

  const { register, handleSubmit, control, setValue, watch, formState: { errors, isSubmitting }, reset } =
    useForm<StudentFormData>({
      resolver: zodResolver(studentSchema),
      defaultValues: editStudent ? {
        firstName: editStudent.firstName,
        lastName: editStudent.lastName,
        dateOfBirth: editStudent.dateOfBirth ?? undefined,
        gender: editStudent.gender ?? undefined,
        gradeLevel: editStudent.gradeLevel ?? undefined,
        classSection: editStudent.classSection ?? undefined,
        email: editStudent.email ?? undefined,
        phone: editStudent.phone ?? undefined,
        address: editStudent.address ?? undefined,
        city: editStudent.city ?? undefined,
        state: editStudent.state ?? undefined,
        nationality: editStudent.nationality ?? undefined,
        bloodGroup: editStudent.bloodGroup ?? undefined,
        medicalNotes: editStudent.medicalNotes ?? undefined,
        enrollmentDate: editStudent.enrollmentDate ?? undefined,
        guardians: editStudent.guardians ?? [],
      } : {
        guardians: [{ name: "", relationship: "", phone: "", email: "", isEmergencyContact: true }],
        city: "Philadelphia",
        state: "PA",
      },
    });

  const { fields: guardianFields, append: addGuardian, remove: removeGuardian } = useFieldArray({
    control,
    name: "guardians",
  });

  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    editStudent?.schoolBranchId ? String(editStudent.schoolBranchId) : "",
  );

  const gender = watch("gender");
  const gradeLevel = watch("gradeLevel");

  const onSubmit = (data: StudentFormData) =>
    new Promise<void>((resolve) => {
      const payload = {
        ...data,
        email: data.email || undefined,
        academicYearId: academicYearId ?? undefined,
        schoolBranchId: selectedBranchId ? parseInt(selectedBranchId, 10) : undefined,
      };
      const options = {
        preserveScroll: true,
        onSuccess: () => {
          toast.success(isEdit ? "Student updated!" : "Student added!");
          reset();
          onClose();
        },
        onError: () => {
          toast.error("Failed to save student");
        },
        onFinish: () => resolve(),
      };
      if (isEdit) {
        router.put(`/dashboard/students/${editStudent.uuid}`, payload, options);
      } else {
        router.post("/dashboard/students", payload, options);
      }
    });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Student" : "Add New Student"}</DialogTitle>
          <DialogDescription>Fill in the student details below.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Tabs defaultValue="personal">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="personal" className="flex-1">Personal</TabsTrigger>
              <TabsTrigger value="academic" className="flex-1">Academic</TabsTrigger>
              <TabsTrigger value="guardians" className="flex-1">Guardians</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1.5 block">First Name *</Label>
                  <Input placeholder="John" {...register("firstName")} />
                  {errors.firstName && <p className="text-destructive text-xs mt-1">{errors.firstName.message}</p>}
                </div>
                <div>
                  <Label className="mb-1.5 block">Last Name *</Label>
                  <Input placeholder="Smith" {...register("lastName")} />
                  {errors.lastName && <p className="text-destructive text-xs mt-1">{errors.lastName.message}</p>}
                </div>
                <div>
                  <Label className="mb-1.5 block">Date of Birth</Label>
                  <Input type="date" {...register("dateOfBirth")} />
                </div>
                <div>
                  <Label className="mb-1.5 block">Gender</Label>
                  <Select value={gender ?? ""} onValueChange={(v) => setValue("gender", v as "male" | "female" | "other")}>
                    <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-1.5 block">Email</Label>
                  <Input placeholder="student@example.com" {...register("email")} />
                </div>
                <div>
                  <Label className="mb-1.5 block">Phone</Label>
                  <Input placeholder="(215) 555-0100" {...register("phone")} />
                </div>
                <div>
                  <Label className="mb-1.5 block">Nationality</Label>
                  <Input placeholder="American" {...register("nationality")} />
                </div>
                <div>
                  <Label className="mb-1.5 block">Blood Group</Label>
                  <Input placeholder="A+" {...register("bloodGroup")} />
                </div>
                <div className="col-span-2">
                  <Label className="mb-1.5 block">Address</Label>
                  <Input placeholder="123 Main Street" {...register("address")} />
                </div>
                <div>
                  <Label className="mb-1.5 block">City</Label>
                  <Input placeholder="Philadelphia" {...register("city")} />
                </div>
                <div>
                  <Label className="mb-1.5 block">State</Label>
                  <Input placeholder="PA" {...register("state")} />
                </div>
                <div className="col-span-2">
                  <Label className="mb-1.5 block">Medical Notes</Label>
                  <Textarea placeholder="Any allergies, conditions, or medications..." rows={2} {...register("medicalNotes")} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="academic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1.5 block">Grade Level</Label>
                  <Select value={gradeLevel ?? ""} onValueChange={(v) => setValue("gradeLevel", v)}>
                    <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                    <SelectContent>
                      {GRADES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-1.5 block">Class Section</Label>
                  <Input placeholder="e.g. A, B, C" {...register("classSection")} />
                </div>
                <div>
                  <Label className="mb-1.5 block">Enrollment Date</Label>
                  <Input type="date" {...register("enrollmentDate")} />
                </div>
                <div>
                  <AcademicYearField
                    calendar={academicCalendar}
                    value={academicYearId}
                    onChange={setAcademicYearId}
                  />
                </div>
                {branches.length > 0 && (
                  <div className="col-span-2">
                    <Label className="mb-1.5 block">Campus/Branch</Label>
                    <Select value={selectedBranchId || "none"} onValueChange={(v) => setSelectedBranchId(v === "none" ? "" : v)}>
                      <SelectTrigger><SelectValue placeholder="Select campus" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No branch</SelectItem>
                        {branches.map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="guardians" className="space-y-4">
              {guardianFields.map((field, index) => (
                <Card key={field.id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold">Guardian {index + 1}</h4>
                    {index > 0 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeGuardian(index)} className="cursor-pointer text-destructive h-7">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="mb-1.5 block text-xs">Full Name *</Label>
                      <Input placeholder="Jane Smith" {...register(`guardians.${index}.name`)} />
                    </div>
                    <div>
                      <Label className="mb-1.5 block text-xs">Relationship *</Label>
                      <Input placeholder="Mother, Father, Guardian" {...register(`guardians.${index}.relationship`)} />
                    </div>
                    <div>
                      <Label className="mb-1.5 block text-xs">Phone *</Label>
                      <Input placeholder="(215) 555-0100" {...register(`guardians.${index}.phone`)} />
                    </div>
                    <div>
                      <Label className="mb-1.5 block text-xs">Email</Label>
                      <Input placeholder="guardian@email.com" {...register(`guardians.${index}.email`)} />
                    </div>
                    <div>
                      <Label className="mb-1.5 block text-xs">Occupation</Label>
                      <Input placeholder="Engineer, Teacher..." {...register(`guardians.${index}.occupation`)} />
                    </div>
                  </div>
                </Card>
              ))}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="cursor-pointer"
                onClick={() => addGuardian({ name: "", relationship: "", phone: "", email: "", isEmergencyContact: false })}
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Guardian
              </Button>
            </TabsContent>
          </Tabs>

          <div className="flex gap-3 mt-6 pt-4 border-t">
            <Button type="submit" disabled={isSubmitting} className="cursor-pointer flex-1">
              {isSubmitting ? "Saving..." : isEdit ? "Update Student" : "Add Student"}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose} className="cursor-pointer">Cancel</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function StudentsContent({ students, stats, school, branches }: PageProps) {
  const { schoolId } = useCurrentSchool();
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const editUuid = params.get("edit");
    if (!editUuid) return;
    const student = students.find((s) => s.uuid === editUuid);
    if (student) setEditStudent(student);
  }, [students]);

  const branchList = branches.length > 0 ? branches : (school?.branches ?? []);

  const filteredStudents = useMemo(() => {
    let result = students;
    if (gradeFilter !== "all") {
      result = result.filter((s) => s.gradeLevel === gradeFilter);
    }
    if (search) {
      const term = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.firstName.toLowerCase().includes(term) ||
          s.lastName.toLowerCase().includes(term) ||
          s.studentId.toLowerCase().includes(term) ||
          s.email?.toLowerCase().includes(term),
      );
    }
    return result;
  }, [students, search, gradeFilter]);

  const handleDelete = async (uuid: string) => {
    await routerDeleteWithConfirm(`/dashboard/students/${uuid}`, {
      title: "Remove this student?",
      onSuccess: () => toast.success("Student removed"),
      onError: () => toast.error("Failed to remove student"),
    });
  };

  if (!schoolId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">No school linked to your account.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">Students</h1>
          <p className="text-muted-foreground">Manage all student records</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="cursor-pointer">
          <Plus className="h-4 w-4 mr-1.5" /> Add Student
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Students", value: stats?.total ?? "—", color: "text-blue-600" },
          { label: "Active", value: stats?.active ?? "—", color: "text-green-600" },
          { label: "Grade Levels", value: Object.keys(stats?.byGrade ?? {}).length || "—", color: "text-purple-600" },
          { label: "Branches", value: branchList.length || "1", color: "text-amber-600" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={gradeFilter} onValueChange={setGradeFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All grades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Grades</SelectItem>
            {GRADES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filteredStudents.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><Users /></EmptyMedia>
            <EmptyTitle>No students found</EmptyTitle>
            <EmptyDescription>
              {search || gradeFilter !== "all" ? "Try adjusting your filters." : "Add your first student to get started."}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="sm" onClick={() => setAddOpen(true)} className="cursor-pointer">
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Student
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase text-muted-foreground">Student</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase text-muted-foreground">ID</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase text-muted-foreground hidden md:table-cell">Grade</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase text-muted-foreground hidden lg:table-cell">Contact</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase text-muted-foreground">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-xs uppercase text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                          {student.firstName[0]}{student.lastName[0]}
                        </div>
                        <div>
                          <p className="font-medium">{student.firstName} {student.lastName}</p>
                          {student.email && <p className="text-xs text-muted-foreground">{student.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{student.studentId}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {student.gradeLevel ? (
                        <Badge variant="secondary" className="text-xs">{student.gradeLevel}</Badge>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">
                      {student.phone ?? student.email ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`${statusColors[student.status]} border text-xs capitalize`}>
                        {student.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 cursor-pointer" asChild>
                          <Link href={`/dashboard/students/${student.uuid}`}>
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 cursor-pointer" onClick={() => setEditStudent(student)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 cursor-pointer text-destructive hover:text-destructive" onClick={() => handleDelete(student.uuid)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <StudentFormDialog
        key={editStudent?.id ?? "new"}
        open={addOpen || !!editStudent}
        onClose={() => { setAddOpen(false); setEditStudent(null); }}
        editStudent={editStudent}
        branches={branchList}
      />
    </div>
  );
}

type PageProps = {
  students: Student[];
  stats: Stats;
  school: School | null;
  branches: Branch[];
};

export default function StudentsPage(props: PageProps) {
  return (
    <DashboardLayout>
      <StudentsContent {...props} />
    </DashboardLayout>
  );
}
