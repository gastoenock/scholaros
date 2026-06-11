import { useMemo, useState } from "react";
import { router } from "@inertiajs/react";
import { DashboardLayout } from "../_components/layout.tsx";
import { useCurrentSchool } from "../_components/use-current-school.ts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { toast } from "sonner";
import { cn } from "@/lib/utils.ts";
import { Users, CheckCircle, Clock, Plus, Briefcase } from "lucide-react";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const NOW = new Date();

type PayrollRecord = {
  id: number;
  schoolId: number;
  staffId: number;
  staffName: string;
  month: number;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  paymentDate?: string | null;
  status: string;
  notes?: string | null;
  createdAt: string;
};

type LeaveRequest = {
  id: number;
  schoolId: number;
  staffId: number;
  staffName: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  createdAt: string;
};

type StaffOption = {
  id: number;
  firstName: string;
  lastName: string;
};

type PageProps = {
  payroll: PayrollRecord[];
  leaves: LeaveRequest[];
  staff: StaffOption[];
};

function PayrollContent({ payroll: allPayroll, leaves, staff: staffList }: PageProps) {
  const { schoolId } = useCurrentSchool();
  const [tab, setTab] = useState("payroll");
  const [selectedMonth, setSelectedMonth] = useState(NOW.getMonth() + 1);
  const [selectedYear] = useState(NOW.getFullYear());
  const [leaveOpen, setLeaveOpen] = useState(false);

  const payroll = useMemo(
    () => allPayroll.filter((r) => r.year === selectedYear && r.month === selectedMonth),
    [allPayroll, selectedMonth, selectedYear],
  );

  const [leaveForm, setLeaveForm] = useState({
    staffId: "",
    type: "annual" as "sick" | "annual" | "casual" | "maternity" | "unpaid",
    startDate: NOW.toISOString().slice(0, 10),
    endDate: NOW.toISOString().slice(0, 10),
    reason: "",
  });

  const handleGeneratePayroll = () => {
    if (!schoolId) return;
    router.post("/dashboard/payroll/generate", { month: selectedMonth, year: selectedYear }, {
      preserveScroll: true,
      onError: () => toast.error("Failed to generate payroll"),
    });
  };

  const handleCreateLeave = () => {
    if (!schoolId || !leaveForm.staffId || !leaveForm.reason) {
      toast.error("Please fill all required fields");
      return;
    }
    router.post("/dashboard/payroll/leaves", {
      staffId: parseInt(leaveForm.staffId),
      type: leaveForm.type,
      startDate: leaveForm.startDate,
      endDate: leaveForm.endDate,
      reason: leaveForm.reason,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success("Leave request submitted");
        setLeaveOpen(false);
        setLeaveForm({ staffId: "", type: "annual", startDate: NOW.toISOString().slice(0, 10), endDate: NOW.toISOString().slice(0, 10), reason: "" });
      },
      onError: () => toast.error("Failed to submit leave request"),
    });
  };

  const statusBadge = (status: string) => {
    if (status === "paid" || status === "approved") return "bg-emerald-100 text-emerald-700";
    if (status === "pending") return "bg-amber-100 text-amber-700";
    return "bg-red-100 text-red-700";
  };

  // Summary stats
  const totalPayroll = payroll.reduce((s, r) => s + r.netSalary, 0);
  const paidCount = payroll.filter((r) => r.status === "paid").length;
  const pendingCount = payroll.filter((r) => r.status === "pending").length;
  const pendingLeaves = leaves.filter((l) => l.status === "pending").length;

  if (!schoolId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">No school linked to your account.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Payroll & HR</h1>
          <p className="text-muted-foreground text-sm">Staff salary and leave management</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm" className="cursor-pointer"><Plus className="h-4 w-4 mr-1" />Leave Request</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Submit Leave Request</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <div>
                  <Label>Staff Member *</Label>
                  <Select value={leaveForm.staffId} onValueChange={(v) => setLeaveForm({ ...leaveForm, staffId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger>
                    <SelectContent>
                      {staffList.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>{s.firstName} {s.lastName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Leave Type *</Label>
                  <Select value={leaveForm.type} onValueChange={(v) => setLeaveForm({ ...leaveForm, type: v as typeof leaveForm.type })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="annual">Annual</SelectItem>
                      <SelectItem value="sick">Sick</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="maternity">Maternity</SelectItem>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Start Date *</Label><Input type="date" value={leaveForm.startDate} onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })} /></div>
                  <div><Label>End Date *</Label><Input type="date" value={leaveForm.endDate} onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })} /></div>
                </div>
                <div><Label>Reason *</Label><Input value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} placeholder="Reason for leave" /></div>
                <Button className="w-full cursor-pointer" onClick={handleCreateLeave}>Submit Request</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card><CardContent className="pt-5">
          <p className="text-xs text-muted-foreground">Total Payroll</p>
          <p className="text-xl font-bold text-primary">${totalPayroll.toLocaleString()}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-5">
          <p className="text-xs text-muted-foreground">Paid</p>
          <p className="text-xl font-bold text-emerald-600">{paidCount}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-5">
          <p className="text-xs text-muted-foreground">Pending</p>
          <p className="text-xl font-bold text-amber-600">{pendingCount}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-5">
          <p className="text-xs text-muted-foreground">Leave Requests</p>
          <p className="text-xl font-bold text-blue-600">{pendingLeaves}</p>
        </CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="payroll" className="cursor-pointer">Payroll</TabsTrigger>
          <TabsTrigger value="leave" className="cursor-pointer">Leave Management</TabsTrigger>
        </TabsList>

        {/* Payroll Tab */}
        <TabsContent value="payroll" className="mt-4 space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MONTHS.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground font-medium">{selectedYear}</span>
            <Button size="sm" className="cursor-pointer" onClick={handleGeneratePayroll}>
              <Users className="h-4 w-4 mr-1" />Generate Payroll
            </Button>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">{MONTHS[selectedMonth - 1]} {selectedYear} Payroll</CardTitle></CardHeader>
            <CardContent>
              {payroll.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Briefcase className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p>No payroll records for this period.</p>
                  <p className="text-xs mt-1">Click "Generate Payroll" to create records for active staff.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Staff</th>
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Basic Salary</th>
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Allowances</th>
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Deductions</th>
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Net Salary</th>
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Status</th>
                        <th className="py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {payroll.map((r) => (
                        <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="py-2 pr-4">{r.staffName}</td>
                          <td className="py-2 pr-4">${r.basicSalary.toLocaleString()}</td>
                          <td className="py-2 pr-4 text-emerald-600">+${r.allowances.toLocaleString()}</td>
                          <td className="py-2 pr-4 text-red-600">-${r.deductions.toLocaleString()}</td>
                          <td className="py-2 pr-4 font-bold">${r.netSalary.toLocaleString()}</td>
                          <td className="py-2 pr-4">
                            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize", statusBadge(r.status))}>{r.status}</span>
                          </td>
                          <td className="py-2">
                            {r.status === "pending" && (
                              <Button
                                variant="ghost" size="sm"
                                className="cursor-pointer text-emerald-600 h-7 text-xs"
                                onClick={() => {
                                  router.put(`/dashboard/payroll/records/${r.id}/status`, { status: "paid", paymentDate: new Date().toISOString().slice(0, 10) }, {
                                    preserveScroll: true,
                                    onSuccess: () => toast.success("Marked as paid"),
                                    onError: () => toast.error("Failed to update"),
                                  });
                                }}
                              >
                                <CheckCircle className="h-3.5 w-3.5 mr-1" />Mark Paid
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leave Management Tab */}
        <TabsContent value="leave" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Leave Requests</CardTitle></CardHeader>
            <CardContent>
              {leaves.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p>No leave requests submitted yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Staff</th>
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Type</th>
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Start</th>
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">End</th>
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Reason</th>
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Status</th>
                        <th className="py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaves.map((l) => (
                        <tr key={l.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="py-2 pr-4">{l.staffName}</td>
                          <td className="py-2 pr-4 capitalize">{l.type}</td>
                          <td className="py-2 pr-4 text-muted-foreground">{l.startDate}</td>
                          <td className="py-2 pr-4 text-muted-foreground">{l.endDate}</td>
                          <td className="py-2 pr-4 max-w-[160px] truncate">{l.reason}</td>
                          <td className="py-2 pr-4">
                            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize", statusBadge(l.status))}>{l.status}</span>
                          </td>
                          <td className="py-2 flex gap-1">
                            {l.status === "pending" && (
                              <>
                                <Button variant="ghost" size="icon" className="cursor-pointer h-7 w-7 text-emerald-600" onClick={() => router.post(`/dashboard/payroll/leaves/${l.id}/status`, { status: "approved" }, { preserveScroll: true, onSuccess: () => toast.success("Approved"), onError: () => toast.error("Failed to update") })}>
                                  <CheckCircle className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="cursor-pointer h-7 w-7 text-destructive" onClick={() => router.post(`/dashboard/payroll/leaves/${l.id}/status`, { status: "rejected" }, { preserveScroll: true, onSuccess: () => toast.success("Rejected"), onError: () => toast.error("Failed to update") })}>
                                  <Clock className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function PayrollPage(props: PageProps) {
  return (
    <DashboardLayout>
      <PayrollContent {...props} />
    </DashboardLayout>
  );
}
