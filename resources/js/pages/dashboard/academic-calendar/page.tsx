import { useState } from "react";
import { router } from "@inertiajs/react";
import { DashboardLayout } from "../_components/layout.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog.tsx";
import { toast } from "sonner";
import { routerDeleteWithConfirm } from "@/lib/confirm.ts";
import { CalendarRange, Plus, Star } from "lucide-react";
import type { AcademicCalendar, AcademicSemesterOption, AcademicTermOption, AcademicYearOption } from "@/lib/academic-calendar.ts";

type PageProps = {
  calendar: AcademicCalendar;
};

function AcademicCalendarContent({ calendar }: PageProps) {
  const [yearDialogOpen, setYearDialogOpen] = useState(false);
  const [yearForm, setYearForm] = useState({ name: "", startDate: "", endDate: "", isCurrent: true });

  const createYear = () => {
    if (!yearForm.name.trim()) return;
    router.post("/dashboard/academic-calendar/years", yearForm, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success("Academic year created");
        setYearDialogOpen(false);
        setYearForm({ name: "", startDate: "", endDate: "", isCurrent: true });
      },
      onError: () => toast.error("Failed to create academic year"),
    });
  };

  const setCurrentYear = (yearId: number) => {
    router.post(`/dashboard/academic-calendar/years/${yearId}/current`, {}, {
      preserveScroll: true,
      onSuccess: () => toast.success("Current year updated"),
    });
  };

  const setCurrentSemester = (semesterId: number) => {
    router.post(`/dashboard/academic-calendar/semesters/${semesterId}/current`, {}, {
      preserveScroll: true,
      onSuccess: () => toast.success("Current semester updated"),
    });
  };

  const setCurrentTerm = (termId: number) => {
    router.post(`/dashboard/academic-calendar/terms/${termId}/current`, {}, {
      preserveScroll: true,
      onSuccess: () => toast.success("Current term updated"),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarRange className="h-6 w-6 text-primary" />
            Academic Calendar
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage academic years, semesters (2 per year), and terms (2 per semester).
          </p>
        </div>
        <Button onClick={() => setYearDialogOpen(true)} className="cursor-pointer">
          <Plus className="h-4 w-4 mr-2" />Add Academic Year
        </Button>
      </div>

      <div className="space-y-4">
        {calendar.years.map((year: AcademicYearOption) => (
          <Card key={year.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">{year.name}</CardTitle>
                  {year.isCurrent && <Badge>Current Year</Badge>}
                </div>
                <div className="flex gap-2">
                  {!year.isCurrent && (
                    <Button size="sm" variant="outline" onClick={() => setCurrentYear(year.id)} className="cursor-pointer">
                      <Star className="h-3.5 w-3.5 mr-1" />Set Current
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => void routerDeleteWithConfirm(`/dashboard/academic-calendar/years/${year.id}`, {
                      title: `Delete ${year.name}?`,
                      onSuccess: () => toast.success("Year removed"),
                    })}
                    className="cursor-pointer"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {year.semesters.map((semester: AcademicSemesterOption) => (
                <div key={semester.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{semester.name}</h3>
                      {semester.isCurrent && <Badge variant="secondary">Current Semester</Badge>}
                    </div>
                    <div className="flex gap-2">
                      {!semester.isCurrent && (
                        <Button size="sm" variant="outline" onClick={() => setCurrentSemester(semester.id)} className="cursor-pointer">
                          Set Current
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {semester.terms.map((term: AcademicTermOption) => (
                      <div key={term.id} className="flex items-center justify-between rounded-md border px-3 py-2 bg-muted/30">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{term.name}</span>
                          {term.isCurrent && <Badge variant="outline" className="text-xs">Current</Badge>}
                        </div>
                        {!term.isCurrent && (
                          <Button size="sm" variant="ghost" onClick={() => setCurrentTerm(term.id)} className="cursor-pointer h-7 text-xs">
                            Set Current
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={yearDialogOpen} onOpenChange={setYearDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Academic Year</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Year Name *</Label>
              <Input value={yearForm.name} onChange={(e) => setYearForm((p) => ({ ...p, name: e.target.value }))} placeholder="2025-2026" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start Date</Label>
                <Input type="date" value={yearForm.startDate} onChange={(e) => setYearForm((p) => ({ ...p, startDate: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>End Date</Label>
                <Input type="date" value={yearForm.endDate} onChange={(e) => setYearForm((p) => ({ ...p, endDate: e.target.value }))} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Creates Semester 1 & 2 with Term 1–4 automatically.
            </p>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setYearDialogOpen(false)} className="cursor-pointer">Cancel</Button>
            <Button onClick={createYear} disabled={!yearForm.name.trim()} className="cursor-pointer">Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AcademicCalendarPage(props: PageProps) {
  return (
    <DashboardLayout>
      <AcademicCalendarContent {...props} />
    </DashboardLayout>
  );
}
