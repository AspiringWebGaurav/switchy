"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Logo } from "@/components/shared/logo";
import { LogOut, BookOpen } from "lucide-react";
import { useLoginModal } from "@/hooks/use-login-modal";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { openLogin } = useLoginModal();
  const isDocsPage = pathname === "/docs";

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  async function handleLogout() {
    setDropdownOpen(false);
    await fetch("/api/v1/auth/session", { method: "DELETE" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-stone-100">
      <div className="flex h-14 items-center justify-between px-6 lg:px-10">
        {/* Left — Logo */}
        <button
          onClick={() => router.push(user ? "/dashboard" : "/")}
          className="cursor-pointer"
        >
          <Logo size="md" />
        </button>

        {/* Right — Docs + Auth */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/docs")}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
              isDocsPage
                ? "font-medium text-indigo-600"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            <BookOpen size={15} />
            <span className="hidden sm:inline">Docs</span>
          </button>

          <div className="h-5 w-px bg-stone-200" />

          {user ? (
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="relative h-9 w-9 rounded-full overflow-hidden ring-2 ring-stone-200 transition-all hover:ring-indigo-300 focus:outline-none focus:ring-indigo-400"
              >
                {user.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={user.name}
                    width={36}
                    height={36}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-indigo-100 text-sm font-semibold text-indigo-600">
                    {user.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                )}
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 rounded-xl border border-stone-200 bg-white py-2 shadow-lg shadow-stone-200/50">
                  {/* User info */}
                  <div className="px-4 py-2.5 border-b border-stone-100">
                    <p className="text-sm font-medium text-stone-900 truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-stone-400 truncate">
                      {user.email}
                    </p>
                  </div>

                  {/* Logout */}
                  <div className="px-2 pt-1.5">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-500 transition-colors hover:bg-red-50"
                    >
                      <LogOut size={14} />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={openLogin}
              className="glow-border rounded-full px-5 py-1.5 text-sm font-medium text-stone-700 transition-all hover:text-stone-900 hover:bg-stone-100 hover:shadow-sm active:scale-95"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
