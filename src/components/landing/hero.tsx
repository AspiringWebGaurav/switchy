"use client";

import { motion } from "framer-motion";
import { ArrowRight, Zap, Shield, Globe } from "lucide-react";
import { useLoginModal } from "@/hooks/use-login-modal";

export function LandingHero() {
  const { openLogin } = useLoginModal();

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-stone-50">
      {/* Hero */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-3xl"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-1.5 text-sm text-stone-600">
            <Zap size={14} className="text-indigo-500" />
            Real-time control, zero redeployments
          </div>

          <h1 className="text-5xl font-bold tracking-tight text-stone-900 sm:text-6xl lg:text-7xl">
            Control your apps
            <br />
            <span className="text-indigo-500">in real-time</span>
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-stone-500 max-w-xl mx-auto">
            Switch between live, maintenance, and custom modes instantly.
            No code changes. No redeployments. Just one click.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-10"
          >
            <button
              onClick={openLogin}
              className="glow-border-filled group inline-flex items-center gap-2 rounded-full bg-indigo-500 px-8 py-3.5 text-base font-medium text-white transition-all hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-500/25"
            >
              Get Started
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </button>
          </motion.div>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-20 flex flex-wrap items-center justify-center gap-6 text-sm text-stone-500"
        >
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-indigo-400" />
            Secure by default
          </div>
          <div className="h-4 w-px bg-stone-300" />
          <div className="flex items-center gap-2">
            <Globe size={16} className="text-indigo-400" />
            Works with any stack
          </div>
          <div className="h-4 w-px bg-stone-300" />
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-indigo-400" />
            Sub-100ms response
          </div>
        </motion.div>
      </div>

      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 right-0 h-[600px] w-[600px] rounded-full bg-indigo-100/50 blur-3xl" />
        <div className="absolute -bottom-40 left-0 h-[400px] w-[400px] rounded-full bg-violet-100/40 blur-3xl" />
      </div>
    </div>
  );
}
