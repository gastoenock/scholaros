import { useState } from "react";
import { router } from "@inertiajs/react";
import { DashboardLayout } from "../_components/layout.tsx";
import { useCurrentSchool } from "../_components/use-current-school.ts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog.tsx";
import { toast } from "sonner";
import { cn } from "@/lib/utils.ts";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import {
  DollarSign, TrendingUp, TrendingDown, Plus, Receipt,
  AlertCircle, Clock, CheckCircle, Trash2,
} from "lucide-react";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const EXPENSE_CATEGORIES = ["Utilities","Supplies","Maintenance","Salaries","IT & Technology","Food & Cafeteria","Transport","Events","Other"];

type FeeItem = {
  name: string;
  amount: number;
  dueDate?: string | null;
  isOptional: boolean;
};

type FeeStructure = {
  id: number;
  schoolId: number;
  name: string;
  gradeLevel?: string | null;
  academicYear: string;
  items: FeeItem[];
  totalAmount: number;
  createdAt: string;
};

type FeePayment = {
  id: number;
  schoolId: number;
  studentId: number;
  studentName: string;
  feeStructureId?: number | null;
  receiptNumber: string;
  amount: number;
  paymentDate: string;
  method: string;
  paidFor: string;
  academicYear: string;
  term?: string | null;
  status: string;
  notes?: string | null;
  createdAt: string;
};

type Expense = {
  id: number;
  schoolId: number;
  category: string;
  description: string;
  amount: number;
  date: string;
  vendor?: string | null;
  status: string;
  createdAt: string;
};

type StudentOption = {
  id: number;
  firstName: string;
  lastName: string;
  studentId: string;
};

type Summary = {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  byMonth: Record<string, { income: number; expenses: number }>;
};

type PageProps = {
  academicYear: string;
  summary: Summary;
  payments: FeePayment[];
  expenses: Expense[];
  feeStructures: FeeStructure[];
  students: StudentOption[];
};

function FinanceContent({ academicYear, summary, payments, expenses, feeStructures, students }: PageProps) {
  const { schoolId } = useCurrentSchool();
  const [tab, setTab] = useState("overview");

  // Dialogs
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [feeStructureOpen, setFeeStructureOpen] = useState(false);

  // Payment form state
  const [payForm, setPayForm] = useState({
    studentId: "",
    amount: "",
    paymentDate: new Date().toISOString().slice(0, 10),
    method: "cash" as "cash" | "card" | "online" | "bank_transfer" | "check",
    paidFor: "",
    term: "Term 1",
    status: "paid" as "paid" | "partial" | "overdue" | "waived",
    notes: "",
  });

  // Expense form state
  const [expForm, setExpForm] = useState({
    category: "",
    description: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    vendor: "",
    status: "pending" as "pending" | "approved" | "rejected",
  });

  // Fee structure form
  const [feeForm, setFeeForm] = useState({
    name: "",
    gradeLevel: "",
    items: [{ name: "Tuition", amount: 5000, dueDate: "", isOptional: false }],
  });

  const handleRecordPayment = () => {
    if (!schoolId || !payForm.studentId || !payForm.amount || !payForm.paidFor) {
      toast.error("Please fill all required fields");
      return;
    }
    router.post("/dashboard/finance/payments", {
      studentId: parseInt(payForm.studentId),
      amount: parseFloat(payForm.amount),
      paymentDate: payForm.paymentDate,
      method: payForm.method,
      paidFor: payForm.paidFor,
      academicYear,
      term: payForm.term || undefined,
      status: payForm.status,
      notes: payForm.notes || undefined,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success("Payment recorded successfully");
        setPaymentOpen(false);
        setPayForm({ studentId: "", amount: "", paymentDate: new Date().toISOString().slice(0, 10), method: "cash", paidFor: "", term: "Term 1", status: "paid", notes: "" });
      },
      onError: () => toast.error("Failed to record payment"),
    });
  };

  const handleCreateExpense = () => {
    if (!schoolId || !expForm.category || !expForm.description || !expForm.amount) {
      toast.error("Please fill all required fields");
      return;
    }
    router.post("/dashboard/finance/expenses", {
      category: expForm.category,
      description: expForm.description,
      amount: parseFloat(expForm.amount),
      date: expForm.date,
      vendor: expForm.vendor || undefined,
      status: expForm.status,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success("Expense recorded");
        setExpenseOpen(false);
        setExpForm({ category: "", description: "", amount: "", date: new Date().toISOString().slice(0, 10), vendor: "", status: "pending" });
      },
      onError: () => toast.error("Failed to record expense"),
    });
  };

  const handleCreateFeeStructure = () => {
    if (!schoolId || !feeForm.name || feeForm.items.length === 0) {
      toast.error("Please fill all required fields");
      return;
    }
    router.post("/dashboard/finance/fee-structures", {
      name: feeForm.name,
      gradeLevel: feeForm.gradeLevel || undefined,
      academicYear,
      items: feeForm.items.map((i) => ({ ...i, dueDate: i.dueDate || undefined })),
    }, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success("Fee structure created");
        setFeeStructureOpen(false);
        setFeeForm({ name: "", gradeLevel: "", items: [{ name: "Tuition", amount: 5000, dueDate: "", isOptional: false }] });
      },
      onError: () => toast.error("Failed to create fee structure"),
    });
  };

  const chartData = Object.entries(summary.byMonth).map(([month, data]) => ({
    month: MONTHS[parseInt(month) - 1],
    Income: data.income,
    Expenses: data.expenses,
  }));

  const statusColor = (status: string) => {
    if (status === "paid" || status === "approved") return "bg-emerald-100 text-emerald-700";
    if (status === "overdue" || status === "rejected") return "bg-red-100 text-red-700";
    if (status === "partial" || status === "pending") return "bg-amber-100 text-amber-700";
    return "bg-gray-100 text-gray-700";
  };

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
          <h1 className="text-2xl font-bold">Finance & Fee Management</h1>
          <p className="text-muted-foreground text-sm">Academic Year: {academicYear}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Dialog open={feeStructureOpen} onOpenChange={setFeeStructureOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm" className="cursor-pointer"><Plus className="h-4 w-4 mr-1" />Fee Structure</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Create Fee Structure</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <div><Label>Name *</Label><Input value={feeForm.name} onChange={(e) => setFeeForm({ ...feeForm, name: e.target.value })} placeholder="Grade 9 Annual 2025" /></div>
                <div><Label>Grade Level</Label><Input value={feeForm.gradeLevel} onChange={(e) => setFeeForm({ ...feeForm, gradeLevel: e.target.value })} placeholder="e.g. 9" /></div>
                <div>
                  <Label>Fee Items</Label>
                  {feeForm.items.map((item, i) => (
                    <div key={i} className="flex gap-2 mt-2 items-center">
                      <Input className="flex-1" placeholder="Item name" value={item.name} onChange={(e) => {
                        const items = [...feeForm.items]; items[i] = { ...items[i], name: e.target.value }; setFeeForm({ ...feeForm, items });
                      }} />
                      <Input className="w-28" type="number" placeholder="Amount" value={item.amount} onChange={(e) => {
                        const items = [...feeForm.items]; items[i] = { ...items[i], amount: parseFloat(e.target.value) || 0 }; setFeeForm({ ...feeForm, items });
                      }} />
                      <Button variant="ghost" size="icon" className="cursor-pointer text-destructive" onClick={() => setFeeForm({ ...feeForm, items: feeForm.items.filter((_, j) => j !== i) })}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" className="cursor-pointer mt-2" onClick={() => setFeeForm({ ...feeForm, items: [...feeForm.items, { name: "", amount: 0, dueDate: "", isOptional: false }] })}>
                    <Plus className="h-4 w-4 mr-1" />Add Item
                  </Button>
                </div>
                <div className="font-semibold text-sm">Total: ${feeForm.items.reduce((s, i) => s + (i.amount || 0), 0).toLocaleString()}</div>
                <Button className="w-full cursor-pointer" onClick={handleCreateFeeStructure}>Create Fee Structure</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm" className="cursor-pointer"><Plus className="h-4 w-4 mr-1" />Add Expense</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Record Expense</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <div>
                  <Label>Category *</Label>
                  <Select value={expForm.category} onValueChange={(v) => setExpForm({ ...expForm, category: v })}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>{EXPENSE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Description *</Label><Input value={expForm.description} onChange={(e) => setExpForm({ ...expForm, description: e.target.value })} /></div>
                <div><Label>Amount ($) *</Label><Input type="number" value={expForm.amount} onChange={(e) => setExpForm({ ...expForm, amount: e.target.value })} /></div>
                <div><Label>Date *</Label><Input type="date" value={expForm.date} onChange={(e) => setExpForm({ ...expForm, date: e.target.value })} /></div>
                <div><Label>Vendor</Label><Input value={expForm.vendor} onChange={(e) => setExpForm({ ...expForm, vendor: e.target.value })} placeholder="Vendor name (optional)" /></div>
                <div>
                  <Label>Status</Label>
                  <Select value={expForm.status} onValueChange={(v) => setExpForm({ ...expForm, status: v as "pending" | "approved" | "rejected" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full cursor-pointer" onClick={handleCreateExpense}>Record Expense</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="cursor-pointer"><Plus className="h-4 w-4 mr-1" />Record Payment</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Record Fee Payment</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <div>
                  <Label>Student *</Label>
                  <Select value={payForm.studentId} onValueChange={(v) => setPayForm({ ...payForm, studentId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                    <SelectContent>
                      {students.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>{s.firstName} {s.lastName} ({s.studentId})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Description / Paid For *</Label><Input value={payForm.paidFor} onChange={(e) => setPayForm({ ...payForm, paidFor: e.target.value })} placeholder="e.g. Tuition - Term 1" /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Amount ($) *</Label><Input type="number" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} /></div>
                  <div><Label>Date *</Label><Input type="date" value={payForm.paymentDate} onChange={(e) => setPayForm({ ...payForm, paymentDate: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Method</Label>
                    <Select value={payForm.method} onValueChange={(v) => setPayForm({ ...payForm, method: v as typeof payForm.method })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Term</Label>
                    <Select value={payForm.term} onValueChange={(v) => setPayForm({ ...payForm, term: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Term 1">Term 1</SelectItem>
                        <SelectItem value="Term 2">Term 2</SelectItem>
                        <SelectItem value="Term 3">Term 3</SelectItem>
                        <SelectItem value="Annual">Annual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={payForm.status} onValueChange={(v) => setPayForm({ ...payForm, status: v as typeof payForm.status })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="waived">Waived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Notes</Label><Input value={payForm.notes} onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })} placeholder="Optional notes" /></div>
                <Button className="w-full cursor-pointer" onClick={handleRecordPayment}>Record Payment</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Income</p>
                <p className="text-2xl font-bold text-emerald-600">${summary.totalIncome.toLocaleString()}</p>
              </div>
              <div className="p-2 bg-emerald-100 rounded-lg"><TrendingUp className="h-5 w-5 text-emerald-600" /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">${summary.totalExpenses.toLocaleString()}</p>
              </div>
              <div className="p-2 bg-red-100 rounded-lg"><TrendingDown className="h-5 w-5 text-red-600" /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net Balance</p>
                <p className={cn("text-2xl font-bold", summary.netBalance >= 0 ? "text-emerald-600" : "text-red-600")}>
                  ${summary.netBalance.toLocaleString()}
                </p>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg"><DollarSign className="h-5 w-5 text-primary" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview" className="cursor-pointer">Overview</TabsTrigger>
          <TabsTrigger value="payments" className="cursor-pointer">Payments</TabsTrigger>
          <TabsTrigger value="expenses" className="cursor-pointer">Expenses</TabsTrigger>
          <TabsTrigger value="fee-structures" className="cursor-pointer">Fee Structures</TabsTrigger>
        </TabsList>

        {/* Overview - Chart */}
        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Monthly Cash Flow</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(val: number) => `$${val.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="Income" fill="#10b981" radius={[4,4,0,0]} />
                  <Bar dataKey="Expenses" fill="#ef4444" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments */}
        <TabsContent value="payments" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Fee Payments</CardTitle></CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Receipt className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p>No payments recorded yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Receipt #</th>
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Student</th>
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Description</th>
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Amount</th>
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Date</th>
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Method</th>
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Status</th>
                        <th className="py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="py-2 pr-4 font-mono text-xs">{p.receiptNumber}</td>
                          <td className="py-2 pr-4">{p.studentName}</td>
                          <td className="py-2 pr-4">{p.paidFor}</td>
                          <td className="py-2 pr-4 font-semibold">${p.amount.toLocaleString()}</td>
                          <td className="py-2 pr-4 text-muted-foreground">{p.paymentDate}</td>
                          <td className="py-2 pr-4 capitalize">{p.method.replace("_", " ")}</td>
                          <td className="py-2 pr-4">
                            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize", statusColor(p.status))}>{p.status}</span>
                          </td>
                          <td className="py-2">
                            <Button variant="ghost" size="icon" className="cursor-pointer h-7 w-7 text-destructive" onClick={() => router.delete(`/dashboard/finance/payments/${p.id}`, { preserveScroll: true, onSuccess: () => toast.success("Deleted"), onError: () => toast.error("Failed to delete") })}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
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

        {/* Expenses */}
        <TabsContent value="expenses" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Expense Records</CardTitle></CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p>No expenses recorded yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Category</th>
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Description</th>
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Amount</th>
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Date</th>
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Vendor</th>
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Status</th>
                        <th className="py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map((e) => (
                        <tr key={e.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="py-2 pr-4">
                            <Badge variant="outline" className="text-xs">{e.category}</Badge>
                          </td>
                          <td className="py-2 pr-4">{e.description}</td>
                          <td className="py-2 pr-4 font-semibold">${e.amount.toLocaleString()}</td>
                          <td className="py-2 pr-4 text-muted-foreground">{e.date}</td>
                          <td className="py-2 pr-4 text-muted-foreground">{e.vendor ?? "—"}</td>
                          <td className="py-2 pr-4">
                            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize", statusColor(e.status))}>{e.status}</span>
                          </td>
                          <td className="py-2 flex gap-1">
                            {e.status === "pending" && (
                              <Button variant="ghost" size="icon" className="cursor-pointer h-7 w-7 text-emerald-600" onClick={() => router.put(`/dashboard/finance/expenses/${e.id}/status`, { status: "approved" }, { preserveScroll: true, onSuccess: () => toast.success("Approved"), onError: () => toast.error("Failed to approve") })}>
                                <CheckCircle className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="cursor-pointer h-7 w-7 text-destructive" onClick={() => router.delete(`/dashboard/finance/expenses/${e.id}`, { preserveScroll: true, onSuccess: () => toast.success("Deleted"), onError: () => toast.error("Failed to delete") })}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
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

        {/* Fee Structures */}
        <TabsContent value="fee-structures" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {feeStructures.length === 0 ? (
              <div className="col-span-2 text-center py-12 text-muted-foreground">
                <Clock className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>No fee structures defined yet.</p>
                <Button size="sm" className="mt-3 cursor-pointer" onClick={() => setFeeStructureOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />Create Fee Structure
                </Button>
              </div>
            ) : feeStructures.map((fs) => (
              <Card key={fs.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{fs.name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">Grade {fs.gradeLevel ?? "All"} · {fs.academicYear}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="cursor-pointer h-7 w-7 text-destructive" onClick={() => router.delete(`/dashboard/finance/fee-structures/${fs.id}`, { preserveScroll: true, onSuccess: () => toast.success("Deleted"), onError: () => toast.error("Failed to delete") })}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {fs.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{item.name}</span>
                        <span className="font-medium">${item.amount.toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="border-t pt-1.5 flex justify-between font-bold text-sm">
                      <span>Total</span>
                      <span>${fs.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function FinancePage(props: PageProps) {
  return (
    <DashboardLayout>
      <FinanceContent {...props} />
    </DashboardLayout>
  );
}
