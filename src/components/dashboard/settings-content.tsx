"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Monitor, Globe, Plus, X, Check, Loader2, Ban } from "lucide-react";
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

export function SettingsContent({ type, projectId, initialSettings, onSave }: SettingsContentProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [devOverlayEnabled, setDevOverlayEnabled] = useState<boolean | null>(
    initialSettings?.devOverlayEnabled ?? null
  );
  const [domainAllowlist, setDomainAllowlist] = useState<string[]>(
    initialSettings?.domainAllowlist ?? []
  );
  const [domainBlocklist, setDomainBlocklist] = useState<string[]>(
    initialSettings?.domainBlocklist ?? []
  );
  const [newAllowDomain, setNewAllowDomain] = useState("");
  const [newBlockDomain, setNewBlockDomain] = useState("");
  const [allowError, setAllowError] = useState<string | null>(null);
  const [blockError, setBlockError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");

  useEffect(() => {
    if (type === "user") {
      fetchUserPreferences();
    } else if (type === "project" && projectId) {
      fetchProjectSettings();
    } else {
      setLoading(false);
    }
  }, [type, projectId]);

  async function fetchUserPreferences() {
    try {
      const res = await fetch("/api/v1/users/me/preferences");
      if (res.ok) {
        const json = await res.json();
        const prefs = json.data as UserPreferences;
        setDevOverlayEnabled(prefs.devOverlayEnabled ?? false);
        setDomainAllowlist(prefs.domainAllowlist ?? []);
        setDomainBlocklist(prefs.domainBlocklist ?? []);
      } else {
        setDevOverlayEnabled(false);
        setDomainAllowlist([]);
        setDomainBlocklist([]);
      }
    } catch (err) {
      console.error("Failed to fetch preferences:", err);
      setDevOverlayEnabled(false);
      setDomainAllowlist([]);
      setDomainBlocklist([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchProjectSettings() {
    try {
      const res = await fetch(`/api/v1/projects/${projectId}`);
      if (res.ok) {
        const json = await res.json();
        const settings = json.data?.settings || {};
        setDevOverlayEnabled(settings.devOverlayEnabled ?? null);
        setDomainAllowlist(settings.domainAllowlist ?? []);
        setDomainBlocklist(settings.domainBlocklist ?? []);
      } else {
        setDevOverlayEnabled(null);
        setDomainAllowlist([]);
        setDomainBlocklist([]);
      }
    } catch (err) {
      console.error("Failed to fetch project settings:", err);
      setDevOverlayEnabled(null);
      setDomainAllowlist([]);
      setDomainBlocklist([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaveStatus("idle");

    try {
      let res: Response;
      
      if (type === "user") {
        res = await fetch("/api/v1/users/me/preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            devOverlayEnabled: devOverlayEnabled ?? false,
            domainAllowlist,
            domainBlocklist,
          }),
        });
      } else {
        res = await fetch(`/api/v1/projects/${projectId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            settings: {
              devOverlayEnabled,
              domainAllowlist: domainAllowlist.length > 0 ? domainAllowlist : null,
              domainBlocklist: domainBlocklist.length > 0 ? domainBlocklist : null,
            },
          }),
        });
      }

      if (res.ok) {
        setSaveStatus("saved");
        onSave?.();
        setTimeout(() => setSaveStatus("idle"), 2500);
      } else {
        setSaveStatus("error");
      }
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }

  function validateDomain(domain: string): string | null {
    if (!domain) return "Enter a domain";
    const domainRegex = /^(\*\.)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/;
    if (!domainRegex.test(domain)) return "Invalid format";
    return null;
  }

  function handleAddAllowDomain() {
    const domain = newAllowDomain.trim().toLowerCase();
    const error = validateDomain(domain);
    if (error) { setAllowError(error); return; }
    if (domainAllowlist.includes(domain)) { setAllowError("Already added"); return; }
    setDomainAllowlist([...domainAllowlist, domain]);
    setNewAllowDomain("");
    setAllowError(null);
  }

  function handleAddBlockDomain() {
    const domain = newBlockDomain.trim().toLowerCase();
    const error = validateDomain(domain);
    if (error) { setBlockError(error); return; }
    if (domainBlocklist.includes(domain)) { setBlockError("Already added"); return; }
    setDomainBlocklist([...domainBlocklist, domain]);
    setNewBlockDomain("");
    setBlockError(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
      </div>
    );
  }

  const isInherit = type === "project" && devOverlayEnabled === null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Testing Mode */}
      <div className="flex items-center justify-between py-3 px-4 bg-zinc-50/80 rounded-xl border border-zinc-100">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${devOverlayEnabled ? "bg-violet-100" : "bg-zinc-200/60"}`}>
            <Monitor className={`w-4 h-4 ${devOverlayEnabled ? "text-violet-600" : "text-zinc-400"}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-800">Testing Mode</p>
            <p className="text-xs text-zinc-500">
              {type === "user" 
                ? devOverlayEnabled ? "Showing on localhost" : "Hidden on localhost"
                : isInherit ? "Using global setting" : devOverlayEnabled ? "Always show" : "Always hide"
              }
            </p>
          </div>
        </div>
        {type === "user" ? (
          <button
            onClick={() => setDevOverlayEnabled(!devOverlayEnabled)}
            className={`relative w-11 h-6 rounded-full transition-colors ${devOverlayEnabled ? "bg-violet-500" : "bg-zinc-300"}`}
          >
            <motion.div
              animate={{ x: devOverlayEnabled ? 20 : 2 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
            />
          </button>
        ) : (
          <select
            value={devOverlayEnabled === null ? "inherit" : devOverlayEnabled ? "on" : "off"}
            onChange={(e) => {
              if (e.target.value === "inherit") setDevOverlayEnabled(null);
              else setDevOverlayEnabled(e.target.value === "on");
            }}
            className="px-3 py-1.5 text-xs font-medium border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 cursor-pointer"
          >
            <option value="inherit">Use global</option>
            <option value="off">Always hide</option>
            <option value="on">Always show</option>
          </select>
        )}
      </div>

      {/* Show Only On */}
      <div className="py-3 px-4 bg-zinc-50/80 rounded-xl border border-zinc-100">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${domainAllowlist.length > 0 ? "bg-emerald-100" : "bg-zinc-200/60"}`}>
            <Globe className={`w-4 h-4 ${domainAllowlist.length > 0 ? "text-emerald-600" : "text-zinc-400"}`} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-zinc-800">Show Only On</p>
            <p className="text-xs text-zinc-500">{domainAllowlist.length > 0 ? `${domainAllowlist.length} domain${domainAllowlist.length > 1 ? 's' : ''}` : type === "user" ? "All websites" : "Using global"}</p>
          </div>
        </div>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newAllowDomain}
            onChange={(e) => { setNewAllowDomain(e.target.value); setAllowError(null); }}
            onKeyDown={(e) => e.key === "Enter" && handleAddAllowDomain()}
            placeholder="example.com"
            className="flex-1 px-3 py-1.5 text-sm border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
          />
          <button
            onClick={handleAddAllowDomain}
            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </div>
        {allowError && <p className="text-xs text-red-500 mb-2">{allowError}</p>}
        <div className="flex flex-wrap gap-1.5 min-h-[28px]">
          {domainAllowlist.map((domain) => (
            <span key={domain} className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">
              {domain}
              <button onClick={() => setDomainAllowlist(domainAllowlist.filter(d => d !== domain))} className="hover:bg-emerald-200 rounded p-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {domainAllowlist.length === 0 && <span className="text-xs text-zinc-400">Empty = show everywhere</span>}
        </div>
      </div>

      {/* Never Show On */}
      <div className="py-3 px-4 bg-zinc-50/80 rounded-xl border border-zinc-100">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${domainBlocklist.length > 0 ? "bg-red-100" : "bg-zinc-200/60"}`}>
            <Ban className={`w-4 h-4 ${domainBlocklist.length > 0 ? "text-red-600" : "text-zinc-400"}`} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-zinc-800">Never Show On</p>
            <p className="text-xs text-zinc-500">{domainBlocklist.length > 0 ? `${domainBlocklist.length} blocked` : "No blocked sites"}</p>
          </div>
        </div>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newBlockDomain}
            onChange={(e) => { setNewBlockDomain(e.target.value); setBlockError(null); }}
            onKeyDown={(e) => e.key === "Enter" && handleAddBlockDomain()}
            placeholder="staging.example.com"
            className="flex-1 px-3 py-1.5 text-sm border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
          />
          <button
            onClick={handleAddBlockDomain}
            className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </div>
        {blockError && <p className="text-xs text-red-500 mb-2">{blockError}</p>}
        <div className="flex flex-wrap gap-1.5 min-h-[28px]">
          {domainBlocklist.map((domain) => (
            <span key={domain} className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
              {domain}
              <button onClick={() => setDomainBlocklist(domainBlocklist.filter(d => d !== domain))} className="hover:bg-red-200 rounded p-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {domainBlocklist.length === 0 && <span className="text-xs text-zinc-400">No blocked domains</span>}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <AnimatePresence mode="wait">
          {saveStatus === "saved" && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-emerald-600 text-sm flex items-center gap-1">
              <Check className="w-4 h-4" /> Saved
            </motion.span>
          )}
          {saveStatus === "error" && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-red-500 text-sm">
              Failed to save
            </motion.span>
          )}
        </AnimatePresence>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </motion.div>
  );
}
