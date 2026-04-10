"use client";

import { useState, useEffect, useRef, KeyboardEvent, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Check, X, AlertCircle, Monitor, Globe, Ban, Settings2, Code2 } from "lucide-react";
import type { UserPreferences } from "@/types/user";

interface SettingsContentProps {
  type: "user" | "project";
  projectId?: string;
  initialSettings?: {
    devOverlayEnabled?: boolean | null;
    devBlocklist?: string[] | null;
    domainAllowlist?: string[] | null;
    domainBlocklist?: string[] | null;
  };
  onSave?: () => void;
}

type SaveState = "idle" | "saving" | "saved" | "error";

interface SettingsState {
  isCustom: boolean; // For project level
  devOverlayEnabled: boolean;
  devBlocklist: string[];       // suppress overlay on these specific dev URLs (hostname[:port])
  domainAllowlist: string[];
  domainBlocklist: string[];
}

// ============================================================================
// REUSABLE SUB-COMPONENTS
// ============================================================================

const ToggleSwitch = memo(function ToggleSwitch({ 
  checked, 
  onChange, 
  disabled,
  activeColor = "bg-indigo-600",
  ringColor = "focus-visible:ring-indigo-600"
}: { 
  checked: boolean; 
  onChange: (v: boolean) => void; 
  disabled?: boolean;
  activeColor?: string;
  ringColor?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${ringColor} ${
        checked ? activeColor : "bg-zinc-200"
      }`}
    >
      <span className="sr-only">Toggle</span>
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
});

function SectionHeader({ 
  title, 
  description, 
  badge,
  icon,
  iconBg
}: { 
  title: string; 
  description: React.ReactNode; 
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  iconBg?: string;
}) {
  return (
    <div className="md:w-1/3 shrink-0">
      <div className="flex items-center gap-3 mb-3">
        {icon && (
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm ring-1 ring-inset ring-black/5 ${iconBg || "bg-indigo-50 text-indigo-500"}`}>
            {icon}
          </div>
        )}
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold tracking-tight text-zinc-900">{title}</h3>
          {badge}
        </div>
      </div>
      <div className="text-sm font-medium text-zinc-600 leading-relaxed pl-11 md:pl-0 mt-1">{description}</div>
    </div>
  );
}

function FeedbackIndicator({ state, errorMessage }: { state: SaveState; errorMessage?: string }) {
  return (
    <AnimatePresence mode="wait">
      {state === "saving" && (
        <motion.div key="saving" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="flex items-center gap-1.5 text-zinc-500 text-sm font-medium">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
        </motion.div>
      )}
      {state === "saved" && (
        <motion.div key="saved" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium">
          <Check className="w-3.5 h-3.5" /> Saved
        </motion.div>
      )}
      {state === "error" && (
        <motion.div key="error" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="flex items-center gap-1.5 text-red-600 text-sm font-medium">
          <AlertCircle className="w-3.5 h-3.5" /> {errorMessage || "Failed to save"}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SettingsCard({
  title,
  description,
  children,
  badge,
  icon,
  iconBg,
  accentType = "default"
}: {
  title: string;
  description: React.ReactNode;
  children: React.ReactNode;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  iconBg?: string;
  accentType?: "violet" | "amber" | "emerald" | "rose" | "indigo" | "default";
}) {
  const accentClasses = {
    violet: "via-violet-500",
    amber: "via-amber-500",
    emerald: "via-emerald-500",
    rose: "via-rose-500",
    indigo: "via-indigo-500",
    default: "via-zinc-300"
  };

  return (
    <div className="relative overflow-hidden border border-zinc-200/80 rounded-2xl bg-white/75 backdrop-blur-sm shadow-sm ring-1 ring-zinc-900/5 mb-8 transition-all hover:shadow-md group">
      <div className={`absolute left-0 top-0 w-[5px] h-full bg-gradient-to-b from-transparent ${accentClasses[accentType]} to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-300`} />
      <div className="p-6 md:p-8 lg:p-10 flex flex-col md:flex-row gap-8 md:gap-14 pl-8 md:pl-10">
        <SectionHeader title={title} description={description} badge={badge} icon={icon} iconBg={iconBg} />
        <div className="md:w-2/3 flex flex-col gap-5">{children}</div>
      </div>
    </div>
  );
}

const DomainChipList = memo(function DomainChipList({ 
  domains, 
  onRemove,
  disabled,
  chipStyle = "default" 
}: { 
  domains: string[]; 
  onRemove: (d: string) => void;
  disabled?: boolean;
  chipStyle?: "default" | "allow" | "block";
}) {
  if (domains.length === 0) return null;

  const styles = {
    default: "bg-zinc-100/80 text-zinc-700 border-zinc-200/50",
    allow: "bg-emerald-50 text-emerald-700 border-emerald-200/50 shadow-sm",
    block: "bg-rose-50 text-rose-700 border-rose-200/50 shadow-sm"
  };

  const btnStyles = {
    default: "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200",
    allow: "text-emerald-500 hover:text-emerald-800 hover:bg-emerald-100",
    block: "text-rose-500 hover:text-rose-800 hover:bg-rose-100"
  };

  return (
    <div className="max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
      <div className="flex flex-wrap gap-2">
        <AnimatePresence mode="popLayout">
          {domains.map((d) => (
            <motion.span
              key={d}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm border transition-colors ${styles[chipStyle]} ${disabled ? "opacity-70 grayscale-[0.3]" : ""}`}
            >
              {d}
              {!disabled && (
                <button 
                  onClick={() => onRemove(d)} 
                  className={`rounded p-0.5 focus:outline-none transition-colors ml-1 ${btnStyles[chipStyle]}`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
});

function DomainInput({
  domains,
  onChange,
  placeholder,
  emptyStateText,
  disabled,
  chipStyle = "default",
  accentColor = "indigo"
}: {
  domains: string[];
  onChange: (newDomains: string[]) => void;
  placeholder: string;
  emptyStateText: string;
  disabled?: boolean;
  chipStyle?: "default" | "allow" | "block";
  accentColor?: "indigo" | "emerald" | "rose";
}) {
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const processInput = () => {
    if (!inputValue) return;
    
    // Helper to strip protocol and paths from pasted URLs
    const cleanUrl = (url: string) => {
      let cleaned = url.replace(/^(https?:\/\/)?/, "");
      cleaned = cleaned.split("/")[0];
      return cleaned;
    };
    
    // Split by comma, space or newline, clean URLs, trim, and to lowercase
    const rawInputs = inputValue
      .split(/[\s,]+/)
      .map(v => cleanUrl(v.trim().toLowerCase()))
      .filter(Boolean);
    
    if (rawInputs.length === 0) return;

    const currentDomains = new Set(domains);
    let addedCount = 0;

    for (const val of rawInputs) {
      if (!currentDomains.has(val)) {
        currentDomains.add(val);
        addedCount++;
      }
    }

    if (addedCount > 0) {
      onChange(Array.from(currentDomains));
    } else if (rawInputs.length === 1 && domains.includes(rawInputs[0])) {
       setError("Domain already added");
       return; // don't clear input to allow user to modify it
    }
    setInputValue("");
    setError(null);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === " " || e.key === ",") {
      e.preventDefault(); // prevent space or comma from being typed
      if (inputValue.trim()) {
        processInput();
      }
    }
  };

  const removeDomain = (domain: string) => {
    onChange(domains.filter((d) => d !== domain));
  };

  const focusRings = {
    indigo: "focus:ring-indigo-500/20 focus:border-indigo-400",
    emerald: "focus:ring-emerald-500/20 focus:border-emerald-400",
    rose: "focus:ring-rose-500/20 focus:border-rose-400"
  };

  const btnColors = {
    indigo: "bg-indigo-600 hover:bg-indigo-700",
    emerald: "bg-emerald-600 hover:bg-emerald-700",
    rose: "bg-rose-600 hover:bg-rose-700"
  };

  return (
    <div className={`space-y-4 ${disabled ? "pointer-events-none grayscale-[0.2]" : ""}`}>
      <div>
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (inputValue.trim()) processInput();
            }}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full px-3.5 py-2.5 text-sm border border-zinc-200 rounded-lg bg-white shadow-sm hover:border-zinc-300 focus:outline-none focus:ring-2 transition-all placeholder:text-zinc-400 disabled:bg-zinc-50 ${focusRings[accentColor]}`}
          />
          <AnimatePresence>
            {inputValue.trim() && (
              <motion.button
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={processInput}
                disabled={disabled}
                className={`absolute right-1.5 top-1.5 bottom-1.5 px-3 text-xs font-medium text-white rounded-md shadow-sm transition-colors disabled:opacity-50 ${btnColors[accentColor]}`}
              >
                Add
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        <AnimatePresence>
          {error && (
            <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-xs text-red-500 mt-2 font-medium">
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {domains.length > 0 ? (
        <DomainChipList domains={domains} onRemove={removeDomain} disabled={disabled} chipStyle={chipStyle} />
      ) : (
        <div className="py-6 px-4 border border-dashed border-zinc-200 bg-zinc-50/50 rounded-lg flex flex-col items-center justify-center text-center">
          <p className="text-xs text-zinc-500">{emptyStateText}</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SettingsContent({ type, projectId, initialSettings, onSave }: SettingsContentProps) {
  // If the caller already has settings data (e.g. dashboard page), start ready immediately.
  // User type always needs a fetch; project type only needs one if initialSettings wasn't passed.
  const hasInitialData = type === "project" && initialSettings !== undefined;
  const [loading, setLoading] = useState(!hasInitialData);
  const [saveStatus, setSaveStatus] = useState<SaveState>("idle");
  const [hasChanges, setHasChanges] = useState(false);
  
  // Compute initial form state from prop when available
  const computedInitialState = (): SettingsState => {
    if (hasInitialData && initialSettings) {
      const s = initialSettings;
      const isCustom =
        (s.devOverlayEnabled !== null && s.devOverlayEnabled !== undefined) ||
        (s.devBlocklist !== null && s.devBlocklist !== undefined) ||
        (s.domainAllowlist !== null && s.domainAllowlist !== undefined) ||
        (s.domainBlocklist !== null && s.domainBlocklist !== undefined);
      return {
        isCustom,
        devOverlayEnabled: s.devOverlayEnabled ?? true,
        devBlocklist: s.devBlocklist ?? [],
        domainAllowlist: s.domainAllowlist ?? [],
        domainBlocklist: s.domainBlocklist ?? [],
      };
    }
    return { isCustom: false, devOverlayEnabled: true, devBlocklist: [], domainAllowlist: [], domainBlocklist: [] };
  };

  const [state, setState] = useState<SettingsState>(computedInitialState);

  // Track pristine state purely for dirty checking
  const [pristineState, setPristineState] = useState<SettingsState>(state);

  // Deep compare arrays for dirty check
  useEffect(() => {
    const isDirty = 
      state.isCustom !== pristineState.isCustom ||
      state.devOverlayEnabled !== pristineState.devOverlayEnabled ||
      state.domainAllowlist.join(',') !== pristineState.domainAllowlist.join(',') ||
      state.domainBlocklist.join(',') !== pristineState.domainBlocklist.join(',') ||
      state.devBlocklist.join(',') !== pristineState.devBlocklist.join(',');
    
    setHasChanges(isDirty);
  }, [state, pristineState]);

  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const tabIdRef = useRef<string>(`tab-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);

  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        if (type === "user") {
          const res = await fetch("/api/v1/users/me/preferences");
          if (res.ok) {
            const data = (await res.json()).data;
            const initialState: SettingsState = {
              isCustom: true,
              devOverlayEnabled: data.devOverlayEnabled ?? true,
              devBlocklist: data.devBlocklist ?? [],
              domainAllowlist: data.domainAllowlist ?? [],
              domainBlocklist: data.domainBlocklist ?? [],
            };
            if (mounted) {
              setState(initialState);
              setPristineState(initialState);
            }
          }
        } else if (type === "project" && projectId) {
          // If the parent passed initialSettings, use them directly — no need to re-fetch
          if (initialSettings !== undefined) {
            const settings = initialSettings || {};
            const isCustom =
              (settings.devOverlayEnabled !== null && settings.devOverlayEnabled !== undefined) ||
              (settings.devBlocklist !== null && settings.devBlocklist !== undefined) ||
              (settings.domainAllowlist !== null && settings.domainAllowlist !== undefined) ||
              (settings.domainBlocklist !== null && settings.domainBlocklist !== undefined);
            const initialState: SettingsState = {
              isCustom,
              devOverlayEnabled: settings.devOverlayEnabled ?? true,
              devBlocklist: settings.devBlocklist ?? [],
              domainAllowlist: settings.domainAllowlist ?? [],
              domainBlocklist: settings.domainBlocklist ?? [],
            };
            if (mounted) {
              setState(initialState);
              setPristineState(initialState);
            }
          } else {
            // Fallback: fetch if parent didn't provide initialSettings
            const res = await fetch(`/api/v1/projects/${projectId}`);
            if (res.ok) {
              const data = (await res.json()).data;
              const settings = data.settings || {};
              const isCustom = (settings.devOverlayEnabled !== null && settings.devOverlayEnabled !== undefined) || 
                               (settings.devBlocklist !== null && settings.devBlocklist !== undefined) ||
                               (settings.domainAllowlist !== null && settings.domainAllowlist !== undefined) || 
                               (settings.domainBlocklist !== null && settings.domainBlocklist !== undefined);
              const initialState: SettingsState = {
                isCustom,
                devOverlayEnabled: settings.devOverlayEnabled ?? true,
                devBlocklist: settings.devBlocklist ?? [],
                domainAllowlist: settings.domainAllowlist ?? [],
                domainBlocklist: settings.domainBlocklist ?? [],
              };
              if (mounted) {
                setState(initialState);
                setPristineState(initialState);
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch settings:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, [type, projectId, initialSettings]);

  // BroadcastChannel: listen for settings changes from other tabs
  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;
    const channel = new BroadcastChannel("switchy-settings-sync");
    broadcastChannelRef.current = channel;

    channel.onmessage = (event: MessageEvent) => {
      const msg = event.data;
      if (msg.source === tabIdRef.current) return; // ignore own messages
      if (msg.type !== "settings_change") return;
      if (type === "project" && msg.projectId !== projectId) return;
      if (type === "user" && msg.projectId) return; // user settings change from non-user context

      // Apply the settings broadcast from another tab
      const s = msg.settings || {};
      const isCustom =
        (s.devOverlayEnabled !== null && s.devOverlayEnabled !== undefined) ||
        (s.devBlocklist !== null && s.devBlocklist !== undefined) ||
        (s.domainAllowlist !== null && s.domainAllowlist !== undefined) ||
        (s.domainBlocklist !== null && s.domainBlocklist !== undefined);
      const newState: SettingsState = {
        isCustom: type === "user" ? true : isCustom,
        devOverlayEnabled: s.devOverlayEnabled ?? true,
        devBlocklist: s.devBlocklist ?? [],
        domainAllowlist: s.domainAllowlist ?? [],
        domainBlocklist: s.domainBlocklist ?? [],
      };
      setState(newState);
      setPristineState(newState);
    };

    return () => {
      channel.close();
      broadcastChannelRef.current = null;
    };
  }, [type, projectId]);

  const handleSave = async () => {
    if (!hasChanges) return;
    
    setSaveStatus("saving");

    try {
      let res: Response;

      const prepareArrays = (arr: string[]) => (arr.length > 0 ? arr : type === "project" && !state.isCustom ? null : []);

      const payloadUser = {
        devOverlayEnabled: state.devOverlayEnabled,
        devBlocklist: prepareArrays(state.devBlocklist) ?? [],
        domainAllowlist: prepareArrays(state.domainAllowlist) ?? [],
        domainBlocklist: prepareArrays(state.domainBlocklist) ?? [],
      };

      const payloadProject = {
        settings: state.isCustom 
        ? {
            devOverlayEnabled: state.devOverlayEnabled,
            devBlocklist: prepareArrays(state.devBlocklist),
            domainAllowlist: prepareArrays(state.domainAllowlist),
            domainBlocklist: prepareArrays(state.domainBlocklist),
          }
        : {
            devOverlayEnabled: null,
            devBlocklist: null,
            domainAllowlist: null,
            domainBlocklist: null,
          }
      };

      if (type === "user") {
        res = await fetch("/api/v1/users/me/preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payloadUser),
        });
      } else {
        res = await fetch(`/api/v1/projects/${projectId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payloadProject),
        });
      }

      if (res.ok) {
        setSaveStatus("saved");
        setPristineState(state); // Clean the dirty state
        onSave?.();

        // Broadcast the change to other open dashboard tabs so they stay in sync
        if (broadcastChannelRef.current) {
          const broadcastSettings = type === "user"
            ? { devOverlayEnabled: state.devOverlayEnabled, devBlocklist: state.devBlocklist, domainAllowlist: state.domainAllowlist, domainBlocklist: state.domainBlocklist }
            : state.isCustom
              ? { devOverlayEnabled: state.devOverlayEnabled, devBlocklist: state.devBlocklist, domainAllowlist: state.domainAllowlist, domainBlocklist: state.domainBlocklist }
              : { devOverlayEnabled: null, devBlocklist: null, domainAllowlist: null, domainBlocklist: null };

          broadcastChannelRef.current.postMessage({
            type: "settings_change",
            projectId: projectId ?? null,
            settings: broadcastSettings,
            source: tabIdRef.current,
          });
        }

        setTimeout(() => setSaveStatus("idle"), 2500);
      } else {
        throw new Error("Failed to save");
      }
    } catch (e) {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 4000);
    }
  };

  const updateField = (key: keyof SettingsState, val: any) => {
    setState(s => ({ ...s, [key]: val }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  // If not custom, elements render in clear "read-only/inherited" visually disabled view
  const isInheriting = type === "project" && !state.isCustom;

  return (
    <div className="pb-12 w-full">
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #e4e4e7;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #d4d4d8;
        }
      `}} />

      {/* Top Level Master Control (Projects Only) */}
      {type === "project" && (
        <div className="mb-8 p-6 md:p-8 rounded-2xl border border-indigo-200/60 bg-gradient-to-r from-indigo-50/80 to-purple-50/40 shadow-sm flex items-center justify-between ring-1 ring-inset ring-indigo-100/50">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 shadow-sm ring-1 ring-inset ring-black/5">
              <Settings2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight text-zinc-900">Custom Settings</h3>
              <p className="text-sm font-medium text-zinc-600 mt-1">
                Turn this ON to use your own settings for this project.<br/>
                Turn this OFF to use default (global) settings.
              </p>
            </div>
          </div>
          <ToggleSwitch 
            checked={state.isCustom} 
            onChange={(val) => updateField("isCustom", val)} 
            activeColor="bg-indigo-600"
            ringColor="focus-visible:ring-indigo-600"
          />
        </div>
      )}

      {/* Development Overlay */}
      <SettingsCard
        title="Development Overlay"
        description={<>This overlay shows on development sites (like localhost) by default.<br />You can show it everywhere or hide it on specific links.</>}
        badge={isInheriting ? <span className="px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase text-zinc-500 bg-zinc-100 rounded-full ring-1 ring-inset ring-zinc-200/60 shadow-sm">Inherited</span> : null}
        icon={<Monitor className="w-5 h-5" />}
        iconBg="bg-violet-100 text-violet-600"
        accentType="violet"
      >
        <div className={`flex items-center justify-between p-4 flex-col md:flex-row gap-4 md:gap-0 rounded-lg border border-violet-200/60 bg-violet-50/40 ${isInheriting ? "opacity-75 bg-zinc-50 pointer-events-none grayscale-[0.2]" : ""}`}>
          <div className="w-full text-left">
            <span className="text-[15px] font-semibold text-zinc-900 block">Hide Overlay on Dev Sites</span>
            <span className="text-sm font-medium text-zinc-600 block mt-1.5 leading-relaxed">
              <span className="font-bold text-zinc-800">When ON</span> &rarr; Overlay is hidden on all development sites<br/>
              <span className="font-bold text-zinc-800">When OFF</span> &rarr; Overlay shows on all development sites
            </span>
          </div>
          <ToggleSwitch 
            checked={state.devOverlayEnabled === false}
            onChange={(checked) => updateField("devOverlayEnabled", !checked)}
            disabled={isInheriting}
            activeColor="bg-violet-600"
            ringColor="focus-visible:ring-violet-600"
          />
        </div>
      </SettingsCard>

      {/* Dev Suppression URLs */}
      <SettingsCard
        title="Hide Overlay on Specific Links"
        description={<>
          Add links where you do NOT want to see the overlay.
          <br /><br />
          <strong>Examples:</strong>
          <ul className="list-disc ml-4 mt-1">
            <li>localhost:3000</li>
            <li>staging.myapp.com</li>
          </ul>
          <br />
          <strong>Rules:</strong>
          <ul className="list-disc ml-4 mt-1">
            <li>Overlay will be hidden only on these links</li>
            <li>Overlay will still show on all other development links</li>
            <li>This does NOT affect production</li>
          </ul>
        </>}
        badge={isInheriting ? <span className="px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase text-zinc-500 bg-zinc-100 rounded-full ring-1 ring-inset ring-zinc-200/60 shadow-sm">Inherited</span> : null}
        icon={<Code2 className="w-5 h-5" />}
        iconBg="bg-amber-100 text-amber-600"
        accentType="amber"
      >
        <DomainInput
          domains={state.devBlocklist}
          onChange={(newUrls) => updateField("devBlocklist", newUrls)}
          placeholder="e.g. localhost:3000, staging.myapp.com"
          emptyStateText="No links added. Overlay shows on all development sites."
          disabled={isInheriting}
          chipStyle="block"
          accentColor="rose"
        />
      </SettingsCard>

      {/* Allowlist and Blocklist UI elements hidden as requested */}

      {/* Floating Centered Action Pill */}
      <AnimatePresence>
        {(hasChanges || saveStatus !== "idle") && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-0 right-0 z-50 md:left-64 lg:left-72 pointer-events-none flex justify-center"
          >
            <motion.div 
              layout
              className={`pointer-events-auto bg-zinc-900/95 backdrop-blur-md border border-white/10 shadow-2xl shadow-indigo-900/20 rounded-full py-2 flex items-center gap-6 overflow-hidden transition-all duration-300 ring-1 ring-white/5 ${
                (saveStatus === "idle" && hasChanges) ? "pl-6 pr-2" : "px-6"
              }`}
            >
              <motion.div layout className="text-sm font-medium">
                {saveStatus === "saving" && (
                  <motion.span 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-zinc-300 flex items-center gap-2"
                  >
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> Saving...
                  </motion.span>
                )}
                {saveStatus === "error" && (
                  <motion.span 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-rose-400 flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4" /> Failed to save
                  </motion.span>
                )}
                {saveStatus === "saved" && (
                  <motion.span 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-emerald-400 flex items-center gap-2"
                  >
                    <div className="flex items-center justify-center bg-emerald-500/20 rounded-full p-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    Changes saved
                  </motion.span>
                )}
                {saveStatus === "idle" && hasChanges && (
                  <span className="flex items-center gap-3 text-[14px] text-white font-medium tracking-wide">
                    <span className="relative flex h-2 w-2">
                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                       <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </span>
                    You have unsaved changes
                  </span>
                )}
              </motion.div>

              {saveStatus === "idle" && hasChanges && (
                <motion.button
                  layout
                  initial={{ opacity: 0, filter: "blur(4px)" }}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  onClick={handleSave}
                  className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white text-[13px] font-bold tracking-wide rounded-full shadow-lg shadow-indigo-500/25 transition-all outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
                >
                  Save Changes
                </motion.button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div >
  );
}
