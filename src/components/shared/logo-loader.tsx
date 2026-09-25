"use client";

import { motion } from "framer-motion";

interface LogoLoaderProps {
  size?: "sm" | "md" | "lg";
  text?: string;
}

const sizeMap = {
  sm: { box: 36, text: "text-xs" },
  md: { box: 52, text: "text-sm" },
  lg: { box: 72, text: "text-base" },
};

export function LogoLoader({ size = "md", text }: LogoLoaderProps) {
  const s = sizeMap[size];
  
  return (
    <div className="relative flex flex-col items-center justify-center gap-4">
      {/* Brand Icon with subtle halo and breathing glow */}
      <div className="relative flex items-center justify-center" style={{ width: s.box, height: s.box }}>
        {/* Pulsing ambient aura */}
        <motion.div
          animate={{ scale: [1, 1.25, 1], opacity: [0.35, 0.7, 0.35] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -inset-3 rounded-2xl bg-indigo-500/25 blur-lg"
        />

        <svg viewBox="0 0 32 32" fill="none" className="relative w-full h-full drop-shadow-md">
          <defs>
            <linearGradient id="loaderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1"/>
              <stop offset="100%" stopColor="#8b5cf6"/>
            </linearGradient>
          </defs>
          {/* Background */}
          <rect width="32" height="32" rx="7" fill="url(#loaderGrad)"/>
          {/* Switch track */}
          <rect x="7" y="12" width="18" height="8" rx="4" fill="rgba(255,255,255,0.3)"/>
          {/* Switch knob with smooth pulse */}
          <motion.circle
            cx="21"
            cy="16"
            r="3"
            fill="#fff"
            animate={{ scale: [1, 1.15, 1], opacity: [0.95, 1, 0.95] }}
            transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
          />
        </svg>
        
        {/* Animated lightning bolt */}
        <motion.svg
          viewBox="0 0 32 32"
          fill="none"
          className="absolute inset-0 w-full h-full"
          initial={{ opacity: 0.7 }}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.path
            d="M14 7L12 13h2l-1.5 6 4-5.5h-2L16 7z"
            fill="#fff"
            animate={{ 
              scale: [1, 1.12, 1],
              filter: ["drop-shadow(0 0 2px #fff)", "drop-shadow(0 0 8px rgba(255,255,255,0.9))", "drop-shadow(0 0 2px #fff)"]
            }}
            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "center" }}
          />
        </motion.svg>
      </div>
      
      {/* Brand name and dynamic loading label with animated dots */}
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
          Switchyy
        </span>
        {text && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
            <span>{text}</span>
            <span className="flex items-center gap-0.5">
              <motion.span
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
                className="inline-block h-1 w-1 rounded-full bg-indigo-500"
              />
              <motion.span
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
                className="inline-block h-1 w-1 rounded-full bg-indigo-500"
              />
              <motion.span
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
                className="inline-block h-1 w-1 rounded-full bg-indigo-500"
              />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function FullPageLoader({ text = "Loading..." }: { text?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-white/85 dark:bg-zinc-950/85 backdrop-blur-md select-none pointer-events-auto"
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: -6 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex flex-col items-center justify-center p-8 rounded-3xl"
      >
        <LogoLoader size="lg" text={text} />
      </motion.div>
    </motion.div>
  );
}

export function InlineLoader({ text }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <LogoLoader size="md" text={text} />
    </div>
  );
}
