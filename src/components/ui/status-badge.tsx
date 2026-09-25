"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

type BadgeVariant = "success" | "warning" | "error" | "info" | "neutral" | "pulse";

interface StatusBadgeProps {
  variant: BadgeVariant;
  label: string;
  icon?: LucideIcon;
  pulse?: boolean;
  size?: "sm" | "md";
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string; dot: string }> = {
  success: {
    bg: "bg-emerald-50 border-emerald-200/60",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  warning: {
    bg: "bg-amber-50 border-amber-200/60",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  error: {
    bg: "bg-red-50 border-red-200/60",
    text: "text-red-700",
    dot: "bg-red-500",
  },
  info: {
    bg: "bg-blue-50 border-blue-200/60",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  neutral: {
    bg: "bg-zinc-100 border-zinc-200/60",
    text: "text-zinc-600",
    dot: "bg-zinc-400",
  },
  pulse: {
    bg: "bg-indigo-50 border-indigo-200/60",
    text: "text-indigo-700",
    dot: "bg-indigo-500",
  },
};

export function StatusBadge({ variant, label, icon: Icon, pulse, size = "sm" }: StatusBadgeProps) {
  const styles = variantStyles[variant];
  const sizeStyles = size === "sm" 
    ? "px-2 py-0.5 text-[11px] gap-1.5" 
    : "px-2.5 py-1 text-xs gap-2";

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center rounded-full border font-medium ${styles.bg} ${styles.text} ${sizeStyles}`}
    >
      {Icon ? (
        <Icon size={size === "sm" ? 12 : 14} />
      ) : (
        <span className="relative flex h-1.5 w-1.5">
          {pulse && (
            <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${styles.dot} opacity-75`} />
          )}
          <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${styles.dot}`} />
        </span>
      )}
      {label}
    </motion.span>
  );
}

export type ConnectionState = "waiting" | "detected" | "connected" | "disconnected";

const connectionConfig: Record<ConnectionState, { variant: BadgeVariant; label: string; pulse: boolean }> = {
  connected: { variant: "success", label: "Active", pulse: true },
  detected: { variant: "pulse", label: "Script Detected", pulse: true },
  disconnected: { variant: "neutral", label: "Paused", pulse: false },
  waiting: { variant: "neutral", label: "Not Started", pulse: false },
};

export function ConnectionBadge({ state, size = "sm" }: { state: ConnectionState; size?: "sm" | "md" }) {
  const config = connectionConfig[state];
  return <StatusBadge variant={config.variant} label={config.label} pulse={config.pulse} size={size} />;
}
