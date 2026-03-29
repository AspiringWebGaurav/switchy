"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi, Sliders, Key, Trash2, Power, Check, Zap, Copy, CheckCircle2, RotateCw, Code2, ChevronLeft, ChevronRight, Search, X, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { CopyButton } from "@/components/ui/copy-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { frameworks, getSnippet, type FrameworkId } from "@/config/frameworks";
import { FrameworkIcon } from "@/components/ui/framework-icon";
import { useSmartSearch } from "@/hooks/use-smart-search";

interface Project {
  id: string;
  name: string;
  publicKey: string;
  mode: string;
  createdAt: number;
  updatedAt: number;
  enabled?: boolean;
  detected?: boolean;
}

interface ProjectOverviewProps {
  project: Project;
  onRefresh: () => void;
  onNavigateToModes?: () => void;
}

type ConnectionState = "waiting" | "detected" | "connected" | "disconnected";

const modeLabels: Record<string, { label: string; color: string }> = {
  live: { label: "Live", color: "success" },
  maintenance: { label: "Maintenance", color: "warning" },
  custom: { label: "Custom", color: "info" },
};

export function ProjectOverview({ project, onRefresh, onNavigateToModes }: ProjectOverviewProps) {
  const router = useRouter();
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [appUrl, setAppUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [selectedFramework, setSelectedFramework] = useState<FrameworkId>("html");
  const [slideIndex, setSlideIndex] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showSetupBanner, setShowSetupBanner] = useState(false);

  // Smart search with Trie, fuzzy matching, and suggestions
  const frameworkLabels = useMemo(() => frameworks.map(f => f.label), []);
  const search = useSmartSearch({
    items: frameworkLabels,
    debounceMs: 150,
    maxSuggestions: 5,
  });

  useEffect(() => {
    setAppUrl(window.location.origin);
  }, []);

  // Setup banner: show for 30s after first activation, then hide forever
  useEffect(() => {
    const key = `setup-banner-seen-${project.id}`;
    const seen = localStorage.getItem(key);
    
    if (project.enabled === true && !seen) {
      setShowSetupBanner(true);
      localStorage.setItem(key, "1");
      const timer = setTimeout(() => setShowSetupBanner(false), 30000);
      return () => clearTimeout(timer);
    }
  }, [project.id, project.enabled]);

  const connectionState: ConnectionState = project.enabled === true
    ? "connected"
    : project.enabled === false
    ? "disconnected"
    : project.detected
    ? "detected"
    : "waiting";

  const modeInfo = modeLabels[project.mode] || modeLabels.live;
  const isOnboarding = connectionState === "waiting" || connectionState === "detected";

  const scriptUrl = `${appUrl}/switchy.js?key=${project.publicKey}&project=${project.id}`;

  // Intelligent filtering based on search results
  const filteredFrameworks = useMemo(() => {
    if (!search.query.trim()) return frameworks;
    if (search.results.matches.length > 0) {
      const matchedLabels = new Set(search.results.matches.map(m => m.item.toLowerCase()));
      return frameworks.filter(fw => matchedLabels.has(fw.label.toLowerCase()));
    }
    return frameworks.filter(fw => 
      fw.label.toLowerCase().includes(search.query.toLowerCase())
    );
  }, [search.query, search.results.matches]);

  const ITEMS_PER_PAGE = 5;
  const maxSlideIndex = Math.max(0, Math.ceil(filteredFrameworks.length / ITEMS_PER_PAGE) - 1);
  const visibleFrameworks = filteredFrameworks.slice(slideIndex * ITEMS_PER_PAGE, (slideIndex + 1) * ITEMS_PER_PAGE);

  // Reset slide index when search changes
  useEffect(() => {
    setSlideIndex(0);
  }, [search.query]);

  // Auto-select first matching framework
  useEffect(() => {
    if (filteredFrameworks.length > 0 && search.query.trim()) {
      const firstMatch = filteredFrameworks[0];
      if (firstMatch && firstMatch.id !== selectedFramework) {
        setSelectedFramework(firstMatch.id);
      }
    }
  }, [filteredFrameworks, search.query, selectedFramework]);

  // Handle suggestion selection
  const handleSelectSuggestion = useCallback((suggestion: string) => {
    search.selectSuggestion(suggestion);
    setShowSuggestions(false);
    const matchingFw = frameworks.find(f => f.label.toLowerCase() === suggestion.toLowerCase());
    if (matchingFw) {
      setSelectedFramework(matchingFw.id);
    }
  }, [search]);

  // Handle search reset
  const handleResetSearch = useCallback(() => {
    search.reset();
    setShowSuggestions(false);
    setSlideIndex(0);
  }, [search]);

  const currentFramework = frameworks.find(f => f.id === selectedFramework)!;
  const currentSnippet = getSnippet(selectedFramework, scriptUrl);

  async function handleToggleConnection(enable: boolean) {
    setToggling(true);
    try {
      await fetch(`/api/v1/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: enable }),
      });
      onRefresh();
    } finally {
      setToggling(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/v1/projects/${project.id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/dashboard");
        onRefresh();
      }
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  }

  function handleCopyScript() {
    navigator.clipboard.writeText(currentSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Onboarding Flow - Compact Layout with Smart Search
  if (isOnboarding) {
    return (
      <div className="flex flex-col gap-3 h-full">
        {/* Compact Header with dynamic Activate button */}
        <div className="space-y-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center justify-between gap-3 py-2"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 border border-indigo-200">
                <Code2 size={18} className="text-indigo-600" />
              </div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <h2 className="text-base font-semibold text-zinc-900">Connect your site</h2>
                <span className="text-sm text-zinc-400">— select framework & copy snippet</span>
              </div>
            </div>

            {connectionState === "detected" && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => handleToggleConnection(true)}
                disabled={toggling}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 shadow-md shadow-emerald-200"
              >
                <Zap size={14} />
                {toggling ? "Activating..." : "Activate Connection"}
              </motion.button>
            )}
          </motion.div>

          {/* Connection detected info banner */}
          {connectionState === "detected" && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200"
            >
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span className="text-sm text-emerald-700 font-medium">
                Connection to your project detected! Click &quot;Activate Connection&quot; to go live.
              </span>
            </motion.div>
          )}
        </div>

        {/* Framework Selector with Smart Search */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-xl border border-zinc-200 bg-white p-3"
        >
          {/* Smart Search */}
          <div className="relative mb-3">
            <div className="relative">
              {search.isSearching ? (
                <Loader2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-500 animate-spin" />
              ) : (
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              )}
              <input
                type="text"
                placeholder="Search framework..."
                value={search.query}
                onChange={(e) => search.setQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className={`w-full pl-10 pr-10 py-2 text-sm rounded-lg border bg-zinc-50 focus:bg-white outline-none transition-all ${
                  !search.results.isSupported && search.query.trim()
                    ? "border-amber-300 focus:border-amber-400 focus:ring-1 focus:ring-amber-200"
                    : "border-zinc-200 focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200"
                }`}
              />
              {search.query && (
                <button
                  onClick={handleResetSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Suggestions Dropdown */}
            <AnimatePresence>
              {showSuggestions && search.suggestions.length > 0 && search.query.trim() && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute z-20 top-full left-0 right-0 mt-1 bg-white rounded-lg border border-zinc-200 shadow-lg overflow-hidden"
                >
                  {search.suggestions.map((suggestion, idx) => {
                    const fw = frameworks.find(f => f.label === suggestion);
                    return (
                      <button
                        key={suggestion}
                        onClick={() => handleSelectSuggestion(suggestion)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left hover:bg-indigo-50 transition-colors ${
                          idx === 0 ? "bg-zinc-50" : ""
                        }`}
                      >
                        {fw && <FrameworkIcon svg={fw.svg} hex={fw.hex} size={16} />}
                        <span className="font-medium text-zinc-800">{suggestion}</span>
                        {idx === 0 && (
                          <span className="ml-auto text-xs text-indigo-500 font-medium">Best match</span>
                        )}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            {/* "Did you mean?" / Unsupported Messages */}
            <AnimatePresence>
              {search.results.message && search.query.trim() && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2"
                >
                  <div className={`flex items-start gap-2 px-3 py-2.5 rounded-lg text-sm ${
                    search.results.isSupported
                      ? "bg-indigo-50 text-indigo-700"
                      : "bg-amber-50 text-amber-700"
                  }`}>
                    {search.results.isSupported ? (
                      <Sparkles size={16} className="shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p>{search.results.message}</p>
                      {search.results.suggestion && (
                        <button
                          onClick={() => handleSelectSuggestion(search.results.suggestion!)}
                          className="mt-1 text-xs font-medium underline underline-offset-2 hover:no-underline"
                        >
                          Use {search.results.suggestion} instead
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Framework Carousel */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSlideIndex(Math.max(0, slideIndex - 1))}
              disabled={slideIndex === 0}
              className="shrink-0 p-2 rounded-lg border border-zinc-200 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="flex-1 flex gap-2 overflow-hidden">
              {visibleFrameworks.map((fw) => (
                <button
                  key={fw.id}
                  onClick={() => setSelectedFramework(fw.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${
                    selectedFramework === fw.id
                      ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                      : "bg-zinc-50 text-zinc-600 border border-zinc-200 hover:bg-zinc-100"
                  }`}
                >
                  <FrameworkIcon svg={fw.svg} hex={fw.hex} size={18} />
                  <span className="truncate">{fw.label}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setSlideIndex(Math.min(maxSlideIndex, slideIndex + 1))}
              disabled={slideIndex >= maxSlideIndex}
              className="shrink-0 p-2 rounded-lg border border-zinc-200 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Page indicator - inline */}
          {maxSlideIndex > 0 && (
            <div className="flex justify-center gap-1 mt-2">
              {Array.from({ length: maxSlideIndex + 1 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1 w-3 rounded-full transition-all ${
                    i === slideIndex ? "bg-indigo-500" : "bg-zinc-200"
                  }`}
                />
              ))}
            </div>
          )}
        </motion.div>

        {/* Code Snippet */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`rounded-xl border p-3 flex-1 min-h-0 flex flex-col ${
            connectionState === "detected" 
              ? "border-emerald-200 bg-emerald-50/50" 
              : "border-zinc-200 bg-white"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-sm font-semibold text-zinc-800">{currentFramework.label}</span>
              <span className="text-sm text-zinc-400 ml-2">{currentFramework.file}</span>
            </div>
            <StatusBadge
              variant={connectionState === "detected" ? "success" : "neutral"}
              label={connectionState === "detected" ? "Detected" : "Not Connected"}
              size="sm"
            />
          </div>

          <div className="relative flex-1 min-h-0">
            <AnimatePresence mode="wait">
              <motion.pre
                key={selectedFramework}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm font-mono text-zinc-700 bg-zinc-50 rounded-lg p-3 pr-20 border border-zinc-200 overflow-x-auto whitespace-pre-wrap leading-relaxed h-full max-h-[120px] overflow-y-auto"
              >
                {currentSnippet}
              </motion.pre>
            </AnimatePresence>
            <div className="absolute top-2 right-2">
              <motion.button
                onClick={handleCopyScript}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  copied 
                    ? "bg-emerald-600 text-white" 
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                }`}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied!" : "Copy"}
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Footer - Delete only */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex items-center pt-1"
        >
          <motion.button
            onClick={() => setDeleteModalOpen(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 px-3 py-1.5 rounded-lg border border-zinc-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <Trash2 size={14} />
            Delete project
          </motion.button>
        </motion.div>

        <ConfirmModal
          open={deleteModalOpen}
          title="Delete Project"
          message="Are you sure? This action is permanent and cannot be undone."
          warning="All API keys for this project will stop working immediately. Any sites using these keys will lose connection."
          confirmLabel="Yes, Delete"
          cancelLabel="No, Keep it"
          variant="danger"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteModalOpen(false)}
        />
      </div>
    );
  }

  // Connected/Disconnected State - Normal Dashboard View
  return (
    <div className="space-y-5">
      {/* Setup Complete Banner - shows for 30s after first activation */}
      <AnimatePresence>
        {showSetupBanner && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-4 rounded-xl border border-emerald-200 bg-emerald-50/50 px-5 py-4"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500">
              <CheckCircle2 size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-base font-medium text-emerald-800">Setup Complete</p>
              <p className="text-sm text-emerald-600">Your site is integrated and ready to use</p>
            </div>
            <StatusBadge
              variant="success"
              label="Active"
              pulse
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Connection */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-xl border border-zinc-200 bg-white p-5"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100">
              <Wifi size={20} className="text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-zinc-500">Connection</p>
              <p className="text-base font-medium text-zinc-900">
                {connectionState === "connected" ? "Active" : "Paused"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Mode */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-zinc-200 bg-white p-5"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100">
              <Sliders size={20} className="text-violet-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-zinc-500">Current Mode</p>
              <p className="text-base font-medium text-zinc-900">{modeInfo.label}</p>
            </div>
            {onNavigateToModes && (
              <motion.button
                onClick={onNavigateToModes}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-200 hover:bg-indigo-50 transition-colors"
              >
                Change
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Public Key */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-xl border border-zinc-200 bg-white p-5"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
              <Key size={20} className="text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-zinc-500">Public Key</p>
              <p className="text-sm font-mono text-zinc-700 truncate">{project.publicKey}</p>
            </div>
            <CopyButton value={project.publicKey} variant="ghost" size="sm" />
          </div>
        </motion.div>
      </div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-wrap gap-3"
      >
        {connectionState === "connected" && (
          <motion.button
            onClick={() => handleToggleConnection(false)}
            disabled={toggling}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
          >
            <Power size={14} />
            {toggling ? "..." : "Pause Connection"}
          </motion.button>
        )}

        {connectionState === "disconnected" && (
          <motion.button
            onClick={() => handleToggleConnection(true)}
            disabled={toggling}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            <RotateCw size={14} className={toggling ? "animate-spin" : ""} />
            {toggling ? "..." : "Resume Connection"}
          </motion.button>
        )}

        <motion.button
          onClick={() => setDeleteModalOpen(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-500 hover:border-red-200 hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 size={14} />
          Delete Project
        </motion.button>
      </motion.div>

      <ConfirmModal
        open={deleteModalOpen}
        title="Delete Project"
        message="Are you sure? This action is permanent and cannot be undone."
        warning="All API keys for this project will stop working immediately. Any sites using these keys will lose connection."
        confirmLabel="Yes, Delete"
        cancelLabel="No, Keep it"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </div>
  );
}
