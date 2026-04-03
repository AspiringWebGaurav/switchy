"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles, Zap, Clock, AlertTriangle, Building2 } from "lucide-react";
import { GuidedEmptyState } from "@/components/ui/empty-state";
import type { ModeValue } from "@/types/policy";
import { modes as modeOptions } from "@/components/modes/mode-selector";

interface Project {
  id: string;
  name: string;
  publicKey: string;
  mode: string;
  enabled?: boolean;
  detected?: boolean;
}

interface ProjectModesProps {
  project: Project;
  onRefresh: () => void;
}

const categoryConfig = {
  status: { label: "General", icon: Zap, gradient: "from-violet-500 to-purple-600" },
  away: { label: "Away & Leave", icon: Clock, gradient: "from-sky-500 to-cyan-600" },
  work: { label: "Work", icon: Sparkles, gradient: "from-orange-500 to-amber-600" },
  issue: { label: "Incidents", icon: AlertTriangle, gradient: "from-red-500 to-rose-600" },
  business: { label: "Business", icon: Building2, gradient: "from-emerald-500 to-teal-600" },
};

export function ProjectModes({ project, onRefresh }: ProjectModesProps) {
  const [mode, setMode] = useState<ModeValue>(project.mode as ModeValue);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "applying" | "saved" | "error">("idle");
  const [hoveredMode, setHoveredMode] = useState<string | null>(null);

  const connectionState = project.enabled === true
    ? "connected"
    : project.enabled === false
    ? "disconnected"
    : project.detected
    ? "detected"
    : "waiting";

  const isConnected = connectionState === "connected";
  const isLocked = !isConnected;

  const activeMode = modeOptions.find((m) => m.value === mode);

  // Group modes by category
  const modesByCategory = modeOptions.reduce((acc, m) => {
    if (!acc[m.category]) acc[m.category] = [];
    acc[m.category].push(m);
    return acc;
  }, {} as Record<string, typeof modeOptions>);

  async function handleModeChange(newMode: ModeValue) {
    if (isLocked || saving) return;

    const prevMode = mode;
    setMode(newMode);
    setSaving(true);
    setSaveStatus("applying");

    try {
      const res = await fetch(`/api/v1/projects/${project.id}/policy`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: newMode }),
      });

      if (res.ok) {
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
        onRefresh();
      } else {
        setMode(prevMode);
        setSaveStatus("error");
      }
    } catch {
      setMode(prevMode);
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }

  if (isLocked) {
    return (
      <GuidedEmptyState
        icon={Zap}
        title="Connect your site to control modes"
        steps={[
          { number: 1, text: "Go to the Keys tab" },
          { number: 2, text: "Copy the integration snippet" },
          { number: 3, text: "Add it to your site and refresh" },
        ]}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Premium Active Mode Banner */}
      {activeMode && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl"
        >
          {/* Gradient background */}
          <div className={`absolute inset-0 bg-gradient-to-r ${
            mode === "live" 
              ? "from-emerald-500 via-emerald-600 to-teal-600" 
              : mode === "maintenance"
              ? "from-amber-500 via-orange-500 to-amber-600"
              : mode === "incident" || mode === "outage"
              ? "from-red-500 via-rose-500 to-red-600"
              : "from-violet-500 via-purple-500 to-indigo-600"
          }`} />
          
          {/* Animated shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
          
          {/* Noise texture overlay */}
          <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }} />

          <div className="relative px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Icon with glow */}
              <div className="relative">
                <div className="absolute inset-0 bg-white/30 rounded-xl blur-lg" />
                <div className="relative w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                  {(() => {
                    const Icon = activeMode.icon;
                    return <Icon size={22} className="text-white" strokeWidth={2} />;
                  })()}
                </div>
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-white">
                    {mode === "live" ? "Site is Live" : `${activeMode.label} Mode`}
                  </h3>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
                  </span>
                </div>
                <p className="text-sm text-white/80 mt-0.5">
                  {mode === "live" 
                    ? "No overlay — visitors see your site normally" 
                    : "Visitors see the overlay when they visit your site"}
                </p>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {saveStatus === "applying" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30"
                >
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span className="text-sm font-medium text-white">Applying...</span>
                </motion.div>
              )}
              {saveStatus === "saved" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/30 backdrop-blur-sm border border-white/40"
                >
                  <Check size={16} className="text-white" />
                  <span className="text-sm font-medium text-white">Applied!</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Mode Categories */}
      <div className="space-y-6">
        {Object.entries(modesByCategory).map(([category, modes], categoryIndex) => {
          const config = categoryConfig[category as keyof typeof categoryConfig];
          const CategoryIcon = config?.icon || Zap;
          
          return (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: categoryIndex * 0.05 }}
              className="space-y-3"
            >
              {/* Category Header */}
              <div className="flex items-center gap-2.5 px-1">
                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${config?.gradient || "from-gray-500 to-gray-600"} flex items-center justify-center shadow-sm`}>
                  <CategoryIcon size={14} className="text-white" />
                </div>
                <span className="text-sm font-semibold text-stone-700 tracking-tight">
                  {config?.label || category}
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-stone-200 to-transparent" />
              </div>

              {/* Mode Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {modes.map((m, modeIndex) => {
                  const Icon = m.icon;
                  const isActive = mode === m.value;
                  const isHovered = hoveredMode === m.value;

                  return (
                    <motion.button
                      key={m.value}
                      onClick={() => handleModeChange(m.value)}
                      disabled={saving}
                      onMouseEnter={() => setHoveredMode(m.value)}
                      onMouseLeave={() => setHoveredMode(null)}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: categoryIndex * 0.05 + modeIndex * 0.02 }}
                      whileHover={{ scale: saving ? 1 : 1.02, y: -2 }}
                      whileTap={{ scale: saving ? 1 : 0.98 }}
                      className={`group relative flex flex-col items-center gap-2.5 rounded-xl p-4 text-center transition-all duration-200 ${
                        isActive
                          ? `bg-white shadow-lg shadow-stone-200/50 ring-2 ring-offset-2 ${m.activeBorder.replace("border-", "ring-")}`
                          : "bg-white/60 hover:bg-white border border-stone-200/80 hover:border-stone-300 hover:shadow-md"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {/* Active indicator glow */}
                      {isActive && (
                        <motion.div
                          layoutId="activeGlow"
                          className={`absolute inset-0 rounded-xl ${m.activeBg} opacity-40`}
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}

                      {/* Icon container */}
                      <div className={`relative z-10 w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 ${
                        isActive
                          ? `bg-gradient-to-br ${m.activeBg} shadow-sm`
                          : "bg-stone-100/80 group-hover:bg-stone-100"
                      }`}>
                        <Icon 
                          size={20} 
                          className={`transition-all duration-200 ${
                            isActive ? m.activeText : "text-stone-500 group-hover:text-stone-700"
                          }`}
                          strokeWidth={isActive ? 2.2 : 1.8}
                        />
                      </div>

                      {/* Label */}
                      <span className={`relative z-10 text-xs font-semibold tracking-tight transition-colors ${
                        isActive ? m.activeText : "text-stone-600 group-hover:text-stone-900"
                      }`}>
                        {m.label}
                      </span>

                      {/* Active checkmark */}
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className={`absolute -top-1 -right-1 w-5 h-5 rounded-full ${m.dotColor} flex items-center justify-center shadow-sm`}
                        >
                          <Check size={12} className="text-white" strokeWidth={3} />
                        </motion.div>
                      )}

                      {/* Hover tooltip */}
                      <AnimatePresence>
                        {isHovered && !isActive && (
                          <motion.div
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 4 }}
                            className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-stone-900 text-white text-[10px] font-medium rounded-md whitespace-nowrap z-20"
                          >
                            {m.description}
                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-stone-900 rotate-45" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Pro tip footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-stone-50 to-stone-100/50 border border-stone-200/60"
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
          <Sparkles size={14} className="text-white" />
        </div>
        <div>
          <p className="text-xs font-medium text-stone-700">Pro tip</p>
          <p className="text-[11px] text-stone-500">Changes apply instantly across all connected sites — no deploy needed</p>
        </div>
      </motion.div>
    </div>
  );
}
