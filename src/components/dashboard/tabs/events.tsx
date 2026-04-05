"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Clock,
  Wifi,
  Sliders,
  LogIn,
  LogOut,
  UserPlus,
  Palette,
  Zap,
  Power,
  PowerOff,
  Settings,
  Key,
  Trash2,
  Edit3,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import type { AuditAction, AuditLog } from "@/lib/services/audit.service";

interface Project {
  id: string;
  name: string;
  mode: string;
  enabled?: boolean;
  detected?: boolean;
}

interface ProjectEventsProps {
  project: Project;
}

const actionConfig: Record<AuditAction, { icon: typeof Activity; color: string; label: string }> = {
  login: { icon: LogIn, color: "sky", label: "Logged in" },
  logout: { icon: LogOut, color: "stone", label: "Logged out" },
  register: { icon: UserPlus, color: "emerald", label: "Registered" },
  mode_change: { icon: Sliders, color: "amber", label: "Changed mode" },
  template_create: { icon: Palette, color: "indigo", label: "Created template" },
  template_update: { icon: Edit3, color: "indigo", label: "Updated template" },
  template_delete: { icon: Trash2, color: "red", label: "Deleted template" },
  template_activate: { icon: Zap, color: "emerald", label: "Activated template" },
  template_deactivate: { icon: PowerOff, color: "stone", label: "Deactivated template" },
  project_create: { icon: Activity, color: "emerald", label: "Created project" },
  project_update: { icon: Settings, color: "violet", label: "Updated project" },
  project_delete: { icon: Trash2, color: "red", label: "Deleted project" },
  project_enable: { icon: Power, color: "emerald", label: "Enabled project" },
  project_disable: { icon: PowerOff, color: "stone", label: "Disabled project" },
  settings_update: { icon: Settings, color: "violet", label: "Updated settings" },
  api_key_regenerate: { icon: Key, color: "amber", label: "Regenerated API key" },
};

const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
  sky: { bg: "bg-sky-100", text: "text-sky-600", border: "border-sky-200" },
  stone: { bg: "bg-stone-100", text: "text-stone-600", border: "border-stone-200" },
  emerald: { bg: "bg-emerald-100", text: "text-emerald-600", border: "border-emerald-200" },
  amber: { bg: "bg-amber-100", text: "text-amber-600", border: "border-amber-200" },
  indigo: { bg: "bg-indigo-100", text: "text-indigo-600", border: "border-indigo-200" },
  red: { bg: "bg-red-100", text: "text-red-600", border: "border-red-200" },
  violet: { bg: "bg-violet-100", text: "text-violet-600", border: "border-violet-200" },
};

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  
  return new Date(timestamp).toLocaleDateString();
}

function formatAbsoluteTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

function getActionDescription(log: AuditLog): string {
  const { action, metadata } = log;
  
  switch (action) {
    case "mode_change":
      return `${metadata.from || "unknown"} → ${metadata.to || "unknown"}`;
    case "template_create":
    case "template_update":
    case "template_delete":
    case "template_activate":
      return metadata.templateName as string || "";
    case "project_update":
      if (metadata.name) return `Renamed to "${metadata.name}"`;
      return "";
    default:
      return "";
  }
}

export function ProjectEvents({ project }: ProjectEventsProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectionState = project.enabled === true
    ? "connected"
    : project.enabled === false
    ? "disconnected"
    : project.detected
    ? "detected"
    : "waiting";

  const fetchLogs = useCallback(async (before?: number) => {
    try {
      const url = before
        ? `/api/v1/projects/${project.id}/audit?limit=20&before=${before}`
        : `/api/v1/projects/${project.id}/audit?limit=20`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch logs");
      
      const { data } = await res.json();
      return data;
    } catch (err) {
      throw err;
    }
  }, [project.id]);

  useEffect(() => {
    async function loadInitial() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchLogs();
        setLogs(data.logs || []);
        setHasMore(data.hasMore || false);
      } catch {
        setError("Failed to load activity");
      } finally {
        setLoading(false);
      }
    }
    loadInitial();
  }, [fetchLogs]);

  async function loadMore() {
    if (loadingMore || !hasMore || logs.length === 0) return;
    
    setLoadingMore(true);
    try {
      const lastLog = logs[logs.length - 1];
      const data = await fetchLogs(lastLog.timestamp);
      setLogs([...logs, ...(data.logs || [])]);
      setHasMore(data.hasMore || false);
    } catch {
      // Silent fail for load more
    } finally {
      setLoadingMore(false);
    }
  }

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLogs();
      setLogs(data.logs || []);
      setHasMore(data.hasMore || false);
    } catch {
      setError("Failed to load activity");
    } finally {
      setLoading(false);
    }
  }

  if (connectionState === "waiting") {
    return (
      <EmptyState
        icon={Activity}
        title="No activity yet"
        description="Activity will appear here once your site is connected and you start switching modes."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Current Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-stone-200 bg-white p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-stone-900">Current Status</h3>
          <button
            onClick={refresh}
            disabled={loading}
            className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-stone-50">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
              connectionState === "connected" ? "bg-emerald-100" : "bg-stone-100"
            }`}>
              <Wifi size={14} className={connectionState === "connected" ? "text-emerald-600" : "text-stone-400"} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-stone-900">
                {connectionState === "connected" ? "Connected" : connectionState === "disconnected" ? "Disconnected" : "Detected"}
              </p>
              <p className="text-xs text-stone-500 truncate">
                {connectionState === "connected" ? "Real-time updates active" : "Updates paused"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-stone-50">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100">
              <Sliders size={14} className="text-violet-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-stone-900">
                {project.mode.charAt(0).toUpperCase() + project.mode.slice(1)}
              </p>
              <p className="text-xs text-stone-500">Current mode</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Activity Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-stone-200 bg-white"
      >
        <div className="px-5 py-4 border-b border-stone-100">
          <h3 className="text-sm font-semibold text-stone-900">Activity Log</h3>
          <p className="text-xs text-stone-500 mt-0.5">All actions performed on this project</p>
        </div>

        {loading && logs.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-6 h-6 mx-auto border-2 border-stone-200 border-t-stone-600 rounded-full animate-spin" />
            <p className="text-sm text-stone-500 mt-3">Loading activity...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={refresh}
              className="mt-2 text-xs text-stone-500 hover:text-stone-700 underline"
            >
              Try again
            </button>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center">
            <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-xl bg-stone-100 mb-3">
              <Activity size={20} className="text-stone-400" />
            </div>
            <p className="text-sm text-stone-600">No activity recorded yet</p>
            <p className="text-xs text-stone-400 mt-1">Actions will appear here as you use the dashboard</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-stone-100">
              <AnimatePresence>
                {logs.map((log, index) => {
                  const config = actionConfig[log.action] || actionConfig.project_update;
                  const colors = colorClasses[config.color] || colorClasses.stone;
                  const Icon = config.icon;
                  const description = getActionDescription(log);

                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="group px-5 py-3 hover:bg-stone-50/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colors.bg}`}>
                          <Icon size={14} className={colors.text} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-stone-900">{config.label}</p>
                            {description && (
                              <span className={`text-xs px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                                {description}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-stone-500 mt-0.5">
                            {log.userEmail || "System"}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-stone-400" title={formatAbsoluteTime(log.timestamp)}>
                            {formatRelativeTime(log.timestamp)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {hasMore && (
              <div className="px-5 py-3 border-t border-stone-100">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="w-full flex items-center justify-center gap-2 py-2 text-sm text-stone-600 hover:text-stone-900 transition-colors disabled:opacity-50"
                >
                  {loadingMore ? (
                    <>
                      <div className="w-4 h-4 border-2 border-stone-200 border-t-stone-600 rounded-full animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <ChevronDown size={16} />
                      Load more
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
