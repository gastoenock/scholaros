export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role?: "superadmin" | "landlord" | "admin" | "teacher" | "student" | "parent" | "admin_staff" | "principal" | "vice_principal" | null;
  accountType?: "platform" | "tenant";
  schoolId?: number | null;
  avatar?: string | null;
  phone?: string | null;
  preferences?: Record<string, string | number | boolean | null>;
};

export type PlatformTenant = {
  id: number;
  name: string;
  slug: string;
  isActive: boolean;
  plan: string;
};

export type SharedPageProps = {
  auth: {
    user: AuthUser | null;
    permissions: string[];
  };
  platform: {
    isPlatformAdmin: boolean;
    manageTenantId: number | null;
    manageTenantName: string | null;
    tenants: PlatformTenant[];
  };
  tenancyHost: {
    isCentral: boolean;
    isTenant: boolean;
    centralDomain: string;
    centralUrl: string;
    tenantSlug: string | null;
    tenantName: string | null;
  };
  flash: { success?: string | null; error?: string | null };
  academicCalendar?: import("@/lib/academic-calendar.ts").AcademicCalendar | null;
};

export type Branch = {
  id: number;
  schoolId: number;
  code?: string | null;
  name: string;
  address?: string | null;
  phone?: string | null;
  principalName?: string | null;
  isActive?: boolean;
};

export type School = {
  id: number;
  name: string;
  slug: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  logo?: string | null;
  adminId?: number | null;
  isActive: boolean;
  plan: "trial" | "basic" | "premium";
  branches?: Branch[];
  createdAt: string;
};

export type EventRecord = {
  id: number;
  schoolId: number;
  schoolBranchId?: number | null;
  title: string;
  description?: string | null;
  startAt: string;
  endAt?: string | null;
  location?: string | null;
  eventType: string;
  status: string;
  createdBy?: number | null;
  branch?: Branch | null;
  createdAt: string;
};
