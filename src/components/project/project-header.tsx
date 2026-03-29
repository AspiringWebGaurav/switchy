"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Trash2, Power, RotateCw } from "lucide-react";
import { useProject } from "@/contexts/project-context";
import { ConnectionBadge } from "@/components/ui/status-badge";
import { ConfirmModal } from "@/components/shared/confirm-modal";

export function ProjectHeader() {
  const router = useRouter();
  const { project, connectionState, toggleConnection } = useProject();
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  if (!project) return null;

  async function handleDisconnect() {
    setToggling(true);
    await toggleConnection(false);
    setToggling(false);
  }

  async function handleReconnect() {
    setToggling(true);
    await toggleConnection(true);
    setToggling(false);
  }

  async function handleDelete() {
    if (!project) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/v1/projects/${project.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/dashboard");
      }
    } catch {
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.button
            onClick={() => router.push("/dashboard")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
          >
            <ArrowLeft size={16} />
          </motion.button>
          
          <div className="h-5 w-px bg-zinc-200" />
          
          <div className="flex items-center gap-2.5">
            <h1 className="text-base font-semibold text-zinc-900">
              {project.name}
            </h1>
            <ConnectionBadge state={connectionState} />
          </div>
          
          <span className="hidden md:inline text-xs text-zinc-400 font-mono">
            <span className="text-zinc-300">ID · </span>
            {project.id}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {connectionState === "detected" && (
            <motion.button
              onClick={handleReconnect}
              disabled={toggling}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              <RotateCw size={13} className={toggling ? "animate-spin" : ""} />
              {toggling ? "Activating..." : "Activate"}
            </motion.button>
          )}
          
          {connectionState === "connected" && (
            <motion.button
              onClick={handleDisconnect}
              disabled={toggling}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
            >
              <Power size={13} />
              {toggling ? "..." : "Disconnect"}
            </motion.button>
          )}
          
          {connectionState === "disconnected" && (
            <motion.button
              onClick={handleReconnect}
              disabled={toggling}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50"
            >
              <RotateCw size={13} className={toggling ? "animate-spin" : ""} />
              {toggling ? "..." : "Reconnect"}
            </motion.button>
          )}
          
          <motion.button
            onClick={() => setDeleteModalOpen(true)}
            disabled={deleting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
          >
            <Trash2 size={13} />
            <span className="hidden sm:inline">Delete</span>
          </motion.button>
        </div>
      </div>

      <ConfirmModal
        open={deleteModalOpen}
        title="Delete Project"
        message="Are you sure you want to delete this project? This action is permanent and cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </>
  );
}
