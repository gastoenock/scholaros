import { Link, router, usePage } from "@inertiajs/react";
import { Bell, ChevronDown, Menu, Search, UserCircle } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb.tsx";
import { useAuth } from "@/hooks/use-auth.ts";
import type { SharedPageProps } from "@/lib/types.ts";
import { ThemeCustomizer } from "./theme-customizer.tsx";
import { useDashboardNav } from "./use-dashboard-nav.ts";
import {
  isNavItemActive,
  resolveNavHref,
  type NavItem,
} from "./dashboard-nav.ts";
import { cn } from "@/lib/utils.ts";

type TopbarProps = {
  onMenuClick?: () => void;
};

function TopbarNavDropdown({
  label,
  items,
  role,
  currentPath,
  navHrefs,
}: {
  label: string;
  items: NavItem[];
  role?: string;
  currentPath: string;
  navHrefs: string[];
}) {
  const hasActive = items.some((item) =>
    isNavItemActive(resolveNavHref(item, role), currentPath, role, navHrefs),
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "hidden xl:inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors cursor-pointer",
            hasActive
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
          )}
        >
          {label}
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        {items.map((item) => {
          const href = resolveNavHref(item, role);
          const active = isNavItemActive(href, currentPath, role, navHrefs);
          return (
            <DropdownMenuItem key={`${label}-${item.href}`} asChild>
              <Link
                href={href}
                className={cn("cursor-pointer", active && "bg-primary/10 text-primary font-medium")}
              >
                <item.icon className="h-4 w-4 mr-2" />
                {item.label}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DashboardTopbar({ onMenuClick }: TopbarProps) {
  const { auth } = usePage<SharedPageProps>().props;
  const user = auth.user;
  const { signout } = useAuth();
  const [query, setQuery] = useState("");
  const { groups, breadcrumbs, currentPath, role: rawRole, navHrefs } = useDashboardNav();
  const role = rawRole ?? undefined;

  const navDropdownGroups = groups.filter(
    (group) => group.id !== "home" && group.items.length > 1,
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      router.visit(`/dashboard/students?search=${encodeURIComponent(q)}`);
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border/60 bg-card/80 backdrop-blur-md px-4 md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden h-9 w-9 cursor-pointer rounded-lg"
        onClick={onMenuClick}
        title="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <Breadcrumb className="hidden md:flex min-w-0 flex-1">
        <BreadcrumbList>
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <span key={`${crumb.label}-${index}`} className="contents">
                {index > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {isLast || !crumb.href ? (
                    <BreadcrumbPage className="truncate max-w-[180px] lg:max-w-none">
                      {crumb.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={crumb.href} className="truncate max-w-[140px]">
                        {crumb.label}
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </span>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>

      <nav className="hidden lg:flex items-center gap-0.5 flex-shrink-0" aria-label="Quick navigation">
        {navDropdownGroups.map((group) => (
          <TopbarNavDropdown
            key={group.id}
            label={group.label}
            items={group.items}
            role={role}
            currentPath={currentPath}
            navHrefs={navHrefs}
          />
        ))}
      </nav>

      <form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-xs xl:max-w-md ml-auto">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search students, classes…"
            className="pl-9 h-9 bg-muted/40 border-transparent focus-visible:bg-background rounded-lg"
          />
        </div>
      </form>

      <div className="flex items-center gap-1 flex-shrink-0">
        <ThemeCustomizer />

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 cursor-pointer rounded-lg relative"
          title="Notifications"
          onClick={() => router.visit("/dashboard/notifications")}
        >
          <Bell className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/60 transition-colors cursor-pointer">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                  {user?.name?.charAt(0).toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
              <span className="hidden lg:block text-sm font-medium max-w-[120px] truncate">
                {user?.name ?? "User"}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile" className="cursor-pointer">
                <UserCircle className="h-4 w-4 mr-2" />
                My Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => void signout()} className="cursor-pointer text-destructive">
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
