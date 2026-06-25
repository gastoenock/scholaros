import { useCallback, useEffect, useMemo, useState } from "react";
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
import { routerDeleteWithConfirm } from "@/lib/confirm.ts";
import { usePermissions } from "@/hooks/use-permissions.ts";
import { cn } from "@/lib/utils.ts";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import {
  DollarSign, TrendingUp, TrendingDown, Plus, Receipt,
  AlertCircle, Clock, CheckCircle, Trash2, BookOpen, Scale, FileSpreadsheet, Wallet,
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
  feesDue?: number | null;
  paidTotalBefore?: number | null;
  paidTotalAfter?: number | null;
  balanceBefore?: number | null;
  balanceAfter?: number | null;
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
  paymentMethod?: string | null;
  status: string;
  createdAt: string;
};

type StudentOption = {
  id: number;
  firstName: string;
  lastName: string;
  studentId: string;
  gradeLevel?: string | null;
};

type FeeBalancePreview = {
  feesDue: number;
  paidTotalBefore: number;
  paidTotalAfter: number;
  balanceBefore: number;
  balanceAfter: number;
  feeStructureId?: number | null;
  feeStructureName?: string | null;
};

type Summary = {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  totalCollected: number;
  totalOutstanding: number;
  byMonth: Record<string, { income: number; expenses: number }>;
};

type AccountingReport = {
  cashBook: {
    openingBalance: number;
    closingBalance: number;
    entries: { date: string; entryNumber: string; description: string; debit: number; credit: number; balance: number }[];
  };
  pettyCashBook: { date: string; voucherNumber: string; description: string; type: string; amount: number }[];
  trialBalance: {
    accounts: { code: string; name: string; accountType: string; ifrsCategory?: string | null; debit: number; credit: number }[];
    totalDebits: number;
    totalCredits: number;
    isBalanced: boolean;
  };
  balanceSheet: {
    assets: { code: string; name: string; amount: number; ifrsCategory?: string | null }[];
    liabilities: { code: string; name: string; amount: number; ifrsCategory?: string | null }[];
    equity: { code: string; name: string; amount: number; ifrsCategory?: string | null }[];
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
  };
  pettyCashFund?: { floatAmount: number; currentBalance: number; name: string } | null;
};

type PageProps = {
  academicYear: string;
  reportAsOf: string;
  summary: Summary;
  payments: FeePayment[];
  expenses: Expense[];
  feeStructures: FeeStructure[];
  students: StudentOption[];
  accounting: AccountingReport | null;
  canManage?: boolean;
  isParentView?: boolean;
};

function FinanceContent({
  academicYear,
  reportAsOf,
  summary,
  payments,
  expenses,
  feeStructures,
  students,
  accounting,
  canManage: canManageProp,
  isParentView = false,
}: PageProps) {
  const { schoolId } = useCurrentSchool();
  const { can } = usePermissions();
  const canManage = canManageProp ?? can("finance.manage");
  const [tab, setTab] = useState("overview");
  const [reportTab, setReportTab] = useState("cash-book");

  // Dialogs
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [feeStructureOpen, setFeeStructureOpen] = useState(false);

  // Payment form state
  const [payForm, setPayForm] = useState({
    studentId: "",
    feeStructureId: "",
    amount: "",
    paymentDate: new Date().toISOString().slice(0, 10),
    method: "cash" as "cash" | "card" | "online" | "bank_transfer" | "check",
    paidFor: "",
    term: "Term 1",
    status: "paid" as "paid" | "partial" | "overdue" | "waived",
    notes: "",
  });
  const [balancePreview, setBalancePreview] = useState<FeeBalancePreview | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const loadBalancePreview = useCallback(async () => {
    if (!payForm.studentId) {
      setBalancePreview(null);
      return;
    }

    setBalanceLoading(true);
    try {
      const params = new URLSearchParams({
        studentId: payForm.studentId,
        academicYear,
        amount: payForm.amount || "0",
        status: payForm.status,
      });
      if (payForm.feeStructureId) params.set("feeStructureId", payForm.feeStructureId);

      const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") ?? "";
      const response = await fetch(`/dashboard/finance/fee-balance-preview?${params.toString()}`, {
        headers: {
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
          "X-CSRF-TOKEN": csrf,
        },
        credentials: "same-origin",
      });

      if (!response.ok) {
        setBalancePreview(null);
        return;
      }

      setBalancePreview(await response.json() as FeeBalancePreview);
    } finally {
      setBalanceLoading(false);
    }
  }, [academicYear, payForm.amount, payForm.feeStructureId, payForm.status, payForm.studentId]);

  useEffect(() => {
    if (!paymentOpen || !payForm.studentId) {
      setBalancePreview(null);
      return;
    }

    const timer = window.setTimeout(() => {
      void loadBalancePreview();
    }, 250);

    return () => window.clearTimeout(timer);
  }, [loadBalancePreview, paymentOpen, payForm.studentId, payForm.amount, payForm.status, payForm.feeStructureId]);

  const matchingFeeStructures = useMemo(
    () => feeStructures.filter((structure) => {
      if (!payForm.studentId) return true;
      const student = students.find((s) => String(s.id) === payForm.studentId);
      if (!student?.gradeLevel) return true;
      return !structure.gradeLevel || structure.gradeLevel === student.gradeLevel;
    }),
    [feeStructures, payForm.studentId, students],
  );

  // Expense form state
  const [expForm, setExpForm] = useState({
    category: "",
    description: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    vendor: "",
    paymentMethod: "cash" as "cash" | "bank" | "petty_cash",
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
      feeStructureId: payForm.feeStructureId ? parseInt(payForm.feeStructureId) : undefined,
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
        setBalancePreview(null);
        setPayForm({ studentId: "", feeStructureId: "", amount: "", paymentDate: new Date().toISOString().slice(0, 10), method: "cash", paidFor: "", term: "Term 1", status: "paid", notes: "" });
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
      paymentMethod: expForm.paymentMethod,
      status: expForm.status,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success("Expense recorded");
        setExpenseOpen(false);
        setExpForm({ category: "", description: "", amount: "", date: new Date().toISOString().slice(0, 10), vendor: "", paymentMethod: "cash", status: "pending" });
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
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">{isParentView ? "Fee Status" : "Finance & Accounting"}</h1>
          <p className="text-muted-foreground text-sm">
            {isParentView
              ? `Your children's fees · Academic Year ${academicYear}`
              : `Academic Year: ${academicYear} · IFRS-aligned ledger · Reports as of ${reportAsOf}`}
          </p>
        </div>
        {canManage && (
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
                  <Label>Payment Source</Label>
                  <Select value={expForm.paymentMethod} onValueChange={(v) => setExpForm({ ...expForm, paymentMethod: v as typeof expForm.paymentMethod })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash / Main Account</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                      <SelectItem value="petty_cash">Petty Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                  <Select value={payForm.studentId} onValueChange={(v) => setPayForm({ ...payForm, studentId: v, feeStructureId: "" })}>
                    <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                    <SelectContent>
                      {students.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>{s.firstName} {s.lastName} ({s.studentId})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {matchingFeeStructures.length > 0 && (
                  <div>
                    <Label>Fee Structure</Label>
                    <Select value={payForm.feeStructureId || "auto"} onValueChange={(v) => setPayForm({ ...payForm, feeStructureId: v === "auto" ? "" : v })}>
                      <SelectTrigger><SelectValue placeholder="Auto-match by grade" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto-match by grade</SelectItem>
                        {matchingFeeStructures.map((structure) => (
                          <SelectItem key={structure.id} value={String(structure.id)}>
                            {structure.name}{structure.gradeLevel ? ` · ${structure.gradeLevel}` : ""} (${structure.totalAmount.toLocaleString()})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {payForm.studentId && (
                  <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-2">
                    <p className="font-medium">Balance preview</p>
                    {balanceLoading ? (
                      <p className="text-muted-foreground">Calculating balances…</p>
                    ) : balancePreview ? (
                      <>
                        {balancePreview.feeStructureName && (
                          <p className="text-xs text-muted-foreground">Fee structure: {balancePreview.feeStructureName}</p>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-xs text-muted-foreground">Total fees due</p>
                            <p className="font-semibold">${balancePreview.feesDue.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Paid before</p>
                            <p className="font-semibold text-emerald-600">${balancePreview.paidTotalBefore.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Due before payment</p>
                            <p className="font-semibold text-amber-600">${balancePreview.balanceBefore.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Due after payment</p>
                            <p className="font-semibold text-blue-600">${balancePreview.balanceAfter.toLocaleString()}</p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Paid after: ${balancePreview.paidTotalAfter.toLocaleString()}
                        </p>
                      </>
                    ) : (
                      <p className="text-muted-foreground">Select a student to preview balances.</p>
                    )}
                  </div>
                )}
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
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
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
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Outstanding Fees</p>
                <p className="text-2xl font-bold text-amber-600">${(summary.totalOutstanding ?? 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Collected: ${(summary.totalCollected ?? 0).toLocaleString()}</p>
              </div>
              <div className="p-2 bg-amber-100 rounded-lg"><Receipt className="h-5 w-5 text-amber-600" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview" className="cursor-pointer">Overview</TabsTrigger>
          <TabsTrigger value="payments" className="cursor-pointer">Payments</TabsTrigger>
          {!isParentView && (
            <>
              <TabsTrigger value="expenses" className="cursor-pointer">Expenses</TabsTrigger>
              <TabsTrigger value="fee-structures" className="cursor-pointer">Fee Structures</TabsTrigger>
              <TabsTrigger value="accounting" className="cursor-pointer">Accounting</TabsTrigger>
            </>
          )}
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
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Due Before</th>
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Due After</th>
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Paid After</th>
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
                          <td className="py-2 pr-4 text-amber-700">
                            {p.balanceBefore != null ? `$${p.balanceBefore.toLocaleString()}` : "—"}
                          </td>
                          <td className="py-2 pr-4 text-blue-700">
                            {p.balanceAfter != null ? `$${p.balanceAfter.toLocaleString()}` : "—"}
                          </td>
                          <td className="py-2 pr-4 text-emerald-700">
                            {p.paidTotalAfter != null ? `$${p.paidTotalAfter.toLocaleString()}` : "—"}
                          </td>
                          <td className="py-2 pr-4 text-muted-foreground">{p.paymentDate}</td>
                          <td className="py-2 pr-4 capitalize">{p.method.replace("_", " ")}</td>
                          <td className="py-2 pr-4">
                            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize", statusColor(p.status))}>{p.status}</span>
                          </td>
                          {canManage && (
                          <td className="py-2">
                            <Button variant="ghost" size="icon" className="cursor-pointer h-7 w-7 text-destructive" onClick={() => void routerDeleteWithConfirm(`/dashboard/finance/payments/${p.id}`, { title: "Delete this payment?", onSuccess: () => toast.success("Deleted"), onError: () => toast.error("Failed to delete") })}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                          )}
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
                              <Button variant="ghost" size="icon" className="cursor-pointer h-7 w-7 text-emerald-600" onClick={() => router.patch(`/dashboard/finance/expenses/${e.id}/status`, { status: "approved" }, { preserveScroll: true, onSuccess: () => toast.success("Approved"), onError: () => toast.error("Failed to approve") })}>
                                <CheckCircle className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="cursor-pointer h-7 w-7 text-destructive" onClick={() => void routerDeleteWithConfirm(`/dashboard/finance/expenses/${e.id}`, { title: "Delete this expense?", onSuccess: () => toast.success("Deleted"), onError: () => toast.error("Failed to delete") })}>
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
                    <Button variant="ghost" size="icon" className="cursor-pointer h-7 w-7 text-destructive" onClick={() => void routerDeleteWithConfirm(`/dashboard/finance/fee-structures/${fs.id}`, { title: "Delete this fee structure?", onSuccess: () => toast.success("Deleted"), onError: () => toast.error("Failed to delete") })}>
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

        {/* Accounting & IFRS Reports */}
        <TabsContent value="accounting" className="mt-4 space-y-4">
          {!accounting ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Accounting data unavailable.</CardContent></Card>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6 flex items-center gap-3">
                    <Wallet className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">Cash Book Balance</p>
                      <p className="text-xl font-bold">${accounting.cashBook.closingBalance.toLocaleString()}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 flex items-center gap-3">
                    <BookOpen className="h-8 w-8 text-amber-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">Petty Cash Float</p>
                      <p className="text-xl font-bold">${(accounting.pettyCashFund?.currentBalance ?? 0).toLocaleString()}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 flex items-center gap-3">
                    <Scale className="h-8 w-8 text-emerald-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">Trial Balance</p>
                      <p className={cn("text-xl font-bold", accounting.trialBalance.isBalanced ? "text-emerald-600" : "text-red-600")}>
                        {accounting.trialBalance.isBalanced ? "Balanced" : "Out of balance"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Tabs value={reportTab} onValueChange={setReportTab}>
                <TabsList className="flex-wrap h-auto">
                  <TabsTrigger value="cash-book" className="cursor-pointer">Cash Book</TabsTrigger>
                  <TabsTrigger value="petty-cash" className="cursor-pointer">Petty Cash Book</TabsTrigger>
                  <TabsTrigger value="trial-balance" className="cursor-pointer">Trial Balance</TabsTrigger>
                  <TabsTrigger value="balance-sheet" className="cursor-pointer">Balance Sheet</TabsTrigger>
                </TabsList>

                <TabsContent value="cash-book" className="mt-4">
                  <Card>
                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4" /> Cash Book (IAS 7)</CardTitle></CardHeader>
                    <CardContent className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 pr-3">Date</th>
                            <th className="text-left py-2 pr-3">Ref</th>
                            <th className="text-left py-2 pr-3">Description</th>
                            <th className="text-right py-2 pr-3">Debit</th>
                            <th className="text-right py-2 pr-3">Credit</th>
                            <th className="text-right py-2">Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {accounting.cashBook.entries.length === 0 ? (
                            <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No cash entries yet. Record fee payments to populate.</td></tr>
                          ) : accounting.cashBook.entries.map((row, i) => (
                            <tr key={i} className="border-b last:border-0">
                              <td className="py-2 pr-3">{row.date}</td>
                              <td className="py-2 pr-3 font-mono text-xs">{row.entryNumber}</td>
                              <td className="py-2 pr-3">{row.description}</td>
                              <td className="py-2 pr-3 text-right">{row.debit ? `$${row.debit.toLocaleString()}` : "—"}</td>
                              <td className="py-2 pr-3 text-right">{row.credit ? `$${row.credit.toLocaleString()}` : "—"}</td>
                              <td className="py-2 text-right font-medium">${row.balance.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="petty-cash" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2"><Wallet className="h-4 w-4" /> Petty Cash Book</CardTitle>
                      <p className="text-xs text-muted-foreground">Fund: {accounting.pettyCashFund?.name ?? "Main Petty Cash"} · Balance: ${(accounting.pettyCashFund?.currentBalance ?? 0).toLocaleString()}</p>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 pr-3">Date</th>
                            <th className="text-left py-2 pr-3">Voucher</th>
                            <th className="text-left py-2 pr-3">Description</th>
                            <th className="text-left py-2 pr-3">Type</th>
                            <th className="text-right py-2">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {accounting.pettyCashBook.length === 0 ? (
                            <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No petty cash disbursements. Approve expenses paid from petty cash.</td></tr>
                          ) : accounting.pettyCashBook.map((row, i) => (
                            <tr key={i} className="border-b last:border-0">
                              <td className="py-2 pr-3">{row.date}</td>
                              <td className="py-2 pr-3 font-mono text-xs">{row.voucherNumber}</td>
                              <td className="py-2 pr-3">{row.description}</td>
                              <td className="py-2 pr-3 capitalize">{row.type}</td>
                              <td className="py-2 text-right font-medium">${row.amount.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="trial-balance" className="mt-4">
                  <Card>
                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><Scale className="h-4 w-4" /> Trial Balance (IAS 1)</CardTitle></CardHeader>
                    <CardContent className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 pr-3">Code</th>
                            <th className="text-left py-2 pr-3">Account</th>
                            <th className="text-left py-2 pr-3">IFRS</th>
                            <th className="text-right py-2 pr-3">Debit</th>
                            <th className="text-right py-2">Credit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {accounting.trialBalance.accounts.map((row) => (
                            <tr key={row.code} className="border-b last:border-0">
                              <td className="py-2 pr-3 font-mono text-xs">{row.code}</td>
                              <td className="py-2 pr-3">{row.name}</td>
                              <td className="py-2 pr-3 text-xs text-muted-foreground">{row.ifrsCategory ?? "—"}</td>
                              <td className="py-2 pr-3 text-right">{row.debit ? `$${row.debit.toLocaleString()}` : "—"}</td>
                              <td className="py-2 text-right">{row.credit ? `$${row.credit.toLocaleString()}` : "—"}</td>
                            </tr>
                          ))}
                          <tr className="font-bold border-t-2">
                            <td colSpan={3} className="py-2 pr-3">Totals</td>
                            <td className="py-2 pr-3 text-right">${accounting.trialBalance.totalDebits.toLocaleString()}</td>
                            <td className="py-2 text-right">${accounting.trialBalance.totalCredits.toLocaleString()}</td>
                          </tr>
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="balance-sheet" className="mt-4">
                  <Card>
                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileSpreadsheet className="h-4 w-4" /> Statement of Financial Position (IAS 1)</CardTitle></CardHeader>
                    <CardContent className="grid md:grid-cols-3 gap-6">
                      {([
                        ["Assets", accounting.balanceSheet.assets, accounting.balanceSheet.totalAssets],
                        ["Liabilities", accounting.balanceSheet.liabilities, accounting.balanceSheet.totalLiabilities],
                        ["Equity", accounting.balanceSheet.equity, accounting.balanceSheet.totalEquity],
                      ] as const).map(([title, rows, total]) => (
                        <div key={title}>
                          <h3 className="font-semibold text-sm mb-2">{title}</h3>
                          <div className="space-y-1.5">
                            {rows.length === 0 ? <p className="text-xs text-muted-foreground">No balances</p> : rows.map((row) => (
                              <div key={row.code} className="flex justify-between text-sm">
                                <span className="text-muted-foreground truncate pr-2">{row.name}</span>
                                <span className="font-medium shrink-0">${row.amount.toLocaleString()}</span>
                              </div>
                            ))}
                            <div className="border-t pt-2 flex justify-between font-bold text-sm">
                              <span>Total {title}</span>
                              <span>${total.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <p className="text-xs text-muted-foreground">
                Double-entry postings are generated automatically from approved expenses and paid fee receipts.
                Chart of accounts follows IFRS taxonomy (IFRS 15 revenue, IAS 1 presentation, IAS 7 cash flows).
              </p>
            </>
          )}
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
