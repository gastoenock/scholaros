import { Link, router } from "@inertiajs/react";
import { cn } from "@/lib/utils.ts";
import {
  GraduationCap,
  UserCircle,
  LogOut,
  X,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth.ts";
import { Avatar, AvatarFallback } from "@/components/ui/avatar.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible.tsx";
import { dashboardHomeForRole } from "@/hooks/use-dashboard-home.ts";
import {
  groupHasActiveItem,
  isNavItemActive,
  resolveNavHref,
  type NavItem,
  type VisibleNavGroup,
} from "./dashboard-nav.ts";
import { useDashboardNav } from "./use-dashboard-nav.ts";

function NavLink({
  item,
  role,
  currentPath,
  navHrefs,
  onClose,
  nested = false,
}: {
  item: NavItem;
  role?: string;
  currentPath: string;
  navHrefs: string[];
  onClose?: () => void;
  nested?: boolean;
}) {
  const href = resolveNavHref(item, role);
  const isActive = isNavItemActive(href, currentPath, role, navHrefs);

  return (
    <Link
      href={href}
      onClick={onClose}
      className={cn(
        "flex items-center gap-3 rounded-xl text-sm font-medium transition-all cursor-pointer",
        nested ? "px-3 py-2 ml-6" : "px-3 py-2.5",
        isActive
          ? nested
            ? "bg-primary/10 text-primary font-semibold"
            : "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
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
}

function NavGroupSection({
  group,
  role,
  currentPath,
  navHrefs,
  open,
  onOpenChange,
  onClose,
}: {
  group: VisibleNavGroup;
  role?: string;
  currentPath: string;
  navHrefs: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose?: () => void;
}) {
  const hasActive = groupHasActiveItem(group, currentPath, role, navHrefs);

  if (group.id === "home") {
    return (
      <div className="space-y-0.5 pb-2 mb-2 border-b border-border/60">
        {group.items.map((item) => (
          <NavLink
            key={`${group.id}-${item.label}`}
            item={item}
            role={role}
            currentPath={currentPath}
            navHrefs={navHrefs}
            onClose={onClose}
          />
        ))}
      </div>
    );
  }

  if (group.items.length === 1) {
    return (
      <NavLink
        item={group.items[0]}
        role={role}
        currentPath={currentPath}
        navHrefs={navHrefs}
        onClose={onClose}
      />
    );
  }

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger
        className={cn(
          "flex w-full items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer",
          hasActive
            ? "text-foreground bg-muted/50"
            : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
        )}
      >
        <group.icon className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1 text-left">{group.label}</span>
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 opacity-60" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-0.5 space-y-0.5 pb-1">
        {group.items.map((item) => (
          <NavLink
            key={`${group.id}-${item.label}-${item.href}`}
            item={item}
            role={role}
            currentPath={currentPath}
            navHrefs={navHrefs}
            onClose={onClose}
            nested
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { signout } = useAuth();
  const {
    groups,
    navHrefs,
    currentPath,
    role: rawRole,
    managingTenant,
    manageTenantName,
    user,
  } = useDashboardNav();
  const role = rawRole ?? undefined;

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const group of groups) {
      initial[group.id] = groupHasActiveItem(group, currentPath, role, navHrefs);
    }
    return initial;
  });

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      for (const group of groups) {
        if (groupHasActiveItem(group, currentPath, role, navHrefs)) {
          next[group.id] = true;
        }
      }
      return next;
    });
  }, [currentPath, groups, role, navHrefs]);

  const handleSignOut = () => {
    void signout();
  };

  const handleLeaveTenant = () => {
    router.post("/dashboard/landlord/tenants/leave", {}, { preserveScroll: true });
    onClose?.();
  };

  return (
    <div className="flex flex-col h-full bg-card text-foreground">
      <div className="flex items-center justify-between px-4 h-16 border-b border-border/60">
        <div
          className="flex items-center gap-2.5 cursor-pointer"
          onClick={() => { router.visit(dashboardHomeForRole(role)); onClose?.(); }}
        >
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-base font-bold tracking-tight">ScholarOS</span>
        </div>
        {onClose && (
          <button title="Close menu" onClick={onClose} className="cursor-pointer text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {role && (
        <div className="px-4 py-3 border-b border-border/60 space-y-2">
          <Badge variant="secondary" className="capitalize text-xs font-medium">
            {role.replace(/_/g, " ")}
          </Badge>
          {managingTenant && manageTenantName && (
            <div className="rounded-xl bg-muted/50 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Managing</p>
              <p className="text-xs font-semibold truncate">{manageTenantName}</p>
              <button
                type="button"
                onClick={handleLeaveTenant}
                className="mt-2 text-[11px] font-medium text-primary hover:underline cursor-pointer"
              >
                Exit school
              </button>
            </div>
          )}
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {groups.map((group) => (
          <NavGroupSection
            key={group.id}
            group={group}
            role={role}
            currentPath={currentPath}
            navHrefs={navHrefs}
            open={openGroups[group.id] ?? false}
            onOpenChange={(open) => setOpenGroups((prev) => ({ ...prev, [group.id]: open }))}
            onClose={onClose}
          />
        ))}
      </nav>

      <div className="border-t border-border/60 p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 w-full px-2 py-2 rounded-xl hover:bg-muted/60 transition-colors cursor-pointer">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                  {user?.name?.charAt(0).toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-semibold truncate">{user?.name ?? "User"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile" className="cursor-pointer">
                <UserCircle className="h-4 w-4 mr-2" />
                My Profile
              </Link>
            </DropdownMenuItem>
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

export function DashboardSidebar({
  mobileOpen,
  onMobileOpenChange,
}: {
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = mobileOpen ?? internalOpen;
  const setOpen = onMobileOpenChange ?? setInternalOpen;

  return (
    <>
      <aside className="hidden md:flex md:w-[260px] md:flex-col md:fixed md:inset-y-0 border-r border-border/60 bg-card z-30 shadow-sm">
        <SidebarContent />
      </aside>

      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-72 flex-shrink-0 shadow-xl">
            <SidebarContent onClose={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
