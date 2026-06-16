import { useState } from "react";
import { router } from "@inertiajs/react";
import { DashboardLayout } from "../_components/layout.tsx";
import { useCurrentSchool } from "../_components/use-current-school.ts";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select.tsx";
import { toast } from "sonner";
import { routerDeleteWithConfirm } from "@/lib/confirm.ts";
import { motion } from "motion/react";
import { CalendarDays, Plus, Pencil, Trash2, Clock } from "lucide-react";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"] as const;
type Day = typeof DAYS[number];

const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

type SchoolClass = {
  id: number;
  name: string;
  gradeLevel: string;
};

type StaffMember = {
  id: number;
  firstName: string;
  lastName: string;
  role: string;
};

export type TimetableSlot = {
  id: number;
  schoolId: number;
  classId: number;
  day: Day;
  period: number;
  subject: string;
  teacherId?: number | null;
  room?: string | null;
  startTime: string;
  endTime: string;
  academicYear: string;
  createdAt: string;
};

type SlotForm = {
  subject: string;
  teacherId: string;
  room: string;
  startTime: string;
  endTime: string;
};

const EMPTY_FORM: SlotForm = { subject: "", teacherId: "", room: "", startTime: "08:00", endTime: "09:00" };

function TimetableInner({ classes, staff, slots }: PageProps) {
  const { schoolId } = useCurrentSchool();
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editSlot, setEditSlot] = useState<TimetableSlot | null>(null);
  const [form, setForm] = useState<SlotForm>(EMPTY_FORM);
  const [activeDay, setActiveDay] = useState<Day>("monday");
  const [activePeriod, setActivePeriod] = useState(1);

  const classId = classes.find((c) => String(c.id) === selectedClass)?.id;
  const timetable = classId ? slots.filter((s) => s.classId === classId) : [];

  // Grid: day -> period -> slot
  const grid: Record<Day, Record<number, TimetableSlot | undefined>> = {} as never;
  DAYS.forEach((d) => {
    grid[d] = {};
    PERIODS.forEach((p) => {
      grid[d][p] = timetable.find((s) => s.day === d && s.period === p);
    });
  });

  const openAdd = (day: Day, period: number) => {
    setActiveDay(day);
    setActivePeriod(period);
    setEditSlot(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (slot: TimetableSlot) => {
    setEditSlot(slot);
    setForm({
      subject: slot.subject,
      teacherId: slot.teacherId ? String(slot.teacherId) : "",
      room: slot.room ?? "",
      startTime: slot.startTime,
      endTime: slot.endTime,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!schoolId || !classId) return;
    const teacherId = form.teacherId && form.teacherId !== "none" ? Number(form.teacherId) : null;
    const options = {
      preserveScroll: true,
      onSuccess: () => {
        toast.success(editSlot ? "Slot updated" : "Slot added");
        setDialogOpen(false);
      },
      onError: () => toast.error("Failed to save slot"),
    };
    if (editSlot) {
      router.put(`/dashboard/timetable/${editSlot.id}`, {
        subject: form.subject,
        teacherId,
        room: form.room || undefined,
        startTime: form.startTime,
        endTime: form.endTime,
      }, options);
    } else {
      router.post("/dashboard/timetable", {
        classId,
        day: activeDay,
        period: activePeriod,
        subject: form.subject,
        teacherId,
        room: form.room || undefined,
        startTime: form.startTime,
        endTime: form.endTime,
        academicYear: "2024-2025",
      }, options);
    }
  };

  const handleDelete = async (slotId: number) => {
    await routerDeleteWithConfirm(`/dashboard/timetable/${slotId}`, {
      title: "Remove this timetable slot?",
      onSuccess: () => toast.success("Slot removed"),
      onError: () => toast.error("Failed to remove slot"),
    });
  };

  const getTeacherName = (id?: number | null) => {
    if (!id) return "";
    const teacher = staff.find((s) => s.id === id);
    return teacher ? `${teacher.firstName} ${teacher.lastName}` : "";
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
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold flex items-center gap-2">
              <CalendarDays className="h-6 w-6 text-primary" /> Timetable
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Build and manage class schedules</p>
          </div>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Select a class…" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name} – Grade {c.gradeLevel}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {!selectedClass ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <CalendarDays className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Select a class to view or edit its timetable.</p>
          </CardContent>
        </Card>
      ) : (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                {classes.find((c) => String(c.id) === selectedClass)?.name} — Weekly Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground w-16">Period</th>
                      {DAYS.map((d) => (
                        <th key={d} className="px-3 py-2.5 text-left font-semibold capitalize">{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PERIODS.map((period) => (
                      <tr key={period} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-3 py-2.5 text-muted-foreground font-medium">{period}</td>
                        {DAYS.map((day) => {
                          const slot = grid[day][period];
                          return (
                            <td key={day} className="px-2 py-2 min-w-[140px]">
                              {slot ? (
                                <div className="bg-primary/10 rounded-lg p-2 group relative">
                                  <p className="font-semibold text-xs">{slot.subject}</p>
                                  {slot.teacherId && (
                                    <p className="text-xs text-muted-foreground truncate">{getTeacherName(slot.teacherId)}</p>
                                  )}
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                    <Clock className="h-3 w-3" />
                                    {slot.startTime}–{slot.endTime}
                                  </div>
                                  <div className="absolute top-1 right-1 hidden group-hover:flex gap-1">
                                    <button title="openEdit" onClick={() => openEdit(slot)} className="p-1 rounded bg-background/80 hover:bg-background cursor-pointer">
                                      <Pencil className="h-3 w-3" />
                                    </button>
                                    <button title="handleDelete" onClick={() => handleDelete(slot.id)} className="p-1 rounded bg-background/80 hover:bg-red-50 hover:text-red-600 cursor-pointer">
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => openAdd(day, period)}
                                  className="w-full h-full min-h-[52px] rounded-lg border border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer flex items-center justify-center text-muted-foreground text-xs gap-1"
                                >
                                  <Plus className="h-3.5 w-3.5" /> Add
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editSlot ? "Edit Slot" : `Add Slot — ${activeDay} Period ${activePeriod}`}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Subject *</Label>
              <Input
                value={form.subject}
                onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                placeholder="e.g. Mathematics"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Teacher</Label>
              <Select
                value={form.teacherId}
                onValueChange={(v) => setForm((p) => ({ ...p, teacherId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Assign teacher…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {staff
                    .filter((s) => s.role === "teacher")
                    .map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.firstName} {s.lastName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Room</Label>
              <Input
                value={form.room}
                onChange={(e) => setForm((p) => ({ ...p, room: e.target.value }))}
                placeholder="e.g. Room 204"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start Time</Label>
                <Input type="time" value={form.startTime} onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>End Time</Label>
                <Input type="time" value={form.endTime} onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDialogOpen(false)} className="cursor-pointer">Cancel</Button>
            <Button onClick={handleSave} disabled={!form.subject} className="cursor-pointer">
              {editSlot ? "Update" : "Add Slot"}
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
  slots: TimetableSlot[];
};

export default function TimetablePage(props: PageProps) {
  return (
    <DashboardLayout>
      <TimetableInner {...props} />
    </DashboardLayout>
  );
}
