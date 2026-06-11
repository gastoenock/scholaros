import { useState } from "react";
import { router } from "@inertiajs/react";
import { DashboardLayout } from "../_components/layout.tsx";
import { useCurrentSchool } from "../_components/use-current-school.ts";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import {
  Calendar, Plus, Video, MapPin, Clock, CheckCircle2, XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty.tsx";
import type { StaffMember } from "../staff/page.tsx";
import type { Student } from "../students/page.tsx";

export type Meeting = {
  id: number;
  schoolId: number;
  parentId: number;
  teacherId: number;
  studentId: number;
  title: string;
  description?: string | null;
  scheduledAt: string;
  durationMinutes: number;
  status: string;
  meetingType: "in_person" | "virtual";
  location?: string | null;
  meetingLink?: string | null;
  parentName: string;
  teacherName: string;
  studentName: string;
};

type PageProps = {
  meetings: Meeting[];
  staff: StaffMember[];
  students: Student[];
  filters: { status: string };
};

function CreateMeetingForm({
  staff,
  students,
  onSuccess,
}: {
  staff: StaffMember[];
  students: Student[];
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [duration, setDuration] = useState("30");
  const [meetingType, setMeetingType] = useState<"in_person" | "virtual">("in_person");
  const [location, setLocation] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const teachers = staff.filter((s) => s.role === "teacher");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher || !selectedStudent || !scheduledAt || !title) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    router.post("/dashboard/meetings", {
      teacherId: parseInt(selectedTeacher, 10),
      studentId: parseInt(selectedStudent, 10),
      title,
      description: description || undefined,
      scheduledAt: new Date(scheduledAt).toISOString(),
      durationMinutes: parseInt(duration, 10),
      meetingType,
      location: location || undefined,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success("Meeting requested successfully");
        onSuccess();
      },
      onError: () => toast.error("Failed to request meeting"),
      onFinish: () => setSubmitting(false),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Meeting about academic progress" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Teacher</Label>
          <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
            <SelectTrigger className="cursor-pointer"><SelectValue placeholder="Select teacher" /></SelectTrigger>
            <SelectContent>
              {teachers.map((t) => (
                <SelectItem key={t.id} value={String(t.id)} className="cursor-pointer">
                  {t.firstName} {t.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Student</Label>
          <Select value={selectedStudent} onValueChange={setSelectedStudent}>
            <SelectTrigger className="cursor-pointer"><SelectValue placeholder="Select student" /></SelectTrigger>
            <SelectContent>
              {students.map((s) => (
                <SelectItem key={s.id} value={String(s.id)} className="cursor-pointer">
                  {s.firstName} {s.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Date & Time</Label>
          <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} required />
        </div>
        <div>
          <Label>Duration (minutes)</Label>
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger className="cursor-pointer"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["15", "30", "45", "60"].map((v) => (
                <SelectItem key={v} value={v} className="cursor-pointer">{v} min</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Type</Label>
          <Select value={meetingType} onValueChange={(v) => setMeetingType(v as "in_person" | "virtual")}>
            <SelectTrigger className="cursor-pointer"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="in_person" className="cursor-pointer">In Person</SelectItem>
              <SelectItem value="virtual" className="cursor-pointer">Virtual</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Location</Label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder={meetingType === "virtual" ? "Meeting link" : "Room number"} />
        </div>
      </div>
      <div>
        <Label>Description (optional)</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What would you like to discuss?" rows={2} />
      </div>
      <Button type="submit" disabled={submitting} className="w-full cursor-pointer">
        {submitting ? "Submitting..." : "Request Meeting"}
      </Button>
    </form>
  );
}

function MeetingsContent({ meetings, staff, students, filters }: PageProps) {
  const { schoolId, role } = useCurrentSchool();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const handleStatusFilter = (status: string) => {
    router.get("/dashboard/meetings", { status: status === "all" ? undefined : status }, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const handleStatusUpdate = (meetingId: number, status: "confirmed" | "cancelled" | "completed") => {
    router.put(`/dashboard/meetings/${meetingId}/status`, { status }, {
      preserveScroll: true,
      onSuccess: () => toast.success(`Meeting ${status}`),
      onError: () => toast.error("Failed to update meeting status"),
    });
  };

  const statusColors: Record<string, string> = {
    requested: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    confirmed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    completed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
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
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-extrabold">Parent-Teacher Meetings</h1>
          <p className="text-muted-foreground mt-1">Schedule and manage meetings</p>
        </div>
        <div className="flex gap-2">
          <Select value={filters.status} onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-[140px] cursor-pointer"><SelectValue placeholder="Filter" /></SelectTrigger>
            <SelectContent>
              {["all", "requested", "confirmed", "completed", "cancelled"].map((s) => (
                <SelectItem key={s} value={s} className="cursor-pointer capitalize">{s === "all" ? "All" : s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="cursor-pointer"><Plus className="h-4 w-4 mr-1.5" /> Schedule Meeting</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Schedule a Meeting</DialogTitle></DialogHeader>
              <CreateMeetingForm staff={staff} students={students} onSuccess={() => setShowCreateDialog(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {meetings.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><Calendar /></EmptyMedia>
            <EmptyTitle>No meetings scheduled</EmptyTitle>
            <EmptyDescription>Schedule your first parent-teacher meeting</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="sm" onClick={() => setShowCreateDialog(true)} className="cursor-pointer">
              <Plus className="h-4 w-4 mr-1.5" /> Schedule Meeting
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="space-y-3">
          {meetings.map((meeting) => (
            <Card key={meeting.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${meeting.meetingType === "virtual" ? "bg-blue-50 dark:bg-blue-950/30" : "bg-emerald-50 dark:bg-emerald-950/30"}`}>
                      {meeting.meetingType === "virtual" ? <Video className="h-5 w-5 text-blue-600" /> : <MapPin className="h-5 w-5 text-emerald-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{meeting.title}</p>
                      <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(meeting.scheduledAt), "MMM d, yyyy h:mm a")}
                        </span>
                        <span>({meeting.durationMinutes} min)</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                        <span>Parent: {meeting.parentName}</span>
                        <span>Teacher: {meeting.teacherName}</span>
                        <span>Student: {meeting.studentName}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`capitalize text-xs ${statusColors[meeting.status] ?? ""}`}>{meeting.status}</Badge>
                    {meeting.status === "requested" && (role === "admin" || role === "superadmin") && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleStatusUpdate(meeting.id, "confirmed")} className="cursor-pointer text-green-600 hover:text-green-700">
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleStatusUpdate(meeting.id, "cancelled")} className="cursor-pointer text-red-600 hover:text-red-700">
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    {meeting.status === "confirmed" && (
                      <Button size="sm" variant="ghost" onClick={() => handleStatusUpdate(meeting.id, "completed")} className="cursor-pointer text-blue-600 hover:text-blue-700">
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Done
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}
    </div>
  );
}

export default function MeetingsPage(props: PageProps) {
  return (
    <DashboardLayout>
      <MeetingsContent {...props} />
    </DashboardLayout>
  );
}
