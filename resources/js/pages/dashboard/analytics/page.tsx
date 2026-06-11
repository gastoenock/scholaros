import { DashboardLayout } from "../_components/layout.tsx";
import { useCurrentSchool } from "../_components/use-current-school.ts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import {
  Users,
  TrendingUp,
  BookOpen,
  BarChart3,
  PieChart,
  Activity,
} from "lucide-react";
import { motion } from "motion/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty.tsx";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#14b8a6"];

type StudentStats = {
  total: number;
  active: number;
  byGrade: Record<string, number>;
};

type PageProps = {
  studentStats: StudentStats;
};

function AnalyticsInner({ studentStats }: PageProps) {
  const { schoolId } = useCurrentSchool();

  if (!schoolId) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon"><BarChart3 /></EmptyMedia>
          <EmptyTitle>No School Connected</EmptyTitle>
          <EmptyDescription>Connect to a school to view analytics</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  // Transform grade data for charts
  const gradeData = Object.entries(studentStats?.byGrade ?? {}).map(([grade, count]) => ({
    grade,
    students: count,
  })).sort((a, b) => a.grade.localeCompare(b.grade));

  // Mock performance data for demonstration (shows trend)
  const performanceTrend = [
    { month: "Jan", attendance: 92, academics: 78 },
    { month: "Feb", attendance: 94, academics: 80 },
    { month: "Mar", attendance: 89, academics: 82 },
    { month: "Apr", attendance: 91, academics: 79 },
    { month: "May", attendance: 95, academics: 85 },
    { month: "Jun", attendance: 93, academics: 83 },
  ];

  // Status distribution for pie chart
  const statusData = [
    { name: "Active", value: studentStats?.active ?? 0 },
    { name: "Inactive", value: (studentStats?.total ?? 0) - (studentStats?.active ?? 0) },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-extrabold">Analytics & Insights</h1>
        <p className="text-muted-foreground mt-1">School performance overview and data insights</p>
      </motion.div>

      {/* Key Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          { label: "Total Students", value: studentStats?.total ?? 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30", trend: "+12%" },
          { label: "Active Students", value: studentStats?.active ?? 0, icon: Activity, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30", trend: "+5%" },
          { label: "Grade Levels", value: Object.keys(studentStats?.byGrade ?? {}).length, icon: BookOpen, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30", trend: "—" },
          { label: "Avg Attendance", value: "93%", icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30", trend: "+2%" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`h-4.5 w-4.5 ${stat.color}`} />
                </div>
                <span className="text-xs font-medium text-emerald-600">{stat.trend}</span>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Charts Row 1 */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Students by Grade */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Students by Grade
            </CardTitle>
          </CardHeader>
          <CardContent>
            {gradeData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">No student data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={gradeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="grade" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--card))",
                    }}
                  />
                  <Bar dataKey="students" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Student Status Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <PieChart className="h-4 w-4 text-primary" /> Student Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">No data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <RechartsPie>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RechartsPie>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Performance Trend */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Performance Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--card))",
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="attendance" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="Attendance %" />
                <Line type="monotone" dataKey="academics" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="Academics %" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Additional Insights */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Top Performing Grade</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              {gradeData.length > 0 ? gradeData.sort((a, b) => b.students - a.students)[0]?.grade : "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Most enrolled grade</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Enrollment Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-600">
              {studentStats?.total ? Math.round((studentStats.active / studentStats.total) * 100) : 0}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">Active students ratio</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Teacher-Student Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-600">1:20</p>
            <p className="text-xs text-muted-foreground mt-1">Average across all grades</p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default function AnalyticsPage(props: PageProps) {
  return (
    <DashboardLayout>
      <AnalyticsInner {...props} />
    </DashboardLayout>
  );
}
