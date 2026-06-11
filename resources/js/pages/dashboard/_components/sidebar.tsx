import { Link, router, usePage } from "@inertiajs/react";
import { cn } from "@/lib/utils.ts";
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  Building2,
  BookOpen,
  Calendar,
  CreditCard,
  Bus,
  Home,
  Bell,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  School,
  ClipboardList,
  Package,
  UserCheck,
  Handshake,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth.ts";
import { Avatar, AvatarFallback } from "@/components/ui/avatar.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import type { SharedPageProps } from "@/lib/types.ts";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  roles?: string[];
  badge?: string;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Schools", href: "/dashboard/schools", icon: School, roles: ["superadmin"] },
  { label: "Admin Panel", href: "/dashboard/admin", icon: Settings, roles: ["superadmin"] },
  { label: "Parent Portal", href: "/dashboard/parent-portal", icon: UserCheck, roles: ["parent"] },
  { label: "Students", href: "/dashboard/students", icon: Users, roles: ["admin", "teacher", "superadmin"] },
  { label: "Staff", href: "/dashboard/staff", icon: Users, roles: ["admin", "superadmin"] },
  { label: "Admissions", href: "/dashboard/admissions", icon: ClipboardList, roles: ["admin", "superadmin"] },
  { label: "Classes", href: "/dashboard/classes", icon: BookOpen, roles: ["admin", "teacher", "superadmin"] },
  { label: "Attendance", href: "/dashboard/attendance", icon: Calendar, roles: ["admin", "teacher", "superadmin"] },
  { label: "Timetable", href: "/dashboard/timetable", icon: Calendar, roles: ["admin", "teacher", "student", "superadmin"] },
  { label: "Academics", href: "/dashboard/academics", icon: BookOpen, roles: ["admin", "teacher", "student", "parent", "superadmin"] },
  { label: "Meetings", href: "/dashboard/meetings", icon: Handshake, roles: ["admin", "teacher", "parent", "superadmin"] },
  { label: "Finance", href: "/dashboard/finance", icon: CreditCard, roles: ["admin", "parent", "superadmin"] },
  { label: "Payroll & HR", href: "/dashboard/payroll", icon: Users, roles: ["admin", "superadmin"] },
  { label: "Transport", href: "/dashboard/transport", icon: Bus, roles: ["admin", "parent", "superadmin"] },
  { label: "Dormitory", href: "/dashboard/dormitory", icon: Home, roles: ["admin", "superadmin"] },
  { label: "Assets", href: "/dashboard/assets", icon: Package, roles: ["admin", "superadmin"] },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3, roles: ["admin", "superadmin"] },
  { label: "Messages", href: "/dashboard/messages", icon: Bell, roles: ["admin", "teacher", "student", "parent", "superadmin"] },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell, roles: ["admin", "teacher", "student", "parent", "superadmin"] },
  { label: "Library", href: "/dashboard/library", icon: BookOpen, roles: ["admin", "teacher", "student", "superadmin"] },
  { label: "Buildings", href: "/dashboard/campus", icon: Building2, roles: ["admin", "superadmin"] },
];

function SidebarContent({
  role,
  user,
  onClose,
}: {
  role?: string;
  user: { name?: string; email?: string } | null;
  onClose?: () => void;
}) {
  const { signout } = useAuth();
  const { url } = usePage();
  const currentPath = url.split("?")[0];

  const visibleItems = navItems.filter(
    (item) => !item.roles || !role || item.roles.includes(role)
  );

  const handleSignOut = () => {
    void signout();
  };

  return (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-sidebar-border">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => { router.visit("/"); onClose?.(); }}
        >
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <span className="text-base font-extrabold">ScholarOS</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="cursor-pointer text-sidebar-foreground/60 hover:text-sidebar-foreground">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Role badge */}
      {role && (
        <div className="px-4 py-3 border-b border-sidebar-border">
          <Badge className="bg-sidebar-primary/20 text-sidebar-primary border-sidebar-primary/30 capitalize text-xs">
            {role}
          </Badge>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {visibleItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? currentPath === "/dashboard"
              : currentPath.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
              {item.badge && (
                <span className="ml-auto text-xs bg-destructive text-white rounded-full px-1.5 py-0.5">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-sidebar-border p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-sidebar-accent/50 transition-colors cursor-pointer">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold">
                  {user?.name?.charAt(0).toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-semibold truncate">{user?.name ?? "User"}</p>
                <p className="text-xs text-sidebar-foreground/50 truncate">{user?.email}</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-sidebar-foreground/50" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function DashboardSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { auth } = usePage<SharedPageProps>().props;
  const currentUser = auth.user;

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-sidebar-border z-30">
        <SidebarContent role={currentUser?.role ?? undefined} user={currentUser} />
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-sidebar border-b border-sidebar-border h-14 flex items-center px-4 gap-3">
        <button onClick={() => setMobileOpen(true)} className="cursor-pointer text-sidebar-foreground">
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <GraduationCap className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          <span className="text-sm font-extrabold text-sidebar-foreground">ScholarOS</span>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 flex-shrink-0">
            <SidebarContent
              role={currentUser?.role ?? undefined}
              user={currentUser}
              onClose={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
