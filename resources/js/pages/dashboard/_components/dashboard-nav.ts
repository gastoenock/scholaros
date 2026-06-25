import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  CreditCard,
  Bus,
  Home,
  Bell,
  BarChart3,
  SlidersHorizontal,
  Cog,
  Shield,
  School,
  ClipboardList,
  Package,
  UserCheck,
  CalendarRange,
  FileBarChart,
  DoorOpen,
  Building2,
  Handshake,
  GraduationCap,
  Wallet,
  MessageSquare,
} from "lucide-react";
import { dashboardHomeForRole } from "@/hooks/use-dashboard-home.ts";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  roles?: string[];
  badge?: string;
  /** Use role-specific dashboard home instead of href */
  roleHome?: boolean;
};

export type NavGroup = {
  id: string;
  label: string;
  icon: LucideIcon;
  /** When true, only shown to platform admins not managing a tenant */
  platformOnly?: boolean;
  items: NavItem[];
};

export const platformOnlyGroupIds = new Set(["platform"]);

export const dashboardNavGroups: NavGroup[] = [
  {
    id: "home",
    label: "Home",
    icon: LayoutDashboard,
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "admin_staff", "principal", "vice_principal", "superadmin"], roleHome: true },
      { label: "Teacher Home", href: "/dashboard/teacher", icon: LayoutDashboard, roles: ["teacher"], roleHome: true },
      { label: "Student Home", href: "/dashboard/student", icon: LayoutDashboard, roles: ["student"], roleHome: true },
      { label: "Parent Portal", href: "/dashboard/parent-portal", icon: UserCheck, roles: ["parent"], roleHome: true },
    ],
  },
  {
    id: "platform",
    label: "Platform",
    icon: Shield,
    platformOnly: true,
    items: [
      { label: "Schools", href: "/dashboard/schools", icon: School, roles: ["superadmin", "landlord"] },
      { label: "Admin Panel", href: "/dashboard/admin", icon: Shield, roles: ["superadmin", "landlord"] },
      { label: "System Settings", href: "/dashboard/admin/settings", icon: Cog, roles: ["superadmin", "landlord"] },
    ],
  },
  {
    id: "people",
    label: "People",
    icon: Users,
    items: [
      { label: "Students", href: "/dashboard/students", icon: Users, roles: ["admin", "teacher", "superadmin"] },
      { label: "Staff", href: "/dashboard/staff", icon: Users, roles: ["admin", "superadmin"] },
      { label: "Admissions", href: "/dashboard/admissions", icon: ClipboardList, roles: ["admin", "superadmin"] },
    ],
  },
  {
    id: "academics",
    label: "Academics",
    icon: GraduationCap,
    items: [
      { label: "Classes", href: "/dashboard/classes", icon: BookOpen, roles: ["admin", "teacher", "superadmin"] },
      { label: "Rooms", href: "/dashboard/rooms", icon: DoorOpen, roles: ["admin", "superadmin"] },
      { label: "Attendance", href: "/dashboard/attendance", icon: Calendar, roles: ["admin", "teacher", "superadmin"] },
      { label: "Timetable", href: "/dashboard/timetable", icon: Calendar, roles: ["admin", "teacher", "student", "superadmin"] },
      { label: "Academics", href: "/dashboard/academics", icon: BookOpen, roles: ["admin", "teacher", "student", "parent", "superadmin"] },
      { label: "Exam Reports", href: "/dashboard/academics/reports", icon: FileBarChart, roles: ["admin", "teacher", "superadmin"] },
      { label: "Academic Calendar", href: "/dashboard/academic-calendar", icon: CalendarRange, roles: ["admin", "superadmin"] },
    ],
  },
  {
    id: "campus-life",
    label: "Campus Life",
    icon: Handshake,
    items: [
      { label: "Meetings", href: "/dashboard/meetings", icon: Handshake, roles: ["admin", "teacher", "parent", "superadmin"] },
      { label: "Events", href: "/dashboard/events", icon: Calendar, roles: ["admin", "teacher", "superadmin"] },
      { label: "Library", href: "/dashboard/library", icon: BookOpen, roles: ["admin", "teacher", "student", "superadmin"] },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    icon: Wallet,
    items: [
      { label: "Finance", href: "/dashboard/finance", icon: CreditCard, roles: ["admin", "parent", "superadmin"] },
      { label: "Payroll & HR", href: "/dashboard/payroll", icon: Users, roles: ["admin", "superadmin"] },
      { label: "Transport", href: "/dashboard/transport", icon: Bus, roles: ["admin", "parent", "superadmin"] },
      { label: "Dormitory", href: "/dashboard/dormitory", icon: Home, roles: ["admin", "superadmin"] },
      { label: "Inventory", href: "/dashboard/assets", icon: Package, roles: ["admin", "superadmin"] },
      { label: "Campuses", href: "/dashboard/campus", icon: Building2, roles: ["admin", "superadmin"] },
    ],
  },
  {
    id: "insights",
    label: "Insights & Comms",
    icon: BarChart3,
    items: [
      { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3, roles: ["admin", "superadmin"] },
      { label: "Messages", href: "/dashboard/messages", icon: MessageSquare, roles: ["admin", "teacher", "student", "parent", "superadmin"] },
      { label: "Notifications", href: "/dashboard/notifications", icon: Bell, roles: ["admin", "teacher", "student", "parent", "superadmin"] },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    icon: SlidersHorizontal,
    items: [
      { label: "Settings", href: "/dashboard/settings", icon: SlidersHorizontal, roles: ["admin", "superadmin"] },
    ],
  },
];

export function canAccessNavItem(item: NavItem, role: string): boolean {
  if (!item.roles) {
    return true;
  }

  if (item.roles.includes(role)) {
    return true;
  }

  if ((role === "superadmin" || role === "landlord") && item.roles.includes("superadmin")) {
    return true;
  }

  return false;
}

export function resolveNavHref(item: NavItem, role?: string): string {
  if (item.roleHome && role) {
    return dashboardHomeForRole(role);
  }

  return item.href;
}

export function isNavItemActive(
  href: string,
  currentPath: string,
  role?: string,
  peerHrefs?: string[],
): boolean {
  const resolved = href === "/dashboard" && role
    ? dashboardHomeForRole(role)
    : href;

  if (resolved === "/dashboard") {
    return currentPath === "/dashboard" || currentPath === "/dashboard/staff-home";
  }

  if (currentPath === resolved) {
    return true;
  }

  if (!currentPath.startsWith(`${resolved}/`)) {
    return false;
  }

  if (!peerHrefs?.length) {
    return false;
  }

  return !peerHrefs.some(
    (peer) =>
      peer !== resolved &&
      peer.startsWith(`${resolved}/`) &&
      (currentPath === peer || currentPath.startsWith(`${peer}/`)),
  );
}

export function collectNavHrefs(groups: VisibleNavGroup[], role?: string): string[] {
  return groups.flatMap((group) => group.items.map((item) => resolveNavHref(item, role)));
}

export function findActiveNavItem(
  groups: VisibleNavGroup[],
  currentPath: string,
  role?: string,
): { group: VisibleNavGroup; item: NavItem } | null {
  const peerHrefs = collectNavHrefs(groups, role);
  let best: { group: VisibleNavGroup; item: NavItem; href: string } | null = null;

  for (const group of groups) {
    for (const item of group.items) {
      const href = resolveNavHref(item, role);
      if (isNavItemActive(href, currentPath, role, peerHrefs)) {
        if (!best || href.length > best.href.length) {
          best = { group, item, href };
        }
      }
    }
  }

  return best ? { group: best.group, item: best.item } : null;
}

export type VisibleNavGroup = NavGroup & { items: NavItem[] };

export function filterNavGroups(
  groups: NavGroup[],
  role: string | undefined,
  options: { isPlatformAdmin: boolean; managingTenant: boolean },
): VisibleNavGroup[] {
  const { isPlatformAdmin, managingTenant } = options;

  return groups
    .filter((group) => {
      if (isPlatformAdmin && !managingTenant) {
        return group.platformOnly === true || group.id === "home";
      }

      if (group.platformOnly) {
        return false;
      }

      return true;
    })
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !role || canAccessNavItem(item, role)),
    }))
    .filter((group) => group.items.length > 0);
}

export type NavBreadcrumb = { label: string; href?: string };

export function breadcrumbsForPath(
  groups: VisibleNavGroup[],
  currentPath: string,
  role?: string,
): NavBreadcrumb[] {
  const trail: NavBreadcrumb[] = [{ label: "Dashboard", href: dashboardHomeForRole(role) }];
  const match = findActiveNavItem(groups, currentPath, role);

  if (match) {
    if (match.group.id !== "home") {
      trail.push({ label: match.group.label });
    }
    if (trail[trail.length - 1]?.label !== match.item.label) {
      trail.push({ label: match.item.label, href: resolveNavHref(match.item, role) });
    }
    return trail;
  }

  if (currentPath !== "/dashboard" && currentPath !== dashboardHomeForRole(role)) {
    const segment = currentPath.split("/").filter(Boolean).pop();
    if (segment) {
      trail.push({ label: segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) });
    }
  }

  return trail;
}

export function groupHasActiveItem(
  group: VisibleNavGroup,
  currentPath: string,
  role?: string,
  allPeerHrefs?: string[],
): boolean {
  const peerHrefs = allPeerHrefs ?? collectNavHrefs([group], role);

  return group.items.some((item) =>
    isNavItemActive(resolveNavHref(item, role), currentPath, role, peerHrefs),
  );
}
