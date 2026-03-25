"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Trash2, Save, Wifi, ShieldAlert } from "lucide-react";
import { ModeToggle } from "@/components/project/mode-toggle";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { CustomConfig } from "@/components/project/custom-config";
import { IntegrationPanel } from "@/components/project/integration-panel";
import type { ModeValue, ModeConfig, ModePolicy } from "@/types/policy";
import type { Project } from "@/types/project";

interface ProjectData extends Project {
  policy: ModePolicy | null;
}

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");

  const [mode, setMode] = useState<ModeValue>("live");
  const [config, setConfig] = useState<ModeConfig>({
    message: null,
    buttonText: null,
    redirectUrl: null,
  });

  const [apiStatus, setApiStatus] = useState<"checking" | "connected" | "disconnected">("checking");

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/projects/${projectId}`);
      if (!res.ok) {
        router.push("/dashboard");
        return;
      }
      const json = await res.json();
      const data = json.data as ProjectData;
      setProject(data);
      if (data.policy) {
        setMode(data.policy.value);
        setConfig(data.policy.config);
      }
    } catch {
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }, [projectId, router]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  // Live API connectivity check — pings the public decide endpoint with actual keys
  const checkApiConnection = useCallback(async () => {
    if (!project) return;
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const res = await fetch(
        `${origin}/api/v1/decide?projectId=${project.id}&key=${project.publicKey}`,
        { cache: "no-store" }
      );
      setApiStatus(res.ok ? "connected" : "disconnected");
    } catch {
      setApiStatus("disconnected");
    }
  }, [project]);

  useEffect(() => {
    checkApiConnection();
    const interval = setInterval(checkApiConnection, 30000);
    return () => clearInterval(interval);
  }, [checkApiConnection]);

  async function handleModeChange(newMode: ModeValue) {
    setMode(newMode);
    await savePolicy(newMode, config);
  }

  async function handleConfigSave() {
    await savePolicy(mode, config);
  }

  async function savePolicy(value: ModeValue, cfg: ModeConfig) {
    try {
      setSaving(true);
      setSaveStatus("idle");

      const res = await fetch(`/api/v1/projects/${projectId}/policy`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value, config: cfg }),
      });

      if (res.ok) {
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } else {
        setSaveStatus("error");
      }
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      setDeleting(true);
      const res = await fetch(`/api/v1/projects/${projectId}`, {
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

  if (loading) {
    return (
      <div className="px-6 lg:px-10 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-64 rounded-lg bg-stone-200" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-48 rounded-2xl bg-stone-200" />
            <div className="space-y-4">
              <div className="h-28 rounded-2xl bg-stone-200" />
              <div className="h-28 rounded-2xl bg-stone-200" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-1 flex-col"
    >
      {/* Project Header Bar */}
      <div className="border-b border-stone-200 bg-white">
        <div className="flex items-center justify-between px-6 lg:px-10 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="rounded-lg p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="h-6 w-px bg-stone-200" />
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-semibold text-stone-900">
                  {project.name}
                </h1>
                {apiStatus === "checking" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-0.5 text-[10px] font-medium text-stone-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-stone-400 animate-pulse" />
                    Checking
                  </span>
                ) : apiStatus === "connected" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-medium text-emerald-700">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    </span>
                    Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-[10px] font-medium text-red-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                    Disconnected
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-400 font-mono">{project.id}</p>
            </div>
          </div>
          <button
            onClick={() => setDeleteModalOpen(true)}
            disabled={deleting}
            className="flex items-center gap-2 rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
            title="Delete project"
          >
            <Trash2 size={15} />
            <span className="hidden sm:inline text-xs font-medium">Delete</span>
          </button>
        </div>
      </div>

      {/* Main Content — full width, two-column on large screens */}
      <div className="flex-1 px-6 lg:px-10 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left Column — Mode Control */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-stone-200 bg-white p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-sm font-semibold text-stone-900">
                    Mode Control
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Set how your application behaves
                  </p>
                </div>
                {saveStatus === "saved" && (
                  <motion.span
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full"
                  >
                    Saved
                  </motion.span>
                )}
                {saveStatus === "error" && (
                  <span className="text-xs font-medium text-red-600 bg-red-50 px-2.5 py-1 rounded-full">
                    Failed to save
                  </span>
                )}
              </div>

              <ModeToggle
                value={mode}
                onChange={handleModeChange}
                disabled={saving}
              />

              {/* Mode status indicator */}
              <div className="mt-4">
                {mode === "live" ? (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3">
                    <Wifi size={15} className="text-emerald-500 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-emerald-700">Connected — Website runs as-is</p>
                      <p className="text-[11px] text-emerald-600/70 mt-0.5">Your key is active. No overlay will be shown to visitors.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
                    <ShieldAlert size={15} className="text-amber-500 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-amber-700">
                        Overlay active — {mode === "maintenance" ? "Maintenance screen" : "Custom message"} shown to visitors
                      </p>
                      <p className="text-[11px] text-amber-600/70 mt-0.5">Switch to Live when you want your website to run normally.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Custom config - visible when mode is custom */}
              {mode === "custom" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 pt-6 border-t border-stone-100"
                >
                  <CustomConfig
                    config={config}
                    onChange={setConfig}
                    disabled={saving}
                  />
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={handleConfigSave}
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-indigo-600 disabled:opacity-50"
                    >
                      <Save size={14} />
                      {saving ? "Saving..." : "Save Config"}
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Right Column — Integration */}
          <IntegrationPanel
            projectId={project.id}
            publicKey={project.publicKey}
          />
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
    </motion.div>
  );
}
