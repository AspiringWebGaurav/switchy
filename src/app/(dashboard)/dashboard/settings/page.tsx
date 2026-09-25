"use client";

import { motion } from "framer-motion";
import { Settings, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { SettingsContent } from "@/components/dashboard/settings-content";

export default function SettingsPage() {
  return (
    <main className="flex-1 flex flex-col bg-zinc-50 h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Header */}
      <div className="border-b border-zinc-200 bg-white shrink-0">
        <div className="px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard"
              className="p-2 -ml-2 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-zinc-500" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-zinc-900">My Settings</h1>
                <p className="text-sm text-zinc-500">Control where your banners appear</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-6 lg:px-8 py-6"
        >
          <SettingsContent type="user" />
        </motion.div>
      </div>
    </main>
  );
}
