import { useState, useEffect } from "react";
import { Link, router } from "@inertiajs/react";
import { DashboardLayout } from "../_components/layout.tsx";
import { useCurrentSchool } from "../_components/use-current-school.ts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog.tsx";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select.tsx";
import { toast } from "sonner";
import { routerDeleteWithConfirm } from "@/lib/confirm.ts";
import { cn } from "@/lib/utils.ts";
import { roomLabel, type RoomOption } from "@/lib/rooms.ts";
import {
  Building2, Home, Plus, Trash2, Pencil, DoorOpen, Search,
} from "lucide-react";

const AMENITIES_OPTIONS = ["WiFi", "AC", "Bathroom", "Laundry", "Study Room", "TV", "Gym Access"];

export type ClassRoom = RoomOption & {
  classes?: AssignedClass[];
};

type AssignedClass = {
  id: number;
  uuid: string;
  name: string;
  gradeLevel: string;
  section?: string | null;
  classRoomId?: number | null;
};

type SchoolClassOption = {
  id: number;
  uuid: string;
  name: string;
  gradeLevel: string;
  section?: string | null;
  classRoomId?: number | null;
};

type HostelRoom = {
  id: number;
  schoolId: number;
  roomNumber: string;
  dormBlock?: string | null;
  floor?: number | null;
  capacity: number;
  occupiedCount: number;
  type: "single" | "double" | "triple" | "dormitory";
  gender: "male" | "female" | "mixed";
  amenities?: string[] | null;
  status: string;
  monthlyFee?: number | null;
};

type Branch = { id: number; name: string; code?: string | null };

type ClassRoomForm = {
  name: string;
  building: string;
  floor: string;
  capacity: string;
  status: string;
  notes: string;
  schoolBranchId: string;
};

const EMPTY_CLASSROOM: ClassRoomForm = {
  name: "", building: "", floor: "", capacity: "", status: "available", notes: "", schoolBranchId: "",
};

type HostelForm = {
  roomNumber: string;
  dormBlock: string;
  floor: string;
  capacity: string;
  type: "single" | "double" | "triple" | "dormitory";
  gender: "male" | "female" | "mixed";
  amenities: string[];
  monthlyFee: string;
  status: string;
};

const EMPTY_HOSTEL: HostelForm = {
  roomNumber: "", dormBlock: "", floor: "", capacity: "2",
  type: "double", gender: "mixed", amenities: [], monthlyFee: "", status: "available",
};

type PageProps = {
  classRooms: ClassRoom[];
  hostelRooms: HostelRoom[];
  branches: Branch[];
  schoolClasses: SchoolClassOption[];
};

function ClassRoomAssignment({
  room,
  schoolClasses,
}: {
  room: ClassRoom;
  schoolClasses: SchoolClassOption[];
}) {
  const assigned = room.classes?.[0];
  const [classId, setClassId] = useState(assigned ? String(assigned.id) : "none");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setClassId(assigned ? String(assigned.id) : "none");
  }, [assigned?.id, room.id]);

  const assignClass = () => {
    setSaving(true);
    router.put(
      `/dashboard/rooms/classrooms/${room.id}/assign-class`,
      { classId: classId === "none" ? null : parseInt(classId, 10) },
      {
        preserveScroll: true,
        onSuccess: () => toast.success("Class assignment updated"),
        onError: () => toast.error("Failed to assign class"),
        onFinish: () => setSaving(false),
      },
    );
  };

  return (
    <div className="space-y-2 mb-3 pt-2 border-t">
      <Label className="text-xs">Assign to class</Label>
      <Select value={classId} onValueChange={setClassId}>
        <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select class" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No class assigned</SelectItem>
          {schoolClasses.map((c) => (
            <SelectItem key={c.id} value={String(c.id)}>
              {c.name} ({c.gradeLevel}{c.section ? ` ${c.section}` : ""})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {assigned && (
        <p className="text-xs text-muted-foreground">
          Currently:{" "}
          <Link href={`/dashboard/classes/${assigned.uuid}`} className="text-primary hover:underline">
            {assigned.name}
          </Link>
        </p>
      )}
      <Button size="sm" variant="secondary" className="w-full cursor-pointer h-8" onClick={assignClass} disabled={saving}>
        {saving ? "Saving..." : "Save assignment"}
      </Button>
    </div>
  );
}

function RoomsContent({ classRooms, hostelRooms, branches, schoolClasses }: PageProps) {
  const { schoolId } = useCurrentSchool();
  const [tab, setTab] = useState("classrooms");
  const [classSearch, setClassSearch] = useState("");
  const [hostelSearch, setHostelSearch] = useState("");

  const [classOpen, setClassOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null);
  const [classForm, setClassForm] = useState<ClassRoomForm>(EMPTY_CLASSROOM);

  const [hostelOpen, setHostelOpen] = useState(false);
  const [editingHostel, setEditingHostel] = useState<HostelRoom | null>(null);
  const [hostelForm, setHostelForm] = useState<HostelForm>(EMPTY_HOSTEL);

  const openAddClassroom = () => {
    setEditingClass(null);
    setClassForm(EMPTY_CLASSROOM);
    setClassOpen(true);
  };

  const openEditClassroom = (room: ClassRoom) => {
    setEditingClass(room);
    setClassForm({
      name: room.name,
      building: room.building ?? "",
      floor: room.floor?.toString() ?? "",
      capacity: room.capacity?.toString() ?? "",
      status: room.status,
      notes: room.notes ?? "",
      schoolBranchId: room.schoolBranchId ? String(room.schoolBranchId) : "",
    });
    setClassOpen(true);
  };

  const saveClassroom = () => {
    if (!classForm.name) { toast.error("Room name is required"); return; }
    const payload = {
      name: classForm.name,
      building: classForm.building || undefined,
      floor: classForm.floor ? parseInt(classForm.floor, 10) : undefined,
      capacity: classForm.capacity ? parseInt(classForm.capacity, 10) : undefined,
      status: classForm.status,
      notes: classForm.notes || undefined,
      schoolBranchId: classForm.schoolBranchId ? parseInt(classForm.schoolBranchId, 10) : undefined,
    };
    const options = {
      preserveScroll: true,
      onSuccess: () => {
        toast.success(editingClass ? "Classroom updated" : "Classroom created");
        setClassOpen(false);
      },
      onError: () => toast.error("Failed to save classroom"),
    };
    if (editingClass) {
      router.put(`/dashboard/rooms/classrooms/${editingClass.id}`, payload, options);
    } else {
      router.post("/dashboard/rooms/classrooms", payload, options);
    }
  };

  const openAddHostel = () => {
    setEditingHostel(null);
    setHostelForm(EMPTY_HOSTEL);
    setHostelOpen(true);
  };

  const openEditHostel = (room: HostelRoom) => {
    setEditingHostel(room);
    setHostelForm({
      roomNumber: room.roomNumber,
      dormBlock: room.dormBlock ?? "",
      floor: room.floor?.toString() ?? "",
      capacity: String(room.capacity),
      type: room.type,
      gender: room.gender,
      amenities: room.amenities ?? [],
      monthlyFee: room.monthlyFee?.toString() ?? "",
      status: room.status,
    });
    setHostelOpen(true);
  };

  const saveHostel = () => {
    if (!hostelForm.roomNumber) { toast.error("Room number is required"); return; }
    const payload = {
      roomNumber: hostelForm.roomNumber,
      dormBlock: hostelForm.dormBlock || undefined,
      floor: hostelForm.floor ? parseInt(hostelForm.floor, 10) : undefined,
      capacity: parseInt(hostelForm.capacity, 10) || 2,
      type: hostelForm.type,
      gender: hostelForm.gender,
      amenities: hostelForm.amenities.length > 0 ? hostelForm.amenities : undefined,
      monthlyFee: hostelForm.monthlyFee ? parseFloat(hostelForm.monthlyFee) : undefined,
      status: hostelForm.status,
    };
    const options = {
      preserveScroll: true,
      onSuccess: () => {
        toast.success(editingHostel ? "Hostel room updated" : "Hostel room created");
        setHostelOpen(false);
      },
      onError: () => toast.error("Failed to save hostel room"),
    };
    if (editingHostel) {
      router.put(`/dashboard/dormitory/rooms/${editingHostel.id}`, payload, options);
    } else {
      router.post("/dashboard/dormitory/rooms", payload, options);
    }
  };

  const filteredClassrooms = classRooms.filter((r) => {
    if (!classSearch) return true;
    const term = classSearch.toLowerCase();
    return roomLabel(r).toLowerCase().includes(term);
  });

  const filteredHostel = hostelRooms.filter((r) => {
    if (!hostelSearch) return true;
    const term = hostelSearch.toLowerCase();
    const label = `${r.dormBlock ?? ""} ${r.roomNumber}`.toLowerCase();
    return label.includes(term);
  });

  const statusColors: Record<string, string> = {
    available: "bg-emerald-100 text-emerald-700",
    full: "bg-red-100 text-red-700",
    maintenance: "bg-amber-100 text-amber-700",
    occupied: "bg-blue-100 text-blue-700",
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2">
            <DoorOpen className="h-6 w-6 text-primary" /> Room Management
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Pre-register classrooms and hostel rooms, then assign them to classes or dormitory allocations.
          </p>
        </div>
        <Link href="/dashboard/dormitory" className="text-sm text-primary hover:underline">
          Go to Dormitory allocations →
        </Link>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="classrooms" className="cursor-pointer">
            <Building2 className="h-4 w-4 mr-1.5" /> Classrooms ({classRooms.length})
          </TabsTrigger>
          <TabsTrigger value="hostel" className="cursor-pointer">
            <Home className="h-4 w-4 mr-1.5" /> Hostel Rooms ({hostelRooms.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="classrooms" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search classrooms..."
                value={classSearch}
                onChange={(e) => setClassSearch(e.target.value)}
              />
            </div>
            <Button onClick={openAddClassroom} className="cursor-pointer">
              <Plus className="h-4 w-4 mr-1.5" /> Add Classroom
            </Button>
          </div>

          {filteredClassrooms.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No classrooms yet. Add rooms before assigning them to classes.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredClassrooms.map((room) => (
                <Card key={room.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-bold">{roomLabel(room)}</p>
                        <p className="text-xs text-muted-foreground">
                          {room.floor != null ? `Floor ${room.floor}` : "—"}
                          {room.capacity ? ` · Capacity ${room.capacity}` : ""}
                        </p>
                      </div>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize", statusColors[room.status] ?? "bg-muted")}>
                        {room.status}
                      </span>
                    </div>
                    {(room.classesCount ?? 0) > 0 && (
                      <p className="text-xs text-muted-foreground mb-3">
                        Assigned to {room.classesCount} class{(room.classesCount ?? 0) === 1 ? "" : "es"}
                      </p>
                    )}
                    {room.notes && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{room.notes}</p>}
                    <ClassRoomAssignment room={room} schoolClasses={schoolClasses} />
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm" className="cursor-pointer flex-1" onClick={() => openEditClassroom(room)}>
                        <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="cursor-pointer text-destructive h-8 w-8"
                        onClick={() => void routerDeleteWithConfirm(`/dashboard/rooms/classrooms/${room.id}`, {
                          title: "Delete this classroom?",
                          text: "Only rooms not assigned to a class can be deleted.",
                          onSuccess: () => toast.success("Classroom deleted"),
                          onError: () => toast.error("Failed to delete classroom"),
                        })}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="hostel" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search hostel rooms..."
                value={hostelSearch}
                onChange={(e) => setHostelSearch(e.target.value)}
              />
            </div>
            <Button onClick={openAddHostel} className="cursor-pointer">
              <Plus className="h-4 w-4 mr-1.5" /> Add Hostel Room
            </Button>
          </div>

          {filteredHostel.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                <Home className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No hostel rooms yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredHostel.map((room) => (
                <Card key={room.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-bold">
                          {room.dormBlock ? `${room.dormBlock} — ` : ""}Room {room.roomNumber}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {room.type} · {room.gender} · Floor {room.floor ?? "—"}
                        </p>
                      </div>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize", statusColors[room.status] ?? "bg-muted")}>
                        {room.status}
                      </span>
                    </div>
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Occupancy</span>
                        <span>{room.occupiedCount}/{room.capacity}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full", room.occupiedCount >= room.capacity ? "bg-red-500" : "bg-emerald-500")}
                          style={{ width: `${Math.min(100, (room.occupiedCount / room.capacity) * 100)}%` }}
                        />
                      </div>
                    </div>
                    {room.monthlyFee != null && (
                      <p className="text-sm font-semibold text-primary mb-2">${room.monthlyFee}/month</p>
                    )}
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm" className="cursor-pointer flex-1" onClick={() => openEditHostel(room)}>
                        <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="cursor-pointer text-destructive h-8 w-8"
                        onClick={() => void routerDeleteWithConfirm(`/dashboard/dormitory/rooms/${room.id}`, {
                          title: "Delete this hostel room?",
                          onSuccess: () => toast.success("Hostel room deleted"),
                          onError: () => toast.error("Failed to delete"),
                        })}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Classroom dialog */}
      <Dialog open={classOpen} onOpenChange={setClassOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingClass ? "Edit Classroom" : "Add Classroom"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Room Name *</Label>
                <Input value={classForm.name} onChange={(e) => setClassForm({ ...classForm, name: e.target.value })} placeholder="Room 101" />
              </div>
              <div className="space-y-1.5">
                <Label>Building / Block</Label>
                <Input value={classForm.building} onChange={(e) => setClassForm({ ...classForm, building: e.target.value })} placeholder="Block A" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Floor</Label>
                <Input type="number" value={classForm.floor} onChange={(e) => setClassForm({ ...classForm, floor: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Capacity</Label>
                <Input type="number" value={classForm.capacity} onChange={(e) => setClassForm({ ...classForm, capacity: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={classForm.status} onValueChange={(v) => setClassForm({ ...classForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {branches.length > 0 && (
                <div className="space-y-1.5">
                  <Label>Branch</Label>
                  <Select value={classForm.schoolBranchId || "none"} onValueChange={(v) => setClassForm({ ...classForm, schoolBranchId: v === "none" ? "" : v })}>
                    <SelectTrigger><SelectValue placeholder="All branches" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">All branches</SelectItem>
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input value={classForm.notes} onChange={(e) => setClassForm({ ...classForm, notes: e.target.value })} placeholder="Optional notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setClassOpen(false)} className="cursor-pointer">Cancel</Button>
            <Button onClick={saveClassroom} disabled={!classForm.name} className="cursor-pointer">
              {editingClass ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hostel dialog */}
      <Dialog open={hostelOpen} onOpenChange={setHostelOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingHostel ? "Edit Hostel Room" : "Add Hostel Room"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1.5">
                <Label>Room # *</Label>
                <Input value={hostelForm.roomNumber} onChange={(e) => setHostelForm({ ...hostelForm, roomNumber: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Block</Label>
                <Input value={hostelForm.dormBlock} onChange={(e) => setHostelForm({ ...hostelForm, dormBlock: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Floor</Label>
                <Input type="number" value={hostelForm.floor} onChange={(e) => setHostelForm({ ...hostelForm, floor: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={hostelForm.type} onValueChange={(v) => setHostelForm({ ...hostelForm, type: v as HostelForm["type"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="double">Double</SelectItem>
                    <SelectItem value="triple">Triple</SelectItem>
                    <SelectItem value="dormitory">Dormitory</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Gender</Label>
                <Select value={hostelForm.gender} onValueChange={(v) => setHostelForm({ ...hostelForm, gender: v as HostelForm["gender"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Capacity</Label>
                <Input type="number" value={hostelForm.capacity} onChange={(e) => setHostelForm({ ...hostelForm, capacity: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Monthly Fee ($)</Label>
                <Input type="number" value={hostelForm.monthlyFee} onChange={(e) => setHostelForm({ ...hostelForm, monthlyFee: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={hostelForm.status} onValueChange={(v) => setHostelForm({ ...hostelForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="full">Full</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Amenities</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {AMENITIES_OPTIONS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => {
                      const updated = hostelForm.amenities.includes(a)
                        ? hostelForm.amenities.filter((x) => x !== a)
                        : [...hostelForm.amenities, a];
                      setHostelForm({ ...hostelForm, amenities: updated });
                    }}
                    className={cn(
                      "text-xs px-2 py-1 rounded-full border cursor-pointer transition-colors",
                      hostelForm.amenities.includes(a) ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-muted",
                    )}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setHostelOpen(false)} className="cursor-pointer">Cancel</Button>
            <Button onClick={saveHostel} disabled={!hostelForm.roomNumber} className="cursor-pointer">
              {editingHostel ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function RoomsPage(props: PageProps) {
  return (
    <DashboardLayout>
      <RoomsContent {...props} />
    </DashboardLayout>
  );
}
