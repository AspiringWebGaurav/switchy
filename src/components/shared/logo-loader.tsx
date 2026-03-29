"use client";

import { motion } from "framer-motion";

interface LogoLoaderProps {
  size?: "sm" | "md" | "lg";
  text?: string;
}

const sizeMap = {
  sm: { box: 40, text: "text-xs" },
  md: { box: 56, text: "text-sm" },
  lg: { box: 80, text: "text-base" },
};

export function LogoLoader({ size = "md", text }: LogoLoaderProps) {
  const s = sizeMap[size];
  
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="relative" style={{ width: s.box, height: s.box }}>
        <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
          <defs>
            <linearGradient id="loaderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1"/>
              <stop offset="100%" stopColor="#8b5cf6"/>
            </linearGradient>
          </defs>
          {/* Background */}
          <rect width="32" height="32" rx="6" fill="url(#loaderGrad)"/>
          {/* Switch track */}
          <rect x="7" y="12" width="18" height="8" rx="4" fill="rgba(255,255,255,0.3)"/>
          {/* Switch knob with pulse */}
          <motion.circle
            cx="21"
            cy="16"
            r="3"
            fill="#fff"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </svg>
        
        {/* Animated lightning bolt - visible pulse */}
        <motion.svg
          viewBox="0 0 32 32"
          fill="none"
          className="absolute inset-0 w-full h-full"
          initial={{ opacity: 0.6 }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.path
            d="M14 7L12 13h2l-1.5 6 4-5.5h-2L16 7z"
            fill="#fff"
            initial={{ scale: 1 }}
            animate={{ 
              scale: [1, 1.15, 1],
              filter: ["drop-shadow(0 0 2px #fff)", "drop-shadow(0 0 8px #fff)", "drop-shadow(0 0 2px #fff)"]
            }}
            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "center" }}
          />
        </motion.svg>
      </div>
      
      {text && (
        <motion.p
          className={`text-stone-500 font-medium ${s.text}`}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
}

export function FullPageLoader({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <LogoLoader size="lg" text={text} />
    </div>
  );
}

export function InlineLoader({ text }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <LogoLoader size="md" text={text} />
    </div>
  );
}
