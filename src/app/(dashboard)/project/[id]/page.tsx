"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Trash2, Save, Power, RotateCw } from "lucide-react";
import { ModeToggle, modes } from "@/components/project/mode-toggle";
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

  type ConnectionState = "waiting" | "detected" | "connected" | "disconnected";
  const [connectionState, setConnectionState] = useState<ConnectionState>("waiting");
  const [toggling, setToggling] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isConnected = connectionState === "connected";

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
      if (data.enabled === true) setConnectionState("connected");
      else if (data.enabled === false) setConnectionState("disconnected");
      else if (data.detected === true) setConnectionState("detected");
      else setConnectionState("waiting");
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

  // Poll every 5s when Not Started — transitions to Detected as soon as script is first called
  useEffect(() => {
    if (connectionState !== "waiting" || loading) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/v1/projects/${projectId}`);
        if (!res.ok) return;
        const json = await res.json();
        const d = json.data;
        if (!d) return;
        if (d.enabled === true) {
          setConnectionState("connected");
          setProject((prev) => prev ? { ...prev, enabled: true } : prev);
          stopPolling();
        } else if (d.detected === true) {
          setConnectionState("detected");
          setProject((prev) => prev ? { ...prev, detected: true } : prev);
          stopPolling();
        }
      } catch { /* silent */ }
    };

    function stopPolling() {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      if (pollTimeoutRef.current) { clearTimeout(pollTimeoutRef.current); pollTimeoutRef.current = null; }
    }

    pollRef.current = setInterval(poll, 5000);
    pollTimeoutRef.current = setTimeout(stopPolling, 120000);

    return stopPolling;
  }, [connectionState, loading, projectId]);

  // Continuous background sync — re-reads real DB state every 30s
  const bgSyncRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (loading) return;

    bgSyncRef.current = setInterval(async () => {
      if (saving || toggling) return;
      try {
        const res = await fetch(`/api/v1/projects/${projectId}`);
        if (!res.ok) return;
        const json = await res.json();
        const d = json.data;
        if (!d) return;
        if (d.enabled === true) setConnectionState("connected");
        else if (d.enabled === false) setConnectionState("disconnected");
        else if (d.detected === true) setConnectionState("detected");
        else setConnectionState("waiting");
      } catch { /* silent */ }
    }, 30000);

    return () => {
      if (bgSyncRef.current) clearInterval(bgSyncRef.current);
    };
  }, [loading, projectId, saving, toggling]);

  async function handleDisconnect() {
    if (!project) return;
    try {
      setToggling(true);
      const res = await fetch(`/api/v1/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: false }),
      });
      if (res.ok) {
        setConnectionState("disconnected");
        setProject({ ...project, enabled: false });
      }
    } catch { /* silent */ }
    finally { setToggling(false); }
  }

  async function handleReconnect() {
    if (!project) return;
    try {
      setToggling(true);
      const res = await fetch(`/api/v1/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: true }),
      });
      if (res.ok) {
        setConnectionState("connected");
        setProject({ ...project, enabled: true });
      }
    } catch { /* silent */ }
    finally { setToggling(false); }
  }

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
      <div className="flex flex-1 flex-col h-full">
        <div className="border-b border-stone-200 bg-white px-6 lg:px-10 py-4">
          <div className="animate-pulse flex items-center gap-4">
            <div className="h-8 w-8 rounded-lg bg-stone-200" />
            <div className="h-5 w-40 rounded bg-stone-200" />
          </div>
        </div>
        <div className="flex-1 px-6 lg:px-10 py-6">
          <div className="animate-pulse grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 h-full">
            <div className="h-64 rounded-2xl bg-stone-200" />
            <div className="space-y-3">
              <div className="h-20 rounded-2xl bg-stone-200" />
              <div className="h-24 rounded-2xl bg-stone-200" />
              <div className="h-24 rounded-2xl bg-stone-200" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) return null;

  const active = modes.find((m) => m.value === mode);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-1 flex-col"
    >
      {/* ── Header Bar ── */}
      <div className="sticky top-14 z-40 border-b border-stone-200 bg-white/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 lg:px-10 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="h-5 w-px bg-stone-200" />
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-semibold text-stone-900">
                {project.name}
              </h1>
              {connectionState === "connected" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                  Active
                </span>
              ) : connectionState === "detected" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-600">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-indigo-500" />
                  </span>
                  Script Detected
                </span>
              ) : connectionState === "disconnected" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-stone-400" />
                  Paused
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-stone-300" />
                  Not Started
                </span>
              )}
            </div>
            <span className="hidden md:inline text-xs text-stone-400 font-mono">
              <span className="text-stone-300 not-italic">ID · </span>{project.id}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {connectionState === "detected" && (
              <button
                onClick={handleReconnect}
                disabled={toggling}
                className="flex items-center gap-1.5 rounded-lg border border-indigo-300 bg-indigo-500 px-2.5 py-1.5 text-xs font-medium text-white transition-all hover:bg-indigo-600 disabled:opacity-50"
              >
                <RotateCw size={13} />
                {toggling ? "..." : "Activate"}
              </button>
            )}
            {connectionState === "connected" && (
              <button
                onClick={handleDisconnect}
                disabled={toggling}
                className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs text-red-600 transition-all hover:bg-red-100 disabled:opacity-50"
              >
                <Power size={13} />
                {toggling ? "..." : "Disconnect"}
              </button>
            )}
            {connectionState === "disconnected" && (
              <button
                onClick={handleReconnect}
                disabled={toggling}
                className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-700 transition-all hover:bg-emerald-100 disabled:opacity-50"
              >
                <RotateCw size={13} />
                {toggling ? "..." : "Reconnect"}
              </button>
            )}
            <button
              onClick={() => setDeleteModalOpen(true)}
              disabled={deleting}
              className="flex items-center gap-1.5 rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs text-stone-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
            >
              <Trash2 size={13} />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="px-6 lg:px-10 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">
          {/* Left — Mode Control */}
          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-stone-900">
                  Mode Control
                </h2>
                <p className="text-xs text-stone-400 mt-0.5">
                  {connectionState === "connected"
                    ? "Choose a mode — visitors will see the corresponding overlay"
                    : connectionState === "detected"
                    ? "Script detected — click Activate above to enable mode control"
                    : connectionState === "disconnected"
                    ? "Reconnect to resume mode control on your site"
                    : "Add the script tag to your site, then return here to activate"}
                </p>
              </div>
              {saveStatus === "saved" && (
                <motion.span
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full"
                >
                  Saved
                </motion.span>
              )}
              {saveStatus === "error" && (
                <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                  Failed
                </span>
              )}
            </div>

            <ModeToggle
              value={mode}
              onChange={handleModeChange}
              disabled={saving}
              locked={!isConnected}
            />

            {/* Mode status banner — only when connected */}
            {isConnected && active && (
              <div className={`mt-3 flex items-center gap-2 rounded-lg ${active.activeBg} border ${active.activeBorder} px-3 py-2.5`}>
                {(() => { const Icon = active.icon; return <Icon size={14} className={`${active.color} shrink-0`} />; })()}
                <div className="min-w-0">
                  <p className={`text-xs font-medium ${active.activeText} leading-tight`}>
                    {mode === "live"
                      ? "Live — No overlay shown to visitors"
                      : `${active.label} mode active — Overlay shown to visitors`}
                  </p>
                  <p className={`text-xs ${active.activeText} opacity-60 leading-tight mt-0.5`}>
                    {active.description}
                  </p>
                </div>
              </div>
            )}

            {/* Custom config — only when mode is "custom" and connected */}
            {mode === "custom" && isConnected && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-stone-100"
              >
                <CustomConfig
                  config={config}
                  onChange={setConfig}
                  disabled={saving}
                />
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={handleConfigSave}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-indigo-600 disabled:opacity-50"
                  >
                    <Save size={12} />
                    {saving ? "Saving..." : "Save Config"}
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Right — Integration */}
          <IntegrationPanel
            projectId={project.id}
            publicKey={project.publicKey}
            connectionState={connectionState}
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
