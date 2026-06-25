import { router, usePage } from "@inertiajs/react";
import { DashboardLayout } from "./_components/layout.tsx";
import { useCurrentSchool } from "./_components/use-current-school.ts";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import {
  Users, School as SchoolIcon, BarChart3, CreditCard,
  Bell, BookOpen, Bus, Calendar, TrendingUp, GraduationCap,
} from "lucide-react";
import { motion } from "motion/react";
import { format } from "date-fns";
import type { AuthUser, School, SharedPageProps } from "@/lib/types.ts";

type DashboardStats = {
  totalStudents: number;
  activeTeachers: number;
  todayAttendance: string | null;
  pendingFees: number;
};

type RecentAdmission = {
  id: number;
  firstName: string;
  lastName: string;
  applyingForGrade: string;
  status: string;
  createdAt: string;
};

type SchoolApplicationRow = {
  id: number;
  schoolName: string;
  adminName: string;
  adminEmail: string;
  status: string;
  createdAt: string;
};

type PageProps = {
  school: School | null;
  stats: DashboardStats | null;
  recentAdmissions: RecentAdmission[];
  schools: School[];
  applications: SchoolApplicationRow[];
  view?: "platform" | "admin" | "setup";
};

function SetupPrompt() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-md text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <GraduationCap className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-extrabold">Welcome to ScholarOS</h2>
        <p className="text-muted-foreground">
          Your account is not yet linked to a school. Contact your school administrator to be added to the system, or register your school.
        </p>
        <div className="flex flex-col gap-3">
          <Button onClick={() => router.visit("/register")} className="cursor-pointer">Register Your School</Button>
        </div>
      </div>
    </div>
  );
}

const quickActions = [
  { label: "Students", icon: Users, href: "/dashboard/students", desc: "Manage student records" },
  { label: "Attendance", icon: Calendar, href: "/dashboard/attendance", desc: "Track daily attendance" },
  { label: "Finance", icon: CreditCard, href: "/dashboard/finance", desc: "Fee collection & reports" },
  { label: "Analytics", icon: BarChart3, href: "/dashboard/analytics", desc: "School performance insights" },
  { label: "Transport", icon: Bus, href: "/dashboard/transport", desc: "Routes & bus tracking" },
  { label: "Messages", icon: Bell, href: "/dashboard/messages", desc: "Notifications & messaging" },
];

const admissionStatusColors: Record<string, string> = {
  submitted: "bg-blue-100 text-blue-700 border-blue-200",
  under_review: "bg-amber-100 text-amber-700 border-amber-200",
  interview_scheduled: "bg-purple-100 text-purple-700 border-purple-200",
  accepted: "bg-green-100 text-green-700 border-green-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  waitlisted: "bg-gray-100 text-gray-600 border-gray-200",
  enrolled: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

function AdminDashboard({
  user,
  school,
  stats,
  recentAdmissions,
}: {
  user: AuthUser;
  school: School | null;
  stats: DashboardStats | null;
  recentAdmissions: RecentAdmission[];
}) {
  const quickStats = [
    { label: "Total Students", value: stats?.totalStudents ?? "—", icon: Users, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
    { label: "Active Teachers", value: stats?.activeTeachers ?? "—", icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
    { label: "Today's Attendance", value: stats?.todayAttendance ?? "—", icon: Calendar, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30" },
    { label: "Pending Fees", value: stats ? `$${stats.pendingFees.toLocaleString()}` : "—", icon: CreditCard, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold">
              Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 17 ? "Afternoon" : "Evening"}, {user.name?.split(" ")[0] ?? "Admin"} 👋
            </h1>
            {school && (
              <p className="text-muted-foreground mt-1 flex items-center gap-1.5">
                <SchoolIcon className="h-4 w-4" />
                {school.name}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => router.visit("/dashboard/messages")} className="cursor-pointer">
              <Bell className="h-4 w-4 mr-1.5" /> Notifications
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {quickStats.map((stat) => (
          <Card key={stat.label} className="border shadow-sm">
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

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <h2 className="text-base font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => router.visit(action.href)}
              className="group p-4 rounded-xl border bg-card hover:border-primary/40 hover:shadow-md transition-all text-left cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                <action.icon className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm font-semibold">{action.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{action.desc}</p>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Recent Admissions</CardTitle>
          </CardHeader>
          <CardContent>
            {recentAdmissions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No recent admissions. Complete the Student Information System setup.
              </p>
            ) : (
              <div className="space-y-2">
                {recentAdmissions.map((a) => (
                  <div key={a.id} className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{a.firstName} {a.lastName}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.applyingForGrade} · {format(new Date(a.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                    <Badge className={`${admissionStatusColors[a.status] ?? admissionStatusColors.submitted} border text-xs capitalize shrink-0`}>
                      {a.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-8">
              No upcoming events scheduled.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function SuperAdminDashboard({ schools, applications }: { schools: School[]; applications: SchoolApplicationRow[] }) {
  const pendingCount = applications.filter((a) => a.status === "pending").length;

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-extrabold">Platform Dashboard</h1>
        <p className="text-muted-foreground">Manage schools, applications, and enter a school to operate its modules</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          { label: "Total Schools", value: schools.length, icon: SchoolIcon, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
          { label: "Pending Applications", value: pendingCount, icon: Bell, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
          { label: "Active Plans", value: schools.filter((s) => s.isActive).length, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
          { label: "Platform Users", value: "—", icon: Users, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30" },
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
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="flex gap-3"
      >
        <Button onClick={() => router.visit("/dashboard/schools")} className="cursor-pointer">
          <SchoolIcon className="h-4 w-4 mr-1.5" /> Manage Schools
        </Button>
        <Button variant="secondary" onClick={() => router.visit("/dashboard/admin")} className="cursor-pointer">
          <Users className="h-4 w-4 mr-1.5" /> Applications {pendingCount > 0 && `(${pendingCount})`}
        </Button>
      </motion.div>
    </div>
  );
}

function DashboardInner({
  school,
  stats,
  recentAdmissions,
  schools,
  applications,
  view = "admin",
}: PageProps) {
  const { user, schoolId } = useCurrentSchool();
  const { platform, tenancyHost } = usePage<SharedPageProps>().props;
  const isPlatformAdmin = platform?.isPlatformAdmin ?? false;
  const managingTenant = isPlatformAdmin && (!!platform?.manageTenantId || tenancyHost?.isTenant);

  if (view === "platform" || (isPlatformAdmin && !managingTenant)) {
    return <SuperAdminDashboard schools={schools} applications={applications} />;
  }

  if (!schoolId || !user) {
    return <SetupPrompt />;
  }

  return <AdminDashboard user={user} school={school} stats={stats} recentAdmissions={recentAdmissions} />;
}

export default function Dashboard(props: PageProps) {
  return (
    <DashboardLayout>
      <DashboardInner {...props} />
    </DashboardLayout>
  );
}
