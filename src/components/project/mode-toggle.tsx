"use client";

import { motion } from "framer-motion";
import type { ModeValue } from "@/types/policy";

interface ModeToggleProps {
  value: ModeValue;
  onChange: (mode: ModeValue) => void;
  disabled?: boolean;
}

const modes: { value: ModeValue; label: string; color: string }[] = [
  { value: "maintenance", label: "Maintenance", color: "bg-amber-500" },
  { value: "custom", label: "Custom", color: "bg-violet-500" },
  { value: "live", label: "Live", color: "bg-emerald-500" },
];

export function ModeToggle({ value, onChange, disabled }: ModeToggleProps) {
  const activeIndex = modes.findIndex((m) => m.value === value);

  return (
    <div className="relative inline-flex rounded-xl border border-stone-200 bg-stone-100 p-1">
      {/* Sliding background */}
      <motion.div
        className="absolute top-1 bottom-1 rounded-lg bg-white shadow-sm"
        initial={false}
        animate={{
          left: `calc(${activeIndex * (100 / 3)}% + 4px)`,
          width: `calc(${100 / 3}% - 8px)`,
        }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />

      {modes.map((mode) => (
        <button
          key={mode.value}
          onClick={() => onChange(mode.value)}
          disabled={disabled}
          className={`relative z-10 flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors ${
            value === mode.value
              ? "text-stone-900"
              : "text-stone-500 hover:text-stone-700"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              value === mode.value ? mode.color : "bg-stone-300"
            }`}
          />
          {mode.label}
        </button>
      ))}
    </div>
  );
}
