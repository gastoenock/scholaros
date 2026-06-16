// Shared layout wrapper for all dashboard pages
import { useEffect, type ReactNode } from "react";
import { router, usePage } from "@inertiajs/react";
import { toast } from "sonner";
import { DashboardSidebar } from "./sidebar.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { GraduationCap, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import type { SharedPageProps } from "@/lib/types.ts";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { auth, flash, platform, tenancyHost } = usePage<SharedPageProps>().props;
  const managingTenant = platform?.isPlatformAdmin && (!!platform.manageTenantId || tenancyHost?.isTenant);

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
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <main className="md:pl-64 pt-14 md:pt-0">
        {managingTenant && (
          <div className="border-b bg-primary/5 px-6 py-3">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                onClick={() => router.post(tenancyHost?.isTenant ? "/dashboard/landlord/tenants/leave" : "/dashboard/landlord/tenants/leave")}
              >
                Exit school
              </Button>
            </div>
          </div>
        )}
        <div className="p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
