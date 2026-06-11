import { useState } from "react";
import { router, usePage } from "@inertiajs/react";
import { DashboardLayout } from "../_components/layout.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Input } from "@/components/ui/input.tsx";
import {
  Building2, Search, CheckCircle, XCircle, Plus, Globe, Mail, Phone, MapPin,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog.tsx";
import { Label } from "@/components/ui/label.tsx";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { SharedPageProps } from "@/lib/types.ts";

export type SchoolRecord = {
  id: number;
  name: string;
  slug: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  website?: string | null;
  isActive: boolean;
  plan: string;
  createdAt: string;
};

const createSchoolSchema = z.object({
  name: z.string().min(2, "School name required"),
  slug: z.string().min(2, "Slug required").regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  website: z.string().optional(),
});
type CreateSchoolData = z.infer<typeof createSchoolSchema>;

function SchoolCard({ school }: { school: SchoolRecord }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{school.name}</h3>
              <p className="text-xs text-muted-foreground">/{school.slug}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={school.isActive ? "bg-green-100 text-green-700 border-green-200 border" : "bg-gray-100 text-gray-600 border-gray-200 border"}>
              {school.isActive ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
              {school.isActive ? "Active" : "Inactive"}
            </Badge>
            <Badge variant="secondary" className="capitalize">{school.plan}</Badge>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mt-3">
          {school.email && <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-3.5 w-3.5" /><span>{school.email}</span></div>}
          {school.phone && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3.5 w-3.5" /><span>{school.phone}</span></div>}
          {(school.city || school.state) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /><span>{[school.city, school.state].filter(Boolean).join(", ")}</span>
            </div>
          )}
          {school.website && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Globe className="h-3.5 w-3.5" />
              <a href={school.website} target="_blank" rel="noreferrer" className="hover:text-primary">{school.website}</a>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-3">Created {format(new Date(school.createdAt), "MMM d, yyyy")}</p>
      </CardContent>
    </Card>
  );
}

function CreateSchoolDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<CreateSchoolData>({
    resolver: zodResolver(createSchoolSchema),
    defaultValues: { city: "Philadelphia", state: "PA" },
  });

  const onSubmit = (data: CreateSchoolData) => {
    router.post("/dashboard/schools", { ...data, email: data.email || undefined }, {
      preserveScroll: true,
      onSuccess: () => { toast.success("School created successfully!"); reset(); onClose(); },
      onError: () => toast.error("Failed to create school"),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New School</DialogTitle>
          <DialogDescription>Add a new school to the ScholarOS platform.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label className="mb-1.5 block">School Name *</Label>
              <Input placeholder="Germantown Academy" {...register("name")} />
              {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div className="col-span-2">
              <Label className="mb-1.5 block">URL Slug *</Label>
              <Input placeholder="germantown-academy" {...register("slug")} />
              {errors.slug && <p className="text-destructive text-xs mt-1">{errors.slug.message}</p>}
            </div>
            <div>
              <Label className="mb-1.5 block">Email</Label>
              <Input type="email" placeholder="admin@school.edu" {...register("email")} />
            </div>
            <div>
              <Label className="mb-1.5 block">Phone</Label>
              <Input placeholder="(215) 555-0100" {...register("phone")} />
            </div>
            <div className="col-span-2">
              <Label className="mb-1.5 block">Address</Label>
              <Input placeholder="123 School Street" {...register("address")} />
            </div>
            <div>
              <Label className="mb-1.5 block">City</Label>
              <Input placeholder="Philadelphia" {...register("city")} />
            </div>
            <div>
              <Label className="mb-1.5 block">State</Label>
              <Input placeholder="PA" {...register("state")} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting} className="cursor-pointer flex-1">
              {isSubmitting ? "Creating..." : "Create School"}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose} className="cursor-pointer">Cancel</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SchoolsContent({ schools }: { schools: SchoolRecord[] }) {
  const { auth } = usePage<SharedPageProps>().props;
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  if (auth.user?.role !== "superadmin") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <XCircle className="h-10 w-10 text-destructive mx-auto" />
          <h2 className="text-xl font-bold">Access Denied</h2>
          <p className="text-muted-foreground">Only superadmins can manage schools.</p>
        </div>
      </div>
    );
  }

  const filtered = schools.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.slug.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">Schools</h1>
          <p className="text-muted-foreground">All registered schools on the platform</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="cursor-pointer">
          <Plus className="h-4 w-4 mr-1.5" /> Add School
        </Button>
      </div>
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search schools..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">{search ? "No schools match your search." : "No schools yet. Create one to get started."}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">{filtered.map((school) => <SchoolCard key={school.id} school={school} />)}</div>
      )}
      <CreateSchoolDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

export default function SchoolsPage({ schools }: { schools: SchoolRecord[] }) {
  return (
    <DashboardLayout>
      <SchoolsContent schools={schools} />
    </DashboardLayout>
  );
}
