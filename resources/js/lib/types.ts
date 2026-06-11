export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role?: "superadmin" | "admin" | "teacher" | "student" | "parent" | null;
  schoolId?: number | null;
  avatar?: string | null;
  phone?: string | null;
};

export type SharedPageProps = {
  auth: { user: AuthUser | null };
  flash: { success?: string | null; error?: string | null };
};

export type Branch = {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  principalName?: string;
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
  branches?: Branch[] | null;
  createdAt: string;
};
