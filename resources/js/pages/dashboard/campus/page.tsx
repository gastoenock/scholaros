import { useState } from "react";
import { router } from "@inertiajs/react";
import { DashboardLayout } from "../_components/layout.tsx";
import { useCurrentSchool } from "../_components/use-current-school.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog.tsx";
import { Building2, Plus, Pencil, Trash2, MapPin, Phone, User, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty.tsx";
import { routerDeleteWithConfirm } from "@/lib/confirm.ts";
import type { Branch, School } from "@/lib/types.ts";

const branchSchema = z.object({
  name: z.string().min(1, "Branch name required"),
  code: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  principalName: z.string().optional(),
});
type BranchFormData = z.infer<typeof branchSchema>;

function BranchDialog({
  open,
  onClose,
  onSave,
  editBranch,
  submitting,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: BranchFormData) => void;
  editBranch?: Branch | null;
  submitting: boolean;
}) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<BranchFormData>({
    resolver: zodResolver(branchSchema),
    defaultValues: editBranch ? {
      name: editBranch.name,
      code: editBranch.code ?? undefined,
      address: editBranch.address ?? undefined,
      phone: editBranch.phone ?? undefined,
      principalName: editBranch.principalName ?? undefined,
    } : {},
  });

  const onSubmit = (data: BranchFormData) => {
    onSave(data);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editBranch ? "Edit Branch" : "Add New Branch"}</DialogTitle>
          <DialogDescription>Campus/branch details</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div>
            <Label className="mb-1.5 block">Branch Name *</Label>
            <Input placeholder="Main Campus, North Branch..." {...register("name")} />
            {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <Label className="mb-1.5 block">Branch Code</Label>
            <Input placeholder="CAMPUS_A" {...register("code")} />
          </div>
          <div>
            <Label className="mb-1.5 block">Address</Label>
            <Input placeholder="123 Campus Drive" {...register("address")} />
          </div>
          <div>
            <Label className="mb-1.5 block">Phone</Label>
            <Input placeholder="+233 302 111 222" {...register("phone")} />
          </div>
          <div>
            <Label className="mb-1.5 block">Principal / Head Name</Label>
            <Input placeholder="Dr. Jane Smith" {...register("principalName")} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={submitting} className="cursor-pointer flex-1">
              {submitting ? "Saving..." : "Save Branch"}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose} className="cursor-pointer">Cancel</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SchoolSettingsCard({ school }: { school: School }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: school.name,
    email: school.email ?? "",
    phone: school.phone ?? "",
    address: school.address ?? "",
    city: school.city ?? "",
    state: school.state ?? "",
    zip: school.zip ?? "",
    website: school.website ?? "",
  });

  const handleSave = () => {
    setSaving(true);
    router.put("/dashboard/campus/school", {
      ...form,
      email: form.email || undefined,
      website: form.website || undefined,
    }, {
      preserveScroll: true,
      onSuccess: () => toast.success("School details updated!"),
      onError: () => toast.error("Failed to update school"),
      onFinish: () => setSaving(false),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <GraduationCap className="h-4 w-4" /> School Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="mb-1.5 block">School Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label className="mb-1.5 block">Email</Label>
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <Label className="mb-1.5 block">Phone</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <Label className="mb-1.5 block">Website</Label>
            <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
          </div>
          <div>
            <Label className="mb-1.5 block">Address</Label>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div>
            <Label className="mb-1.5 block">City</Label>
            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div>
            <Label className="mb-1.5 block">State</Label>
            <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          </div>
          <div>
            <Label className="mb-1.5 block">ZIP</Label>
            <Input value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} />
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="cursor-pointer">
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </CardContent>
    </Card>
  );
}

function BranchesCard({ branches }: { branches: Branch[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editBranch, setEditBranch] = useState<Branch | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSave = (data: BranchFormData) => {
    setSubmitting(true);
    const options = {
      preserveScroll: true,
      onSuccess: () => {
        toast.success(editBranch ? "Branch updated!" : "Branch added!");
        setDialogOpen(false);
        setEditBranch(null);
      },
      onError: () => toast.error("Failed to save branch"),
      onFinish: () => setSubmitting(false),
    };

    if (editBranch) {
      router.put(`/dashboard/campus/branches/${editBranch.id}`, data, options);
    } else {
      router.post("/dashboard/campus/branches", data, options);
    }
  };

  const handleDelete = async (branch: Branch) => {
    await routerDeleteWithConfirm(`/dashboard/campus/branches/${branch.id}`, {
      title: "Delete this branch?",
      text: `"${branch.name}" will be soft-deleted.`,
      onSuccess: () => toast.success("Branch removed"),
      onError: () => toast.error("Failed to remove branch"),
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="h-4 w-4" /> Branches / Campuses
        </CardTitle>
        <Button size="sm" onClick={() => { setEditBranch(null); setDialogOpen(true); }} className="cursor-pointer">
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Branch
        </Button>
      </CardHeader>
      <CardContent>
        {branches.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon"><Building2 /></EmptyMedia>
              <EmptyTitle>No branches yet</EmptyTitle>
              <EmptyDescription>Add your school's first campus or branch location.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button size="sm" onClick={() => setDialogOpen(true)} className="cursor-pointer">
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Branch
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {branches.map((branch) => (
              <div key={branch.id} className="p-4 rounded-lg border hover:border-primary/40 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <span className="font-semibold text-sm">{branch.name}</span>
                      {branch.code && <p className="text-xs text-muted-foreground font-mono">{branch.code}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 cursor-pointer" onClick={() => { setEditBranch(branch); setDialogOpen(true); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 cursor-pointer text-destructive" onClick={() => handleDelete(branch)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {branch.address && <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3" />{branch.address}</div>}
                  {branch.phone && <div className="flex items-center gap-1.5"><Phone className="h-3 w-3" />{branch.phone}</div>}
                  {branch.principalName && <div className="flex items-center gap-1.5"><User className="h-3 w-3" />{branch.principalName}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <BranchDialog
        key={editBranch?.id ?? "new"}
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditBranch(null); }}
        onSave={handleSave}
        editBranch={editBranch}
        submitting={submitting}
      />
    </Card>
  );
}

function CampusContent({ school }: PageProps) {
  const { schoolId } = useCurrentSchool();
  const branches = school?.branches ?? [];

  if (!schoolId || !school) {
    return <div className="text-muted-foreground text-center py-20">No school linked to your account.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Campus Management</h1>
        <p className="text-muted-foreground">Manage school details and branch locations</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <GraduationCap className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold">{school.name}</h2>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="capitalize">{school.plan} Plan</Badge>
            <Badge className={school.isActive ? "bg-green-100 text-green-700 border-green-200 border" : "bg-gray-100 text-gray-600 border"}>
              {school.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
      </div>
      <SchoolSettingsCard school={school} />
      <BranchesCard branches={branches} />
    </div>
  );
}

type PageProps = {
  school: School | null;
};

export default function CampusPage(props: PageProps) {
  return (
    <DashboardLayout>
      <CampusContent {...props} />
    </DashboardLayout>
  );
}
