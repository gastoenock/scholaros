import { Label } from "@/components/ui/label.tsx";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select.tsx";
import {
  defaultSemesterId,
  defaultTermId,
  defaultYearId,
  semestersForYear,
  termsForSemester,
  type AcademicCalendar,
} from "@/lib/academic-calendar.ts";

type AcademicYearFieldProps = {
  calendar: AcademicCalendar | null | undefined;
  value: number | null;
  onChange: (yearId: number) => void;
  label?: string;
  required?: boolean;
};

export function AcademicYearField({
  calendar,
  value,
  onChange,
  label = "Academic Year",
  required = false,
}: AcademicYearFieldProps) {
  const selected = value ?? defaultYearId(calendar);

  if (!calendar?.years.length) {
    return null;
  }

  return (
    <div className="space-y-1.5">
      <Label>{label}{required ? " *" : ""}</Label>
      <Select
        value={selected ? String(selected) : undefined}
        onValueChange={(next) => onChange(Number(next))}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select academic year" />
        </SelectTrigger>
        <SelectContent>
          {calendar.years.map((year) => (
            <SelectItem key={year.id} value={String(year.id)}>
              {year.name}{year.isCurrent ? " (current)" : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

type AcademicSemesterFieldProps = {
  calendar: AcademicCalendar | null | undefined;
  yearId: number | null;
  value: number | null;
  onChange: (semesterId: number) => void;
  label?: string;
  required?: boolean;
};

export function AcademicSemesterField({
  calendar,
  yearId,
  value,
  onChange,
  label = "Semester",
  required = false,
}: AcademicSemesterFieldProps) {
  const resolvedYearId = yearId ?? defaultYearId(calendar);
  const semesters = semestersForYear(calendar, resolvedYearId ?? 0);
  const selected = value ?? defaultSemesterId(calendar, resolvedYearId);

  if (!semesters.length) {
    return null;
  }

  return (
    <div className="space-y-1.5">
      <Label>{label}{required ? " *" : ""}</Label>
      <Select
        value={selected ? String(selected) : undefined}
        onValueChange={(next) => onChange(Number(next))}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select semester" />
        </SelectTrigger>
        <SelectContent>
          {semesters.map((semester) => (
            <SelectItem key={semester.id} value={String(semester.id)}>
              {semester.name}{semester.isCurrent ? " (current)" : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

type AcademicTermFieldProps = {
  calendar: AcademicCalendar | null | undefined;
  yearId: number | null;
  semesterId: number | null;
  value: number | null;
  onChange: (termId: number) => void;
  label?: string;
  required?: boolean;
};

export function AcademicTermField({
  calendar,
  yearId,
  semesterId,
  value,
  onChange,
  label = "Term",
  required = false,
}: AcademicTermFieldProps) {
  const resolvedYearId = yearId ?? defaultYearId(calendar);
  const resolvedSemesterId = semesterId ?? defaultSemesterId(calendar, resolvedYearId);
  const terms = termsForSemester(calendar, resolvedYearId ?? 0, resolvedSemesterId ?? 0);
  const selected = value ?? defaultTermId(calendar, resolvedYearId, resolvedSemesterId);

  if (!terms.length) {
    return null;
  }

  return (
    <div className="space-y-1.5">
      <Label>{label}{required ? " *" : ""}</Label>
      <Select
        value={selected ? String(selected) : undefined}
        onValueChange={(next) => onChange(Number(next))}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select term" />
        </SelectTrigger>
        <SelectContent>
          {terms.map((term) => (
            <SelectItem key={term.id} value={String(term.id)}>
              {term.name}{term.isCurrent ? " (current)" : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

type AcademicCalendarFieldsProps = {
  calendar: AcademicCalendar | null | undefined;
  yearId: number | null;
  semesterId: number | null;
  termId: number | null;
  onYearChange: (yearId: number) => void;
  onSemesterChange: (semesterId: number) => void;
  onTermChange: (termId: number) => void;
  showTerm?: boolean;
  requireTerm?: boolean;
};

export function AcademicCalendarFields({
  calendar,
  yearId,
  semesterId,
  termId,
  onYearChange,
  onSemesterChange,
  onTermChange,
  showTerm = true,
  requireTerm = false,
}: AcademicCalendarFieldsProps) {
  return (
    <>
      <AcademicYearField calendar={calendar} value={yearId} onChange={(id) => {
        onYearChange(id);
        const nextSemester = defaultSemesterId(calendar, id);
        if (nextSemester) {
          onSemesterChange(nextSemester);
          const nextTerm = defaultTermId(calendar, id, nextSemester);
          if (nextTerm) {
            onTermChange(nextTerm);
          }
        }
      }} required />
      <AcademicSemesterField
        calendar={calendar}
        yearId={yearId}
        value={semesterId}
        onChange={(id) => {
          onSemesterChange(id);
          const nextTerm = defaultTermId(calendar, yearId ?? defaultYearId(calendar), id);
          if (nextTerm) {
            onTermChange(nextTerm);
          }
        }}
      />
      {showTerm && (
        <AcademicTermField
          calendar={calendar}
          yearId={yearId}
          semesterId={semesterId}
          value={termId}
          onChange={onTermChange}
          required={requireTerm}
        />
      )}
    </>
  );
}
