import { useState } from "react";
import { router } from "@inertiajs/react";
import { DashboardLayout } from "../_components/layout.tsx";
import { useCurrentSchool } from "../_components/use-current-school.ts";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select.tsx";
import { toast } from "sonner";
import { routerDeleteWithConfirm } from "@/lib/confirm.ts";
import { motion } from "motion/react";
import { BookOpen, Plus, Trash2, Pencil, Users } from "lucide-react";
import type { StaffMember } from "../staff/page.tsx";
import type { Student } from "../students/page.tsx";

export type SchoolClass = {
  id: number;
  schoolId: number;
  schoolBranchId?: number | null;
  name: string;
  gradeLevel: string;
  section?: string | null;
  classTeacherId?: number | null;
  room?: string | null;
  academicYear: string;
  capacity?: number | null;
  createdAt: string;
};

type ClassForm = {
  name: string;
  gradeLevel: string;
  section: string;
  room: string;
  academicYear: string;
  capacity: string;
};

const EMPTY: ClassForm = { name: "", gradeLevel: "", section: "", room: "", academicYear: "2024-2025", capacity: "" };

function ClassesContent({ classes, staff, students }: PageProps) {
  const { schoolId } = useCurrentSchool();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SchoolClass | null>(null);
  const [form, setForm] = useState<ClassForm>(EMPTY);
  const [saving, setSaving] = useState(false);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setOpen(true); };
  const openEdit = (c: SchoolClass) => {
    setEditing(c);
    setForm({
      name: c.name,
      gradeLevel: c.gradeLevel,
      section: c.section ?? "",
      room: c.room ?? "",
      academicYear: c.academicYear,
      capacity: c.capacity?.toString() ?? "",
    });
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.gradeLevel) return;
    setSaving(true);
    const payload = {
      name: form.name,
      gradeLevel: form.gradeLevel,
      section: form.section || undefined,
      room: form.room || undefined,
      academicYear: form.academicYear,
      capacity: form.capacity ? parseInt(form.capacity) : undefined,
    };
    const options = {
      preserveScroll: true,
      onSuccess: () => {
        toast.success(editing ? "Class updated" : "Class created");
        setOpen(false);
      },
      onError: () => toast.error("Failed to save class"),
      onFinish: () => setSaving(false),
    };
    if (editing) {
      router.put(`/dashboard/classes/${editing.id}`, payload, options);
    } else {
      router.post("/dashboard/classes", payload, options);
    }
  };

  const handleDelete = async (id: number) => {
    await routerDeleteWithConfirm(`/dashboard/classes/${id}`, {
      title: "Delete this class?",
      onSuccess: () => toast.success("Class deleted"),
      onError: () => toast.error("Failed to delete class"),
    });
  };

  const getStudentCount = (c: SchoolClass) =>
    students.filter((s) => s.classSection === c.name || s.classSection === `${c.name}-${c.section}`).length;

  if (!schoolId) {
    return <div className="text-muted-foreground text-center py-20">No school linked.</div>;
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" /> Classes
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Manage class sections and assign teachers</p>
          </div>
          <Button onClick={openAdd} className="cursor-pointer">
            <Plus className="h-4 w-4 mr-1.5" /> Add Class
          </Button>
        </div>
      </motion.div>

      {classes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 gap-3">
            <BookOpen className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No classes yet. Add your first class to get started.</p>
            <Button onClick={openAdd} size="sm" className="cursor-pointer">
              <Plus className="h-4 w-4 mr-1.5" /> Add Class
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((c, i) => {
            const teacher = staff.find((s) => s.id === c.classTeacherId);
            const studentCount = getStudentCount(c);
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-base">{c.name}</h3>
                        <p className="text-sm text-muted-foreground">Grade {c.gradeLevel}{c.section ? ` · Section ${c.section}` : ""}</p>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => openEdit(c)} className="p-1.5 rounded hover:bg-muted cursor-pointer">
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                        <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded hover:bg-red-50 hover:text-red-600 cursor-pointer">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        <span>{studentCount} students{c.capacity ? ` / ${c.capacity} capacity` : ""}</span>
                      </div>
                      {teacher && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <BookOpen className="h-3.5 w-3.5" />
                          <span>Class Teacher: {teacher.firstName} {teacher.lastName}</span>
                        </div>
                      )}
                      {c.room && (
                        <div className="text-muted-foreground">Room: {c.room}</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Class" : "Add Class"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Class Name *</Label>
                <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Class 10A" />
              </div>
              <div className="space-y-1.5">
                <Label>Grade Level *</Label>
                <Input value={form.gradeLevel} onChange={(e) => setForm((p) => ({ ...p, gradeLevel: e.target.value }))} placeholder="e.g. 10" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Section</Label>
                <Input value={form.section} onChange={(e) => setForm((p) => ({ ...p, section: e.target.value }))} placeholder="e.g. A" />
              </div>
              <div className="space-y-1.5">
                <Label>Room</Label>
                <Input value={form.room} onChange={(e) => setForm((p) => ({ ...p, room: e.target.value }))} placeholder="e.g. Room 101" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Academic Year</Label>
                <Input value={form.academicYear} onChange={(e) => setForm((p) => ({ ...p, academicYear: e.target.value }))} placeholder="2024-2025" />
              </div>
              <div className="space-y-1.5">
                <Label>Capacity</Label>
                <Input type="number" value={form.capacity} onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))} placeholder="e.g. 30" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)} className="cursor-pointer">Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name || !form.gradeLevel || saving} className="cursor-pointer">
              {saving ? "Saving…" : editing ? "Update" : "Create Class"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type PageProps = {
  classes: SchoolClass[];
  staff: StaffMember[];
  students: Student[];
};

export default function ClassesPage(props: PageProps) {
  return (
    <DashboardLayout>
      <ClassesContent {...props} />
    </DashboardLayout>
  );
}
