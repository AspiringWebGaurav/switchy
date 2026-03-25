"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Logo } from "@/components/shared/logo";
import { LogOut } from "lucide-react";

export function DashboardNav() {
  const router = useRouter();
  const { user } = useAuth();

  async function handleLogout() {
    await fetch("/api/v1/auth/session", { method: "DELETE" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <button
          onClick={() => router.push("/dashboard")}
          className="cursor-pointer"
        >
          <Logo size="md" />
        </button>

        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-3">
              {user.avatar && (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-8 w-8 rounded-full ring-2 ring-stone-100"
                  referrerPolicy="no-referrer"
                />
              )}
              <span className="text-sm font-medium text-stone-700 hidden sm:block">
                {user.name}
              </span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
