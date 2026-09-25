"use client";

import { createContext, useContext } from "react";
import type { User } from "@/types/user";

export interface AuthContextValue {
  user: User | null;
}

export const AuthContext = createContext<AuthContextValue>({ user: null });

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
