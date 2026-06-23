import { useMemo, useState, type ElementType } from "react";
import { router, usePage } from "@inertiajs/react";
import { DashboardLayout } from "../_components/layout.tsx";
import { useCurrentSchool } from "../_components/use-current-school.ts";
import { AcademicSemesterField, AcademicYearField } from "@/components/academic-calendar-fields.tsx";
import { defaultSemesterId, defaultYearId, type SharedWithCalendar } from "@/lib/academic-calendar.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import {
  ClipboardList, Plus, Search, Eye, CheckCircle, XCircle,
  Clock, Calendar, ChevronRight, User, Mail, Phone,
} from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty.tsx";

const GRADES = ["Pre-K", "Kindergarten", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5",
  "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];

type AdmissionStatus =
  | "submitted"
  | "under_review"
  | "interview_scheduled"
  | "accepted"
  | "rejected"
  | "waitlisted"
  | "enrolled";

export type Admission = {
  id: number;
  schoolId: number;
  schoolBranchId?: number | null;
  applicationId: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string | null;
  gender?: "male" | "female" | "other" | null;
  applyingForGrade: string;
  academicYear: string;
  previousSchool?: string | null;
  guardianName: string;
  guardianEmail: string;
  guardianPhone: string;
  guardianRelationship: string;
  status: AdmissionStatus;
  reviewNotes?: string | null;
  interviewDate?: string | null;
  createdAt: string;
};

type Stats = {
  total: number;
  submitted: number;
  underReview: number;
  accepted: number;
  enrolled: number;
  rejected: number;
};

const admissionSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  applyingForGrade: z.string().min(1, "Required"),
  previousSchool: z.string().optional(),
  guardianName: z.string().min(1, "Required"),
  guardianEmail: z.string().email("Valid email required"),
  guardianPhone: z.string().min(1, "Required"),
  guardianRelationship: z.string().min(1, "Required"),
});
type AdmissionFormData = z.infer<typeof admissionSchema>;

const statusConfig: Record<string, { label: string; color: string; icon: ElementType }> = {
  submitted: { label: "Submitted", color: "bg-blue-100 text-blue-700 border-blue-200", icon: ClipboardList },
  under_review: { label: "Under Review", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
  interview_scheduled: { label: "Interview Scheduled", color: "bg-purple-100 text-purple-700 border-purple-200", icon: Calendar },
  accepted: { label: "Accepted", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
  waitlisted: { label: "Waitlisted", color: "bg-gray-100 text-gray-600 border-gray-200", icon: Clock },
  enrolled: { label: "Enrolled", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle },
};

function NewAdmissionDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { academicCalendar } = usePage<SharedWithCalendar>().props;
  const [academicYearId, setAcademicYearId] = useState<number | null>(() => defaultYearId(academicCalendar));
  const [academicSemesterId, setAcademicSemesterId] = useState<number | null>(() =>
    defaultSemesterId(academicCalendar, defaultYearId(academicCalendar)),
  );

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting }, reset } =
    useForm<AdmissionFormData>({
      resolver: zodResolver(admissionSchema),
      defaultValues: { guardianRelationship: "Parent" },
    });

  const onSubmit = (data: AdmissionFormData) =>
    new Promise<void>((resolve) => {
      router.post("/dashboard/admissions", {
        ...data,
        academicYearId: academicYearId ?? undefined,
        academicSemesterId: academicSemesterId ?? undefined,
      }, {
        preserveScroll: true,
        onSuccess: () => {
          toast.success("Admission application submitted!");
          reset();
          onClose();
        },
        onError: () => toast.error("Failed to submit application"),
        onFinish: () => resolve(),
      });
    });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Admission Application</DialogTitle>
          <DialogDescription>Submit a new student admission application.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-2">
          <div>
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Applicant</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block">First Name *</Label>
                <Input placeholder="John" {...register("firstName")} />
                {errors.firstName && <p className="text-destructive text-xs mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <Label className="mb-1.5 block">Last Name *</Label>
                <Input placeholder="Smith" {...register("lastName")} />
                {errors.lastName && <p className="text-destructive text-xs mt-1">{errors.lastName.message}</p>}
              </div>
              <div>
                <Label className="mb-1.5 block">Date of Birth</Label>
                <Input type="date" {...register("dateOfBirth")} />
              </div>
              <div>
                <Label className="mb-1.5 block">Gender</Label>
                <Select onValueChange={(v) => setValue("gender", v as "male" | "female" | "other")}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block">Applying for Grade *</Label>
                <Select onValueChange={(v) => setValue("applyingForGrade", v)}>
                  <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                  <SelectContent>
                    {GRADES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.applyingForGrade && <p className="text-destructive text-xs mt-1">{errors.applyingForGrade.message}</p>}
              </div>
              <div>
                <AcademicYearField
                  calendar={academicCalendar}
                  value={academicYearId}
                  onChange={(yearId) => {
                    setAcademicYearId(yearId);
                    setAcademicSemesterId(defaultSemesterId(academicCalendar, yearId));
                  }}
                  required
                />
              </div>
              <div>
                <AcademicSemesterField
                  calendar={academicCalendar}
                  yearId={academicYearId}
                  value={academicSemesterId}
                  onChange={setAcademicSemesterId}
                />
              </div>
              <div className="col-span-2">
                <Label className="mb-1.5 block">Previous School</Label>
                <Input placeholder="Previous school name (if any)" {...register("previousSchool")} />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Guardian / Parent</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block">Guardian Name *</Label>
                <Input placeholder="Jane Smith" {...register("guardianName")} />
                {errors.guardianName && <p className="text-destructive text-xs mt-1">{errors.guardianName.message}</p>}
              </div>
              <div>
                <Label className="mb-1.5 block">Relationship *</Label>
                <Input placeholder="Mother, Father, etc." {...register("guardianRelationship")} />
              </div>
              <div>
                <Label className="mb-1.5 block">Email *</Label>
                <Input type="email" placeholder="parent@email.com" {...register("guardianEmail")} />
                {errors.guardianEmail && <p className="text-destructive text-xs mt-1">{errors.guardianEmail.message}</p>}
              </div>
              <div>
                <Label className="mb-1.5 block">Phone *</Label>
                <Input placeholder="(215) 555-0100" {...register("guardianPhone")} />
                {errors.guardianPhone && <p className="text-destructive text-xs mt-1">{errors.guardianPhone.message}</p>}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting} className="cursor-pointer flex-1">
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose} className="cursor-pointer">Cancel</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AdmissionDetailDialog({
  admission,
  onClose,
}: {
  admission: Admission | null;
  onClose: () => void;
}) {
  const [notes, setNotes] = useState("");

  if (!admission) return null;
  const cfg = statusConfig[admission.status];

  const handleStatusChange = (newStatus: AdmissionStatus) => {
    router.post(`/dashboard/admissions/${admission.id}/status`, {
      status: newStatus,
      reviewNotes: notes || undefined,
    }, {
      preserveScroll: true,
      onSuccess: () => toast.success(`Status updated to ${statusConfig[newStatus].label}`),
      onError: () => toast.error("Failed to update status"),
    });
  };

  const handleEnroll = () => {
    router.post(`/dashboard/admissions/${admission.id}/enroll`, {}, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success("Student enrolled successfully!");
        onClose();
      },
      onError: () => toast.error("Failed to enroll student"),
    });
  };

  return (
    <Dialog open={!!admission} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{admission.firstName} {admission.lastName}</DialogTitle>
          <DialogDescription>Application ID: {admission.applicationId}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className={`${cfg.color} border flex items-center gap-1`}>
              <cfg.icon className="h-3 w-3" /> {cfg.label}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Applied {format(new Date(admission.createdAt), "MMM d, yyyy")}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-muted-foreground">Grade: </span><span className="font-medium">{admission.applyingForGrade}</span></div>
            <div><span className="text-muted-foreground">Year: </span><span className="font-medium">{admission.academicYear}</span></div>
            {admission.gender && <div><span className="text-muted-foreground">Gender: </span><span className="capitalize">{admission.gender}</span></div>}
            {admission.dateOfBirth && <div><span className="text-muted-foreground">DOB: </span><span>{format(new Date(admission.dateOfBirth), "MMM d, yyyy")}</span></div>}
            {admission.previousSchool && <div className="col-span-2"><span className="text-muted-foreground">Previous School: </span><span>{admission.previousSchool}</span></div>}
          </div>

          <div className="border-t pt-3">
            <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Guardian</p>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-muted-foreground" /><span>{admission.guardianName} ({admission.guardianRelationship})</span></div>
              <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" /><span>{admission.guardianEmail}</span></div>
              <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" /><span>{admission.guardianPhone}</span></div>
            </div>
          </div>

          {admission.reviewNotes && (
            <div className="border-t pt-3">
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Review Notes</p>
              <p className="text-sm">{admission.reviewNotes}</p>
            </div>
          )}

          {admission.status !== "enrolled" && (
            <div className="border-t pt-3 space-y-3">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Update Status</p>
              <Textarea
                placeholder="Add review notes (optional)..."
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                {admission.status === "submitted" && (
                  <Button size="sm" variant="secondary" onClick={() => handleStatusChange("under_review")} className="cursor-pointer">
                    Mark Under Review
                  </Button>
                )}
                {(admission.status === "submitted" || admission.status === "under_review") && (
                  <Button size="sm" variant="secondary" onClick={() => handleStatusChange("interview_scheduled")} className="cursor-pointer">
                    Schedule Interview
                  </Button>
                )}
                {admission.status !== "accepted" && admission.status !== "rejected" && (
                  <>
                    <Button size="sm" className="cursor-pointer bg-green-600 hover:bg-green-700" onClick={() => handleStatusChange("accepted")}>
                      <CheckCircle className="h-3.5 w-3.5 mr-1" /> Accept
                    </Button>
                    <Button size="sm" variant="secondary" className="cursor-pointer text-destructive" onClick={() => handleStatusChange("rejected")}>
                      <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => handleStatusChange("waitlisted")} className="cursor-pointer">
                      Waitlist
                    </Button>
                  </>
                )}
                {admission.status === "accepted" && (
                  <Button size="sm" className="cursor-pointer" onClick={handleEnroll}>
                    <ChevronRight className="h-3.5 w-3.5 mr-1" /> Enroll Student
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AdmissionsContent({ admissions, stats }: PageProps) {
  const { schoolId } = useCurrentSchool();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [newOpen, setNewOpen] = useState(false);
  const [viewAdmission, setViewAdmission] = useState<Admission | null>(null);

  const filteredAdmissions = useMemo(() => {
    let result = admissions;
    if (statusFilter !== "all") {
      result = result.filter((a) => a.status === statusFilter);
    }
    if (search) {
      const term = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.firstName.toLowerCase().includes(term) ||
          a.lastName.toLowerCase().includes(term) ||
          a.applicationId.toLowerCase().includes(term) ||
          a.guardianName.toLowerCase().includes(term),
      );
    }
    return result;
  }, [admissions, search, statusFilter]);

  if (!schoolId) return <div className="text-muted-foreground text-center py-20">No school linked.</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">Admissions</h1>
          <p className="text-muted-foreground">Track and manage student applications</p>
        </div>
        <Button onClick={() => setNewOpen(true)} className="cursor-pointer">
          <Plus className="h-4 w-4 mr-1.5" /> New Application
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: "Total", value: stats?.total ?? "—", color: "text-blue-600" },
          { label: "Submitted", value: stats?.submitted ?? "—", color: "text-blue-500" },
          { label: "Under Review", value: stats?.underReview ?? "—", color: "text-amber-600" },
          { label: "Accepted", value: stats?.accepted ?? "—", color: "text-green-600" },
          { label: "Enrolled", value: stats?.enrolled ?? "—", color: "text-emerald-600" },
          { label: "Rejected", value: stats?.rejected ?? "—", color: "text-red-500" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-3">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by name, ID..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.entries(statusConfig).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredAdmissions.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><ClipboardList /></EmptyMedia>
            <EmptyTitle>No applications found</EmptyTitle>
            <EmptyDescription>{search || statusFilter !== "all" ? "Try adjusting filters." : "Start by adding a new application."}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="sm" onClick={() => setNewOpen(true)} className="cursor-pointer"><Plus className="h-3.5 w-3.5 mr-1.5" /> New Application</Button>
          </EmptyContent>
        </Empty>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase text-muted-foreground">Applicant</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase text-muted-foreground">App ID</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase text-muted-foreground hidden md:table-cell">Grade</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase text-muted-foreground hidden lg:table-cell">Guardian</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase text-muted-foreground">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-xs uppercase text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredAdmissions.map((app) => {
                  const cfg = statusConfig[app.status];
                  return (
                    <tr key={app.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium">{app.firstName} {app.lastName}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(app.createdAt), "MMM d, yyyy")}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{app.applicationId}</td>
                      <td className="px-4 py-3 hidden md:table-cell"><Badge variant="secondary" className="text-xs">{app.applyingForGrade}</Badge></td>
                      <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground">{app.guardianName}</td>
                      <td className="px-4 py-3">
                        <Badge className={`${cfg.color} border text-xs`}>{cfg.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 cursor-pointer" onClick={() => setViewAdmission(app)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <NewAdmissionDialog open={newOpen} onClose={() => setNewOpen(false)} />
      <AdmissionDetailDialog admission={viewAdmission} onClose={() => setViewAdmission(null)} />
    </div>
  );
}

type PageProps = {
  admissions: Admission[];
  stats: Stats;
};

export default function AdmissionsPage(props: PageProps) {
  return (
    <DashboardLayout>
      <AdmissionsContent {...props} />
    </DashboardLayout>
  );
}
