"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
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
  ChevronDown,
  Radio,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import type { AuditAction, AuditLog } from "@/lib/services/audit.service";

interface Project {
  id: string;
  name: string;
  publicKey: string;
  mode: string;
  enabled?: boolean;
  detected?: boolean;
}

interface ProjectEventsProps {
  project: Project;
}

interface LiveEvent {
  id: string;
  action: AuditAction;
  message: string;
  userEmail: string;
  timestamp: number;
  version: number;
  isLive?: boolean;
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
  const now = new Date();
  const date = new Date(timestamp);
  const diff = now.getTime() - timestamp;
  
  // Just now (< 1 minute)
  if (diff < 60000) return "Just now";
  
  const timeStr = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  
  // Today
  if (date.toDateString() === now.toDateString()) {
    return `Today at ${timeStr}`;
  }
  
  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday at ${timeStr}`;
  }
  
  // This week (show day name)
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  if (date > weekAgo) {
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
    return `${dayName} at ${timeStr}`;
  }
  
  // Older (show full date)
  const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${dateStr} at ${timeStr}`;
}

function formatAbsoluteTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString("en-US", {
    weekday: "long",
    month: "long", 
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
}

export function ProjectEvents({ project }: ProjectEventsProps) {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sseConnected, setSseConnected] = useState(false);
  
  const seenIdsRef = useRef<Set<string>>(new Set());
  const eventSourceRef = useRef<EventSource | null>(null);

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

  // Initial load of historical events
  useEffect(() => {
    async function loadInitial() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchLogs();
        const logs: AuditLog[] = data.logs || [];
        
        // Convert AuditLog to LiveEvent format and track seen IDs
        const initialEvents: LiveEvent[] = logs.map(log => {
          seenIdsRef.current.add(log.id);
          return {
            id: log.id,
            action: log.action,
            message: getActionLabel(log.action, log.metadata),
            userEmail: log.userEmail,
            timestamp: log.timestamp,
            version: log.timestamp, // Use timestamp as version for historical events
            isLive: false,
          };
        });
        
        setEvents(initialEvents);
        setHasMore(data.hasMore || false);
      } catch {
        setError("Failed to load activity");
      } finally {
        setLoading(false);
      }
    }
    loadInitial();
  }, [fetchLogs]);

  // SSE subscription for real-time events
  useEffect(() => {
    if (!project.publicKey || connectionState === "waiting") return;

    const eventsUrl = `/api/v1/events/${project.id}?key=${encodeURIComponent(project.publicKey)}`;
    const evtSource = new EventSource(eventsUrl);
    eventSourceRef.current = evtSource;

    evtSource.onopen = () => {
      setSseConnected(true);
    };

    evtSource.onerror = () => {
      setSseConnected(false);
    };

    evtSource.addEventListener("audit", (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as LiveEvent;
        
        // Deduplicate by ID
        if (seenIdsRef.current.has(data.id)) return;
        seenIdsRef.current.add(data.id);
        
        const newEvent: LiveEvent = {
          ...data,
          isLive: true,
        };
        
        // Insert in correct position by version (descending)
        setEvents(prev => {
          const updated = [...prev];
          let insertIndex = 0;
          for (let i = 0; i < updated.length; i++) {
            if (newEvent.version > updated[i].version) {
              insertIndex = i;
              break;
            }
            insertIndex = i + 1;
          }
          updated.splice(insertIndex, 0, newEvent);
          return updated;
        });
      } catch {
        // Ignore parse errors
      }
    });

    return () => {
      evtSource.close();
      eventSourceRef.current = null;
      setSseConnected(false);
    };
  }, [project.id, project.publicKey, connectionState]);

  async function loadMore() {
    if (loadingMore || !hasMore || events.length === 0) return;
    
    setLoadingMore(true);
    try {
      const lastEvent = events[events.length - 1];
      const data = await fetchLogs(lastEvent.timestamp);
      const logs: AuditLog[] = data.logs || [];
      
      const moreEvents: LiveEvent[] = logs
        .filter(log => !seenIdsRef.current.has(log.id))
        .map(log => {
          seenIdsRef.current.add(log.id);
          return {
            id: log.id,
            action: log.action,
            message: getActionLabel(log.action, log.metadata),
            userEmail: log.userEmail,
            timestamp: log.timestamp,
            version: log.timestamp,
            isLive: false,
          };
        });
      
      setEvents(prev => [...prev, ...moreEvents]);
      setHasMore(data.hasMore || false);
    } catch {
      // Silent fail for load more
    } finally {
      setLoadingMore(false);
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

  function getActionLabel(action: AuditAction, metadata?: Record<string, unknown>): string {
    switch (action) {
      case "mode_change":
        const modeTo = metadata?.to as string;
        return modeTo ? `Switched to ${modeTo.charAt(0).toUpperCase() + modeTo.slice(1)} mode` : "Mode switched";
      case "template_activate":
        return `Activated "${metadata?.templateName || "Untitled"}" template`;
      case "template_create":
        return `Created new template "${metadata?.templateName || "Untitled"}"`;
      case "template_update":
        return `Updated "${metadata?.templateName || "Untitled"}" template`;
      case "template_delete":
        return `Removed "${metadata?.templateName || "Untitled"}" template`;
      case "template_deactivate":
        return `Deactivated "${metadata?.templateName || "Untitled"}" template`;
      case "project_enable":
        return "Project is now live";
      case "project_disable":
        return "Project paused";
      case "project_update":
        return metadata?.name ? `Renamed project to "${metadata.name}"` : "Project settings updated";
      case "login":
        return "Signed in to dashboard";
      case "logout":
        return "Session ended";
      case "register":
        return "Account created";
      case "api_key_regenerate":
        return "API key regenerated for security";
      default:
        return actionConfig[action]?.label || action;
    }
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
          {/* Live indicator */}
          {sseConnected && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-xs font-medium text-emerald-700">Live</span>
            </div>
          )}
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
                {sseConnected ? "Real-time updates active" : "Connecting..."}
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

      {/* Activity Feed */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-stone-200 bg-white"
      >
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-stone-900">Activity Feed</h3>
            <p className="text-xs text-stone-500 mt-0.5">Live updates from your project</p>
          </div>
          {sseConnected && (
            <Radio size={14} className="text-emerald-500 animate-pulse" />
          )}
        </div>

        {loading && events.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-6 h-6 mx-auto border-2 border-stone-200 border-t-stone-600 rounded-full animate-spin" />
            <p className="text-sm text-stone-500 mt-3">Loading activity...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : events.length === 0 ? (
          <div className="p-8 text-center">
            <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-xl bg-stone-100 mb-3">
              <Activity size={20} className="text-stone-400" />
            </div>
            <p className="text-sm text-stone-600">No activity recorded yet</p>
            <p className="text-xs text-stone-400 mt-1">Actions will appear here instantly</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-stone-100">
              <AnimatePresence mode="popLayout">
                {events.map((event) => {
                  const config = actionConfig[event.action] || actionConfig.project_update;
                  const colors = colorClasses[config.color] || colorClasses.stone;
                  const Icon = config.icon;

                  return (
                    <motion.div
                      key={event.id}
                      initial={event.isLive ? { opacity: 0, y: -20, scale: 0.95 } : { opacity: 0 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className={`group px-5 py-3 hover:bg-stone-50/50 transition-colors ${
                        event.isLive ? "bg-emerald-50/30" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colors.bg}`}>
                          <Icon size={14} className={colors.text} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-stone-900">{event.message}</p>
                          <p className="text-xs text-stone-500 mt-0.5">
                            {event.userEmail || "System"}
                          </p>
                        </div>
                        <div className="text-right shrink-0 flex items-center gap-2">
                          {event.isLive && (
                            <span className="text-[10px] font-medium text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">
                              NEW
                            </span>
                          )}
                          <p className="text-xs text-stone-400" title={formatAbsoluteTime(event.timestamp)}>
                            {formatRelativeTime(event.timestamp)}
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
