// Shared layout wrapper for all dashboard pages
import { useEffect, useState, type ReactNode } from "react";
import { router, usePage } from "@inertiajs/react";
import { toast } from "sonner";
import { DashboardSidebar } from "./sidebar.tsx";
import { DashboardTopbar } from "./topbar.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { GraduationCap, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { initColorScheme } from "@/lib/theme-schemes.ts";
import type { SharedPageProps } from "@/lib/types.ts";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { auth, flash, platform, tenancyHost } = usePage<SharedPageProps>().props;
  const managingTenant = platform?.isPlatformAdmin && (!!platform.manageTenantId || tenancyHost?.isTenant);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    initColorScheme();
  }, []);

  useEffect(() => {
    if (flash?.success) toast.success(flash.success);
    if (flash?.error) toast.error(flash.error);
  }, [flash?.success, flash?.error]);

  if (!auth.user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <GraduationCap className="h-10 w-10 text-primary" />
          <p className="text-muted-foreground">Please sign in to continue.</p>
          <SignInButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardSidebar mobileOpen={mobileOpen} onMobileOpenChange={setMobileOpen} />
      <div className="md:pl-[260px] flex flex-col min-h-screen">
        <DashboardTopbar onMenuClick={() => setMobileOpen(true)} />
        {managingTenant && (
          <div className="border-b bg-primary/5 px-4 md:px-6 py-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-primary" />
                <span>
                  Managing <strong>{platform.manageTenantName}</strong> as platform admin
                </span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="cursor-pointer"
                onClick={() => router.post("/dashboard/landlord/tenants/leave")}
              >
                Exit school
              </Button>
            </div>
          </div>
        )}
        <main className="flex-1 p-4 md:p-6 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
