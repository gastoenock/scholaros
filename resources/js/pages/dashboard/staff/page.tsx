import { useMemo, useState } from "react";
import { router } from "@inertiajs/react";
import { DashboardLayout } from "../_components/layout.tsx";
import { useCurrentSchool } from "../_components/use-current-school.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs.tsx";
import { Users, Plus, Search, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { routerDeleteWithConfirm } from "@/lib/confirm.ts";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty.tsx";

const DEPARTMENTS = ["Mathematics", "English", "Science", "Social Studies", "Arts", "Music", "Physical Education", "Technology", "Foreign Languages", "Administration"];
const DESIGNATIONS = ["Teacher", "Senior Teacher", "Department Head", "Vice Principal", "Principal", "Admin Officer", "Counselor", "Librarian", "Coach", "Support Staff"];

type EmergencyContact = {
  name: string;
  phone: string;
  relationship: string;
};

type StaffRole = "teacher" | "admin_staff" | "support_staff" | "principal" | "vice_principal";

export type StaffMember = {
  id: number;
  schoolId: number;
  schoolBranchId?: number | null;
  userId?: number | null;
  firstName: string;
  lastName: string;
  dateOfBirth?: string | null;
  nationality?: string | null;
  photo?: string | null;
  gender?: "male" | "female" | "other" | null;
  staffId: string;
  department?: string | null;
  designation?: string | null;
  qualification?: string | null;
  role: StaffRole;
  joinDate?: string | null;
  subjects?: string[] | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  emergencyContact?: EmergencyContact | null;
  salary?: number | null;
  status: string;
  createdAt: string;
};

type Stats = {
  total: number;
  teachers: number;
  active: number;
};

const staffSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  role: z.enum(["teacher", "admin_staff", "support_staff", "principal", "vice_principal"]),
  department: z.string().optional(),
  designation: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  qualification: z.string().optional(),
  joinDate: z.string().optional(),
  salary: z.string().optional(),
  subjects: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  dateOfBirth: z.string().optional(),
  nationality: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelationship: z.string().optional(),
});
type StaffFormData = z.infer<typeof staffSchema>;

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700 border-green-200",
  inactive: "bg-gray-100 text-gray-600 border-gray-200",
  on_leave: "bg-amber-100 text-amber-700 border-amber-200",
};

const roleColors: Record<string, string> = {
  teacher: "bg-blue-100 text-blue-700 border-blue-200",
  admin_staff: "bg-purple-100 text-purple-700 border-purple-200",
  support_staff: "bg-gray-100 text-gray-600 border-gray-200",
  principal: "bg-gold-100 text-amber-700 border-amber-200",
  vice_principal: "bg-amber-100 text-amber-600 border-amber-200",
};

function StaffFormDialog({
  open,
  onClose,
  editStaff,
}: {
  open: boolean;
  onClose: () => void;
  editStaff?: StaffMember | null;
}) {
  const isEdit = !!editStaff;

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting }, reset } =
    useForm<StaffFormData>({
      resolver: zodResolver(staffSchema),
      defaultValues: editStaff ? {
        firstName: editStaff.firstName,
        lastName: editStaff.lastName,
        role: editStaff.role,
        department: editStaff.department ?? undefined,
        designation: editStaff.designation ?? undefined,
        email: editStaff.email ?? undefined,
        phone: editStaff.phone ?? undefined,
        address: editStaff.address ?? undefined,
        qualification: editStaff.qualification ?? undefined,
        joinDate: editStaff.joinDate ?? undefined,
        salary: editStaff.salary?.toString(),
        subjects: editStaff.subjects?.join(", "),
        gender: editStaff.gender ?? undefined,
        dateOfBirth: editStaff.dateOfBirth ?? undefined,
        nationality: editStaff.nationality ?? undefined,
        emergencyContactName: editStaff.emergencyContact?.name,
        emergencyContactPhone: editStaff.emergencyContact?.phone,
        emergencyContactRelationship: editStaff.emergencyContact?.relationship,
      } : { role: "teacher" },
    });

  const onSubmit = (data: StaffFormData) =>
    new Promise<void>((resolve) => {
      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        department: data.department,
        designation: data.designation,
        email: data.email || undefined,
        phone: data.phone,
        address: data.address,
        qualification: data.qualification,
        joinDate: data.joinDate,
        salary: data.salary ? parseFloat(data.salary) : undefined,
        subjects: data.subjects ? data.subjects.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
        nationality: data.nationality,
        emergencyContact: data.emergencyContactName ? {
          name: data.emergencyContactName,
          phone: data.emergencyContactPhone ?? "",
          relationship: data.emergencyContactRelationship ?? "",
        } : undefined,
      };
      const options = {
        preserveScroll: true,
        onSuccess: () => {
          toast.success(isEdit ? "Staff member updated!" : "Staff member added!");
          reset();
          onClose();
        },
        onError: () => {
          toast.error("Failed to save staff member");
        },
        onFinish: () => resolve(),
      };
      if (isEdit) {
        router.put(`/dashboard/staff/${editStaff.id}`, payload, options);
      } else {
        router.post("/dashboard/staff", payload, options);
      }
    });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Staff Member" : "Add Staff Member"}</DialogTitle>
          <DialogDescription>Fill in the staff details below.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Tabs defaultValue="personal">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="personal" className="flex-1">Personal</TabsTrigger>
              <TabsTrigger value="employment" className="flex-1">Employment</TabsTrigger>
              <TabsTrigger value="emergency" className="flex-1">Emergency</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1.5 block">First Name *</Label>
                  <Input placeholder="Jane" {...register("firstName")} />
                  {errors.firstName && <p className="text-destructive text-xs mt-1">{errors.firstName.message}</p>}
                </div>
                <div>
                  <Label className="mb-1.5 block">Last Name *</Label>
                  <Input placeholder="Doe" {...register("lastName")} />
                  {errors.lastName && <p className="text-destructive text-xs mt-1">{errors.lastName.message}</p>}
                </div>
                <div>
                  <Label className="mb-1.5 block">Gender</Label>
                  <Select onValueChange={(v) => setValue("gender", v as "male" | "female" | "other")}>
                    <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-1.5 block">Date of Birth</Label>
                  <Input type="date" {...register("dateOfBirth")} />
                </div>
                <div>
                  <Label className="mb-1.5 block">Email</Label>
                  <Input placeholder="jane.doe@school.edu" {...register("email")} />
                </div>
                <div>
                  <Label className="mb-1.5 block">Phone</Label>
                  <Input placeholder="(215) 555-0100" {...register("phone")} />
                </div>
                <div className="col-span-2">
                  <Label className="mb-1.5 block">Address</Label>
                  <Input placeholder="123 Main St, Philadelphia, PA" {...register("address")} />
                </div>
                <div>
                  <Label className="mb-1.5 block">Nationality</Label>
                  <Input placeholder="American" {...register("nationality")} />
                </div>
                <div>
                  <Label className="mb-1.5 block">Qualification</Label>
                  <Input placeholder="M.Ed., B.Sc., etc." {...register("qualification")} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="employment" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1.5 block">Role *</Label>
                  <Select defaultValue={editStaff?.role ?? "teacher"} onValueChange={(v) => setValue("role", v as StaffFormData["role"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="admin_staff">Admin Staff</SelectItem>
                      <SelectItem value="support_staff">Support Staff</SelectItem>
                      <SelectItem value="principal">Principal</SelectItem>
                      <SelectItem value="vice_principal">Vice Principal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-1.5 block">Department</Label>
                  <Select onValueChange={(v) => setValue("department", v)}>
                    <SelectTrigger><SelectValue placeholder="Select dept." /></SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-1.5 block">Designation</Label>
                  <Select onValueChange={(v) => setValue("designation", v)}>
                    <SelectTrigger><SelectValue placeholder="Select designation" /></SelectTrigger>
                    <SelectContent>
                      {DESIGNATIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-1.5 block">Join Date</Label>
                  <Input type="date" {...register("joinDate")} />
                </div>
                <div>
                  <Label className="mb-1.5 block">Annual Salary ($)</Label>
                  <Input type="number" placeholder="55000" {...register("salary")} />
                </div>
                <div className="col-span-2">
                  <Label className="mb-1.5 block">Subjects (comma separated)</Label>
                  <Input placeholder="Algebra, Geometry, Calculus" {...register("subjects")} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="emergency" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1.5 block">Contact Name</Label>
                  <Input placeholder="John Doe" {...register("emergencyContactName")} />
                </div>
                <div>
                  <Label className="mb-1.5 block">Relationship</Label>
                  <Input placeholder="Spouse, Parent, Sibling" {...register("emergencyContactRelationship")} />
                </div>
                <div>
                  <Label className="mb-1.5 block">Phone</Label>
                  <Input placeholder="(215) 555-0199" {...register("emergencyContactPhone")} />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-3 mt-6 pt-4 border-t">
            <Button type="submit" disabled={isSubmitting} className="cursor-pointer flex-1">
              {isSubmitting ? "Saving..." : isEdit ? "Update Staff" : "Add Staff"}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose} className="cursor-pointer">Cancel</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function StaffContent({ staff, stats }: PageProps) {
  const { schoolId } = useCurrentSchool();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editStaff, setEditStaff] = useState<StaffMember | null>(null);

  const staffList = useMemo(() => {
    let result = staff;
    if (roleFilter !== "all") {
      result = result.filter((s) => s.role === roleFilter);
    }
    if (search) {
      const term = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.firstName.toLowerCase().includes(term) ||
          s.lastName.toLowerCase().includes(term) ||
          s.staffId.toLowerCase().includes(term) ||
          s.designation?.toLowerCase().includes(term),
      );
    }
    return result;
  }, [staff, roleFilter, search]);

  const handleDelete = async (id: number) => {
    await routerDeleteWithConfirm(`/dashboard/staff/${id}`, {
      title: "Remove this staff member?",
      onSuccess: () => toast.success("Staff member removed"),
      onError: () => toast.error("Failed to remove staff member"),
    });
  };

  if (!schoolId) return <div className="text-muted-foreground text-center py-20">No school linked.</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">Staff</h1>
          <p className="text-muted-foreground">Manage teachers and school staff</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="cursor-pointer">
          <Plus className="h-4 w-4 mr-1.5" /> Add Staff
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Staff", value: stats?.total ?? "—", color: "text-blue-600" },
          { label: "Teachers", value: stats?.teachers ?? "—", color: "text-emerald-600" },
          { label: "Active", value: stats?.active ?? "—", color: "text-green-600" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search staff..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="teacher">Teachers</SelectItem>
            <SelectItem value="admin_staff">Admin Staff</SelectItem>
            <SelectItem value="principal">Principals</SelectItem>
            <SelectItem value="support_staff">Support Staff</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {staffList.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><Users /></EmptyMedia>
            <EmptyTitle>No staff found</EmptyTitle>
            <EmptyDescription>{search ? "Try adjusting your search." : "Add your first staff member."}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="sm" onClick={() => setAddOpen(true)} className="cursor-pointer"><Plus className="h-3.5 w-3.5 mr-1.5" /> Add Staff</Button>
          </EmptyContent>
        </Empty>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase text-muted-foreground">ID</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase text-muted-foreground hidden md:table-cell">Role</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase text-muted-foreground hidden lg:table-cell">Department</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase text-muted-foreground">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-xs uppercase text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {staffList.map((member) => (
                  <tr key={member.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                          {member.firstName[0]}{member.lastName[0]}
                        </div>
                        <div>
                          <p className="font-medium">{member.firstName} {member.lastName}</p>
                          {member.designation && <p className="text-xs text-muted-foreground">{member.designation}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{member.staffId}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <Badge className={`${roleColors[member.role] ?? ""} border text-xs capitalize`}>
                        {member.role.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">{member.department ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge className={`${statusColors[member.status]} border text-xs capitalize`}>
                        {member.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 cursor-pointer" onClick={() => setEditStaff(member)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 cursor-pointer text-destructive hover:text-destructive" onClick={() => handleDelete(member.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <StaffFormDialog
        key={editStaff?.id ?? "new"}
        open={addOpen || !!editStaff}
        onClose={() => { setAddOpen(false); setEditStaff(null); }}
        editStaff={editStaff}
      />
    </div>
  );
}

type PageProps = {
  staff: StaffMember[];
  stats: Stats;
};

export default function StaffPage(props: PageProps) {
  return (
    <DashboardLayout>
      <StaffContent {...props} />
    </DashboardLayout>
  );
}
