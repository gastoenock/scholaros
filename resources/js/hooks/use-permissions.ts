import { usePage } from "@inertiajs/react";
import type { SharedPageProps } from "@/lib/types.ts";

export function usePermissions() {
  const permissions = usePage<SharedPageProps>().props.auth.permissions ?? [];

  const can = (permission: string) =>
    permissions.includes("*") || permissions.includes(permission);

  const canAny = (...keys: string[]) => keys.some((key) => can(key));

  return { permissions, can, canAny };
}
