import { useMemo, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import { DashboardLayout } from "../_components/layout.tsx";
import { useCurrentSchool } from "../_components/use-current-school.ts";
import { defaultSemesterId, defaultTermId, defaultYearId, type SharedWithCalendar } from "@/lib/academic-calendar.ts";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { toast } from "sonner";
import { motion } from "motion/react";
import { Calendar, Users, CheckCircle2, XCircle, Clock, AlertCircle, Check } from "lucide-react";
import { format } from "date-fns";
import type { SchoolClass } from "../classes/page.tsx";
import type { StaffMember } from "../staff/page.tsx";
import type { Student } from "../students/page.tsx";

const STATUS_OPTIONS = [
  { value: "present", label: "Present", color: "bg-emerald-500", icon: CheckCircle2 },
  { value: "absent", label: "Absent", color: "bg-red-500", icon: XCircle },
  { value: "late", label: "Late", color: "bg-amber-500", icon: Clock },
  { value: "excused", label: "Excused", color: "bg-blue-500", icon: AlertCircle },
] as const;

type AttendanceStatus = "present" | "absent" | "late" | "excused";

type AttendanceRecord = {
  id: number;
  schoolId: number;
  date: string;
  type: "student" | "staff";
  personId: string;
  status: AttendanceStatus;
  classId?: number | null;
  markedBy?: number | null;
  note?: string | null;
  createdAt: string;
};

function AttendanceContent({ classes, students, staff, records }: PageProps) {
  const { schoolId } = useCurrentSchool();
  const { academicCalendar } = usePage<SharedWithCalendar>().props;
  const [tab, setTab] = useState<"student" | "staff">("student");
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({});
  const [saving, setSaving] = useState(false);

  const dateRecords = useMemo(
    () => records.filter((r) => r.date === date && r.type === tab),
    [records, date, tab],
  );

  const existingMap = useMemo(() => {
    const map: Record<string, AttendanceStatus> = {};
    dateRecords.forEach((r) => { map[r.personId] = r.status; });
    return map;
  }, [dateRecords]);

  const summary = useMemo(() => {
    const count = (list: AttendanceRecord[]) => ({
      present: list.filter((r) => r.status === "present").length,
      absent: list.filter((r) => r.status === "absent").length,
      late: list.filter((r) => r.status === "late").length,
      excused: list.filter((r) => r.status === "excused").length,
      total: list.length,
    });
    const studentRecords = records.filter((r) => r.date === date && r.type === "student");
    const staffRecords = records.filter((r) => r.date === date && r.type === "staff");
    return { students: count(studentRecords), staff: count(staffRecords) };
  }, [records, date]);

  const filteredStudents = useMemo(
    () => students.filter((s) => selectedClass === "all" || s.classSection === selectedClass),
    [students, selectedClass],
  );

  const people = tab === "student" ? filteredStudents : staff;

  const getStatus = (id: number): AttendanceStatus =>
    attendanceMap[String(id)] ?? existingMap[String(id)] ?? "present";

  const setStatus = (id: number, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({ ...prev, [String(id)]: status }));
  };

  const markAll = (status: AttendanceStatus) => {
    const map: Record<string, AttendanceStatus> = {};
    people.forEach((p) => { map[String(p.id)] = status; });
    setAttendanceMap(map);
  };

  const handleSave = () => {
    setSaving(true);
    const classId = tab === "student" && selectedClass !== "all"
      ? classes.find((c) => c.name === selectedClass)?.id
      : undefined;

    router.post("/dashboard/attendance", {
      date,
      type: tab,
      academicYearId: defaultYearId(academicCalendar) ?? undefined,
      academicSemesterId: defaultSemesterId(academicCalendar, defaultYearId(academicCalendar)) ?? undefined,
      academicTermId: defaultTermId(academicCalendar, defaultYearId(academicCalendar), defaultSemesterId(academicCalendar, defaultYearId(academicCalendar))) ?? undefined,
      records: people.map((p) => ({
        personId: String(p.id),
        status: getStatus(p.id),
        classId,
      })),
    }, {
      preserveScroll: true,
      onSuccess: () => toast.success("Attendance saved successfully"),
      onError: () => toast.error("Failed to save attendance"),
      onFinish: () => setSaving(false),
    });
  };

  const statsData = [
    { label: "Present", value: tab === "student" ? summary.students.present : summary.staff.present, color: "text-emerald-600" },
    { label: "Absent", value: tab === "student" ? summary.students.absent : summary.staff.absent, color: "text-red-600" },
    { label: "Late", value: tab === "student" ? summary.students.late : summary.staff.late, color: "text-amber-600" },
    { label: "Excused", value: tab === "student" ? summary.students.excused : summary.staff.excused, color: "text-blue-600" },
  ];

  if (!schoolId) {
    return <div className="text-muted-foreground text-center py-20">No school linked.</div>;
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" /> Attendance
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Track daily student & staff attendance</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              title="date"
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); setAttendanceMap({}); }}
              className="border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <Button onClick={handleSave} disabled={saving} className="cursor-pointer">
              <Check className="h-4 w-4 mr-1.5" />
              {saving ? "Saving…" : "Save Attendance"}
            </Button>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {statsData.map((s) => (
          <Card key={s.label} className="border shadow-sm">
            <CardContent className="p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      <Tabs value={tab} onValueChange={(v) => { setTab(v as "student" | "staff"); setAttendanceMap({}); }}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <TabsList>
            <TabsTrigger value="student" className="cursor-pointer">
              <Users className="h-4 w-4 mr-1.5" /> Students
            </TabsTrigger>
            <TabsTrigger value="staff" className="cursor-pointer">
              <Users className="h-4 w-4 mr-1.5" /> Staff
            </TabsTrigger>
          </TabsList>

          {tab === "student" && (
            <Select value={selectedClass} onValueChange={(v) => { setSelectedClass(v); setAttendanceMap({}); }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.name}>{c.name} – {c.gradeLevel}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div className="flex gap-2 ml-auto">
            <Button size="sm" variant="secondary" onClick={() => markAll("present")} className="cursor-pointer">
              Mark All Present
            </Button>
            <Button size="sm" variant="secondary" onClick={() => markAll("absent")} className="cursor-pointer">
              Mark All Absent
            </Button>
          </div>
        </div>

        <TabsContent value="student" className="mt-4">
          <AttendanceTable
            people={filteredStudents.map((s) => ({
              id: s.id,
              name: `${s.firstName} ${s.lastName}`,
              detail: s.gradeLevel ?? "—",
              idCode: s.studentId,
            }))}
            getStatus={getStatus}
            setStatus={setStatus}
          />
        </TabsContent>

        <TabsContent value="staff" className="mt-4">
          <AttendanceTable
            people={staff.map((s) => ({
              id: s.id,
              name: `${s.firstName} ${s.lastName}`,
              detail: s.designation ?? s.role,
              idCode: s.staffId,
            }))}
            getStatus={getStatus}
            setStatus={setStatus}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AttendanceTable({
  people,
  getStatus,
  setStatus,
}: {
  people: { id: number; name: string; detail: string; idCode: string }[];
  getStatus: (id: number) => AttendanceStatus;
  setStatus: (id: number, status: AttendanceStatus) => void;
}) {
  if (people.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No records found for the selected filter.
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-4 py-3 font-semibold">Name</th>
                <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">ID</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Class / Role</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {people.map((p, i) => {
                const status = getStatus(p.id);
                return (
                  <tr key={p.id} className={`border-b last:border-0 ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{p.idCode}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{p.detail}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5 flex-wrap">
                        {STATUS_OPTIONS.map((o) => (
                          <button
                            key={o.value}
                            onClick={() => setStatus(p.id, o.value)}
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                              status === o.value
                                ? `${o.color} text-white border-transparent`
                                : "bg-background border-border text-muted-foreground hover:border-primary/40"
                            }`}
                          >
                            {o.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

type PageProps = {
  classes: SchoolClass[];
  students: Student[];
  staff: StaffMember[];
  records: AttendanceRecord[];
};

export default function AttendancePage(props: PageProps) {
  return (
    <DashboardLayout>
      <AttendanceContent {...props} />
    </DashboardLayout>
  );
}
