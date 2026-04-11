import { ReactNode } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { Shield, Lock, FileText, Settings } from "lucide-react";

export const metadata: Metadata = {
  title: "Legal & Policies",
};

const legalPages = [
  { href: "/terms", label: "Terms of Service", icon: FileText },
  { href: "/privacy", label: "Privacy Policy", icon: Lock },
  { href: "/license", label: "License Agreement", icon: Shield },
  { href: "/how-it-works", label: "How It Works", icon: Settings },
];

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex flex-1 bg-white">
      {/* Sidebar - Matching Docs UI */}
      <aside className="relative z-10 sticky top-14 hidden lg:flex h-[calc(100vh-3.5rem)] w-72 shrink-0 flex-col border-r border-stone-200 bg-stone-50 overflow-y-auto">
        <div className="px-6 pt-8 pb-3">
          <h2 className="text-sm font-semibold text-stone-900">
            Legal & Policies
          </h2>
          <p className="text-xs text-stone-500 mt-1">Platform terms and guidelines</p>
        </div>
        <nav className="flex-1 px-4 pb-8 space-y-0.5">
          {legalPages.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors text-stone-600 hover:bg-white hover:text-stone-900 hover:shadow-sm hover:border-stone-200 border border-transparent"
            >
              <Icon size={16} className="text-stone-400 group-hover:text-indigo-500 transition-colors" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="relative z-10 flex-1 overflow-y-auto bg-white">
        {/* Mobile nav */}
        <div className="lg:hidden w-full border-b border-stone-100 bg-stone-50/50 backdrop-blur-sm sticky top-14 z-20">
          <div className="flex overflow-x-auto px-4 py-3 gap-2 hide-scrollbar">
            {legalPages.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="shrink-0 rounded-full px-4 py-1.5 text-xs font-medium bg-white border border-stone-200 text-stone-600 hover:text-stone-900 shadow-sm"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-6 lg:px-12 py-10 lg:py-14">
          <div className="prose prose-zinc max-w-none prose-headings:text-stone-900 prose-p:text-stone-700 prose-p:leading-relaxed prose-a:text-indigo-600 hover:prose-a:text-indigo-500 prose-li:text-stone-700">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
