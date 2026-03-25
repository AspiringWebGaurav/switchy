"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase/client";
import { useLoginModal } from "@/hooks/use-login-modal";
import { X } from "lucide-react";

const RETURNING_KEY = "switchyy_returning";

function getTimeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function LoginModal() {
  const router = useRouter();
  const { open, closeLogin } = useLoginModal();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isReturning, setIsReturning] = useState(false);

  useEffect(() => {
    try {
      setIsReturning(localStorage.getItem(RETURNING_KEY) === "1");
    } catch {}
  }, []);

  const greeting = useMemo(() => {
    if (isReturning) {
      return pickRandom(["Welcome back", "Hey again", "Good to see you"]);
    }
    return pickRandom([getTimeGreeting(), "Hello there", "Welcome"]);
  }, [isReturning, open]); // eslint-disable-line react-hooks/exhaustive-deps

  const successGreeting = useMemo(() => {
    if (isReturning) {
      return pickRandom(["Welcome back!", "Good to see you!", "Hey again!"]);
    }
    return pickRandom(["You're all set!", "Let's go!", "Welcome aboard!"]);
  }, [isReturning, success]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleLogin() {
    try {
      setLoading(true);
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      const res = await fetch("/api/v1/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (res.ok) {
        try { localStorage.setItem(RETURNING_KEY, "1"); } catch {}
        setSuccess(true);
        // Brief delay so user sees the success state, then hard navigate
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 800);
      } else {
        setError("Failed to create session. Please try again.");
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      const cancelCodes = [
        "auth/popup-closed-by-user",
        "auth/cancelled-popup-request",
        "auth/popup-blocked",
        "auth/user-cancelled",
      ];
      if (code && cancelCodes.includes(code)) {
        // User cancelled — close modal smoothly, no error
        setLoading(false);
        closeLogin();
        return;
      }
      console.error("Login failed:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (success) return;
    setLoading(false);
    setError(null);
    closeLogin();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-black/25 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-8 shadow-xl relative">
              {/* Close button */}
              {!success && (
                <button
                  onClick={handleClose}
                  disabled={loading}
                  className="absolute top-4 right-4 rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600 disabled:opacity-50"
                >
                  <X size={16} />
                </button>
              )}

              <AnimatePresence mode="wait">
                {success ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center py-4"
                  >
                    {/* Checkmark */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", duration: 0.5, bounce: 0.4 }}
                      className="flex h-14 w-14 items-center justify-center rounded-full bg-green-50 mb-4"
                    >
                      <svg className="h-7 w-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <motion.path
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.4, delay: 0.2 }}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </motion.div>
                    <p className="text-base font-semibold text-stone-900">
                      {successGreeting}
                    </p>
                    <p className="mt-1 text-sm text-stone-500">
                      Redirecting to dashboard...
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                  >
                    <h2 className="text-center text-xl font-semibold text-stone-900 mb-2">
                      {greeting}
                    </h2>
                    <p className="text-center text-sm text-stone-500 mb-6">
                      {isReturning
                        ? "Sign in to pick up where you left off"
                        : "Sign in with Google to get started"}
                    </p>

                    <button
                      onClick={handleLogin}
                      disabled={loading}
                      className="flex w-full items-center justify-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-700 transition-all hover:bg-stone-50 hover:border-stone-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <svg className="animate-spin h-5 w-5 text-stone-400" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                      )}
                      {loading ? "Signing in..." : "Continue with Google"}
                    </button>

                    {error && (
                      <p className="mt-4 text-center text-sm text-red-500">{error}</p>
                    )}

                    <p className="mt-6 text-center text-xs text-stone-400">
                      By signing in, you agree to our Terms of Service
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
