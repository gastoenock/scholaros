import { useState } from "react";
import { router } from "@inertiajs/react";
import { DashboardLayout } from "../_components/layout.tsx";
import { useCurrentSchool } from "../_components/use-current-school.ts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog.tsx";
import { toast } from "sonner";
import { routerDeleteWithConfirm } from "@/lib/confirm.ts";
import { cn } from "@/lib/utils.ts";
import {
  Home, Users, Plus, Trash2, Wrench, Shield,
  CheckCircle, Clock, LogOut,
} from "lucide-react";

const CURRENT_YEAR = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
const AMENITIES_OPTIONS = ["WiFi", "AC", "Bathroom", "Laundry", "Study Room", "TV", "Gym Access"];

type DormRoom = {
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
  createdAt: string;
};

type DormAllocation = {
  id: number;
  schoolId: number;
  roomId: number;
  studentId: number;
  academicYear: string;
  checkInDate: string;
  checkOutDate?: string | null;
  bedNumber?: string | null;
  status: string;
  createdAt: string;
};

type MaintenanceRequest = {
  id: number;
  schoolId: number;
  location: string;
  locationType: "dorm" | "bus" | "campus";
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  reportedBy?: number | null;
  assignedTo?: string | null;
  status: "open" | "in_progress" | "resolved" | "closed";
  resolvedAt?: string | null;
  createdAt: string;
};

type SecurityLog = {
  id: number;
  schoolId: number;
  personName: string;
  personType: "visitor" | "student" | "staff" | "vendor";
  purpose?: string | null;
  checkInTime: string;
  checkOutTime?: string | null;
  hostName?: string | null;
  idType?: string | null;
  idNumber?: string | null;
  loggedBy?: number | null;
  createdAt: string;
};

type StudentLite = {
  id: number;
  firstName: string;
  lastName: string;
};

type PageProps = {
  rooms: DormRoom[];
  allocations: DormAllocation[];
  maintenance: MaintenanceRequest[];
  securityLogs: SecurityLog[];
  students: StudentLite[];
};

function DormitoryContent({ rooms, allocations, maintenance, securityLogs, students }: PageProps) {
  const { schoolId } = useCurrentSchool();
  const [tab, setTab] = useState("rooms");
  const [roomOpen, setRoomOpen] = useState(false);
  const [allocateOpen, setAllocateOpen] = useState(false);
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);

  const [roomForm, setRoomForm] = useState({
    roomNumber: "", dormBlock: "", floor: "",
    capacity: "2",
    type: "double" as "single" | "double" | "triple" | "dormitory",
    gender: "mixed" as "male" | "female" | "mixed",
    amenities: [] as string[],
    monthlyFee: "",
  });

  const [allocForm, setAllocForm] = useState({
    roomId: "",
    studentId: "",
    checkInDate: new Date().toISOString().slice(0, 10),
    bedNumber: "",
  });

  const [maintForm, setMaintForm] = useState({
    location: "", locationType: "dorm" as "dorm" | "bus" | "campus",
    title: "", description: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    assignedTo: "",
  });

  const [secForm, setSecForm] = useState({
    personName: "", personType: "visitor" as "visitor" | "student" | "staff" | "vendor",
    purpose: "", hostName: "", idType: "National ID", idNumber: "",
    checkInTime: new Date().toISOString().slice(0, 16),
  });

  const handleCreateRoom = () => {
    if (!schoolId || !roomForm.roomNumber) { toast.error("Please fill required fields"); return; }
    router.post("/dashboard/dormitory/rooms", {
      roomNumber: roomForm.roomNumber,
      dormBlock: roomForm.dormBlock || undefined,
      floor: roomForm.floor ? parseInt(roomForm.floor) : undefined,
      capacity: parseInt(roomForm.capacity) || 2,
      type: roomForm.type,
      gender: roomForm.gender,
      amenities: roomForm.amenities.length > 0 ? roomForm.amenities : undefined,
      monthlyFee: roomForm.monthlyFee ? parseFloat(roomForm.monthlyFee) : undefined,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success("Room created");
        setRoomOpen(false);
        setRoomForm({ roomNumber: "", dormBlock: "", floor: "", capacity: "2", type: "double", gender: "mixed", amenities: [], monthlyFee: "" });
      },
      onError: () => toast.error("Failed to create room"),
    });
  };

  const handleAllocate = () => {
    if (!schoolId || !allocForm.roomId || !allocForm.studentId) { toast.error("Please fill required fields"); return; }
    router.post("/dashboard/dormitory/allocations", {
      roomId: Number(allocForm.roomId),
      studentId: Number(allocForm.studentId),
      academicYear: CURRENT_YEAR,
      checkInDate: allocForm.checkInDate,
      bedNumber: allocForm.bedNumber || undefined,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success("Student allocated");
        setAllocateOpen(false);
        setAllocForm({ roomId: "", studentId: "", checkInDate: new Date().toISOString().slice(0, 10), bedNumber: "" });
      },
      onError: (errors) => {
        toast.error(Object.values(errors)[0] ?? "Failed to allocate");
      },
    });
  };

  const handleCreateMaintenance = () => {
    if (!schoolId || !maintForm.title || !maintForm.location) { toast.error("Please fill required fields"); return; }
    router.post("/dashboard/dormitory/maintenance", {
      location: maintForm.location,
      locationType: maintForm.locationType,
      title: maintForm.title,
      description: maintForm.description,
      priority: maintForm.priority,
      assignedTo: maintForm.assignedTo || undefined,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success("Maintenance request submitted");
        setMaintenanceOpen(false);
        setMaintForm({ location: "", locationType: "dorm", title: "", description: "", priority: "medium", assignedTo: "" });
      },
      onError: () => toast.error("Failed to submit request"),
    });
  };

  const handleCreateSecurityLog = () => {
    if (!schoolId || !secForm.personName) { toast.error("Please fill required fields"); return; }
    router.post("/dashboard/dormitory/security-logs", {
      personName: secForm.personName,
      personType: secForm.personType,
      purpose: secForm.purpose || undefined,
      checkInTime: secForm.checkInTime,
      hostName: secForm.hostName || undefined,
      idType: secForm.idType || undefined,
      idNumber: secForm.idNumber || undefined,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success("Entry logged");
        setSecurityOpen(false);
        setSecForm({ personName: "", personType: "visitor", purpose: "", hostName: "", idType: "National ID", idNumber: "", checkInTime: new Date().toISOString().slice(0, 16) });
      },
      onError: () => toast.error("Failed to log entry"),
    });
  };

  const roomStatusColors: Record<string, string> = {
    available: "bg-emerald-100 text-emerald-700",
    full: "bg-red-100 text-red-700",
    maintenance: "bg-amber-100 text-amber-700",
  };

  const priorityColors: Record<string, string> = {
    low: "bg-gray-100 text-gray-600",
    medium: "bg-blue-100 text-blue-700",
    high: "bg-amber-100 text-amber-700",
    urgent: "bg-red-100 text-red-700",
  };

  const maintStatusColors: Record<string, string> = {
    open: "bg-red-100 text-red-700",
    in_progress: "bg-blue-100 text-blue-700",
    resolved: "bg-emerald-100 text-emerald-700",
    closed: "bg-gray-100 text-gray-600",
  };

  const totalCapacity = rooms.reduce((s, r) => s + r.capacity, 0);
  const totalOccupied = rooms.reduce((s, r) => s + r.occupiedCount, 0);
  const availableRooms = rooms.filter((r) => r.status === "available").length;
  const openMaintenance = maintenance.filter((m) => m.status === "open").length;

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
          <h1 className="text-2xl font-bold">Dormitory Management</h1>
          <p className="text-muted-foreground text-sm">Rooms, allocations, maintenance & security</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Dialog open={roomOpen} onOpenChange={setRoomOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm" className="cursor-pointer"><Plus className="h-4 w-4 mr-1" />Add Room</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Add Dormitory Room</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <div className="grid grid-cols-3 gap-2">
                  <div><Label>Room # *</Label><Input value={roomForm.roomNumber} onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })} placeholder="A-101" /></div>
                  <div><Label>Block</Label><Input value={roomForm.dormBlock} onChange={(e) => setRoomForm({ ...roomForm, dormBlock: e.target.value })} placeholder="Block A" /></div>
                  <div><Label>Floor</Label><Input type="number" value={roomForm.floor} onChange={(e) => setRoomForm({ ...roomForm, floor: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label>Type</Label>
                    <Select value={roomForm.type} onValueChange={(v) => setRoomForm({ ...roomForm, type: v as typeof roomForm.type })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="double">Double</SelectItem>
                        <SelectItem value="triple">Triple</SelectItem>
                        <SelectItem value="dormitory">Dormitory</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Gender</Label>
                    <Select value={roomForm.gender} onValueChange={(v) => setRoomForm({ ...roomForm, gender: v as typeof roomForm.gender })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="mixed">Mixed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Capacity</Label><Input type="number" value={roomForm.capacity} onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })} /></div>
                </div>
                <div><Label>Monthly Fee ($)</Label><Input type="number" value={roomForm.monthlyFee} onChange={(e) => setRoomForm({ ...roomForm, monthlyFee: e.target.value })} /></div>
                <div>
                  <Label>Amenities</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {AMENITIES_OPTIONS.map((a) => (
                      <button
                        key={a}
                        onClick={() => {
                          const updated = roomForm.amenities.includes(a)
                            ? roomForm.amenities.filter((x) => x !== a)
                            : [...roomForm.amenities, a];
                          setRoomForm({ ...roomForm, amenities: updated });
                        }}
                        className={cn("text-xs px-2 py-1 rounded-full border cursor-pointer transition-colors", roomForm.amenities.includes(a) ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-muted")}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
                <Button className="w-full cursor-pointer" onClick={handleCreateRoom}>Create Room</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={allocateOpen} onOpenChange={setAllocateOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm" className="cursor-pointer"><Users className="h-4 w-4 mr-1" />Allocate Student</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Allocate Student to Room</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <div>
                  <Label>Room *</Label>
                  <Select value={allocForm.roomId} onValueChange={(v) => setAllocForm({ ...allocForm, roomId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select room" /></SelectTrigger>
                    <SelectContent>
                      {rooms.filter((r) => r.status === "available").map((r) => (
                        <SelectItem key={r.id} value={String(r.id)}>
                          {r.dormBlock ? `${r.dormBlock} - ` : ""}{r.roomNumber} ({r.occupiedCount}/{r.capacity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Student *</Label>
                  <Select value={allocForm.studentId} onValueChange={(v) => setAllocForm({ ...allocForm, studentId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                    <SelectContent>{students.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.firstName} {s.lastName}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Check-In Date *</Label><Input type="date" value={allocForm.checkInDate} onChange={(e) => setAllocForm({ ...allocForm, checkInDate: e.target.value })} /></div>
                  <div><Label>Bed Number</Label><Input value={allocForm.bedNumber} onChange={(e) => setAllocForm({ ...allocForm, bedNumber: e.target.value })} placeholder="Bed A" /></div>
                </div>
                <Button className="w-full cursor-pointer" onClick={handleAllocate}>Allocate</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={maintenanceOpen} onOpenChange={setMaintenanceOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm" className="cursor-pointer"><Wrench className="h-4 w-4 mr-1" />Maintenance</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Submit Maintenance Request</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Location Type</Label>
                    <Select value={maintForm.locationType} onValueChange={(v) => setMaintForm({ ...maintForm, locationType: v as typeof maintForm.locationType })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dorm">Dormitory</SelectItem>
                        <SelectItem value="bus">Bus</SelectItem>
                        <SelectItem value="campus">Campus</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Location *</Label><Input value={maintForm.location} onChange={(e) => setMaintForm({ ...maintForm, location: e.target.value })} placeholder="Room A-101" /></div>
                </div>
                <div><Label>Title *</Label><Input value={maintForm.title} onChange={(e) => setMaintForm({ ...maintForm, title: e.target.value })} placeholder="Broken door lock" /></div>
                <div><Label>Description *</Label><Input value={maintForm.description} onChange={(e) => setMaintForm({ ...maintForm, description: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Priority</Label>
                    <Select value={maintForm.priority} onValueChange={(v) => setMaintForm({ ...maintForm, priority: v as typeof maintForm.priority })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Assigned To</Label><Input value={maintForm.assignedTo} onChange={(e) => setMaintForm({ ...maintForm, assignedTo: e.target.value })} placeholder="Technician name" /></div>
                </div>
                <Button className="w-full cursor-pointer" onClick={handleCreateMaintenance}>Submit Request</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={securityOpen} onOpenChange={setSecurityOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="cursor-pointer"><Shield className="h-4 w-4 mr-1" />Log Entry</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Security Check-In</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Full Name *</Label><Input value={secForm.personName} onChange={(e) => setSecForm({ ...secForm, personName: e.target.value })} /></div>
                  <div>
                    <Label>Type</Label>
                    <Select value={secForm.personType} onValueChange={(v) => setSecForm({ ...secForm, personType: v as typeof secForm.personType })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="visitor">Visitor</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="vendor">Vendor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Purpose</Label><Input value={secForm.purpose} onChange={(e) => setSecForm({ ...secForm, purpose: e.target.value })} placeholder="Meeting, delivery..." /></div>
                  <div><Label>Host / Visiting</Label><Input value={secForm.hostName} onChange={(e) => setSecForm({ ...secForm, hostName: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>ID Type</Label><Input value={secForm.idType} onChange={(e) => setSecForm({ ...secForm, idType: e.target.value })} /></div>
                  <div><Label>ID Number</Label><Input value={secForm.idNumber} onChange={(e) => setSecForm({ ...secForm, idNumber: e.target.value })} /></div>
                </div>
                <div><Label>Check-In Time</Label><Input type="datetime-local" value={secForm.checkInTime} onChange={(e) => setSecForm({ ...secForm, checkInTime: e.target.value })} /></div>
                <Button className="w-full cursor-pointer" onClick={handleCreateSecurityLog}>Log Check-In</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Total Rooms</p><p className="text-2xl font-bold">{rooms.length}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Occupancy</p><p className="text-2xl font-bold text-primary">{totalOccupied}/{totalCapacity}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Available Rooms</p><p className="text-2xl font-bold text-emerald-600">{availableRooms}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Open Maintenance</p><p className="text-2xl font-bold text-amber-600">{openMaintenance}</p></CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="rooms" className="cursor-pointer">Rooms</TabsTrigger>
          <TabsTrigger value="allocations" className="cursor-pointer">Allocations</TabsTrigger>
          <TabsTrigger value="maintenance" className="cursor-pointer">Maintenance</TabsTrigger>
          <TabsTrigger value="security" className="cursor-pointer">Security Log</TabsTrigger>
        </TabsList>

        {/* Rooms */}
        <TabsContent value="rooms" className="mt-4">
          {rooms.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground"><Home className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>No rooms added yet.</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {rooms.map((room) => (
                <Card key={room.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-bold text-lg">{room.dormBlock ? `${room.dormBlock} - ` : ""}Room {room.roomNumber}</p>
                        <p className="text-xs text-muted-foreground capitalize">{room.type} · {room.gender} · Floor {room.floor ?? "—"}</p>
                      </div>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize", roomStatusColors[room.status])}>{room.status}</span>
                    </div>
                    {/* Occupancy bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Occupancy</span>
                        <span>{room.occupiedCount}/{room.capacity}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", room.occupiedCount >= room.capacity ? "bg-red-500" : "bg-emerald-500")} style={{ width: `${Math.min(100, (room.occupiedCount / room.capacity) * 100)}%` }} />
                      </div>
                    </div>
                    {room.amenities && room.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {room.amenities.slice(0, 4).map((a) => (
                          <span key={a} className="text-xs bg-muted px-1.5 py-0.5 rounded">{a}</span>
                        ))}
                        {room.amenities.length > 4 && <span className="text-xs text-muted-foreground">+{room.amenities.length - 4}</span>}
                      </div>
                    )}
                    {room.monthlyFee && <p className="text-sm font-semibold text-primary mb-2">${room.monthlyFee}/month</p>}
                    <div className="flex gap-2">
                      <Select value={room.status} onValueChange={(v) => {
                        router.put(`/dashboard/dormitory/rooms/${room.id}`, { status: v }, {
                          preserveScroll: true,
                          onSuccess: () => toast.success("Status updated"),
                          onError: () => toast.error("Failed to update status"),
                        });
                      }}>
                        <SelectTrigger className="h-7 text-xs flex-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" className="cursor-pointer h-7 w-7 text-destructive" onClick={() => void routerDeleteWithConfirm(`/dashboard/dormitory/rooms/${room.id}`, { title: "Delete this room?", onSuccess: () => toast.success("Deleted"), onError: () => toast.error("Failed to delete") })}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Allocations */}
        <TabsContent value="allocations" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Room Allocations — {CURRENT_YEAR}</CardTitle></CardHeader>
            <CardContent>
              {allocations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground"><Users className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>No allocations yet.</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Student</th>
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Room</th>
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Bed</th>
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Check-In</th>
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Status</th>
                        <th className="py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {allocations.map((a) => {
                        const student = students.find((s) => s.id === a.studentId);
                        const room = rooms.find((r) => r.id === a.roomId);
                        return (
                          <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30">
                            <td className="py-2 pr-4">{student ? `${student.firstName} ${student.lastName}` : "—"}</td>
                            <td className="py-2 pr-4">{room ? `${room.dormBlock ? room.dormBlock + " - " : ""}${room.roomNumber}` : "—"}</td>
                            <td className="py-2 pr-4 text-muted-foreground">{a.bedNumber ?? "—"}</td>
                            <td className="py-2 pr-4 text-muted-foreground">{a.checkInDate}</td>
                            <td className="py-2 pr-4">
                              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize", a.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600")}>{a.status.replace("_", " ")}</span>
                            </td>
                            <td className="py-2">
                              {a.status === "active" && (
                                <Button variant="ghost" size="sm" className="cursor-pointer h-7 text-xs text-amber-600" onClick={() => {
                                  router.put(`/dashboard/dormitory/allocations/${a.id}/checkout`, { checkOutDate: new Date().toISOString().slice(0, 10) }, {
                                    preserveScroll: true,
                                    onSuccess: () => toast.success("Checked out"),
                                    onError: () => toast.error("Failed to check out"),
                                  });
                                }}>
                                  <LogOut className="h-3 w-3 mr-1" />Check Out
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance */}
        <TabsContent value="maintenance" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Maintenance Requests</CardTitle></CardHeader>
            <CardContent>
              {maintenance.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground"><Wrench className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>No maintenance requests.</p></div>
              ) : (
                <div className="space-y-3">
                  {maintenance.map((m) => (
                    <div key={m.id} className="flex items-start justify-between p-3 rounded-lg border bg-card gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-semibold text-sm">{m.title}</p>
                          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize", priorityColors[m.priority])}>{m.priority}</span>
                          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize", maintStatusColors[m.status])}>{m.status.replace("_", " ")}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{m.description}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{m.locationType} · {m.location}{m.assignedTo && ` · Assigned: ${m.assignedTo}`}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        {m.status === "open" && (
                          <Button variant="ghost" size="icon" className="cursor-pointer h-7 w-7 text-blue-600" onClick={() => {
                            router.put(`/dashboard/dormitory/maintenance/${m.id}`, { status: "in_progress" }, {
                              preserveScroll: true,
                              onSuccess: () => toast.success("Marked in progress"),
                              onError: () => toast.error("Failed to update"),
                            });
                          }}>
                            <Clock className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {m.status === "in_progress" && (
                          <Button variant="ghost" size="icon" className="cursor-pointer h-7 w-7 text-emerald-600" onClick={() => {
                            router.put(`/dashboard/dormitory/maintenance/${m.id}`, { status: "resolved" }, {
                              preserveScroll: true,
                              onSuccess: () => toast.success("Marked resolved"),
                              onError: () => toast.error("Failed to update"),
                            });
                          }}>
                            <CheckCircle className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="cursor-pointer h-7 w-7 text-destructive" onClick={() => void routerDeleteWithConfirm(`/dashboard/dormitory/maintenance/${m.id}`, { title: "Delete this maintenance request?", onSuccess: () => toast.success("Deleted"), onError: () => toast.error("Failed to delete") })}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Log */}
        <TabsContent value="security" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Security Check-In/Out Log</CardTitle></CardHeader>
            <CardContent>
              {securityLogs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground"><Shield className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>No security logs yet.</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Name</th>
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Type</th>
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Purpose</th>
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Check-In</th>
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Check-Out</th>
                        <th className="py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {securityLogs.map((log) => (
                        <tr key={log.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="py-2 pr-4 font-medium">{log.personName}</td>
                          <td className="py-2 pr-4 capitalize">{log.personType}</td>
                          <td className="py-2 pr-4 text-muted-foreground">{log.purpose ?? "—"}</td>
                          <td className="py-2 pr-4 text-muted-foreground text-xs">{new Date(log.checkInTime).toLocaleString()}</td>
                          <td className="py-2 pr-4">
                            {log.checkOutTime ? (
                              <span className="text-xs text-muted-foreground">{new Date(log.checkOutTime).toLocaleString()}</span>
                            ) : (
                              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">On Premises</span>
                            )}
                          </td>
                          <td className="py-2">
                            {!log.checkOutTime && (
                              <Button variant="ghost" size="icon" className="cursor-pointer h-7 w-7 text-emerald-600" onClick={() => {
                                router.put(`/dashboard/dormitory/security-logs/${log.id}/checkout`, { checkOutTime: new Date().toISOString() }, {
                                  preserveScroll: true,
                                  onSuccess: () => toast.success("Checked out"),
                                  onError: () => toast.error("Failed to check out"),
                                });
                              }}>
                                <LogOut className="h-3.5 w-3.5" />
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
      </Tabs>
    </div>
  );
}

export default function DormitoryPage(props: PageProps) {
  return (
    <DashboardLayout>
      <DormitoryContent {...props} />
    </DashboardLayout>
  );
}
