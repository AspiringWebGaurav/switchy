"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sliders, Save, Check, ChevronDown, ChevronUp, Lock } from "lucide-react";
import { GuidedEmptyState } from "@/components/ui/empty-state";
import type { ModeValue, ModeConfig } from "@/types/policy";
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

export function ProjectModes({ project, onRefresh }: ProjectModesProps) {
  const [mode, setMode] = useState<ModeValue>(project.mode as ModeValue);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "applying" | "saved" | "error">("idle");
  const [expanded, setExpanded] = useState(false);

  const connectionState = project.enabled === true
    ? "connected"
    : project.enabled === false
    ? "disconnected"
    : project.detected
    ? "detected"
    : "waiting";

  const isConnected = connectionState === "connected";
  const isLocked = !isConnected;

  const primaryModes = modeOptions.filter((m) => m.category === "status");
  const extraModes = modeOptions.filter((m) => m.category !== "status");
  const activeMode = modeOptions.find((m) => m.value === mode);
  const activeInExtra = extraModes.some((m) => m.value === mode);
  const showExtra = expanded || activeInExtra;

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
      <div className="space-y-6">
        <GuidedEmptyState
          icon={Sliders}
          title="Connect your site to control modes"
          steps={[
            { number: 1, text: "Go to the Keys tab" },
            { number: 2, text: "Copy the integration snippet" },
            { number: 3, text: "Add it to your site and refresh" },
          ]}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Mode Status */}
      {activeMode && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center justify-between rounded-xl ${activeMode.activeBg} border ${activeMode.activeBorder} px-5 py-4`}
        >
          <div className="flex items-center gap-3">
            {(() => {
              const Icon = activeMode.icon;
              return <Icon size={18} className={activeMode.activeText} />;
            })()}
            <div>
              <p className={`text-sm font-medium ${activeMode.activeText}`}>
                {mode === "live" ? "Live — No overlay shown" : `${activeMode.label} mode active`}
              </p>
              {mode !== "live" && (
                <p className={`text-xs ${activeMode.activeText} opacity-70`}>
                  Visitors see the overlay on your site
                </p>
              )}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {saveStatus === "applying" && (
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 bg-white/80 px-2.5 py-1 rounded-full"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-pulse" />
                Applying...
              </motion.span>
            )}
            {saveStatus === "saved" && (
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200"
              >
                <Check size={12} />
                Applied
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Mode Selector */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-zinc-200 bg-white p-5"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100">
            <Sliders size={18} className="text-violet-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">Select Mode</h3>
            <p className="text-xs text-zinc-500">Click to switch instantly</p>
          </div>
        </div>

        {/* Primary Modes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {primaryModes.map((m) => {
            const Icon = m.icon;
            const isActive = mode === m.value;
            return (
              <motion.button
                key={m.value}
                onClick={() => handleModeChange(m.value)}
                disabled={saving}
                whileHover={{ scale: saving ? 1 : 1.02 }}
                whileTap={{ scale: saving ? 1 : 0.98 }}
                className={`relative flex flex-col items-center gap-2 rounded-xl border px-3 py-3.5 text-center transition-all ${
                  isActive
                    ? `${m.activeBg} ${m.activeBorder} ${m.activeText} shadow-sm`
                    : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50"
                } disabled:opacity-50`}
              >
                {isActive && (
                  <span className={`absolute top-2 right-2 h-2 w-2 rounded-full ${m.dotColor}`} />
                )}
                <div className={`p-2 rounded-lg ${isActive ? `${m.activeBg}` : "bg-zinc-100"}`}>
                  <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                </div>
                <span className="text-xs font-semibold">{m.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Expand/Collapse */}
        {!activeInExtra && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 mx-auto mt-4 text-sm font-medium text-zinc-400 hover:text-zinc-600 transition-colors py-1"
          >
            {expanded ? (
              <>Less modes <ChevronUp size={14} /></>
            ) : (
              <>More modes <ChevronDown size={14} /></>
            )}
          </button>
        )}

        {/* Extra Modes */}
        <AnimatePresence initial={false}>
          {showExtra && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-4 pt-4 border-t border-zinc-100"
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {extraModes.map((m) => {
                  const Icon = m.icon;
                  const isActive = mode === m.value;
                  return (
                    <motion.button
                      key={m.value}
                      onClick={() => handleModeChange(m.value)}
                      disabled={saving}
                      whileHover={{ scale: saving ? 1 : 1.02 }}
                      whileTap={{ scale: saving ? 1 : 0.98 }}
                      className={`relative flex flex-col items-center gap-2 rounded-xl border px-3 py-3 text-center transition-all ${
                        isActive
                          ? `${m.activeBg} ${m.activeBorder} ${m.activeText} shadow-sm`
                          : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50"
                      } disabled:opacity-50`}
                    >
                      {isActive && (
                        <span className={`absolute top-2 right-2 h-2 w-2 rounded-full ${m.dotColor}`} />
                      )}
                      <div className={`p-1.5 rounded-lg ${isActive ? `${m.activeBg}` : "bg-zinc-100"}`}>
                        <Icon size={16} strokeWidth={isActive ? 2 : 1.5} />
                      </div>
                      <span className="text-[11px] font-semibold">{m.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
