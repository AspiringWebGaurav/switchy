"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wifi,
  Wrench,
  Settings2,
  Eye,
  Stethoscope,
  Coffee,
  Palmtree,
  Headphones,
  Laptop,
  Rocket,
  Server,
  CloudUpload,
  AlertTriangle,
  TrendingDown,
  Ban,
  DoorClosed,
  Clock,
  Pause,
  ArrowRightLeft,
  FlaskConical,
  Gift,
  WifiOff,
  Lock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { ModeValue } from "@/types/policy";
import type { LucideIcon } from "lucide-react";

interface ModeToggleProps {
  value: ModeValue;
  onChange: (mode: ModeValue) => void;
  disabled?: boolean;
  locked?: boolean;
}

export interface ModeOption {
  value: ModeValue;
  label: string;
  description: string;
  category: "status" | "away" | "work" | "issue" | "business";
  color: string;
  activeBg: string;
  activeBorder: string;
  activeText: string;
  dotColor: string;
  icon: LucideIcon;
}

const categoryLabels: Record<string, string> = {
  status: "General",
  away: "Away & Leave",
  work: "Work",
  issue: "Incidents",
  business: "Business",
};

export const modes: ModeOption[] = [
  // ── Status ──
  {
    value: "live",
    label: "Live",
    description: "Site runs normally — no overlay shown",
    category: "status",
    color: "text-emerald-600",
    activeBg: "bg-emerald-50",
    activeBorder: "border-emerald-300",
    activeText: "text-emerald-700",
    dotColor: "bg-emerald-500",
    icon: Wifi,
  },
  {
    value: "maintenance",
    label: "Maintenance",
    description: "Scheduled maintenance in progress",
    category: "status",
    color: "text-amber-600",
    activeBg: "bg-amber-50",
    activeBorder: "border-amber-300",
    activeText: "text-amber-700",
    dotColor: "bg-amber-500",
    icon: Wrench,
  },
  {
    value: "custom",
    label: "Custom",
    description: "Show a custom message & redirect",
    category: "status",
    color: "text-violet-600",
    activeBg: "bg-violet-50",
    activeBorder: "border-violet-300",
    activeText: "text-violet-700",
    dotColor: "bg-violet-500",
    icon: Settings2,
  },
  {
    value: "offline",
    label: "Offline",
    description: "Site is intentionally offline",
    category: "status",
    color: "text-zinc-600",
    activeBg: "bg-zinc-50",
    activeBorder: "border-zinc-300",
    activeText: "text-zinc-700",
    dotColor: "bg-zinc-500",
    icon: WifiOff,
  },
  {
    value: "preview",
    label: "Preview",
    description: "Staging or preview environment",
    category: "status",
    color: "text-fuchsia-600",
    activeBg: "bg-fuchsia-50",
    activeBorder: "border-fuchsia-300",
    activeText: "text-fuchsia-700",
    dotColor: "bg-fuchsia-500",
    icon: Eye,
  },
  // ── Away & Leave ──
  {
    value: "medical",
    label: "On Leave",
    description: "Medical or personal leave",
    category: "away",
    color: "text-rose-600",
    activeBg: "bg-rose-50",
    activeBorder: "border-rose-300",
    activeText: "text-rose-700",
    dotColor: "bg-rose-500",
    icon: Stethoscope,
  },
  {
    value: "brb",
    label: "Be Right Back",
    description: "Away briefly, returning soon",
    category: "away",
    color: "text-sky-600",
    activeBg: "bg-sky-50",
    activeBorder: "border-sky-300",
    activeText: "text-sky-700",
    dotColor: "bg-sky-500",
    icon: Coffee,
  },
  {
    value: "vacation",
    label: "Vacation",
    description: "On holiday — back later",
    category: "away",
    color: "text-cyan-600",
    activeBg: "bg-cyan-50",
    activeBorder: "border-cyan-300",
    activeText: "text-cyan-700",
    dotColor: "bg-cyan-500",
    icon: Palmtree,
  },
  {
    value: "focus",
    label: "Focus Mode",
    description: "Do not disturb — heads down",
    category: "away",
    color: "text-slate-600",
    activeBg: "bg-slate-100",
    activeBorder: "border-slate-300",
    activeText: "text-slate-700",
    dotColor: "bg-slate-500",
    icon: Headphones,
  },
  // ── Work ──
  {
    value: "working",
    label: "Working",
    description: "Heads-down building",
    category: "work",
    color: "text-orange-600",
    activeBg: "bg-orange-50",
    activeBorder: "border-orange-300",
    activeText: "text-orange-700",
    dotColor: "bg-orange-500",
    icon: Laptop,
  },
  {
    value: "launching",
    label: "Launching Soon",
    description: "Product launch imminent",
    category: "work",
    color: "text-indigo-600",
    activeBg: "bg-indigo-50",
    activeBorder: "border-indigo-300",
    activeText: "text-indigo-700",
    dotColor: "bg-indigo-500",
    icon: Rocket,
  },
  {
    value: "migrating",
    label: "Migrating",
    description: "Moving servers or data",
    category: "work",
    color: "text-purple-600",
    activeBg: "bg-purple-50",
    activeBorder: "border-purple-300",
    activeText: "text-purple-700",
    dotColor: "bg-purple-500",
    icon: Server,
  },
  {
    value: "deploying",
    label: "Deploying",
    description: "Deployment in progress",
    category: "work",
    color: "text-blue-700",
    activeBg: "bg-blue-100",
    activeBorder: "border-blue-400",
    activeText: "text-blue-800",
    dotColor: "bg-blue-600",
    icon: CloudUpload,
  },
  // ── Incidents ──
  {
    value: "incident",
    label: "Incident",
    description: "Active incident being resolved",
    category: "issue",
    color: "text-red-600",
    activeBg: "bg-red-50",
    activeBorder: "border-red-300",
    activeText: "text-red-700",
    dotColor: "bg-red-500",
    icon: AlertTriangle,
  },
  {
    value: "degraded",
    label: "Degraded",
    description: "Service partially degraded",
    category: "issue",
    color: "text-yellow-600",
    activeBg: "bg-yellow-50",
    activeBorder: "border-yellow-300",
    activeText: "text-yellow-700",
    dotColor: "bg-yellow-500",
    icon: TrendingDown,
  },
  {
    value: "outage",
    label: "Outage",
    description: "Full service outage",
    category: "issue",
    color: "text-red-800",
    activeBg: "bg-red-100",
    activeBorder: "border-red-400",
    activeText: "text-red-900",
    dotColor: "bg-red-700",
    icon: Ban,
  },
  // ── Business ──
  {
    value: "closed",
    label: "Closed",
    description: "Temporarily closed",
    category: "business",
    color: "text-stone-600",
    activeBg: "bg-stone-100",
    activeBorder: "border-stone-300",
    activeText: "text-stone-700",
    dotColor: "bg-stone-500",
    icon: DoorClosed,
  },
  {
    value: "coming-soon",
    label: "Coming Soon",
    description: "Not launched yet — teaser page",
    category: "business",
    color: "text-teal-600",
    activeBg: "bg-teal-50",
    activeBorder: "border-teal-300",
    activeText: "text-teal-700",
    dotColor: "bg-teal-500",
    icon: Clock,
  },
  {
    value: "paused",
    label: "Paused",
    description: "Operations temporarily paused",
    category: "business",
    color: "text-slate-600",
    activeBg: "bg-slate-50",
    activeBorder: "border-slate-300",
    activeText: "text-slate-700",
    dotColor: "bg-slate-500",
    icon: Pause,
  },
  {
    value: "moved",
    label: "Moved",
    description: "Relocated to a new address",
    category: "business",
    color: "text-blue-600",
    activeBg: "bg-blue-50",
    activeBorder: "border-blue-300",
    activeText: "text-blue-700",
    dotColor: "bg-blue-500",
    icon: ArrowRightLeft,
  },
  {
    value: "beta",
    label: "Beta",
    description: "Beta access only",
    category: "business",
    color: "text-lime-700",
    activeBg: "bg-lime-50",
    activeBorder: "border-lime-300",
    activeText: "text-lime-800",
    dotColor: "bg-lime-600",
    icon: FlaskConical,
  },
  {
    value: "holiday",
    label: "Holiday",
    description: "Closed for the holiday",
    category: "business",
    color: "text-pink-600",
    activeBg: "bg-pink-50",
    activeBorder: "border-pink-300",
    activeText: "text-pink-700",
    dotColor: "bg-pink-500",
    icon: Gift,
  },
];

export function ModeToggle({ value, onChange, disabled, locked }: ModeToggleProps) {
  const [expanded, setExpanded] = useState(false);

  // Show first 4 (General status) always, rest behind "Show more"
  const primaryModes = modes.filter((m) => m.category === "status");
  const extraModes = modes.filter((m) => m.category !== "status");

  // Group extra modes by category
  const extraByCategory = extraModes.reduce<Record<string, ModeOption[]>>((acc, m) => {
    if (!acc[m.category]) acc[m.category] = [];
    acc[m.category].push(m);
    return acc;
  }, {});

  // If active mode is in extra, auto-expand
  const activeInExtra = extraModes.some((m) => m.value === value);
  const showExtra = expanded || activeInExtra;

  if (locked) {
    return (
      <div className="relative rounded-xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center">
        <Lock size={20} className="mx-auto mb-2 text-stone-400" />
        <p className="text-sm font-medium text-stone-500">Mode control locked</p>
        <p className="text-sm text-stone-400 mt-1">
          Add the script tag to your site and connect to enable mode switching
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Primary modes — always visible */}
      <div className="grid grid-cols-4 gap-1.5">
        {primaryModes.map((mode) => (
          <ModeCard
            key={mode.value}
            mode={mode}
            isActive={value === mode.value}
            disabled={disabled}
            onChange={onChange}
          />
        ))}
      </div>

      {/* Expand / collapse toggle — hide when auto-expanded due to active mode in extra */}
      {(!activeInExtra || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 mx-auto text-sm font-medium text-stone-400 hover:text-stone-600 transition-colors py-0.5"
        >
          {expanded ? (
            <>
              Less modes <ChevronUp size={13} />
            </>
          ) : (
            <>
              More modes <ChevronDown size={13} />
            </>
          )}
        </button>
      )}

      {/* Extra modes by category */}
      <AnimatePresence initial={false}>
        {showExtra && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden space-y-2"
          >
            {Object.entries(extraByCategory).map(([cat, items]) => (
              <div key={cat}>
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1 px-0.5">
                  {categoryLabels[cat] ?? cat}
                </p>
                <div className="grid grid-cols-4 gap-1.5">
                  {items.map((mode) => (
                    <ModeCard
                      key={mode.value}
                      mode={mode}
                      isActive={value === mode.value}
                      disabled={disabled}
                      onChange={onChange}
                    />
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ModeCard({
  mode,
  isActive,
  disabled,
  onChange,
}: {
  mode: ModeOption;
  isActive: boolean;
  disabled?: boolean;
  onChange: (v: ModeValue) => void;
}) {
  const Icon = mode.icon;

  return (
    <motion.button
      onClick={() => onChange(mode.value)}
      disabled={disabled}
      whileTap={{ scale: 0.96 }}
      title={mode.description}
      className={`relative flex flex-col items-center gap-1.5 rounded-lg border px-2 py-2.5 text-center transition-all ${
        isActive
          ? `${mode.activeBg} ${mode.activeBorder} ${mode.activeText} shadow-sm`
          : "border-stone-200 bg-white text-stone-500 hover:border-stone-300 hover:bg-stone-50"
      } disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {isActive && (
        <motion.span
          layoutId="mode-active-dot"
          className={`absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full ${mode.dotColor}`}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}
      <Icon size={16} strokeWidth={isActive ? 2 : 1.5} />
      <span className="text-sm font-semibold leading-tight truncate w-full">
        {mode.label}
      </span>
    </motion.button>
  );
}
