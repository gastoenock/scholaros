// Shared hook to get the current user's school context from Inertia props
import { usePage } from "@inertiajs/react";
import type { SharedPageProps } from "@/lib/types.ts";

export function useCurrentSchool() {
  const { auth } = usePage<SharedPageProps>().props;
  const user = auth.user;
  return {
    user,
    schoolId: user?.schoolId ?? undefined,
    role: user?.role ?? undefined,
    isLoading: false,
  };
}
