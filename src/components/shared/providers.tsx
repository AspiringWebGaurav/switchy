"use client";

import { ReactNode, useState, useCallback, useMemo } from "react";
import { AuthContext } from "@/hooks/use-auth";
import { LoginModalContext } from "@/hooks/use-login-modal";
import { LoginModal } from "@/components/shared/login-modal";
import { LoadingProvider } from "@/components/shared/loading-provider";
import type { User } from "@/types/user";

interface ProvidersProps {
  children: ReactNode;
  user: User | null;
}

export function Providers({ children, user }: ProvidersProps) {
  const [loginOpen, setLoginOpen] = useState(false);

  const openLogin = useCallback(() => setLoginOpen(true), []);
  const closeLogin = useCallback(() => setLoginOpen(false), []);
  const loginModalValue = useMemo(
    () => ({ open: loginOpen, openLogin, closeLogin }),
    [loginOpen, openLogin, closeLogin]
  );

  return (
    <AuthContext.Provider value={{ user }}>
      <LoginModalContext.Provider value={loginModalValue}>
        <LoadingProvider>
          {children}
          <LoginModal />
        </LoadingProvider>
      </LoginModalContext.Provider>
    </AuthContext.Provider>
  );
}
