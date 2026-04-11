"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Zap, Shield, Globe, LayoutDashboard, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useLoginModal } from "@/hooks/use-login-modal";
import { frameworks } from "@/config/frameworks";
import { FrameworkIcon } from "@/components/ui/framework-icon";

const rotatingWords = ["real-time", "one click", "zero deploys", "instantly"];

export function HomeBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex w-full flex-col overflow-hidden bg-gradient-to-b from-indigo-50/50 via-violet-50/20 via-30% to-white -mt-14 pt-14">
      {/* Animated grid background - covers full page edge-to-edge */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#e5e5e5_1px,transparent_1px),linear-gradient(to_bottom,#e5e5e5_1px,transparent_1px)] bg-[size:24px_24px]" />

      {/* Enhanced background gradients */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.6, 0.5]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 right-0 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-indigo-200/60 to-violet-200/40 blur-3xl opacity-50" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.15, 1],
            opacity: [0.4, 0.5, 0.4]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -bottom-40 left-0 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-violet-200/50 to-pink-200/30 blur-3xl opacity-50" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.4, 0.3]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-gradient-to-r from-blue-200/30 to-indigo-200/30 blur-3xl opacity-50" 
        />
      </div>
      
      {children}
    </div>
  );
}

export function LandingHero() {
  const router = useRouter();
  const { user } = useAuth();
  const { openLogin } = useLoginModal();
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % rotatingWords.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Hero */}
      <div className="relative z-10 flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="max-w-3xl"
        >
          {/* Badge */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-200/60 bg-gradient-to-r from-indigo-50 to-violet-50 px-3 py-1.5 text-sm text-indigo-700 shadow-sm shadow-indigo-100 hover:shadow-md hover:border-indigo-300/80 transition-all cursor-default"
          >
            <span aria-hidden="true" className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-white animate-pulse">
              <Sparkles size={10} />
            </span>
            <span className="font-medium">Real-time control, zero redeployments</span>
          </motion.div>

          {/* Headline */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-5xl font-bold tracking-tight text-stone-900 sm:text-6xl lg:text-7xl"
          >
            Control your apps
            <br />
            <span className="relative inline-block pb-2">
              <AnimatePresence mode="wait">
                <motion.span
                  key={wordIndex}
                  initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="inline-block bg-gradient-to-r from-indigo-600 via-violet-500 to-purple-600 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-x leading-tight"
                >
                  {rotatingWords[wordIndex]}
                </motion.span>
              </AnimatePresence>
              {/* Shimmer overlay */}
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer bg-[length:200%_100%] pointer-events-none" />
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-4 text-base leading-relaxed text-stone-500 max-w-lg mx-auto"
          >
            Switch between live, maintenance, and custom modes instantly.
            No code changes. No redeployments. Just one click.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            {user ? (
              <button
                onClick={() => router.push("/dashboard")}
                className="group relative inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98]"
              >
                <LayoutDashboard size={18} />
                Go to Dashboard
                <ArrowRight
                  size={18}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            ) : (
              <>
                <button
                  onClick={openLogin}
                  className="group relative inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Get Started Free
                  <ArrowRight
                    size={18}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
                <button
                  onClick={() => router.push("/docs")}
                  className="group inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-6 py-3.5 text-base font-medium text-stone-700 transition-all duration-300 hover:border-stone-400 hover:bg-stone-50 hover:shadow-sm"
                >
                  View Documentation
                </button>
              </>
            )}
          </motion.div>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-2"
        >
          {[
            { icon: Shield, label: "Secure by default", color: "emerald" },
            { icon: Globe, label: "Works with any stack", color: "blue" },
            { icon: Zap, label: "Sub-100ms response", color: "amber" },
          ].map((feature, i) => (
            <motion.div
              key={feature.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 + i * 0.1 }}
              className="group flex items-center gap-1.5 rounded-full border border-stone-200/80 bg-white/80 backdrop-blur-sm px-3 py-1.5 text-xs text-stone-600 shadow-sm transition-all hover:border-stone-300 hover:shadow-md"
            >
              <feature.icon size={12} className={`text-${feature.color}-500`} />
              {feature.label}
            </motion.div>
          ))}
        </motion.div>

        {/* Trusted by section - Infinite marquee */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1 }}
          className="mt-10 w-full max-w-2xl mx-auto"
        >
          <p className="text-[11px] font-semibold uppercase tracking-widest text-stone-400 mb-4 flex items-center justify-center gap-2">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-stone-300" />
            Works with your favorite stack
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-stone-300" />
          </p>
          
          {/* Marquee container with cloud fade edges */}
          <div className="relative overflow-hidden rounded-xl">
            {/* Cloud fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white via-white/95 via-40% to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white via-white/95 via-40% to-transparent z-10 pointer-events-none" />
            
            {/* Scrolling content - duplicated for seamless loop */}
            <div className="flex animate-marquee will-change-transform py-2">
              {[0, 1].map((setIndex) => (
                <div key={setIndex} className="flex shrink-0 gap-2.5 px-1" aria-hidden={setIndex === 1}>
                  {frameworks.map((fw) => (
                    <div
                      key={`${setIndex}-${fw.label}`}
                      className="group relative shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/90 border border-stone-200/70 shadow-sm cursor-default transition-all duration-200 hover:shadow-md hover:border-stone-300 hover:bg-white hover:-translate-y-0.5"
                    >
                      <FrameworkIcon svg={fw.svg} hex={fw.hex} size={18} />
                      <span className="text-sm font-semibold text-stone-800 whitespace-nowrap">
                        {fw.label}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

    </>
  );
}
