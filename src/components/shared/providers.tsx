"use client";

import { ReactNode } from "react";
import { AuthContext } from "@/hooks/use-auth";
import type { User } from "@/types/user";

interface ProvidersProps {
  children: ReactNode;
  user: User | null;
}

export function Providers({ children, user }: ProvidersProps) {
  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  );
}
