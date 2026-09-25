"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check } from "lucide-react";

interface CopyButtonProps {
  value: string;
  label?: string;
  variant?: "default" | "ghost" | "outline";
  size?: "sm" | "md";
  className?: string;
}

export function CopyButton({ 
  value, 
  label, 
  variant = "default",
  size = "sm",
  className = "" 
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API failed silently
    }
  }, [value]);

  const baseStyles = "inline-flex items-center justify-center font-medium transition-all active:scale-95";
  
  const variantStyles = {
    default: "bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 hover:shadow-sm",
    ghost: "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100",
    outline: "border border-zinc-200 text-zinc-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50",
  };

  const sizeStyles = {
    sm: "gap-1.5 px-2.5 py-1.5 text-xs rounded-lg",
    md: "gap-2 px-3 py-2 text-sm rounded-lg",
  };

  return (
    <motion.button
      onClick={handleCopy}
      whileTap={{ scale: 0.97 }}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span
            key="check"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-1.5 text-emerald-600"
          >
            <Check size={size === "sm" ? 12 : 14} />
            {label ? "Copied!" : null}
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-1.5"
          >
            <Copy size={size === "sm" ? 12 : 14} />
            {label || "Copy"}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

interface CopyFieldProps {
  value: string;
  label?: string;
  mono?: boolean;
  truncate?: boolean;
}

export function CopyField({ value, label, mono = true, truncate = true }: CopyFieldProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-gradient-to-r from-zinc-50 to-zinc-100/50 px-4 py-3">
      <div className="min-w-0 flex-1">
        {label && (
          <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 mb-1">
            {label}
          </p>
        )}
        <code className={`text-sm text-zinc-700 ${mono ? "font-mono" : ""} ${truncate ? "block truncate" : "break-all"}`}>
          {value}
        </code>
      </div>
      <CopyButton value={value} variant="outline" />
    </div>
  );
}
