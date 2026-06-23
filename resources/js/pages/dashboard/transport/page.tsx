import { useMemo, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { toast } from "sonner";
import { routerDeleteWithConfirm } from "@/lib/confirm.ts";
import { cn } from "@/lib/utils.ts";
import {
  Bus, MapPin, Users, Plus, Trash2, Navigation,
  Phone, User, Route, Pencil, UserPlus, Filter, X,
} from "lucide-react";

const CURRENT_YEAR = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

type StudentFilters = {
  search: string;
  classSection: string;
  gradeLevel: string;
  city: string;
  location: string;
  ageMin: string;
  ageMax: string;
  gender: string;
};

const DEFAULT_STUDENT_FILTERS: StudentFilters = {
  search: "",
  classSection: "all",
  gradeLevel: "all",
  city: "all",
  location: "",
  ageMin: "",
  ageMax: "",
  gender: "all",
};

// Simulated Philadelphia coordinates for GPS demo
const PHILLY_COORDS = [
  { lat: 39.9526, lng: -75.1652 },
  { lat: 39.9612, lng: -75.1791 },
  { lat: 39.9441, lng: -75.1534 },
  { lat: 39.9780, lng: -75.1580 },
];

type RouteStop = {
  name: string;
  time: string;
  lat?: number | null;
  lng?: number | null;
};

type BusRoute = {
  id: number;
  schoolId: number;
  routeName: string;
  routeNumber: string;
  stops: RouteStop[];
  morningStartTime?: string | null;
  afternoonStartTime?: string | null;
  isActive: boolean;
  createdAt: string;
};

type BusRecord = {
  id: number;
  schoolId: number;
  busNumber: string;
  plateNumber: string;
  capacity: number;
  routeId?: number | null;
  driverName: string;
  driverPhone: string;
  driverLicense?: string | null;
  matronName?: string | null;
  matronPhone?: string | null;
  currentLat?: number | null;
  currentLng?: number | null;
  lastLocationUpdate?: string | null;
  status: string;
  createdAt: string;
};

type TransportAssignment = {
  id: number;
  schoolId: number;
  studentId: number;
  busId: number;
  routeId: number;
  pickupStop: string;
  dropStop: string;
  academicYear: string;
  isActive: boolean;
  createdAt: string;
};

type StudentLite = {
  id: number;
  firstName: string;
  lastName: string;
  studentId?: string;
  classSection?: string | null;
  gradeLevel?: string | null;
  dateOfBirth?: string | null;
  city?: string | null;
  address?: string | null;
  gender?: string | null;
};

type PageProps = {
  routes: BusRoute[];
  buses: BusRecord[];
  assignments: TransportAssignment[];
  students: StudentLite[];
};

function getStudentAge(dateOfBirth?: string | null): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
}

function matchesStudentFilters(
  student: StudentLite | undefined,
  filters: StudentFilters,
  assignment?: { pickupStop?: string; dropStop?: string },
): boolean {
  if (filters.search.trim()) {
    const query = filters.search.trim().toLowerCase();
    const haystack = [
      student?.firstName,
      student?.lastName,
      student?.studentId,
      `${student?.firstName ?? ""} ${student?.lastName ?? ""}`,
    ].join(" ").toLowerCase();
    if (!haystack.includes(query)) return false;
  }

  if (filters.classSection !== "all" && student?.classSection !== filters.classSection) return false;
  if (filters.gradeLevel !== "all" && student?.gradeLevel !== filters.gradeLevel) return false;
  if (filters.city !== "all" && student?.city !== filters.city) return false;
  if (filters.gender !== "all" && student?.gender !== filters.gender) return false;

  if (filters.location.trim()) {
    const query = filters.location.trim().toLowerCase();
    const locationHaystack = [
      student?.city,
      student?.address,
      assignment?.pickupStop,
      assignment?.dropStop,
    ].filter(Boolean).join(" ").toLowerCase();
    if (!locationHaystack.includes(query)) return false;
  }

  const age = getStudentAge(student?.dateOfBirth);
  if (filters.ageMin && (age === null || age < parseInt(filters.ageMin, 10))) return false;
  if (filters.ageMax && (age === null || age > parseInt(filters.ageMax, 10))) return false;

  return true;
}

function StudentFilterFields({
  filters,
  onChange,
  classSections,
  gradeLevels,
  cities,
  layout = "default",
  assignmentExtras,
}: {
  filters: StudentFilters;
  onChange: (next: StudentFilters) => void;
  classSections: string[];
  gradeLevels: string[];
  cities: string[];
  layout?: "default" | "columns";
  assignmentExtras?: {
    busId: string;
    routeId: string;
    pickupStop: string;
    status: string;
    onChange: (patch: { busId?: string; routeId?: string; pickupStop?: string; status?: string }) => void;
    buses: BusRecord[];
    routes: BusRoute[];
    pickupStops: string[];
  };
}) {
  const update = (patch: Partial<StudentFilters>) => onChange({ ...filters, ...patch });

  const searchField = (
    <div className={layout === "default" ? "col-span-2" : undefined}>
      <Label>Search</Label>
      <Input
        placeholder="Name or student ID..."
        value={filters.search}
        onChange={(e) => update({ search: e.target.value })}
      />
    </div>
  );

  const otherFields = (
    <>
      <div>
        <Label>Class</Label>
        <Select value={filters.classSection} onValueChange={(v) => update({ classSection: v })}>
          <SelectTrigger><SelectValue placeholder="All classes" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All classes</SelectItem>
            {classSections.map((section) => (
              <SelectItem key={section} value={section}>{section}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Grade</Label>
        <Select value={filters.gradeLevel} onValueChange={(v) => update({ gradeLevel: v })}>
          <SelectTrigger><SelectValue placeholder="All grades" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All grades</SelectItem>
            {gradeLevels.map((grade) => (
              <SelectItem key={grade} value={grade}>{grade}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>City</Label>
        <Select value={filters.city} onValueChange={(v) => update({ city: v })}>
          <SelectTrigger><SelectValue placeholder="All cities" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All cities</SelectItem>
            {cities.map((city) => (
              <SelectItem key={city} value={city}>{city}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Location / Area</Label>
        <Input
          placeholder="Address or pickup area..."
          value={filters.location}
          onChange={(e) => update({ location: e.target.value })}
        />
      </div>
      <div>
        <Label>Min Age</Label>
        <Input
          type="number"
          min={0}
          placeholder="Any"
          value={filters.ageMin}
          onChange={(e) => update({ ageMin: e.target.value })}
        />
      </div>
      <div>
        <Label>Max Age</Label>
        <Input
          type="number"
          min={0}
          placeholder="Any"
          value={filters.ageMax}
          onChange={(e) => update({ ageMax: e.target.value })}
        />
      </div>
      <div>
        <Label>Gender</Label>
        <Select value={filters.gender} onValueChange={(v) => update({ gender: v })}>
          <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );

  if (layout === "columns") {
    const classField = (
      <div>
        <Label>Class</Label>
        <Select value={filters.classSection} onValueChange={(v) => update({ classSection: v })}>
          <SelectTrigger><SelectValue placeholder="All classes" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All classes</SelectItem>
            {classSections.map((section) => (
              <SelectItem key={section} value={section}>{section}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
    const gradeField = (
      <div>
        <Label>Grade</Label>
        <Select value={filters.gradeLevel} onValueChange={(v) => update({ gradeLevel: v })}>
          <SelectTrigger><SelectValue placeholder="All grades" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All grades</SelectItem>
            {gradeLevels.map((grade) => (
              <SelectItem key={grade} value={grade}>{grade}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
    const genderField = (
      <div>
        <Label>Gender</Label>
        <Select value={filters.gender} onValueChange={(v) => update({ gender: v })}>
          <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Student</p>
          {searchField}
          {classField}
          {gradeField}
          {genderField}
        </div>
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Location & Age</p>
          <div>
            <Label>City</Label>
            <Select value={filters.city} onValueChange={(v) => update({ city: v })}>
              <SelectTrigger><SelectValue placeholder="All cities" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All cities</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Location / Area</Label>
            <Input
              placeholder="Address or pickup area..."
              value={filters.location}
              onChange={(e) => update({ location: e.target.value })}
            />
          </div>
          <div>
            <Label>Min Age</Label>
            <Input
              type="number"
              min={0}
              placeholder="Any"
              value={filters.ageMin}
              onChange={(e) => update({ ageMin: e.target.value })}
            />
          </div>
          <div>
            <Label>Max Age</Label>
            <Input
              type="number"
              min={0}
              placeholder="Any"
              value={filters.ageMax}
              onChange={(e) => update({ ageMax: e.target.value })}
            />
          </div>
        </div>
        {assignmentExtras && (
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Transport</p>
            <div>
              <Label>Bus</Label>
              <Select value={assignmentExtras.busId} onValueChange={(v) => assignmentExtras.onChange({ busId: v })}>
                <SelectTrigger><SelectValue placeholder="All buses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All buses</SelectItem>
                  {assignmentExtras.buses.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>Bus {b.busNumber}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Route</Label>
              <Select value={assignmentExtras.routeId} onValueChange={(v) => assignmentExtras.onChange({ routeId: v })}>
                <SelectTrigger><SelectValue placeholder="All routes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All routes</SelectItem>
                  {assignmentExtras.routes.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>{r.routeName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Pickup Stop</Label>
              <Select value={assignmentExtras.pickupStop} onValueChange={(v) => assignmentExtras.onChange({ pickupStop: v })}>
                <SelectTrigger><SelectValue placeholder="All stops" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All stops</SelectItem>
                  {assignmentExtras.pickupStops.map((stop) => (
                    <SelectItem key={stop} value={stop}>{stop}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={assignmentExtras.status} onValueChange={(v) => assignmentExtras.onChange({ status: v })}>
                <SelectTrigger><SelectValue placeholder="All statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
      {searchField}
      {otherFields}
    </div>
  );
}

function TransportContent({ routes, buses, assignments, students }: PageProps) {
  const { schoolId } = useCurrentSchool();
  const [tab, setTab] = useState("buses");
  const [busOpen, setBusOpen] = useState(false);
  const [routeOpen, setRouteOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [editAssignOpen, setEditAssignOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<TransportAssignment | null>(null);

  const [busForm, setBusForm] = useState({
    busNumber: "", plateNumber: "", capacity: "40",
    driverName: "", driverPhone: "", driverLicense: "",
    matronName: "", matronPhone: "",
    routeId: "",
  });

  const [routeForm, setRouteForm] = useState({
    routeName: "", routeNumber: "",
    morningStartTime: "07:00", afternoonStartTime: "15:00",
    stops: [{ name: "", time: "" }],
  });

  const [assignForm, setAssignForm] = useState({
    studentId: "",
    busId: "",
    routeId: "",
    pickupStop: "", dropStop: "",
  });

  const [bulkForm, setBulkForm] = useState({
    busId: "",
    routeId: "",
    pickupStop: "",
    dropStop: "",
    showAssigned: false,
    selectedStudentIds: [] as number[],
    filters: { ...DEFAULT_STUDENT_FILTERS },
  });

  const [assignmentFilters, setAssignmentFilters] = useState({
    ...DEFAULT_STUDENT_FILTERS,
    busId: "all",
    routeId: "all",
    status: "all",
    pickupStop: "all",
  });

  const [showAssignmentFilters, setShowAssignmentFilters] = useState(true);

  const [editForm, setEditForm] = useState({
    busId: "",
    routeId: "",
    pickupStop: "",
    dropStop: "",
    isActive: true,
  });

  const studentById = useMemo(() => {
    const map = new Map<number, StudentLite>();
    students.forEach((s) => map.set(s.id, s));
    return map;
  }, [students]);

  const assignmentByStudentId = useMemo(() => {
    const map = new Map<number, TransportAssignment>();
    assignments.forEach((a) => map.set(a.studentId, a));
    return map;
  }, [assignments]);

  const busOccupancy = useMemo(() => {
    const map = new Map<number, number>();
    assignments.filter((a) => a.isActive).forEach((a) => {
      map.set(a.busId, (map.get(a.busId) ?? 0) + 1);
    });
    return map;
  }, [assignments]);

  const classSections = useMemo(
    () => [...new Set(students.map((s) => s.classSection).filter(Boolean))].sort() as string[],
    [students],
  );

  const gradeLevels = useMemo(
    () => [...new Set(students.map((s) => s.gradeLevel).filter(Boolean))].sort() as string[],
    [students],
  );

  const cities = useMemo(
    () => [...new Set(students.map((s) => s.city).filter(Boolean))].sort() as string[],
    [students],
  );

  const pickupStops = useMemo(
    () => [...new Set(assignments.map((a) => a.pickupStop).filter(Boolean))].sort() as string[],
    [assignments],
  );

  const bulkCandidateStudents = useMemo(() => {
    return students.filter((student) => {
      const existing = assignmentByStudentId.get(student.id);
      if (!bulkForm.showAssigned && existing) {
        return false;
      }
      return matchesStudentFilters(student, bulkForm.filters, existing);
    });
  }, [students, bulkForm.showAssigned, bulkForm.filters, assignmentByStudentId]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      const student = studentById.get(assignment.studentId);

      if (assignmentFilters.busId !== "all" && String(assignment.busId) !== assignmentFilters.busId) {
        return false;
      }
      if (assignmentFilters.routeId !== "all" && String(assignment.routeId) !== assignmentFilters.routeId) {
        return false;
      }
      if (assignmentFilters.status === "active" && !assignment.isActive) return false;
      if (assignmentFilters.status === "inactive" && assignment.isActive) return false;
      if (assignmentFilters.pickupStop !== "all" && assignment.pickupStop !== assignmentFilters.pickupStop) {
        return false;
      }

      return matchesStudentFilters(student, assignmentFilters, assignment);
    });
  }, [assignments, assignmentFilters, studentById]);

  const hasActiveAssignmentFilters = useMemo(() => {
    const { busId, routeId, status, pickupStop, ...studentFilterValues } = assignmentFilters;
    const studentFiltersActive = Object.entries(studentFilterValues).some(([key, value]) => {
      const defaultValue = DEFAULT_STUDENT_FILTERS[key as keyof StudentFilters];
      return value !== defaultValue;
    });
    return studentFiltersActive
      || busId !== "all"
      || routeId !== "all"
      || status !== "all"
      || pickupStop !== "all";
  }, [assignmentFilters]);

  const resetBulkForm = () => {
    setBulkForm({
      busId: "",
      routeId: "",
      pickupStop: "",
      dropStop: "",
      showAssigned: false,
      selectedStudentIds: [],
      filters: { ...DEFAULT_STUDENT_FILTERS },
    });
  };

  const resetAssignmentFilters = () => {
    setAssignmentFilters({
      ...DEFAULT_STUDENT_FILTERS,
      busId: "all",
      routeId: "all",
      status: "all",
      pickupStop: "all",
    });
  };

  const resetEditForm = () => {
    setEditForm({ busId: "", routeId: "", pickupStop: "", dropStop: "", isActive: true });
    setEditingAssignment(null);
  };

  const handleBulkBusChange = (busId: string) => {
    const bus = buses.find((b) => String(b.id) === busId);
    setBulkForm((prev) => ({
      ...prev,
      busId,
      routeId: bus?.routeId ? String(bus.routeId) : prev.routeId,
    }));
  };

  const handleEditBusChange = (busId: string) => {
    const bus = buses.find((b) => String(b.id) === busId);
    setEditForm((prev) => ({
      ...prev,
      busId,
      routeId: bus?.routeId ? String(bus.routeId) : prev.routeId,
    }));
  };

  const toggleBulkStudent = (studentId: number) => {
    setBulkForm((prev) => ({
      ...prev,
      selectedStudentIds: prev.selectedStudentIds.includes(studentId)
        ? prev.selectedStudentIds.filter((id) => id !== studentId)
        : [...prev.selectedStudentIds, studentId],
    }));
  };

  const toggleAllBulkStudents = () => {
    const ids = bulkCandidateStudents.map((s) => s.id);
    const allSelected = ids.length > 0 && ids.every((id) => bulkForm.selectedStudentIds.includes(id));
    setBulkForm((prev) => ({
      ...prev,
      selectedStudentIds: allSelected ? [] : ids,
    }));
  };

  const openEditAssignment = (assignment: TransportAssignment) => {
    setEditingAssignment(assignment);
    setEditForm({
      busId: String(assignment.busId),
      routeId: String(assignment.routeId),
      pickupStop: assignment.pickupStop,
      dropStop: assignment.dropStop,
      isActive: assignment.isActive,
    });
    setEditAssignOpen(true);
  };

  const handleCreateBus = () => {
    if (!schoolId || !busForm.busNumber || !busForm.driverName || !busForm.driverPhone) {
      toast.error("Please fill all required fields");
      return;
    }
    router.post("/dashboard/transport/buses", {
      busNumber: busForm.busNumber,
      plateNumber: busForm.plateNumber,
      capacity: parseInt(busForm.capacity) || 40,
      driverName: busForm.driverName,
      driverPhone: busForm.driverPhone,
      driverLicense: busForm.driverLicense || undefined,
      matronName: busForm.matronName || undefined,
      matronPhone: busForm.matronPhone || undefined,
      routeId: busForm.routeId ? Number(busForm.routeId) : undefined,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success("Bus added");
        setBusOpen(false);
        setBusForm({ busNumber: "", plateNumber: "", capacity: "40", driverName: "", driverPhone: "", driverLicense: "", matronName: "", matronPhone: "", routeId: "" });
      },
      onError: () => toast.error("Failed to add bus"),
    });
  };

  const handleCreateRoute = () => {
    if (!schoolId || !routeForm.routeName || routeForm.stops.length === 0) {
      toast.error("Please fill all required fields");
      return;
    }
    router.post("/dashboard/transport/routes", {
      routeName: routeForm.routeName,
      routeNumber: routeForm.routeNumber,
      morningStartTime: routeForm.morningStartTime || undefined,
      afternoonStartTime: routeForm.afternoonStartTime || undefined,
      stops: routeForm.stops.filter((s) => s.name).map((s) => ({ name: s.name, time: s.time })),
    }, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success("Route created");
        setRouteOpen(false);
        setRouteForm({ routeName: "", routeNumber: "", morningStartTime: "07:00", afternoonStartTime: "15:00", stops: [{ name: "", time: "" }] });
      },
      onError: () => toast.error("Failed to create route"),
    });
  };

  const handleAssignStudent = () => {
    if (!schoolId || !assignForm.studentId || !assignForm.busId || !assignForm.routeId) {
      toast.error("Please fill all required fields");
      return;
    }
    router.post("/dashboard/transport/assignments", {
      studentId: Number(assignForm.studentId),
      busId: Number(assignForm.busId),
      routeId: Number(assignForm.routeId),
      pickupStop: assignForm.pickupStop,
      dropStop: assignForm.dropStop,
      academicYear: CURRENT_YEAR,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success("Student assigned");
        setAssignOpen(false);
        setAssignForm({ studentId: "", busId: "", routeId: "", pickupStop: "", dropStop: "" });
      },
      onError: () => toast.error("Failed to assign student"),
    });
  };

  const handleBulkAssign = () => {
    if (!schoolId || !bulkForm.busId || !bulkForm.routeId || bulkForm.selectedStudentIds.length === 0) {
      toast.error("Select a bus, route, and at least one student");
      return;
    }

    router.post("/dashboard/transport/assignments/bulk", {
      studentIds: bulkForm.selectedStudentIds,
      busId: Number(bulkForm.busId),
      routeId: Number(bulkForm.routeId),
      pickupStop: bulkForm.pickupStop || undefined,
      dropStop: bulkForm.dropStop || undefined,
      academicYear: CURRENT_YEAR,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success(`${bulkForm.selectedStudentIds.length} students assigned`);
        setBulkAssignOpen(false);
        resetBulkForm();
      },
      onError: (errors) => {
        const message = Object.values(errors)[0];
        toast.error(typeof message === "string" ? message : "Failed to assign students");
      },
    });
  };

  const handleUpdateAssignment = () => {
    if (!editingAssignment || !editForm.busId || !editForm.routeId) {
      toast.error("Please fill all required fields");
      return;
    }

    router.put(`/dashboard/transport/assignments/${editingAssignment.id}`, {
      busId: Number(editForm.busId),
      routeId: Number(editForm.routeId),
      pickupStop: editForm.pickupStop,
      dropStop: editForm.dropStop,
      isActive: editForm.isActive,
      academicYear: CURRENT_YEAR,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success("Assignment updated");
        setEditAssignOpen(false);
        resetEditForm();
      },
      onError: (errors) => {
        const message = Object.values(errors)[0];
        toast.error(typeof message === "string" ? message : "Failed to update assignment");
      },
    });
  };

  // Simulate GPS update for a bus
  const handleSimulateGPS = (busId: number, idx: number) => {
    const coord = PHILLY_COORDS[idx % PHILLY_COORDS.length];
    router.put(`/dashboard/transport/buses/${busId}`, { lat: coord.lat, lng: coord.lng }, {
      preserveScroll: true,
      onSuccess: () => toast.success("GPS location updated (simulated)"),
      onError: () => toast.error("Failed to update location"),
    });
  };

  const statusColors: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    in_transit: "bg-blue-100 text-blue-700",
    maintenance: "bg-amber-100 text-amber-700",
    inactive: "bg-gray-100 text-gray-700",
  };

  const totalStudents = assignments.length;
  const activeBuses = buses.filter((b) => b.status === "active" || b.status === "in_transit").length;

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
          <h1 className="text-2xl font-bold">Transport Management</h1>
          <p className="text-muted-foreground text-sm">Bus routes, drivers, and GPS tracking</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Dialog open={routeOpen} onOpenChange={setRouteOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm" className="cursor-pointer"><Plus className="h-4 w-4 mr-1" />Add Route</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Create Bus Route</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Route Name *</Label><Input value={routeForm.routeName} onChange={(e) => setRouteForm({ ...routeForm, routeName: e.target.value })} placeholder="North Philly Route" /></div>
                  <div><Label>Route Number *</Label><Input value={routeForm.routeNumber} onChange={(e) => setRouteForm({ ...routeForm, routeNumber: e.target.value })} placeholder="R-01" /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Morning Start</Label><Input type="time" value={routeForm.morningStartTime} onChange={(e) => setRouteForm({ ...routeForm, morningStartTime: e.target.value })} /></div>
                  <div><Label>Afternoon Start</Label><Input type="time" value={routeForm.afternoonStartTime} onChange={(e) => setRouteForm({ ...routeForm, afternoonStartTime: e.target.value })} /></div>
                </div>
                <div>
                  <Label>Stops</Label>
                  {routeForm.stops.map((stop, i) => (
                    <div key={i} className="flex gap-2 mt-2 items-center">
                      <Input className="flex-1" placeholder="Stop name" value={stop.name} onChange={(e) => {
                        const stops = [...routeForm.stops]; stops[i] = { ...stops[i], name: e.target.value }; setRouteForm({ ...routeForm, stops });
                      }} />
                      <Input className="w-24" type="time" value={stop.time} onChange={(e) => {
                        const stops = [...routeForm.stops]; stops[i] = { ...stops[i], time: e.target.value }; setRouteForm({ ...routeForm, stops });
                      }} />
                      <Button variant="ghost" size="icon" className="cursor-pointer text-destructive h-8 w-8" onClick={() => setRouteForm({ ...routeForm, stops: routeForm.stops.filter((_, j) => j !== i) })}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" className="cursor-pointer mt-2" onClick={() => setRouteForm({ ...routeForm, stops: [...routeForm.stops, { name: "", time: "" }] })}>
                    <Plus className="h-4 w-4 mr-1" />Add Stop
                  </Button>
                </div>
                <Button className="w-full cursor-pointer" onClick={handleCreateRoute}>Create Route</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={busOpen} onOpenChange={setBusOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm" className="cursor-pointer"><Plus className="h-4 w-4 mr-1" />Add Bus</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Register Bus</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <div className="grid grid-cols-3 gap-2">
                  <div><Label>Bus # *</Label><Input value={busForm.busNumber} onChange={(e) => setBusForm({ ...busForm, busNumber: e.target.value })} placeholder="BUS-01" /></div>
                  <div><Label>Plate *</Label><Input value={busForm.plateNumber} onChange={(e) => setBusForm({ ...busForm, plateNumber: e.target.value })} placeholder="PHL-1234" /></div>
                  <div><Label>Capacity</Label><Input type="number" value={busForm.capacity} onChange={(e) => setBusForm({ ...busForm, capacity: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Driver Name *</Label><Input value={busForm.driverName} onChange={(e) => setBusForm({ ...busForm, driverName: e.target.value })} /></div>
                  <div><Label>Driver Phone *</Label><Input value={busForm.driverPhone} onChange={(e) => setBusForm({ ...busForm, driverPhone: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Matron Name</Label><Input value={busForm.matronName} onChange={(e) => setBusForm({ ...busForm, matronName: e.target.value })} /></div>
                  <div><Label>Matron Phone</Label><Input value={busForm.matronPhone} onChange={(e) => setBusForm({ ...busForm, matronPhone: e.target.value })} /></div>
                </div>
                <div>
                  <Label>Assign Route</Label>
                  <Select value={busForm.routeId} onValueChange={(v) => setBusForm({ ...busForm, routeId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select route (optional)" /></SelectTrigger>
                    <SelectContent>
                      {routes.map((r) => <SelectItem key={r.id} value={String(r.id)}>{r.routeName} ({r.routeNumber})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full cursor-pointer" onClick={handleCreateBus}>Register Bus</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="secondary" className="cursor-pointer"><Users className="h-4 w-4 mr-1" />Assign Student</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Assign Student to Bus</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <div>
                  <Label>Student *</Label>
                  <Select value={assignForm.studentId} onValueChange={(v) => setAssignForm({ ...assignForm, studentId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                    <SelectContent>{students.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.firstName} {s.lastName}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Bus *</Label>
                  <Select value={assignForm.busId} onValueChange={(v) => setAssignForm({ ...assignForm, busId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select bus" /></SelectTrigger>
                    <SelectContent>{buses.map((b) => <SelectItem key={b.id} value={String(b.id)}>Bus {b.busNumber} - {b.driverName}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Route *</Label>
                  <Select value={assignForm.routeId} onValueChange={(v) => setAssignForm({ ...assignForm, routeId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select route" /></SelectTrigger>
                    <SelectContent>{routes.map((r) => <SelectItem key={r.id} value={String(r.id)}>{r.routeName}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Pickup Stop</Label><Input value={assignForm.pickupStop} onChange={(e) => setAssignForm({ ...assignForm, pickupStop: e.target.value })} /></div>
                  <div><Label>Drop Stop</Label><Input value={assignForm.dropStop} onChange={(e) => setAssignForm({ ...assignForm, dropStop: e.target.value })} /></div>
                </div>
                <Button className="w-full cursor-pointer" onClick={handleAssignStudent}>Assign Student</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={bulkAssignOpen} onOpenChange={(open) => { setBulkAssignOpen(open); if (!open) resetBulkForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="cursor-pointer"><UserPlus className="h-4 w-4 mr-1" />Bulk Assign</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Bulk Assign Students to Bus</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Bus *</Label>
                    <Select value={bulkForm.busId} onValueChange={handleBulkBusChange}>
                      <SelectTrigger><SelectValue placeholder="Select bus" /></SelectTrigger>
                      <SelectContent>
                        {buses.map((b) => (
                          <SelectItem key={b.id} value={String(b.id)}>
                            Bus {b.busNumber} ({busOccupancy.get(b.id) ?? 0}/{b.capacity})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Route *</Label>
                    <Select value={bulkForm.routeId} onValueChange={(v) => setBulkForm({ ...bulkForm, routeId: v })}>
                      <SelectTrigger><SelectValue placeholder="Select route" /></SelectTrigger>
                      <SelectContent>{routes.map((r) => <SelectItem key={r.id} value={String(r.id)}>{r.routeName}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Pickup Stop</Label><Input value={bulkForm.pickupStop} onChange={(e) => setBulkForm({ ...bulkForm, pickupStop: e.target.value })} /></div>
                  <div><Label>Drop Stop</Label><Input value={bulkForm.dropStop} onChange={(e) => setBulkForm({ ...bulkForm, dropStop: e.target.value })} /></div>
                </div>
                <div className="flex flex-wrap items-end gap-3">
                  <label className="flex items-center gap-2 text-sm pb-2 cursor-pointer">
                    <Checkbox
                      checked={bulkForm.showAssigned}
                      onCheckedChange={(checked) => setBulkForm({ ...bulkForm, showAssigned: checked === true, selectedStudentIds: [] })}
                    />
                    Include already assigned
                  </label>
                </div>
                <div className="rounded-lg border p-3 space-y-3 bg-muted/10">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Filter className="h-4 w-4" />
                    Filter Students
                  </div>
                  <StudentFilterFields
                    filters={bulkForm.filters}
                    onChange={(filters) => setBulkForm({ ...bulkForm, filters, selectedStudentIds: [] })}
                    classSections={classSections}
                    gradeLevels={gradeLevels}
                    cities={cities}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Students ({bulkForm.selectedStudentIds.length} selected)</Label>
                    <Button type="button" variant="ghost" size="sm" className="cursor-pointer h-7 text-xs" onClick={toggleAllBulkStudents}>
                      {bulkCandidateStudents.length > 0 && bulkCandidateStudents.every((s) => bulkForm.selectedStudentIds.includes(s.id))
                        ? "Deselect all"
                        : "Select all"}
                    </Button>
                  </div>
                  <div className="max-h-56 overflow-y-auto border rounded-lg p-2 space-y-1">
                    {bulkCandidateStudents.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">No students match this filter.</p>
                    ) : (
                      bulkCandidateStudents.map((student) => {
                        const existing = assignmentByStudentId.get(student.id);
                        const existingBus = existing ? buses.find((b) => b.id === existing.busId) : null;
                        const age = getStudentAge(student.dateOfBirth);
                        return (
                          <label key={student.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/40 cursor-pointer">
                            <Checkbox
                              checked={bulkForm.selectedStudentIds.includes(student.id)}
                              onCheckedChange={() => toggleBulkStudent(student.id)}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">{student.firstName} {student.lastName}</p>
                              <p className="text-xs text-muted-foreground">
                                {[
                                  student.classSection,
                                  student.gradeLevel,
                                  student.city,
                                  age !== null ? `Age ${age}` : null,
                                ].filter(Boolean).join(" · ") || "No details"}
                                {existingBus ? ` · currently Bus ${existingBus.busNumber}` : ""}
                              </p>
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
                <Button className="w-full cursor-pointer" onClick={handleBulkAssign}>
                  Assign {bulkForm.selectedStudentIds.length || ""} Student{bulkForm.selectedStudentIds.length === 1 ? "" : "s"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={editAssignOpen} onOpenChange={(open) => { setEditAssignOpen(open); if (!open) resetEditForm(); }}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Transport Assignment</DialogTitle>
              </DialogHeader>
              {editingAssignment && (
                <div className="space-y-3 mt-2">
                  <p className="text-sm text-muted-foreground">
                    {(() => {
                      const student = students.find((s) => s.id === editingAssignment.studentId);
                      return student ? `${student.firstName} ${student.lastName}` : `Student #${editingAssignment.studentId}`;
                    })()}
                  </p>
                  <div>
                    <Label>Bus *</Label>
                    <Select value={editForm.busId} onValueChange={handleEditBusChange}>
                      <SelectTrigger><SelectValue placeholder="Select bus" /></SelectTrigger>
                      <SelectContent>
                        {buses.map((b) => (
                          <SelectItem key={b.id} value={String(b.id)}>
                            Bus {b.busNumber} ({busOccupancy.get(b.id) ?? 0}/{b.capacity})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Route *</Label>
                    <Select value={editForm.routeId} onValueChange={(v) => setEditForm({ ...editForm, routeId: v })}>
                      <SelectTrigger><SelectValue placeholder="Select route" /></SelectTrigger>
                      <SelectContent>{routes.map((r) => <SelectItem key={r.id} value={String(r.id)}>{r.routeName}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label>Pickup Stop</Label><Input value={editForm.pickupStop} onChange={(e) => setEditForm({ ...editForm, pickupStop: e.target.value })} /></div>
                    <div><Label>Drop Stop</Label><Input value={editForm.dropStop} onChange={(e) => setEditForm({ ...editForm, dropStop: e.target.value })} /></div>
                  </div>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={editForm.isActive}
                      onCheckedChange={(checked) => setEditForm({ ...editForm, isActive: checked === true })}
                    />
                    Active assignment
                  </label>
                  <Button className="w-full cursor-pointer" onClick={handleUpdateAssignment}>Save Changes</Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Total Buses</p><p className="text-2xl font-bold">{buses.length}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Active/Transit</p><p className="text-2xl font-bold text-emerald-600">{activeBuses}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Routes</p><p className="text-2xl font-bold text-primary">{routes.length}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Assigned Students</p><p className="text-2xl font-bold text-blue-600">{totalStudents}</p></CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="buses" className="cursor-pointer">Buses & Drivers</TabsTrigger>
          <TabsTrigger value="routes" className="cursor-pointer">Routes</TabsTrigger>
          <TabsTrigger value="gps" className="cursor-pointer">GPS Tracking</TabsTrigger>
          <TabsTrigger value="assignments" className="cursor-pointer">Student Assignments</TabsTrigger>
        </TabsList>

        {/* Buses */}
        <TabsContent value="buses" className="mt-4">
          {buses.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Bus className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No buses registered yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {buses.map((bus) => (
                <Card key={bus.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 rounded-lg"><Bus className="h-5 w-5 text-primary" /></div>
                        <div>
                          <p className="font-bold">Bus {bus.busNumber}</p>
                          <p className="text-xs text-muted-foreground">{bus.plateNumber} · Capacity: {bus.capacity}</p>
                        </div>
                      </div>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize", statusColors[bus.status])}>
                        {bus.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-3.5 w-3.5" />
                        <span>Driver: <span className="text-foreground font-medium">{bus.driverName}</span></span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{bus.driverPhone}</span>
                      </div>
                      {bus.matronName && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="h-3.5 w-3.5" />
                          <span>Matron: <span className="text-foreground">{bus.matronName}</span></span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Select value={bus.status} onValueChange={(v) => {
                        router.put(`/dashboard/transport/buses/${bus.id}`, { status: v }, {
                          preserveScroll: true,
                          onSuccess: () => toast.success("Status updated"),
                          onError: () => toast.error("Failed to update status"),
                        });
                      }}>
                        <SelectTrigger className="h-7 text-xs flex-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="in_transit">In Transit</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" className="cursor-pointer h-7 w-7 text-destructive" onClick={() => void routerDeleteWithConfirm(`/dashboard/transport/buses/${bus.id}`, { title: "Delete this bus?", onSuccess: () => toast.success("Deleted"), onError: () => toast.error("Failed to delete") })}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Routes */}
        <TabsContent value="routes" className="mt-4">
          {routes.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Route className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No routes created yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {routes.map((route) => (
                <Card key={route.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{route.routeName}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">#{route.routeNumber} · Morning: {route.morningStartTime ?? "—"} · Afternoon: {route.afternoonStartTime ?? "—"}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="cursor-pointer h-7 w-7 text-destructive" onClick={() => void routerDeleteWithConfirm(`/dashboard/transport/routes/${route.id}`, { title: "Delete this route?", onSuccess: () => toast.success("Deleted"), onError: () => toast.error("Failed to delete") })}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {route.stops.map((stop, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <div className="flex flex-col items-center">
                            <div className={cn("h-2 w-2 rounded-full", i === 0 ? "bg-emerald-500" : i === route.stops.length - 1 ? "bg-red-500" : "bg-primary/50")} />
                            {i < route.stops.length - 1 && <div className="w-px h-3 bg-border" />}
                          </div>
                          <span className="flex-1">{stop.name}</span>
                          <span className="text-xs text-muted-foreground">{stop.time}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* GPS Tracking */}
        <TabsContent value="gps" className="mt-4">
          <div className="space-y-4">
            <div className="rounded-xl border bg-card overflow-hidden">
              {/* Map placeholder with Philadelphia map feel */}
              <div className="relative h-72 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
                <div className="absolute inset-0 opacity-20" style={{
                  backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 40px, hsl(var(--border)) 40px, hsl(var(--border)) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, hsl(var(--border)) 40px, hsl(var(--border)) 41px)`
                }} />
                <div className="relative z-10 text-center">
                  <MapPin className="h-10 w-10 mx-auto text-primary mb-2" />
                  <p className="text-sm font-semibold text-foreground">Philadelphia School District</p>
                  <p className="text-xs text-muted-foreground mt-1">Live GPS map — use buttons below to simulate bus positions</p>
                </div>
                {/* Simulated bus pins */}
                {buses.filter((b) => b.currentLat).map((bus, i) => (
                  <div
                    key={bus.id}
                    className="absolute flex flex-col items-center"
                    style={{
                      left: `${20 + (i * 20)}%`,
                      top: `${25 + (i * 15)}%`,
                    }}
                  >
                    <div className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full font-bold shadow-lg">
                      {bus.busNumber}
                    </div>
                    <div className="h-2 w-0.5 bg-primary" />
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>
                ))}
              </div>
            </div>

            {/* Bus list with GPS controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {buses.map((bus, i) => (
                <div key={bus.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-1.5 rounded-full", bus.status === "in_transit" ? "bg-blue-100" : "bg-muted")}>
                      <Bus className={cn("h-4 w-4", bus.status === "in_transit" ? "text-blue-600" : "text-muted-foreground")} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Bus {bus.busNumber}</p>
                      {bus.currentLat ? (
                        <p className="text-xs text-muted-foreground">
                          {bus.currentLat.toFixed(4)}, {bus.currentLng?.toFixed(4)}
                          <span className="ml-1 text-emerald-600">● Live</span>
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">No GPS data</p>
                      )}
                    </div>
                  </div>
                  <Button size="sm" variant="secondary" className="cursor-pointer text-xs h-7" onClick={() => handleSimulateGPS(bus.id, i)}>
                    <Navigation className="h-3 w-3 mr-1" />Ping
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Assignments */}
        <TabsContent value="assignments" className="mt-4">
          <Card>
            <CardHeader className="space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <CardTitle className="text-base">Student Transport Assignments — {CURRENT_YEAR}</CardTitle>
                <div className="flex items-center gap-2">
                  {hasActiveAssignmentFilters && (
                    <Button variant="ghost" size="sm" className="cursor-pointer h-8" onClick={resetAssignmentFilters}>
                      <X className="h-3.5 w-3.5 mr-1" />
                      Clear filters
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="cursor-pointer h-8"
                    onClick={() => setShowAssignmentFilters((prev) => !prev)}
                  >
                    <Filter className="h-3.5 w-3.5 mr-1" />
                    {showAssignmentFilters ? "Hide filters" : "Show filters"}
                  </Button>
                </div>
              </div>
              {showAssignmentFilters && (
                <div className="rounded-lg border p-4 space-y-4 bg-muted/10">
                  <StudentFilterFields
                    filters={assignmentFilters}
                    onChange={(filters) => setAssignmentFilters({ ...assignmentFilters, ...filters })}
                    classSections={classSections}
                    gradeLevels={gradeLevels}
                    cities={cities}
                    layout="columns"
                    assignmentExtras={{
                      busId: assignmentFilters.busId,
                      routeId: assignmentFilters.routeId,
                      pickupStop: assignmentFilters.pickupStop,
                      status: assignmentFilters.status,
                      onChange: (patch) => setAssignmentFilters({ ...assignmentFilters, ...patch }),
                      buses,
                      routes,
                      pickupStops,
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Showing {filteredAssignments.length} of {assignments.length} assignments
                  </p>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>No student assignments yet.</p>
                </div>
              ) : filteredAssignments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Filter className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>No assignments match your filters.</p>
                  <Button variant="link" className="cursor-pointer mt-2" onClick={resetAssignmentFilters}>
                    Clear filters
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Student</th>
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Class / Age</th>
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">From</th>
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Bus</th>
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Route</th>
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Pickup</th>
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Drop</th>
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Status</th>
                        <th className="py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAssignments.map((a) => {
                        const student = studentById.get(a.studentId);
                        const bus = buses.find((b) => b.id === a.busId);
                        const route = routes.find((r) => r.id === a.routeId);
                        const age = getStudentAge(student?.dateOfBirth);
                        return (
                          <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30">
                            <td className="py-2 pr-4">
                              <div>{student ? `${student.firstName} ${student.lastName}` : a.studentId}</div>
                              {student?.studentId && (
                                <div className="text-xs text-muted-foreground font-mono">{student.studentId}</div>
                              )}
                            </td>
                            <td className="py-2 pr-4 text-muted-foreground">
                              <div>{[student?.gradeLevel, student?.classSection].filter(Boolean).join(" · ") || "—"}</div>
                              {age !== null && <div className="text-xs">Age {age}</div>}
                            </td>
                            <td className="py-2 pr-4 text-muted-foreground">
                              <div>{student?.city || "—"}</div>
                              {(student?.address || a.pickupStop) && (
                                <div className="text-xs truncate max-w-[160px]">{student?.address || a.pickupStop}</div>
                              )}
                            </td>
                            <td className="py-2 pr-4">{bus ? `Bus ${bus.busNumber}` : "—"}</td>
                            <td className="py-2 pr-4">{route?.routeName ?? "—"}</td>
                            <td className="py-2 pr-4 text-muted-foreground">{a.pickupStop || "—"}</td>
                            <td className="py-2 pr-4 text-muted-foreground">{a.dropStop || "—"}</td>
                            <td className="py-2 pr-4">
                              <Badge variant={a.isActive ? "default" : "secondary"} className="text-xs">
                                {a.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </td>
                            <td className="py-2">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" className="cursor-pointer h-7 w-7" onClick={() => openEditAssignment(a)}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="cursor-pointer h-7 w-7 text-destructive" onClick={() => void routerDeleteWithConfirm(`/dashboard/transport/assignments/${a.id}`, { title: "Remove this assignment?", onSuccess: () => toast.success("Removed"), onError: () => toast.error("Failed to remove") })}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
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
      </Tabs>
    </div>
  );
}

export default function TransportPage(props: PageProps) {
  return (
    <DashboardLayout>
      <TransportContent {...props} />
    </DashboardLayout>
  );
}
