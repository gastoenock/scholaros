import type { SharedPageProps } from "@/lib/types.ts";

export type AcademicTermOption = {
  id: number;
  name: string;
  isCurrent: boolean;
  startDate?: string | null;
  endDate?: string | null;
  sortOrder?: number;
};

export type AcademicSemesterOption = {
  id: number;
  name: string;
  isCurrent: boolean;
  startDate?: string | null;
  endDate?: string | null;
  sortOrder?: number;
  terms: AcademicTermOption[];
};

export type AcademicYearOption = {
  id: number;
  name: string;
  isCurrent: boolean;
  startDate?: string | null;
  endDate?: string | null;
  sortOrder?: number;
  semesters: AcademicSemesterOption[];
};

export type AcademicCalendar = {
  years: AcademicYearOption[];
  currentYearId: number;
  currentSemesterId: number;
  currentTermId: number;
};

export type SharedWithCalendar = SharedPageProps & {
  academicCalendar: AcademicCalendar | null;
};

export function semestersForYear(calendar: AcademicCalendar | null | undefined, yearId: number): AcademicSemesterOption[] {
  return calendar?.years.find((year) => year.id === yearId)?.semesters ?? [];
}

export function termsForSemester(calendar: AcademicCalendar | null | undefined, yearId: number, semesterId: number): AcademicTermOption[] {
  return semestersForYear(calendar, yearId).find((semester) => semester.id === semesterId)?.terms ?? [];
}

export function defaultYearId(calendar: AcademicCalendar | null | undefined): number | null {
  return calendar?.currentYearId ?? calendar?.years[0]?.id ?? null;
}

export function defaultSemesterId(calendar: AcademicCalendar | null | undefined, yearId: number | null): number | null {
  if (!calendar || !yearId) {
    return null;
  }

  const semesters = semestersForYear(calendar, yearId);
  const current = semesters.find((semester) => semester.id === calendar.currentSemesterId);
  if (current) {
    return current.id;
  }

  return semesters.find((semester) => semester.isCurrent)?.id ?? semesters[0]?.id ?? null;
}

export function defaultTermId(calendar: AcademicCalendar | null | undefined, yearId: number | null, semesterId: number | null): number | null {
  if (!calendar || !yearId || !semesterId) {
    return null;
  }

  const terms = termsForSemester(calendar, yearId, semesterId);
  const current = terms.find((term) => term.id === calendar.currentTermId);
  if (current) {
    return current.id;
  }

  return terms.find((term) => term.isCurrent)?.id ?? terms[0]?.id ?? null;
}

export function yearName(calendar: AcademicCalendar | null | undefined, yearId: number | null): string {
  if (!calendar || !yearId) {
    return "";
  }

  return calendar.years.find((year) => year.id === yearId)?.name ?? "";
}

export function semesterName(calendar: AcademicCalendar | null | undefined, yearId: number | null, semesterId: number | null): string {
  if (!calendar || !yearId || !semesterId) {
    return "";
  }

  return semestersForYear(calendar, yearId).find((semester) => semester.id === semesterId)?.name ?? "";
}

export function termName(calendar: AcademicCalendar | null | undefined, yearId: number | null, semesterId: number | null, termId: number | null): string {
  if (!calendar || !yearId || !semesterId || !termId) {
    return "";
  }

  return termsForSemester(calendar, yearId, semesterId).find((term) => term.id === termId)?.name ?? "";
}
