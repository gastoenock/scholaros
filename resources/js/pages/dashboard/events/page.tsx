import { useState } from "react";
import { router } from "@inertiajs/react";
import { DashboardLayout } from "../_components/layout.tsx";
import { useCurrentSchool } from "../_components/use-current-school.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Calendar, Plus, Pencil, Trash2, MapPin, Clock } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { routerDeleteWithConfirm } from "@/lib/confirm.ts";
import type { Branch, EventRecord } from "@/lib/types.ts";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty.tsx";

type PageProps = {
  events: EventRecord[];
  branches: Branch[];
  filters: { status: string; eventType: string };
};

const EVENT_TYPES = ["general", "academic", "sports", "cultural", "holiday", "meeting", "other"] as const;

function EventFormDialog({
  open,
  onClose,
  editEvent,
  branches,
}: {
  open: boolean;
  onClose: () => void;
  editEvent?: EventRecord | null;
  branches: Branch[];
}) {
  const [title, setTitle] = useState(editEvent?.title ?? "");
  const [description, setDescription] = useState(editEvent?.description ?? "");
  const [startAt, setStartAt] = useState(editEvent?.startAt ? editEvent.startAt.slice(0, 16) : "");
  const [endAt, setEndAt] = useState(editEvent?.endAt ? editEvent.endAt.slice(0, 16) : "");
  const [location, setLocation] = useState(editEvent?.location ?? "");
  const [eventType, setEventType] = useState(editEvent?.eventType ?? "general");
  const [status, setStatus] = useState(editEvent?.status ?? "scheduled");
  const [schoolBranchId, setSchoolBranchId] = useState(editEvent?.schoolBranchId ? String(editEvent.schoolBranchId) : "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startAt) {
      toast.error("Title and start date are required");
      return;
    }

    setSubmitting(true);
    const payload = {
      title,
      description: description || undefined,
      startAt: new Date(startAt).toISOString(),
      endAt: endAt ? new Date(endAt).toISOString() : undefined,
      location: location || undefined,
      eventType,
      status,
      schoolBranchId: schoolBranchId ? parseInt(schoolBranchId, 10) : undefined,
    };

    const options = {
      preserveScroll: true,
      onSuccess: () => {
        toast.success(editEvent ? "Event updated" : "Event created");
        onClose();
      },
      onError: () => toast.error("Failed to save event"),
      onFinish: () => setSubmitting(false),
    };

    if (editEvent) {
      router.put(`/dashboard/events/${editEvent.id}`, payload, options);
    } else {
      router.post("/dashboard/events", payload, options);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editEvent ? "Edit Event" : "Create Event"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start *</Label>
              <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} required />
            </div>
            <div>
              <Label>End</Label>
              <Input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Type</Label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger className="cursor-pointer"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((t) => <SelectItem key={t} value={t} className="cursor-pointer capitalize">{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="cursor-pointer"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["scheduled", "completed", "cancelled"].map((s) => <SelectItem key={s} value={s} className="cursor-pointer capitalize">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Location</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Main hall, sports field..." />
          </div>
          {branches.length > 0 && (
            <div>
              <Label>Branch (optional)</Label>
              <Select value={schoolBranchId || "none"} onValueChange={(v) => setSchoolBranchId(v === "none" ? "" : v)}>
                <SelectTrigger className="cursor-pointer"><SelectValue placeholder="All branches" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="cursor-pointer">All branches</SelectItem>
                  {branches.map((b) => <SelectItem key={b.id} value={String(b.id)} className="cursor-pointer">{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button type="submit" disabled={submitting} className="w-full cursor-pointer">
            {submitting ? "Saving..." : editEvent ? "Update Event" : "Create Event"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EventsContent({ events, branches, filters }: PageProps) {
  const { schoolId } = useCurrentSchool();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<EventRecord | null>(null);

  const handleFilter = (key: "status" | "eventType", value: string) => {
    router.get("/dashboard/events", {
      status: key === "status" ? (value === "all" ? undefined : value) : (filters.status === "all" ? undefined : filters.status),
      eventType: key === "eventType" ? (value === "all" ? undefined : value) : (filters.eventType === "all" ? undefined : filters.eventType),
    }, { preserveState: true, preserveScroll: true });
  };

  const handleDelete = async (id: number) => {
    await routerDeleteWithConfirm(`/dashboard/events/${id}`, {
      title: "Delete this event?",
      onSuccess: () => toast.success("Event removed"),
      onError: () => toast.error("Failed to remove event"),
    });
  };

  if (!schoolId) {
    return <div className="text-muted-foreground text-center py-20">No school linked to your account.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">School Events</h1>
          <p className="text-muted-foreground">Manage calendar events and activities</p>
        </div>
        <div className="flex gap-2">
          <Select value={filters.status} onValueChange={(v) => handleFilter("status", v)}>
            <SelectTrigger className="w-[130px] cursor-pointer"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["all", "scheduled", "completed", "cancelled"].map((s) => <SelectItem key={s} value={s} className="cursor-pointer capitalize">{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.eventType} onValueChange={(v) => handleFilter("eventType", v)}>
            <SelectTrigger className="w-[130px] cursor-pointer"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="cursor-pointer">All types</SelectItem>
              {EVENT_TYPES.map((t) => <SelectItem key={t} value={t} className="cursor-pointer capitalize">{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button className="cursor-pointer" onClick={() => { setEditEvent(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-1.5" /> Add Event
          </Button>
        </div>
      </div>

      {events.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><Calendar /></EmptyMedia>
            <EmptyTitle>No events yet</EmptyTitle>
            <EmptyDescription>Create your first school event or activity.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="sm" onClick={() => setDialogOpen(true)} className="cursor-pointer">
              <Plus className="h-4 w-4 mr-1.5" /> Add Event
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map((event) => (
            <Card key={event.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold truncate">{event.title}</p>
                      <Badge variant="secondary" className="capitalize text-xs">{event.eventType}</Badge>
                    </div>
                    {event.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{event.description}</p>}
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{format(new Date(event.startAt), "MMM d, yyyy h:mm a")}</span>
                      {event.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</span>}
                    </div>
                    {event.branch && <p className="text-xs text-muted-foreground mt-1">{event.branch.name}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className="capitalize text-xs">{event.status}</Badge>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 cursor-pointer" onClick={() => { setEditEvent(event); setDialogOpen(true); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 cursor-pointer text-destructive" onClick={() => handleDelete(event.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <EventFormDialog
        key={editEvent?.id ?? "new"}
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditEvent(null); }}
        editEvent={editEvent}
        branches={branches}
      />
    </div>
  );
}

export default function EventsPage(props: PageProps) {
  return (
    <DashboardLayout>
      <EventsContent {...props} />
    </DashboardLayout>
  );
}
