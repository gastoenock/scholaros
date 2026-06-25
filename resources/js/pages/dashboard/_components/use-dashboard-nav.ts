import { useMemo } from "react";
import { usePage } from "@inertiajs/react";
import type { SharedPageProps } from "@/lib/types.ts";
import {
  breadcrumbsForPath,
  collectNavHrefs,
  dashboardNavGroups,
  filterNavGroups,
  groupHasActiveItem,
  type VisibleNavGroup,
} from "./dashboard-nav.ts";

export function useDashboardNav() {
  const page = usePage<SharedPageProps>();
  const { auth, platform, tenancyHost } = page.props;
  const role = auth.user?.role;
  const currentPath = (page.url ?? window.location.pathname).split("?")[0];
  const isPlatformAdmin = platform?.isPlatformAdmin ?? false;
  const managingTenant = isPlatformAdmin && (!!platform?.manageTenantId || tenancyHost?.isTenant);

  const groups = useMemo(
    () => filterNavGroups(dashboardNavGroups, role, { isPlatformAdmin, managingTenant }),
    [role, isPlatformAdmin, managingTenant],
  );

  const navHrefs = useMemo(() => collectNavHrefs(groups, role), [groups, role]);

  const breadcrumbs = useMemo(
    () => breadcrumbsForPath(groups, currentPath, role),
    [groups, currentPath, role],
  );

  const isGroupOpen = (group: VisibleNavGroup) =>
    groupHasActiveItem(group, currentPath, role, navHrefs);

  return {
    groups,
    navHrefs,
    breadcrumbs,
    currentPath,
    role,
    isGroupOpen,
    isPlatformAdmin,
    managingTenant,
    manageTenantName: platform?.manageTenantName ?? null,
    user: auth.user,
  };
}
