"use client";

import { ReactNode } from "react";
import { AuthContext } from "@/hooks/use-auth";
import type { User } from "@/types/user";

interface DashboardAuthProviderProps {
  user: User;
  children: ReactNode;
}

export function DashboardAuthProvider({ user, children }: DashboardAuthProviderProps) {
  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  );
}
