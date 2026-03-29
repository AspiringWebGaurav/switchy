"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Code2, Key, Search, X, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { CopyButton } from "@/components/ui/copy-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { frameworks, getSnippet, type FrameworkId } from "@/config/frameworks";
import { FrameworkIcon } from "@/components/ui/framework-icon";
import { useSmartSearch } from "@/hooks/use-smart-search";

interface Project {
  id: string;
  name: string;
  publicKey: string;
  mode: string;
  enabled?: boolean;
  detected?: boolean;
}

interface ProjectKeysProps {
  project: Project;
}

export function ProjectKeys({ project }: ProjectKeysProps) {
  const [appUrl, setAppUrl] = useState("");
  const [framework, setFramework] = useState<FrameworkId>("html");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Smart search with Trie, fuzzy matching, and suggestions
  const frameworkLabels = useMemo(() => frameworks.map(f => f.label), []);
  const search = useSmartSearch({
    items: frameworkLabels,
    debounceMs: 150,
    maxSuggestions: 5,
  });

  // Handle suggestion selection
  const handleSelectSuggestion = useCallback((suggestion: string) => {
    search.selectSuggestion(suggestion);
    setShowSuggestions(false);
    const matchingFw = frameworks.find(f => f.label.toLowerCase() === suggestion.toLowerCase());
    if (matchingFw) {
      setFramework(matchingFw.id);
    }
  }, [search]);

  // Handle search reset
  const handleResetSearch = useCallback(() => {
    search.reset();
    setShowSuggestions(false);
  }, [search]);

  // Filter frameworks based on search
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

  const connectionState = project.enabled === true
    ? "connected"
    : project.enabled === false
    ? "disconnected"
    : project.detected
    ? "detected"
    : "waiting";

  useEffect(() => {
    setAppUrl(window.location.origin);
  }, []);

  const scriptUrl = `${appUrl}/switchy.js?key=${project.publicKey}&project=${project.id}`;
  const currentFramework = frameworks.find(f => f.id === framework)!;
  const currentSnippet = getSnippet(framework, scriptUrl);

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Public Key - Compact */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="shrink-0 rounded-xl border border-zinc-200 bg-white p-4"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
              <Key size={18} className="text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">Public Key</h3>
              <code className="text-sm font-mono text-zinc-600">{project.publicKey}</code>
            </div>
          </div>
          <CopyButton value={project.publicKey} variant="outline" />
        </div>
      </motion.div>

      {/* Integration Snippet */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex-1 flex flex-col rounded-xl border border-zinc-200 bg-white p-4 min-h-0"
      >
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100">
              <Code2 size={18} className="text-indigo-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">Integration Snippet</h3>
              <p className="text-xs text-zinc-500">{currentFramework.file}</p>
            </div>
          </div>
          <StatusBadge
            variant={connectionState === "connected" ? "success" : "neutral"}
            label={connectionState === "connected" ? "Connected" : "Not Connected"}
          />
        </div>

        {/* Smart Search */}
        <div className="relative mb-3 shrink-0">
          <div className="relative">
            {search.isSearching ? (
              <Loader2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-500 animate-spin" />
            ) : (
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            )}
            <input
              type="text"
              placeholder="Search framework... (try 'rreact' for fuzzy match)"
              value={search.query}
              onChange={(e) => search.setQuery(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className={`w-full pl-10 pr-10 py-2.5 text-sm rounded-lg border bg-zinc-50 focus:bg-white outline-none transition-all ${
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
                    {!search.results.isSupported && !search.results.suggestion && (
                      <p className="mt-1 text-xs opacity-75">
                        We've noted this request and may add support soon.
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Framework Selector Grid */}
        <div className="flex flex-wrap gap-1 p-1 bg-zinc-100 rounded-lg mb-3 shrink-0">
          {filteredFrameworks.map((fw) => (
            <button
              key={fw.id}
              onClick={() => setFramework(fw.id)}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md transition-all ${
                framework === fw.id
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              <FrameworkIcon svg={fw.svg} hex={fw.hex} size={18} />
              <span>{fw.label}</span>
            </button>
          ))}
          {filteredFrameworks.length === 0 && (
            <p className="w-full text-center py-3 text-sm text-zinc-400">No frameworks match your search</p>
          )}
        </div>

        {/* Code Block */}
        <div className="relative flex-1 min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={framework}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 rounded-lg border border-zinc-200 bg-zinc-50 p-4 pr-16 overflow-auto"
            >
              <pre className="text-sm font-mono text-zinc-700 leading-relaxed whitespace-pre-wrap break-all">
                {currentSnippet}
              </pre>
            </motion.div>
          </AnimatePresence>
          <div className="absolute top-2 right-2 z-10">
            <CopyButton value={currentSnippet} variant="outline" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
