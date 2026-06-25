import type { AuthUser } from "@/lib/types.ts";

export function dashboardHomeForRole(role?: AuthUser["role"] | string): string {
  switch (role) {
    case "parent":
      return "/dashboard/parent-portal";
    case "student":
      return "/dashboard/student";
    case "teacher":
      return "/dashboard/teacher";
    default:
      return "/dashboard";
  }
}
