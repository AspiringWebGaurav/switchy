"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: "default" | "compact";
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action,
  variant = "default" 
}: EmptyStateProps) {
  const isCompact = variant === "compact";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col items-center justify-center text-center ${
        isCompact ? "py-8" : "py-16"
      }`}
    >
      <div className={`flex items-center justify-center rounded-2xl bg-zinc-100 ${
        isCompact ? "h-12 w-12 mb-3" : "h-16 w-16 mb-5"
      }`}>
        <Icon size={isCompact ? 22 : 28} className="text-zinc-400" />
      </div>
      
      <h3 className={`font-semibold text-zinc-900 ${
        isCompact ? "text-sm mb-1" : "text-lg mb-1.5"
      }`}>
        {title}
      </h3>
      
      <p className={`text-zinc-500 max-w-sm ${
        isCompact ? "text-xs mb-4" : "text-sm mb-6"
      }`}>
        {description}
      </p>
      
      {action && (
        <motion.button
          onClick={action.onClick}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`inline-flex items-center gap-2 rounded-xl bg-indigo-600 font-medium text-white transition-colors hover:bg-indigo-700 ${
            isCompact ? "px-4 py-2 text-xs" : "px-5 py-2.5 text-sm"
          }`}
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
}

interface GuidedEmptyStateProps {
  icon: LucideIcon;
  title: string;
  steps: { number: number; text: string }[];
}

export function GuidedEmptyState({ icon: Icon, title, steps }: GuidedEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/50 p-8 text-center"
    >
      <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-zinc-100 mb-4">
        <Icon size={24} className="text-zinc-400" />
      </div>
      
      <h3 className="text-base font-semibold text-zinc-900 mb-4">{title}</h3>
      
      <div className="flex flex-col gap-2 max-w-xs mx-auto">
        {steps.map((step) => (
          <div key={step.number} className="flex items-center gap-3 text-left">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600">
              {step.number}
            </span>
            <span className="text-sm text-zinc-600">{step.text}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
