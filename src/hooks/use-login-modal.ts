"use client";

import { createContext, useContext } from "react";

export interface LoginModalContextValue {
  open: boolean;
  openLogin: () => void;
  closeLogin: () => void;
}

export const LoginModalContext = createContext<LoginModalContextValue>({
  open: false,
  openLogin: () => {},
  closeLogin: () => {},
});

export function useLoginModal(): LoginModalContextValue {
  return useContext(LoginModalContext);
}
