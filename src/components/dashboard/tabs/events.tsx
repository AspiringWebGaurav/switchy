"use client";

import { motion } from "framer-motion";
import { Activity, Clock, Wifi, Sliders } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

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

export function ProjectEvents({ project }: ProjectEventsProps) {
  const connectionState = project.enabled === true
    ? "connected"
    : project.enabled === false
    ? "disconnected"
    : project.detected
    ? "detected"
    : "waiting";

  const hasEvents = connectionState === "connected" || connectionState === "disconnected";

  if (!hasEvents) {
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
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-zinc-200 bg-white p-5"
      >
        <h3 className="text-sm font-semibold text-zinc-900 mb-4">Current Status</h3>
        
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-50">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
              <Wifi size={14} className="text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-900">
                {connectionState === "connected" ? "Site Connected" : "Site Disconnected"}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {connectionState === "connected" 
                  ? "Your site is receiving real-time mode updates"
                  : "Connection is paused"}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <Clock size={12} />
              <span>Now</span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-50">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100">
              <Sliders size={14} className="text-violet-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-900">
                Mode: {project.mode.charAt(0).toUpperCase() + project.mode.slice(1)}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Currently active mode
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <Clock size={12} />
              <span>Active</span>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/50 p-8 text-center"
      >
        <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-xl bg-zinc-100 mb-3">
          <Activity size={20} className="text-zinc-400" />
        </div>
        <h3 className="text-sm font-medium text-zinc-600 mb-1">Event History Coming Soon</h3>
        <p className="text-xs text-zinc-500 max-w-sm mx-auto">
          Full event timeline with mode changes and activity logs will be available in a future update.
        </p>
      </motion.div>
    </div>
  );
}
