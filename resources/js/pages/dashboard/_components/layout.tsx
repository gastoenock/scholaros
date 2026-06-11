// Shared layout wrapper for all dashboard pages
import { useEffect, type ReactNode } from "react";
import { usePage } from "@inertiajs/react";
import { toast } from "sonner";
import { DashboardSidebar } from "./sidebar.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { GraduationCap } from "lucide-react";
import type { SharedPageProps } from "@/lib/types.ts";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { auth, flash } = usePage<SharedPageProps>().props;

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
        <div className="p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
