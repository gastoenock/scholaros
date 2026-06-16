import { router, usePage } from "@inertiajs/react";
import { DashboardLayout } from "../_components/layout.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { CheckCircle, XCircle, Clock, Building2, User, Mail, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import type { SharedPageProps } from "@/lib/types.ts";

export type SchoolApplication = {
  id: number;
  schoolName: string;
  adminName: string;
  adminEmail: string;
  adminPhone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  role?: string | null;
  isActive?: boolean;
  createdAt: string;
};

type PageProps = {
  applications: SchoolApplication[];
  users: AdminUser[];
};

function ApplicationCard({ app }: { app: SchoolApplication }) {
  const handleApprove = () => {
    router.post(`/dashboard/admin/applications/${app.id}/approve`, {}, {
      preserveScroll: true,
      onSuccess: () => toast.success(`${app.schoolName} has been approved!`),
      onError: () => toast.error("Failed to approve application"),
    });
  };

  const handleReject = () => {
    router.post(`/dashboard/admin/applications/${app.id}/reject`, {}, {
      preserveScroll: true,
      onSuccess: () => toast.success("Application rejected."),
      onError: () => toast.error("Failed to reject application"),
    });
  };

  const statusConfig = {
    pending: { label: "Pending Review", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
    approved: { label: "Approved", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle },
    rejected: { label: "Rejected", color: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
  };
  const { label, color, icon: StatusIcon } = statusConfig[app.status];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{app.schoolName}</h3>
              <p className="text-xs text-muted-foreground">Applied {format(new Date(app.createdAt), "MMM d, yyyy")}</p>
            </div>
          </div>
          <Badge className={`${color} border text-xs flex items-center gap-1`}>
            <StatusIcon className="h-3 w-3" />{label}
          </Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground"><User className="h-3.5 w-3.5" /><span>{app.adminName}</span></div>
          <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-3.5 w-3.5" /><span>{app.adminEmail}</span></div>
          {app.adminPhone && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3.5 w-3.5" /><span>{app.adminPhone}</span></div>}
          {(app.city || app.state) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /><span>{[app.address, app.city, app.state, app.zip].filter(Boolean).join(", ")}</span>
            </div>
          )}
        </div>
        {app.status === "pending" && (
          <div className="flex gap-2 mt-4 pt-4 border-t">
            <Button size="sm" onClick={handleApprove} className="cursor-pointer">
              <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Approve & Create School
            </Button>
            <Button size="sm" variant="secondary" onClick={handleReject} className="cursor-pointer text-destructive hover:text-destructive">
              <XCircle className="h-3.5 w-3.5 mr-1.5" /> Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function UserRoleRow({ user }: { user: AdminUser }) {
  const handleRoleChange = (role: string) => {
    router.put(`/dashboard/admin/users/${user.id}/role`, { role }, {
      preserveScroll: true,
      onSuccess: () => toast.success("User role updated"),
      onError: () => toast.error("Failed to update role"),
    });
  };

  return (
    <div className="flex items-center justify-between gap-4 p-3 border rounded-lg">
      <div className="min-w-0">
        <p className="font-medium truncate">{user.name}</p>
        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
      </div>
      <Select value={user.role ?? "parent"} onValueChange={handleRoleChange}>
        <SelectTrigger className="w-36 cursor-pointer"><SelectValue /></SelectTrigger>
        <SelectContent>
          {["superadmin", "landlord"].map((r) => (
            <SelectItem key={r} value={r} className="cursor-pointer capitalize">{r}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function AdminContent({ applications, users }: PageProps) {
  const { platform } = usePage<SharedPageProps>().props;

  if (!platform?.isPlatformAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <XCircle className="h-7 w-7 text-destructive mx-auto" />
          <h2 className="text-xl font-bold">Access Denied</h2>
          <p className="text-muted-foreground">You need platform administrator privileges to access this page.</p>
        </div>
      </div>
    );
  }

  const pending = applications.filter((a) => a.status === "pending");
  const others = applications.filter((a) => a.status !== "pending");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold">Admin Panel</h1>
        <p className="text-muted-foreground">Review applications and manage user roles</p>
      </div>

      <div>
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-600" /> Pending Applications
          {pending.length > 0 && <Badge className="bg-amber-100 text-amber-700 border-amber-200 border">{pending.length}</Badge>}
        </h2>
        {pending.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground text-sm">No pending applications.</CardContent></Card>
        ) : (
          <div className="grid gap-4">{pending.map((app) => <ApplicationCard key={app.id} app={app} />)}</div>
        )}
      </div>

      {others.length > 0 && (
        <div>
          <h2 className="text-base font-semibold mb-4">Past Applications</h2>
          <div className="grid gap-4">{others.map((app) => <ApplicationCard key={app.id} app={app} />)}</div>
        </div>
      )}

      <div>
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
          <User className="h-4 w-4" /> Platform Users
        </h2>
        <div className="space-y-2">
          {users.map((user) => <UserRoleRow key={user.id} user={user} />)}
        </div>
      </div>
    </div>
  );
}

export default function AdminPage(props: PageProps) {
  return (
    <DashboardLayout>
      <AdminContent {...props} />
    </DashboardLayout>
  );
}
