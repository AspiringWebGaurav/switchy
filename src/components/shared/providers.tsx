"use client";

import { ReactNode, useState, useCallback, useMemo, useEffect } from "react";
import { AuthContext } from "@/hooks/use-auth";
import { LoginModalContext } from "@/hooks/use-login-modal";
import { LoginModal } from "@/components/shared/login-modal";
import { LoadingProvider } from "@/components/shared/loading-provider";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import type { User } from "@/types/user";

interface ProvidersProps {
  children: ReactNode;
  user?: User | null;
}

export function Providers({ children, user: initialUser = null }: ProvidersProps) {
  const [loginOpen, setLoginOpen] = useState(false);
  const [user, setUser] = useState<User | null>(initialUser);

  useEffect(() => {
    if (initialUser) return;
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        setUser({
          uid: fbUser.uid,
          name: fbUser.displayName || "",
          email: fbUser.email || "",
          avatar: fbUser.photoURL || "",
          createdAt: 0,
          updatedAt: 0,
        });
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, [initialUser]);

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
