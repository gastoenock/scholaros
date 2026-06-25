import { router } from "@inertiajs/react";
import { format } from "date-fns";
import { Bell, Calendar, ClipboardList, MessageSquare } from "lucide-react";
import { DashboardLayout } from "../_components/layout.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import type { School } from "@/lib/types.ts";

type NotificationRow = {
  id: number;
  title: string;
  message?: string | null;
  createdAt: string;
};

type EventRow = {
  id: number;
  title: string;
  startAt: string;
  location?: string | null;
};

type PageProps = {
  school: School | null;
  user: { name: string; role: string };
  notifications: NotificationRow[];
  upcomingEvents: EventRow[];
};

function StaffHomeInner({ school, user, notifications, upcomingEvents }: PageProps) {
  const greeting = new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 17 ? "Afternoon" : "Evening";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Good {greeting}, {user.name.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground text-sm mt-1 capitalize">
            {user.role.replace(/_/g, " ")}{school ? ` · ${school.name}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => router.visit("/dashboard/notifications")}>
            <Bell className="h-4 w-4 mr-1.5" /> Notifications
          </Button>
          <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => router.visit("/dashboard/messages")}>
            <MessageSquare className="h-4 w-4 mr-1.5" /> Messages
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-sm border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <ClipboardList className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{notifications.length}</p>
                <p className="text-xs text-muted-foreground">Recent alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10">
                <Calendar className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{upcomingEvents.length}</p>
                <p className="text-xs text-muted-foreground">Upcoming events</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10">
                <Bell className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold">Staff workspace</p>
                <p className="text-xs text-muted-foreground">Administrative tools & alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Recent Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No notifications yet.</p>
            ) : (
              <div className="space-y-3">
                {notifications.map((n) => (
                  <div key={n.id} className="rounded-lg border border-border/60 p-3 hover:bg-muted/30 transition-colors">
                    <p className="text-sm font-medium">{n.title}</p>
                    {n.message && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.message}</p>}
                    <p className="text-[11px] text-muted-foreground mt-2">
                      {format(new Date(n.createdAt), "MMM d, yyyy · h:mm a")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No upcoming events.</p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((e) => (
                  <div key={e.id} className="flex items-start gap-3 rounded-lg border border-border/60 p-3">
                    <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{e.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(e.startAt), "EEE, MMM d · h:mm a")}
                        {e.location ? ` · ${e.location}` : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function StaffHomePage(props: PageProps) {
  return (
    <DashboardLayout>
      <StaffHomeInner {...props} />
    </DashboardLayout>
  );
}
