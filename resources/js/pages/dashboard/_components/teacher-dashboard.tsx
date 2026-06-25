import { router } from "@inertiajs/react";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { BookOpen, Calendar, ClipboardList, Users, Clock } from "lucide-react";
import { motion } from "motion/react";
import type { AuthUser, School } from "@/lib/types.ts";
import { roomLabel } from "@/lib/rooms.ts";

type StaffLite = {
  id: number;
  firstName: string;
  lastName: string;
  designation?: string | null;
  department?: string | null;
};

type ClassLite = {
  id: number;
  uuid: string;
  name: string;
  gradeLevel: string;
  section?: string | null;
  assignedRoom?: { id: number; name: string; building?: string | null; displayName: string } | null;
};

type TimetableSlotLite = {
  id: number;
  subject: string;
  startTime: string;
  endTime: string;
  room?: string | null;
  period: number;
};

type AssignmentLite = {
  id: number;
  title: string;
  dueDate: string;
  type: string;
};

export type TeacherDashboardData = {
  staff: StaffLite;
  classes: ClassLite[];
  studentCount: number;
  todaySlots: TimetableSlotLite[];
  pendingSubmissions: number;
  recentAssignments: AssignmentLite[];
};

export function TeacherDashboard({
  user,
  school,
  data,
}: {
  user: AuthUser;
  school: School | null;
  data: TeacherDashboardData;
}) {
  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-extrabold">
          Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 17 ? "Afternoon" : "Evening"},{" "}
          {user.name?.split(" ")[0] ?? "Teacher"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {data.staff.designation ?? "Teacher"}{school ? ` · ${school.name}` : ""}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          { label: "My Classes", value: data.classes.length, icon: BookOpen },
          { label: "My Students", value: data.studentCount, icon: Users },
          { label: "To Grade", value: data.pendingSubmissions, icon: ClipboardList },
          { label: "Lessons Today", value: data.todaySlots.length, icon: Calendar },
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">My Classes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.classes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No classes assigned yet.</p>
            ) : (
              data.classes.map((cls) => (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => router.visit(`/dashboard/classes/${cls.uuid}`)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 text-left cursor-pointer"
                >
                  <div>
                    <p className="font-medium">{cls.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Grade {cls.gradeLevel}{cls.section ? ` · Section ${cls.section}` : ""}
                    </p>
                  </div>
                  {cls.assignedRoom && (
                    <Badge variant="secondary" className="text-xs">{roomLabel(cls.assignedRoom)}</Badge>
                  )}
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Today&apos;s Timetable</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.todaySlots.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No lessons scheduled today.</p>
            ) : (
              data.todaySlots.map((slot) => (
                <div key={slot.id} className="flex items-center gap-3 p-2 rounded-lg border">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
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
      </div>

      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">Recent Assignments</CardTitle>
          <Button variant="ghost" size="sm" className="cursor-pointer text-xs" onClick={() => router.visit("/dashboard/academics")}>
            View Academics
          </Button>
        </CardHeader>
        <CardContent>
          {data.recentAssignments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No assignments yet.</p>
          ) : (
            <div className="space-y-2">
              {data.recentAssignments.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30">
                  <div>
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{a.type} · Due {a.dueDate}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Attendance", href: "/dashboard/attendance" },
          { label: "Timetable", href: "/dashboard/timetable" },
          { label: "Exam Reports", href: "/dashboard/academics/reports" },
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
