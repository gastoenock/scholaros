import { router } from "@inertiajs/react";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { BookOpen, Calendar, ClipboardList, GraduationCap, Clock } from "lucide-react";
import { motion } from "motion/react";
import type { AuthUser, School } from "@/lib/types.ts";
import { roomLabel } from "@/lib/rooms.ts";

type StudentLite = {
  id: number;
  uuid: string;
  firstName: string;
  lastName: string;
  studentId: string;
  gradeLevel?: string | null;
  classSection?: string | null;
  schoolClass?: {
    name: string;
    assignedRoom?: { id: number; name: string; building?: string | null; displayName: string } | null;
    classTeacher?: { firstName: string; lastName: string } | null;
  } | null;
};

type ExamResultLite = {
  id: number;
  score: number;
  grade?: string | null;
  examTitle: string;
  subjectName: string;
  examDate: string;
  maxScore: number;
};

type TimetableSlotLite = {
  id: number;
  subject: string;
  startTime: string;
  endTime: string;
  room?: string | null;
};

type AssignmentLite = {
  id: number;
  title: string;
  dueDate: string;
  type: string;
};

export type StudentDashboardData = {
  student: StudentLite;
  examResults: ExamResultLite[];
  attendanceRate: number;
  totalDays: number;
  presentDays: number;
  todayTimetable: TimetableSlotLite[];
  upcomingAssignments: AssignmentLite[];
};

export function StudentDashboard({
  user,
  school,
  data,
}: {
  user: AuthUser;
  school: School | null;
  data: StudentDashboardData;
}) {
  const { student } = data;
  const cls = student.schoolClass;

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-extrabold">Welcome, {student.firstName}</h1>
        <p className="text-muted-foreground mt-1">
          {cls?.name ?? `Grade ${student.gradeLevel ?? "N/A"}`}{school ? ` · ${school.name}` : ""}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          { label: "Attendance", value: `${data.attendanceRate}%`, icon: Calendar },
          { label: "Recent Results", value: data.examResults.length, icon: GraduationCap },
          { label: "Due Assignments", value: data.upcomingAssignments.length, icon: ClipboardList },
          { label: "Classes Today", value: data.todayTimetable.length, icon: BookOpen },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <stat.icon className="h-4.5 w-4.5 text-primary" />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">My Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Student ID</p>
            <p className="font-medium font-mono">{student.studentId}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Class</p>
            <p className="font-medium">{cls?.name ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Class Teacher</p>
            <p className="font-medium">
              {cls?.classTeacher ? `${cls.classTeacher.firstName} ${cls.classTeacher.lastName}` : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Classroom</p>
            <p className="font-medium">
              {cls?.assignedRoom ? roomLabel(cls.assignedRoom) : "—"}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Today&apos;s Timetable</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.todayTimetable.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No classes today.</p>
            ) : (
              data.todayTimetable.map((slot) => (
                <div key={slot.id} className="flex items-center gap-3 p-2 rounded-lg border">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{slot.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {slot.startTime} – {slot.endTime}{slot.room ? ` · ${slot.room}` : ""}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Recent Exam Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.examResults.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No results yet.</p>
            ) : (
              data.examResults.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30">
                  <div>
                    <p className="text-sm font-medium">{r.subjectName}</p>
                    <p className="text-xs text-muted-foreground">{r.examTitle}</p>
                  </div>
                  <Badge variant="secondary">{r.score}/{r.maxScore}{r.grade ? ` · ${r.grade}` : ""}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Upcoming Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          {data.upcomingAssignments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No upcoming assignments.</p>
          ) : (
            <div className="space-y-2">
              {data.upcomingAssignments.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-2 rounded-lg border">
                  <p className="text-sm font-medium">{a.title}</p>
                  <span className="text-xs text-muted-foreground">Due {a.dueDate}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Timetable", href: "/dashboard/timetable" },
          { label: "Academics", href: "/dashboard/academics" },
          { label: "Library", href: "/dashboard/library" },
          { label: "Messages", href: "/dashboard/messages" },
        ].map((action) => (
          <Button key={action.label} variant="secondary" className="cursor-pointer" onClick={() => router.visit(action.href)}>
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
