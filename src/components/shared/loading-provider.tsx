"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { FullPageLoader } from "./logo-loader";

interface LoadingContextType {
  isLoading: boolean;
  loadingText: string;
  showLoading: (text?: string) => void;
  hideLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | null>(null);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Loading...");
  const pathname = usePathname();
  const safetyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showLoading = useCallback((text = "Loading...") => {
    setLoadingText(text);
    setIsLoading(true);
    if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
    // Safety auto-dismiss to prevent stuck overlays if network hangs
    safetyTimeoutRef.current = setTimeout(() => {
      setIsLoading(false);
    }, 4500);
  }, []);

  const hideLoading = useCallback(() => {
    if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
    setIsLoading(false);
  }, []);

  // When pathname changes (route transition completed), smoothly dismiss loader
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 120);
    return () => clearTimeout(timer);
  }, [pathname]);

  // Intercept internal link clicks for instant visual feedback on navigation
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      const isBlank = target.getAttribute("target") === "_blank";
      const isDownload = target.hasAttribute("download");

      if (!href || isBlank || isDownload) return;
      if (
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:")
      ) {
        return;
      }

      // Only handle internal navigation
      if (href.startsWith("/") || href.startsWith(window.location.origin)) {
        try {
          const targetUrl = new URL(href, window.location.origin);
          const currentUrl = new URL(window.location.href);

          if (targetUrl.pathname !== currentUrl.pathname) {
            showLoading("Loading...");
          }
        } catch {
          // Ignore URL parse error
        }
      }
    };

    document.addEventListener("click", handleLinkClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleLinkClick, { capture: true });
    };
  }, [showLoading]);

  return (
    <LoadingContext.Provider value={{ isLoading, loadingText, showLoading, hideLoading }}>
      {children}
      <AnimatePresence mode="wait">
        {isLoading && <FullPageLoader text={loadingText} />}
      </AnimatePresence>
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
}
