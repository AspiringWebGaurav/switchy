"use client";

import { useState, useEffect, KeyboardEvent, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Check, X, AlertCircle, Monitor, Globe, Ban, Settings2 } from "lucide-react";
import type { UserPreferences } from "@/types/user";

interface SettingsContentProps {
  type: "user" | "project";
  projectId?: string;
  initialSettings?: {
    devOverlayEnabled?: boolean | null;
    domainAllowlist?: string[] | null;
    domainBlocklist?: string[] | null;
  };
  onSave?: () => void;
}

type SaveState = "idle" | "saving" | "saved" | "error";

interface SettingsState {
  isCustom: boolean; // For project level
  devOverlayEnabled: boolean;
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
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${ringColor} ${
        checked ? activeColor : "bg-zinc-200"
      }`}
    >
      <span className="sr-only">Toggle</span>
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-2" : "-translate-x-2"
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
  description: string; 
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  iconBg?: string;
}) {
  return (
    <div className="md:w-1/3 shrink-0">
      <div className="flex items-center gap-3 mb-2">
        {icon && (
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBg || "bg-indigo-50 text-indigo-500"}`}>
            {icon}
          </div>
        )}
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
          {badge}
        </div>
      </div>
      <p className="text-sm text-zinc-500 leading-relaxed pl-11 md:pl-0">{description}</p>
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
  iconBg
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  iconBg?: string;
}) {
  return (
    <div className="border border-zinc-200 rounded-xl bg-white shadow-sm mb-6">
      <div className="p-5 md:p-6 lg:p-8 flex flex-col md:flex-row gap-6 md:gap-12">
        <SectionHeader title={title} description={description} badge={badge} icon={icon} iconBg={iconBg} />
        <div className="md:w-2/3 flex flex-col gap-4">{children}</div>
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
    
    // Split by comma, space or newline, trim, and to lowercase
    const rawInputs = inputValue.split(/[\s,]+/).map(v => v.trim().toLowerCase()).filter(Boolean);
    
    if (rawInputs.length === 0) return;

    const domainRegex = /^(\*\.)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/;
    let hasError = false;
    const currentDomains = new Set(domains);
    let addedCount = 0;

    for (const val of rawInputs) {
      if (!domainRegex.test(val) && val !== "localhost") {
        setError(`Invalid format: ${val}`);
        hasError = true;
        break;
      }
      if (!currentDomains.has(val)) {
        currentDomains.add(val);
        addedCount++;
      }
    }

    if (!hasError) {
      if (addedCount > 0) {
        onChange(Array.from(currentDomains));
      } else if (rawInputs.length === 1 && domains.includes(rawInputs[0])) {
         setError("Domain already added");
         return; // don't clear input to allow user to modify it
      }
      setInputValue("");
      setError(null);
    }
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
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveState>("idle");
  const [hasChanges, setHasChanges] = useState(false);
  
  // Track our form state
  const [state, setState] = useState<SettingsState>({
    isCustom: initialSettings?.devOverlayEnabled !== null && initialSettings?.domainAllowlist !== null, // approximate init
    devOverlayEnabled: false,
    domainAllowlist: [],
    domainBlocklist: [],
  });

  // Track pristine state purely for dirty checking
  const [pristineState, setPristineState] = useState<SettingsState>(state);

  // Deep compare arrays for dirty check
  useEffect(() => {
    const isDirty = 
      state.isCustom !== pristineState.isCustom ||
      state.devOverlayEnabled !== pristineState.devOverlayEnabled ||
      state.domainAllowlist.join(',') !== pristineState.domainAllowlist.join(',') ||
      state.domainBlocklist.join(',') !== pristineState.domainBlocklist.join(',');
    
    setHasChanges(isDirty);
  }, [state, pristineState]);

  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        if (type === "user") {
          const res = await fetch("/api/v1/users/me/preferences");
          if (res.ok) {
            const data = (await res.json()).data;
            const initialState: SettingsState = {
              isCustom: true, // User level is always custom
              devOverlayEnabled: data.devOverlayEnabled ?? false,
              domainAllowlist: data.domainAllowlist ?? [],
              domainBlocklist: data.domainBlocklist ?? [],
            };
            if (mounted) {
              setState(initialState);
              setPristineState(initialState);
            }
          }
        } else if (type === "project" && projectId) {
          const res = await fetch(`/api/v1/projects/${projectId}`);
          if (res.ok) {
            const data = (await res.json()).data;
            const settings = data.settings || {};
            // Determine if project relies on custom settings by checking if any setting is explicitly non-null
            const isCustom = (settings.devOverlayEnabled !== null && settings.devOverlayEnabled !== undefined) || 
                             (settings.domainAllowlist !== null && settings.domainAllowlist !== undefined) || 
                             (settings.domainBlocklist !== null && settings.domainBlocklist !== undefined);
            
            const initialState: SettingsState = {
              isCustom: isCustom,
              devOverlayEnabled: settings.devOverlayEnabled ?? false,
              domainAllowlist: settings.domainAllowlist ?? [],
              domainBlocklist: settings.domainBlocklist ?? [],
            };
            if (mounted) {
              setState(initialState);
              setPristineState(initialState);
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
  }, [type, projectId]);

  const handleSave = async () => {
    if (!hasChanges) return;
    
    setSaveStatus("saving");

    try {
      let res: Response;

      const prepareArrays = (arr: string[]) => (arr.length > 0 ? arr : type === "project" && !state.isCustom ? null : []);

      const payloadUser = {
        devOverlayEnabled: state.devOverlayEnabled,
        domainAllowlist: prepareArrays(state.domainAllowlist) ?? [],
        domainBlocklist: prepareArrays(state.domainBlocklist) ?? [],
      };

      const payloadProject = {
        settings: state.isCustom 
        ? {
            devOverlayEnabled: state.devOverlayEnabled,
            domainAllowlist: prepareArrays(state.domainAllowlist),
            domainBlocklist: prepareArrays(state.domainBlocklist),
          }
        : {
            devOverlayEnabled: null,
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
    <div className="pb-12 max-w-5xl">
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
        <div className="mb-6 p-5 rounded-xl border border-indigo-100 bg-indigo-50/30 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">Use Custom Settings</h3>
              <p className="text-sm text-zinc-500 mt-0.5">Toggle off to inherit settings strictly from your global configuration</p>
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

      {/* Dev Overlay Component */}
      <SettingsCard
        title="Testing Mode"
        description="Configure whether the development overlay is visible. This helps with debugging and setting up Switchyy on your site."
        badge={isInheriting ? <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase bg-zinc-100 text-zinc-500 rounded">Inherited</span> : null}
        icon={<Monitor className="w-4 h-4" />}
        iconBg="bg-violet-100 text-violet-600"
      >
        <div className={`flex items-center justify-between p-4 rounded-lg border border-violet-100/50 bg-violet-50/30 ${isInheriting ? "opacity-50 grayscale-[0.8] cursor-not-allowed" : ""}`}>
          <div>
            <span className="text-sm font-medium text-zinc-900 block">Show Testing Overlay</span>
            <span className="text-xs text-zinc-500 block mt-0.5">Toggle the visual overlay component on your website</span>
          </div>
          <ToggleSwitch 
            checked={state.devOverlayEnabled} 
            onChange={(c) => updateField("devOverlayEnabled", c)} 
            disabled={isInheriting}
            activeColor="bg-violet-600"
            ringColor="focus-visible:ring-violet-600"
          />
        </div>
      </SettingsCard>

      {/* Show Only On Component */}
      <SettingsCard
        title="Allowlist Domains"
        description="Strictly limit where your banner can appear. If specified, the banner will only show on these exact domains."
        badge={isInheriting ? <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase bg-zinc-100 text-zinc-500 rounded">Inherited</span> : null}
        icon={<Globe className="w-4 h-4" />}
        iconBg="bg-emerald-100 text-emerald-600"
      >
        <DomainInput
          domains={state.domainAllowlist}
          onChange={(newDomains) => updateField("domainAllowlist", newDomains)}
          placeholder="e.g. example.com, myapp.com"
          emptyStateText="No allowlist restrictions. Banner will show anywhere the script is embedded."
          disabled={isInheriting}
          chipStyle="allow"
          accentColor="emerald"
        />
      </SettingsCard>

      {/* Never Show On Component */}
      <SettingsCard
        title="Blocklist Domains"
        description="Prevent the banner from appearing on specific domains or subdomains, such as staging or internal environments."
        badge={isInheriting ? <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase bg-zinc-100 text-zinc-500 rounded">Inherited</span> : null}
        icon={<Ban className="w-4 h-4" />}
        iconBg="bg-rose-100 text-rose-600"
      >
        <DomainInput
          domains={state.domainBlocklist}
          onChange={(newDomains) => updateField("domainBlocklist", newDomains)}
          placeholder="e.g. staging.example.com"
          emptyStateText="No blocked domains. The banner will not be explicitly hidden anywhere."
          disabled={isInheriting}
          chipStyle="block"
          accentColor="rose"
        />
      </SettingsCard>

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
              className={`pointer-events-auto bg-zinc-900 border border-zinc-800 shadow-xl shadow-zinc-900/20 rounded-full py-2 flex items-center gap-4 overflow-hidden transition-all duration-300 ${
                (saveStatus === "idle" && hasChanges) ? "pl-5 pr-2" : "px-5"
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
                  <span className="text-zinc-300">You have unsaved changes</span>
                )}
              </motion.div>

              {saveStatus === "idle" && hasChanges && (
                <motion.button
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={handleSave}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-full shadow-sm transition-colors"
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
