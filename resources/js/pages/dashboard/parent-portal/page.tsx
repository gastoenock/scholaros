import { router } from "@inertiajs/react";
import { DashboardLayout } from "../_components/layout.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  GraduationCap, Users, Calendar, Bell, BookOpen, TrendingUp, Clock, ArrowLeft,
} from "lucide-react";
import { motion } from "motion/react";
import { format } from "date-fns";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty.tsx";
import type { Student } from "../students/page.tsx";
import type { Meeting } from "../meetings/page.tsx";

type Notification = {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

type DashboardData = {
  user: { id: number; name: string; email: string; role: string };
  students: Student[];
  upcomingMeetings: Meeting[];
  notifications: Notification[];
  studentCount: number;
};

type StudentSummary = {
  student: Student;
  examResults: Array<{ id: number; score: number; grade?: string | null; examTitle: string; subjectName: string; examDate: string; maxScore: number }>;
  attendanceRate: number;
  totalDays: number;
  presentDays: number;
  submissionCount: number;
  gradedCount: number;
};

type PageProps = {
  dashboard: DashboardData | null;
  studentSummary?: StudentSummary | null;
};

function StudentSummaryView({ summary }: { summary: StudentSummary }) {
  const { student, examResults, attendanceRate, submissionCount, gradedCount } = summary;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.visit("/dashboard/parent-portal")} className="cursor-pointer">
        <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Portal
      </Button>
      <div>
        <h1 className="text-2xl font-extrabold">{student.firstName} {student.lastName}</h1>
        <p className="text-muted-foreground">Grade {student.gradeLevel ?? "N/A"} {student.classSection ? `- ${student.classSection}` : ""}</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Attendance", value: `${attendanceRate}%` },
          { label: "Submissions", value: submissionCount },
          { label: "Graded", value: gradedCount },
          { label: "Recent Results", value: examResults.length },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Recent Exam Results</CardTitle></CardHeader>
        <CardContent>
          {examResults.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No exam results yet.</p>
          ) : (
            <div className="space-y-2">
              {examResults.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-sm border-b last:border-0 pb-2">
                  <div>
                    <p className="font-medium">{r.examTitle}</p>
                    <p className="text-xs text-muted-foreground">{r.subjectName} · {r.examDate}</p>
                  </div>
                  <Badge variant="secondary">{r.score}/{r.maxScore} {r.grade ? `(${r.grade})` : ""}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ParentPortalContent({ dashboard }: { dashboard: DashboardData }) {
  const { user, students, upcomingMeetings, notifications, studentCount } = dashboard;

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-extrabold">Welcome back, {user.name?.split(" ")[0] ?? "Parent"}</h1>
        <p className="text-muted-foreground mt-1">Here&apos;s how your {studentCount === 1 ? "child is" : "children are"} doing</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Children Enrolled", value: studentCount, icon: Users, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
          { label: "Upcoming Meetings", value: upcomingMeetings.length, icon: Calendar, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30" },
          { label: "Unread Notifications", value: notifications.filter((n) => !n.isRead).length, icon: Bell, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
          { label: "Academic Year", value: "2025-26", icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`h-4.5 w-4.5 ${stat.color}`} />
                </div>
                <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
        <h2 className="text-base font-semibold mb-4">My Children</h2>
        {students.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">No children linked to your account yet. Contact your school admin.</CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((student) => (
              <Card key={student.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.visit(`/dashboard/parent-portal/student/${student.id}`)}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <GraduationCap className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{student.firstName} {student.lastName}</p>
                      <p className="text-xs text-muted-foreground">Grade {student.gradeLevel ?? "N/A"} {student.classSection ? `- ${student.classSection}` : ""}</p>
                      <Badge variant="secondary" className="text-xs mt-2 capitalize">{student.status}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Upcoming Meetings</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => router.visit("/dashboard/meetings")} className="cursor-pointer text-xs">View All</Button>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingMeetings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No upcoming meetings</p>
            ) : (
              <div className="space-y-3">
                {upcomingMeetings.map((meeting) => (
                  <div key={meeting.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{meeting.title}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(meeting.scheduledAt), "MMM d, yyyy h:mm a")}</p>
                    </div>
                    <Badge variant={meeting.status === "confirmed" ? "default" : "secondary"} className="text-xs capitalize">{meeting.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Recent Notifications</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => router.visit("/dashboard/notifications")} className="cursor-pointer text-xs">View All</Button>
            </div>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No notifications</p>
            ) : (
              <div className="space-y-3">
                {notifications.slice(0, 5).map((notification) => (
                  <div key={notification.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
                    <div className={`w-2 h-2 mt-2 rounded-full ${notification.isRead ? "bg-muted" : "bg-primary"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{notification.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{notification.message}</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">{format(new Date(notification.createdAt), "MMM d, h:mm a")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }}>
        <h2 className="text-base font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Book Meeting", icon: Calendar, href: "/dashboard/meetings" },
            { label: "Fee Status", icon: TrendingUp, href: "/dashboard/finance" },
            { label: "Academics", icon: BookOpen, href: "/dashboard/academics" },
            { label: "Notifications", icon: Bell, href: "/dashboard/notifications" },
          ].map((action) => (
            <button key={action.label} onClick={() => router.visit(action.href)} className="group p-4 rounded-xl border bg-card hover:border-primary/40 hover:shadow-md transition-all text-left cursor-pointer">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                <action.icon className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm font-semibold">{action.label}</p>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function ParentPortalInner({ dashboard, studentSummary }: PageProps) {
  if (studentSummary) {
    return <StudentSummaryView summary={studentSummary} />;
  }

  if (!dashboard) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon"><Users /></EmptyMedia>
          <EmptyTitle>Parent Portal Not Available</EmptyTitle>
          <EmptyDescription>Your account is not set up as a parent. Contact your school administrator.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return <ParentPortalContent dashboard={dashboard} />;
}

export default function ParentPortalPage(props: PageProps) {
  return (
    <DashboardLayout>
      <ParentPortalInner {...props} />
    </DashboardLayout>
  );
}
