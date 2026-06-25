import { useState } from "react";
import { Link } from "@inertiajs/react";
import { DashboardLayout } from "../_components/layout.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import {
  ArrowLeft, Pencil, Trash2, Phone, Mail, MapPin, Calendar, User,
  Briefcase, BookOpen, HeartPulse, Building2,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { routerDeleteWithConfirm } from "@/lib/confirm.ts";
import type { Branch } from "@/lib/types.ts";
import { StaffFormDialog, type StaffMember } from "./page.tsx";

import { roomLabel, type RoomOption } from "@/lib/rooms.ts";

type TaughtClass = {
  id: number;
  uuid: string;
  name: string;
  gradeLevel: string;
  section?: string | null;
  room?: string | null;
  assignedRoom?: RoomOption | null;
};

type PageProps = {
  staffMember: StaffMember & { branch?: Branch | null };
  taughtClasses: TaughtClass[];
};

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700 border-green-200",
  inactive: "bg-gray-100 text-gray-600 border-gray-200",
  on_leave: "bg-amber-100 text-amber-700 border-amber-200",
};

const roleColors: Record<string, string> = {
  teacher: "bg-blue-100 text-blue-700 border-blue-200",
  admin_staff: "bg-purple-100 text-purple-700 border-purple-200",
  support_staff: "bg-gray-100 text-gray-600 border-gray-200",
  principal: "bg-amber-100 text-amber-700 border-amber-200",
  vice_principal: "bg-amber-100 text-amber-600 border-amber-200",
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

function formatDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, "MMM d, yyyy");
}

function formatRole(role: string) {
  return role.replace(/_/g, " ");
}

function StaffShowContent({ staffMember, taughtClasses }: PageProps) {
  const [editOpen, setEditOpen] = useState(false);

  const handleDelete = async () => {
    await routerDeleteWithConfirm(`/dashboard/staff/${staffMember.uuid}`, {
      title: "Remove this staff member?",
      text: "The staff record will be soft-deleted.",
      onSuccess: () => toast.success("Staff member removed"),
      onError: () => toast.error("Failed to remove staff member"),
      preserveScroll: false,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="cursor-pointer">
            <Link href="/dashboard/staff"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
          </Button>
          <div>
            <h1 className="text-2xl font-extrabold">{staffMember.firstName} {staffMember.lastName}</h1>
            <p className="text-muted-foreground text-sm font-mono">{staffMember.staffId}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className={`${statusColors[staffMember.status] ?? ""} border capitalize`}>
            {staffMember.status.replace("_", " ")}
          </Badge>
          <Badge className={`${roleColors[staffMember.role] ?? ""} border capitalize`}>
            {formatRole(staffMember.role)}
          </Badge>
          <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => setEditOpen(true)}>
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
                {staffMember.firstName[0]}{staffMember.lastName[0]}
              </div>
              <div>
                <p className="font-semibold">{staffMember.firstName} {staffMember.lastName}</p>
                <p className="text-sm text-muted-foreground capitalize">{staffMember.gender ?? "—"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <DetailItem label="Date of Birth" value={formatDate(staffMember.dateOfBirth)} />
              <DetailItem label="Nationality" value={staffMember.nationality} />
              <DetailItem label="Qualification" value={staffMember.qualification} />
            </div>
            <div className="space-y-2 pt-2 border-t">
              {staffMember.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <a href={`mailto:${staffMember.email}`} className="hover:underline">{staffMember.email}</a>
                </div>
              )}
              {staffMember.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{staffMember.phone}</span>
                </div>
              )}
              {staffMember.address && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                  <span>{staffMember.address}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Briefcase className="h-4 w-4" /> Employment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <DetailItem label="Department" value={staffMember.department} />
              <DetailItem label="Designation" value={staffMember.designation} />
              <DetailItem label="Role" value={formatRole(staffMember.role)} />
              <DetailItem label="Join Date" value={formatDate(staffMember.joinDate)} />
              <DetailItem
                label="Annual Salary"
                value={staffMember.salary != null ? `$${staffMember.salary.toLocaleString()}` : undefined}
              />
              {staffMember.branch && (
                <DetailItem label="Campus/Branch" value={staffMember.branch.name} />
              )}
            </div>
            {staffMember.subjects && staffMember.subjects.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Subjects</p>
                <div className="flex flex-wrap gap-2">
                  {staffMember.subjects.map((subject) => (
                    <Badge key={subject} variant="secondary">{subject}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><HeartPulse className="h-4 w-4" /> Emergency Contact</CardTitle>
          </CardHeader>
          <CardContent>
            {staffMember.emergencyContact ? (
              <div className="grid grid-cols-2 gap-4">
                <DetailItem label="Name" value={staffMember.emergencyContact.name} />
                <DetailItem label="Relationship" value={staffMember.emergencyContact.relationship} />
                <DetailItem label="Phone" value={staffMember.emergencyContact.phone} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No emergency contact on file.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4" /> Class Teacher Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            {taughtClasses.length === 0 ? (
              <p className="text-sm text-muted-foreground">Not assigned as a class teacher.</p>
            ) : (
              <div className="space-y-2">
                {taughtClasses.map((cls) => (
                  <Link
                    key={cls.id}
                    href={`/dashboard/classes/${cls.uuid}`}
                    className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm hover:bg-muted/30 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{cls.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {cls.gradeLevel}{cls.section ? ` · Section ${cls.section}` : ""}
                      </p>
                    </div>
                    {(cls.assignedRoom || cls.room) && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5" />
                        {cls.assignedRoom ? roomLabel(cls.assignedRoom) : cls.room}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4" /> Record Info</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <DetailItem label="Staff ID" value={staffMember.staffId} />
          <DetailItem label="Status" value={staffMember.status.replace("_", " ")} />
          <DetailItem label="Added" value={formatDate(staffMember.createdAt)} />
        </CardContent>
      </Card>

      <StaffFormDialog
        key={staffMember.uuid}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        editStaff={staffMember}
      />
    </div>
  );
}

export default function StaffShowPage(props: PageProps) {
  return (
    <DashboardLayout>
      <StaffShowContent {...props} />
    </DashboardLayout>
  );
}
