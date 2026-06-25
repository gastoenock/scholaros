import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { cn } from "@/lib/utils.ts";
import { Bus, MapPin, Phone, Route, User, Navigation } from "lucide-react";

type RouteStop = {
  name: string;
  time: string;
  lat?: number | null;
  lng?: number | null;
};

type BusRoute = {
  id: number;
  routeName: string;
  routeNumber: string;
  stops: RouteStop[];
  morningStartTime?: string | null;
  afternoonStartTime?: string | null;
  isActive: boolean;
};

type BusRecord = {
  id: number;
  busNumber: string;
  plateNumber: string;
  capacity: number;
  driverName: string;
  driverPhone: string;
  matronName?: string | null;
  matronPhone?: string | null;
  currentLat?: number | null;
  currentLng?: number | null;
  lastLocationUpdate?: string | null;
  status: string;
};

type TransportAssignment = {
  id: number;
  studentId: number;
  busId: number;
  routeId: number;
  pickupStop: string;
  dropStop: string;
  academicYear: string;
  isActive: boolean;
};

type StudentLite = {
  id: number;
  firstName: string;
  lastName: string;
  studentId?: string;
  classSection?: string | null;
  gradeLevel?: string | null;
};

export type ChildTransportRow = {
  student: StudentLite;
  assignment: TransportAssignment | null;
  bus: BusRecord | null;
  route: BusRoute | null;
};

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  in_transit: "bg-blue-100 text-blue-700",
  maintenance: "bg-amber-100 text-amber-700",
  inactive: "bg-gray-100 text-gray-700",
};

export function ParentTransportView({ childRows, buses }: { childRows: ChildTransportRow[]; buses: BusRecord[] }) {
  const assignedCount = childRows.filter((c) => c.assignment?.isActive).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">School Transport</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Bus routes and pickup details for your {childRows.length === 1 ? "child" : "children"}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card className="shadow-sm border-border/60">
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Children</p>
            <p className="text-2xl font-bold">{childRows.length}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border/60">
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">On Transport</p>
            <p className="text-2xl font-bold text-emerald-600">{assignedCount}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border/60 col-span-2 sm:col-span-1">
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Buses</p>
            <p className="text-2xl font-bold text-primary">{buses.length}</p>
          </CardContent>
        </Card>
      </div>

      {childRows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            No children linked to your account. Contact your school administrator.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {childRows.map(({ student, assignment, bus, route }) => (
            <Card key={student.id} className="shadow-sm border-border/60 overflow-hidden">
              <CardHeader className="pb-3 bg-muted/20">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">
                      {student.firstName} {student.lastName}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Grade {student.gradeLevel ?? "N/A"}
                      {student.classSection ? ` · ${student.classSection}` : ""}
                      {student.studentId ? ` · ${student.studentId}` : ""}
                    </p>
                  </div>
                  {assignment ? (
                    <Badge variant={assignment.isActive ? "default" : "secondary"} className="text-xs capitalize shrink-0">
                      {assignment.isActive ? "Assigned" : "Inactive"}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs shrink-0">Not assigned</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {!assignment || !bus ? (
                  <p className="text-sm text-muted-foreground">
                    No bus assignment for the current academic year. Contact the school transport office.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="rounded-lg border p-4 space-y-3">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <Bus className="h-4 w-4 text-primary" />
                          Bus {bus.busNumber}
                          <span className={cn("ml-auto text-xs px-2 py-0.5 rounded-full font-medium capitalize", statusColors[bus.status] ?? statusColors.inactive)}>
                            {bus.status.replace("_", " ")}
                          </span>
                        </div>
                        <div className="text-sm space-y-1.5 text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5" />
                            <span>Driver: <span className="text-foreground font-medium">{bus.driverName}</span></span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5" />
                            <a href={`tel:${bus.driverPhone}`} className="text-primary hover:underline">{bus.driverPhone}</a>
                          </div>
                          {bus.matronName && (
                            <div className="flex items-center gap-2">
                              <User className="h-3.5 w-3.5" />
                              <span>Matron: {bus.matronName}{bus.matronPhone ? ` · ${bus.matronPhone}` : ""}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-lg border p-3">
                          <p className="text-xs text-muted-foreground mb-1">Pickup stop</p>
                          <p className="font-medium">{assignment.pickupStop || "—"}</p>
                        </div>
                        <div className="rounded-lg border p-3">
                          <p className="text-xs text-muted-foreground mb-1">Drop stop</p>
                          <p className="font-medium">{assignment.dropStop || "—"}</p>
                        </div>
                      </div>
                    </div>

                    {route && (
                      <div className="rounded-lg border p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold mb-3">
                          <Route className="h-4 w-4 text-primary" />
                          {route.routeName}
                          <span className="text-xs text-muted-foreground font-normal">#{route.routeNumber}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">
                          Morning {route.morningStartTime ?? "—"} · Afternoon {route.afternoonStartTime ?? "—"}
                        </p>
                        <div className="space-y-1">
                          {route.stops.map((stop, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <div className={cn(
                                "h-2 w-2 rounded-full shrink-0",
                                i === 0 ? "bg-emerald-500" : i === route.stops.length - 1 ? "bg-red-500" : "bg-primary/50",
                              )} />
                              <span className="flex-1">{stop.name}</span>
                              <span className="text-xs text-muted-foreground">{stop.time}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {buses.length > 0 && (
        <Card className="shadow-sm border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Navigation className="h-4 w-4 text-primary" />
              Bus locations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {buses.map((bus) => (
              <div key={bus.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn("p-1.5 rounded-full shrink-0", bus.status === "in_transit" ? "bg-blue-100" : "bg-muted")}>
                    <Bus className={cn("h-4 w-4", bus.status === "in_transit" ? "text-blue-600" : "text-muted-foreground")} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">Bus {bus.busNumber}</p>
                    {bus.currentLat != null ? (
                      <p className="text-xs text-muted-foreground truncate">
                        <MapPin className="h-3 w-3 inline mr-0.5" />
                        {bus.currentLat.toFixed(4)}, {bus.currentLng?.toFixed(4)}
                        <span className="ml-1 text-emerald-600">· Live</span>
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Location not available</p>
                    )}
                  </div>
                </div>
                <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize shrink-0", statusColors[bus.status] ?? statusColors.inactive)}>
                  {bus.status.replace("_", " ")}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
