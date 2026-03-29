"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Check, ChevronDown, Sparkles } from "lucide-react";
import type { CustomPreset, ModeConfig } from "@/types/policy";

interface PresetSelectorProps {
  projectId: string;
  currentConfig: ModeConfig;
  onSelect: (preset: CustomPreset) => void;
  onConfigChange: (config: ModeConfig) => void;
  disabled?: boolean;
}

const DEFAULT_PRESETS: { name: string; config: ModeConfig }[] = [
  {
    name: "Under Construction",
    config: {
      message: "We're building something amazing!",
      buttonText: "Notify Me",
      redirectUrl: null,
    },
  },
  {
    name: "Coming Soon",
    config: {
      message: "Something exciting is coming soon!",
      buttonText: "Learn More",
      redirectUrl: null,
    },
  },
  {
    name: "Maintenance Break",
    config: {
      message: "We'll be back shortly after a quick update.",
      buttonText: "Check Status",
      redirectUrl: null,
    },
  },
  {
    name: "Temporarily Closed",
    config: {
      message: "We're temporarily closed. Thank you for your patience.",
      buttonText: null,
      redirectUrl: null,
    },
  },
];

export function PresetSelector({
  projectId,
  currentConfig,
  onSelect,
  onConfigChange,
  disabled,
}: PresetSelectorProps) {
  const [presets, setPresets] = useState<CustomPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<CustomPreset | null>(null);

  useEffect(() => {
    fetchPresets();
  }, [projectId]);

  async function fetchPresets() {
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/presets`);
      if (res.ok) {
        const json = await res.json();
        setPresets(json.data || []);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }

  async function handleSavePreset() {
    if (!newPresetName.trim()) return;

    try {
      setSaving(true);
      const res = await fetch(`/api/v1/projects/${projectId}/presets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newPresetName.trim(),
          config: currentConfig,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setPresets((prev) => [json.data, ...prev]);
        setSelectedPreset(json.data);
        setShowSaveModal(false);
        setNewPresetName("");
      }
    } catch {
      /* silent */
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePreset(presetId: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/presets/${presetId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPresets((prev) => prev.filter((p) => p.id !== presetId));
        if (selectedPreset?.id === presetId) {
          setSelectedPreset(null);
        }
      }
    } catch {
      /* silent */
    }
  }

  function handleSelectPreset(preset: CustomPreset) {
    setSelectedPreset(preset);
    onSelect(preset);
    onConfigChange(preset.config);
    setIsOpen(false);
  }

  const [selectedName, setSelectedName] = useState<string | null>(null);

  function handleSelectDefault(preset: { name: string; config: ModeConfig }) {
    setSelectedPreset(null);
    setSelectedName(preset.name);
    onConfigChange(preset.config);
    setIsOpen(false);
  }

  function handleSelectSaved(preset: CustomPreset) {
    setSelectedPreset(preset);
    setSelectedName(preset.name);
    onSelect(preset);
    onConfigChange(preset.config);
    setIsOpen(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-stone-600">Quick Start or Saved</label>
        <button
          onClick={() => setShowSaveModal(true)}
          disabled={disabled}
          className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
        >
          <Plus size={12} />
          Save Current
        </button>
      </div>

      {/* Preset Dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled || loading}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-stone-200 bg-white text-sm text-stone-700 hover:border-stone-300 disabled:opacity-50 transition-colors"
        >
          <span className={selectedName ? "text-stone-900" : "text-stone-400"}>
            {loading ? "Loading..." : selectedName || "Choose a template or saved preset..."}
          </span>
          <ChevronDown size={14} className={`text-stone-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute z-10 mt-1 w-full rounded-lg border border-stone-200 bg-white shadow-lg overflow-hidden max-h-64 overflow-y-auto"
            >
              {/* Default Templates */}
              <div className="px-3 py-1.5 bg-stone-50 border-b border-stone-100">
                <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles size={10} />
                  Templates
                </span>
              </div>
              {DEFAULT_PRESETS.map((preset) => (
                <div
                  key={preset.name}
                  onClick={() => handleSelectDefault(preset)}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-indigo-50 cursor-pointer"
                >
                  {selectedName === preset.name && !selectedPreset && (
                    <Check size={12} className="text-indigo-600 shrink-0" />
                  )}
                  <span className="text-sm text-stone-700">{preset.name}</span>
                </div>
              ))}

              {/* User Saved Presets */}
              {presets.length > 0 && (
                <>
                  <div className="px-3 py-1.5 bg-stone-50 border-y border-stone-100">
                    <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                      Your Saved
                    </span>
                  </div>
                  {presets.map((preset) => (
                    <div
                      key={preset.id}
                      onClick={() => handleSelectSaved(preset)}
                      className="flex items-center justify-between px-3 py-2 hover:bg-stone-50 cursor-pointer group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {selectedPreset?.id === preset.id && (
                          <Check size={12} className="text-indigo-600 shrink-0" />
                        )}
                        <span className="text-sm text-stone-700 truncate">{preset.name}</span>
                      </div>
                      <button
                        onClick={(e) => handleDeletePreset(preset.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-red-500 transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Save Modal */}
      <AnimatePresence>
        {showSaveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setShowSaveModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl p-5 w-full max-w-sm shadow-xl"
            >
              <h3 className="text-sm font-semibold text-stone-900 mb-3">Save as Preset</h3>
              <input
                type="text"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder="Preset name..."
                className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                autoFocus
              />
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePreset}
                  disabled={!newPresetName.trim() || saving}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-500 rounded-lg hover:bg-indigo-600 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
