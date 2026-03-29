"use client";

import { motion } from "framer-motion";
import { AlertCircle, RefreshCw, WifiOff, Lock, ServerCrash } from "lucide-react";
import { LucideIcon } from "lucide-react";

type ErrorType = "generic" | "network" | "auth" | "server" | "custom";

interface ErrorStateProps {
  type?: ErrorType;
  title?: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
    loading?: boolean;
  };
  icon?: LucideIcon;
  variant?: "default" | "inline" | "compact";
}

const errorConfig: Record<ErrorType, { icon: LucideIcon; title: string; message: string }> = {
  generic: {
    icon: AlertCircle,
    title: "Something went wrong",
    message: "An unexpected error occurred. Please try again.",
  },
  network: {
    icon: WifiOff,
    title: "Connection failed",
    message: "Unable to connect. Check your internet connection.",
  },
  auth: {
    icon: Lock,
    title: "Session expired",
    message: "Your session has expired. Please log in again.",
  },
  server: {
    icon: ServerCrash,
    title: "Server error",
    message: "Our servers are having issues. We're looking into it.",
  },
  custom: {
    icon: AlertCircle,
    title: "Error",
    message: "An error occurred.",
  },
};

export function ErrorState({
  type = "generic",
  title,
  message,
  action,
  icon,
  variant = "default",
}: ErrorStateProps) {
  const config = errorConfig[type];
  const Icon = icon || config.icon;
  const displayTitle = title || config.title;
  const displayMessage = message || config.message;

  if (variant === "inline") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3"
      >
        <Icon size={16} className="shrink-0 text-red-500" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-red-700">{displayTitle}</p>
          {displayMessage && (
            <p className="text-xs text-red-600 mt-0.5">{displayMessage}</p>
          )}
        </div>
        {action && (
          <button
            onClick={action.onClick}
            disabled={action.loading}
            className="shrink-0 flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
          >
            <RefreshCw size={12} className={action.loading ? "animate-spin" : ""} />
            {action.label}
          </button>
        )}
      </motion.div>
    );
  }

  if (variant === "compact") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-8 text-center"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 mb-3">
          <Icon size={18} className="text-red-500" />
        </div>
        <p className="text-sm font-medium text-zinc-900 mb-1">{displayTitle}</p>
        <p className="text-xs text-zinc-500 mb-3 max-w-xs">{displayMessage}</p>
        {action && (
          <button
            onClick={action.onClick}
            disabled={action.loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-50"
          >
            <RefreshCw size={12} className={action.loading ? "animate-spin" : ""} />
            {action.label}
          </button>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 mb-5">
        <Icon size={28} className="text-red-500" />
      </div>
      
      <h3 className="text-lg font-semibold text-zinc-900 mb-1.5">{displayTitle}</h3>
      <p className="text-sm text-zinc-500 max-w-sm mb-6">{displayMessage}</p>
      
      {action && (
        <motion.button
          onClick={action.onClick}
          disabled={action.loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:border-zinc-300 hover:shadow-md disabled:opacity-50"
        >
          <RefreshCw size={14} className={action.loading ? "animate-spin" : ""} />
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
}
