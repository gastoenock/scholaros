import { router, usePage } from "@inertiajs/react";
import type { SharedPageProps } from "@/lib/types.ts";

export function useUser() {
  const { auth } = usePage<SharedPageProps>().props;
  return auth.user;
}

export function useAuth() {
  const user = useUser();
  return {
    isAuthenticated: !!user,
    user,
    signin: () => router.visit("/login"),
    signout: () => {
      router.post("/logout");
      return Promise.resolve();
    },
  };
}
