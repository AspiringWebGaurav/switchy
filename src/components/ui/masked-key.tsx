"use client";

import { useState, useCallback } from "react";
import { Eye, EyeOff, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MaskedKeyProps {
  value: string;
  className?: string;
  showPrefix?: boolean;
  isRevealed?: boolean;
  onToggleReveal?: (revealed: boolean) => void;
  variant?: "inline" | "field";
  label?: string;
}

export function getMaskedKey(value: string, showPrefix = true): string {
  if (!value) return "••••••••••••••••••••••••";
  if (showPrefix && value.startsWith("pk_")) {
    return `pk_${"•".repeat(20)}`;
  }
  return "•".repeat(Math.min(value.length, 24));
}

export function MaskedKey({
  value,
  className = "",
  showPrefix = true,
  isRevealed: controlledRevealed,
  onToggleReveal,
  variant = "inline",
}: MaskedKeyProps) {
  const [internalRevealed, setInternalRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const isControlled = controlledRevealed !== undefined;
  const isRevealed = isControlled ? controlledRevealed : internalRevealed;

  const handleToggle = useCallback(() => {
    const next = !isRevealed;
    if (!isControlled) {
      setInternalRevealed(next);
    }
    onToggleReveal?.(next);
  }, [isRevealed, isControlled, onToggleReveal]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard write fallback
    }
  }, [value]);

  const displayString = isRevealed ? value : getMaskedKey(value, showPrefix);

  if (variant === "field") {
    return (
      <div className={`flex items-center gap-2 mt-1 ${className}`}>
        <code className={`text-sm font-mono transition-all select-all ${isRevealed ? "text-zinc-800" : "text-zinc-500 tracking-wider font-semibold"}`}>
          {displayString}
        </code>
        <div className="flex items-center gap-1 shrink-0 ml-1">
          <button
            type="button"
            onClick={handleToggle}
            aria-label={isRevealed ? "Hide credential" : "Show credential"}
            title={isRevealed ? "Hide credential" : "Show credential"}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            {isRevealed ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
          <button
            type="button"
            onClick={handleCopy}
            aria-label="Copy key"
            title="Copy key"
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <AnimatePresence mode="wait" initial={false}>
              {copied ? (
                <motion.span
                  key="check"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-emerald-600 block"
                >
                  <Check size={14} />
                </motion.span>
              ) : (
                <motion.span
                  key="copy"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="block"
                >
                  <Copy size={14} />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>
    );
  }

  // Default: inline
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <code className={`text-sm font-mono transition-all ${isRevealed ? "text-zinc-800" : "text-zinc-500 tracking-wider font-semibold"}`}>
        {displayString}
      </code>
      <button
        type="button"
        onClick={handleToggle}
        aria-label={isRevealed ? "Hide credential" : "Show credential"}
        title={isRevealed ? "Hide credential" : "Show credential"}
        className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
      >
        {isRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy key"
        title="Copy key"
        className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
      >
        <AnimatePresence mode="wait" initial={false}>
          {copied ? (
            <motion.span
              key="check"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-emerald-600 block"
            >
              <Check size={14} />
            </motion.span>
          ) : (
            <motion.span
              key="copy"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="block"
            >
              <Copy size={14} />
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </span>
  );
}
