import { Link, router } from "@inertiajs/react";
import { DashboardLayout } from "../_components/layout.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import {
  ArrowLeft, Pencil, Trash2, Phone, Mail, MapPin, Calendar, User,
  HeartPulse, GraduationCap, Building2, Bus, CreditCard, ClipboardList,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { routerDeleteWithConfirm } from "@/lib/confirm.ts";
import type { Branch } from "@/lib/types.ts";
import type { Student } from "./page.tsx";

type AttendanceRecord = {
  id: number;
  date: string;
  status: string;
  type: string;
  note?: string | null;
};

type AttendanceSummary = {
  present: number;
  absent: number;
  late: number;
  total: number;
};

type FeePayment = {
  id: number;
  amount: number;
  paymentDate: string;
  method: string;
  paidFor: string;
  receiptNumber: string;
  status: string;
  feesDue?: number | null;
  paidTotalBefore?: number | null;
  paidTotalAfter?: number | null;
  balanceBefore?: number | null;
  balanceAfter?: number | null;
};

type FeeBalance = {
  feesDue: number;
  totalPaid: number;
  balanceDue: number;
  feeStructureId?: number | null;
  feeStructureName?: string | null;
};

type ExamResult = {
  id: number;
  score: number;
  grade?: string | null;
  remarks?: string | null;
  exam?: { title?: string; examDate?: string } | null;
};

type TransportAssignment = {
  id: number;
  pickupStop: string;
  dropStop: string;
  bus?: { busNumber?: string; driverName?: string } | null;
  route?: { routeName?: string } | null;
};

type PageProps = {
  student: Student & { branch?: Branch | null; schoolBranchId?: number | null };
  branches: Branch[];
  attendanceRecords: AttendanceRecord[];
  attendanceSummary: AttendanceSummary;
  feePayments: FeePayment[];
  feeBalance: FeeBalance;
  examResults: ExamResult[];
  transport: TransportAssignment | null;
};

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700 border-green-200",
  inactive: "bg-gray-100 text-gray-600 border-gray-200",
  graduated: "bg-blue-100 text-blue-700 border-blue-200",
  transferred: "bg-purple-100 text-purple-700 border-purple-200",
  suspended: "bg-red-100 text-red-700 border-red-200",
};

function DetailItem({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function StudentShowContent({
  student,
  attendanceRecords,
  attendanceSummary,
  feePayments,
  feeBalance,
  examResults,
  transport,
}: PageProps) {
  const handleDelete = async () => {
    await routerDeleteWithConfirm(`/dashboard/students/${student.uuid}`, {
      title: "Remove this student?",
      text: "The student record will be soft-deleted.",
      onSuccess: () => toast.success("Student removed"),
      onError: () => toast.error("Failed to remove student"),
      preserveScroll: false,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="cursor-pointer">
            <Link href="/dashboard/students"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
          </Button>
          <div>
            <h1 className="text-2xl font-extrabold">{student.firstName} {student.lastName}</h1>
            <p className="text-muted-foreground text-sm font-mono">{student.studentId}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge className={`${statusColors[student.status]} border capitalize`}>{student.status}</Badge>
          <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => router.visit(`/dashboard/students?edit=${student.uuid}`)}>
            <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
          </Button>
          <Button variant="destructive" size="sm" className="cursor-pointer" onClick={handleDelete}>
            <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Remove
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" /> Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                {student.firstName[0]}{student.lastName[0]}
              </div>
              <div>
                <p className="font-semibold">{student.firstName} {student.lastName}</p>
                <p className="text-sm text-muted-foreground capitalize">{student.gender ?? "—"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <DetailItem label="Date of Birth" value={student.dateOfBirth ? format(new Date(student.dateOfBirth), "MMM d, yyyy") : undefined} />
              <DetailItem label="Nationality" value={student.nationality} />
              <DetailItem label="Religion" value={student.religion} />
              <DetailItem label="Blood Group" value={student.bloodGroup} />
            </div>
            <div className="space-y-2 text-sm">
              {student.phone && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3.5 w-3.5" />{student.phone}</div>}
              {student.email && <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-3.5 w-3.5" />{student.email}</div>}
              {(student.address || student.city) && (
                <div className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 mt-0.5" />
                  <span>{[student.address, student.city, student.state, student.zip].filter(Boolean).join(", ")}</span>
                </div>
              )}
            </div>
            {student.medicalNotes && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1 flex items-center gap-1"><HeartPulse className="h-3 w-3" /> Medical Notes</p>
                <p className="text-sm text-amber-800 dark:text-amber-300">{student.medicalNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><GraduationCap className="h-4 w-4" /> Academic Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <DetailItem label="Grade Level" value={student.gradeLevel} />
              <DetailItem label="Class Section" value={student.classSection} />
              <DetailItem label="Academic Year" value={student.academicYear} />
              <DetailItem label="Enrollment Date" value={student.enrollmentDate ? format(new Date(student.enrollmentDate), "MMM d, yyyy") : undefined} />
              <DetailItem label="Campus / Branch" value={student.branch?.name} />
            </div>
          </CardContent>
        </Card>
      </div>

      {student.guardians && student.guardians.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Guardians</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {student.guardians.map((g, i) => (
                <div key={i} className="p-4 rounded-lg border bg-muted/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{g.name}</span>
                    <span className="text-xs text-muted-foreground">{g.relationship}</span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>{g.phone}</p>
                    {g.email && <p>{g.email}</p>}
                    {g.occupation && <p>{g.occupation}</p>}
                  </div>
                  {g.isEmergencyContact && (
                    <Badge className="mt-2 bg-red-100 text-red-700 border-red-200 border text-xs">Emergency Contact</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Attendance (recent)</p>
            <p className="text-2xl font-bold text-green-600">{attendanceSummary.present}</p>
            <p className="text-xs text-muted-foreground">Present of {attendanceSummary.total} records</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Absent</p>
            <p className="text-2xl font-bold text-red-600">{attendanceSummary.absent}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Late</p>
            <p className="text-2xl font-bold text-amber-600">{attendanceSummary.late}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Fees Due</p>
            <p className="text-2xl font-bold text-amber-600">GHS {feeBalance.balanceDue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Paid: GHS {feeBalance.totalPaid.toLocaleString()} / GHS {feeBalance.feesDue.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4" /> Recent Attendance</CardTitle></CardHeader>
          <CardContent>
            {attendanceRecords.length === 0 ? (
              <p className="text-sm text-muted-foreground">No attendance records yet.</p>
            ) : (
              <div className="space-y-2">
                {attendanceRecords.slice(0, 8).map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                    <span>{format(new Date(r.date), "MMM d, yyyy")}</span>
                    <Badge variant="secondary" className="capitalize text-xs">{r.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><CreditCard className="h-4 w-4" /> Recent Payments</CardTitle></CardHeader>
          <CardContent>
            {feePayments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payment records yet.</p>
            ) : (
              <div className="space-y-2">
                {feePayments.map((p) => (
                  <div key={p.id} className="border-b pb-2 last:border-0 space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium">GHS {p.amount.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{p.paidFor}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{format(new Date(p.paymentDate), "MMM d, yyyy")}</span>
                    </div>
                    {(p.balanceBefore != null || p.balanceAfter != null) && (
                      <p className="text-xs text-muted-foreground">
                        Due: GHS {(p.balanceBefore ?? 0).toLocaleString()} → GHS {(p.balanceAfter ?? 0).toLocaleString()}
                        {p.paidTotalAfter != null ? ` · Paid total: GHS ${p.paidTotalAfter.toLocaleString()}` : ""}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><ClipboardList className="h-4 w-4" /> Exam Results</CardTitle></CardHeader>
          <CardContent>
            {examResults.length === 0 ? (
              <p className="text-sm text-muted-foreground">No exam results yet.</p>
            ) : (
              <div className="space-y-2">
                {examResults.map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                    <div>
                      <p className="font-medium">{r.exam?.title ?? "Exam"}</p>
                      {r.exam?.examDate && <p className="text-xs text-muted-foreground">{format(new Date(r.exam.examDate), "MMM d, yyyy")}</p>}
                    </div>
                    <Badge variant="secondary">{r.score}{r.grade ? ` (${r.grade})` : ""}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bus className="h-4 w-4" /> Transport</CardTitle></CardHeader>
          <CardContent>
            {!transport ? (
              <p className="text-sm text-muted-foreground">No active transport assignment.</p>
            ) : (
              <div className="space-y-2 text-sm">
                <DetailItem label="Route" value={transport.route?.routeName} />
                <DetailItem label="Bus" value={transport.bus?.busNumber} />
                <DetailItem label="Driver" value={transport.bus?.driverName} />
                <DetailItem label="Pickup" value={transport.pickupStop} />
                <DetailItem label="Drop-off" value={transport.dropStop} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function StudentShowPage(props: PageProps) {
  return (
    <DashboardLayout>
      <StudentShowContent {...props} />
    </DashboardLayout>
  );
}
