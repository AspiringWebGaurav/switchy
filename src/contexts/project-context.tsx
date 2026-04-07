"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import type { ModeValue, ModeConfig, ModePolicy } from "@/types/policy";
import type { Project } from "@/types/project";

export type ConnectionState = "waiting" | "detected" | "connected" | "disconnected";

export interface ProjectData extends Project {
  policy: ModePolicy | null;
}

interface ProjectContextValue {
  project: ProjectData | null;
  loading: boolean;
  error: Error | null;

  connectionState: ConnectionState;
  mode: ModeValue;
  config: ModeConfig;

  saving: boolean;
  saveStatus: "idle" | "applying" | "saved" | "error";

  setMode: (mode: ModeValue) => Promise<boolean>;
  saveConfig: (config: ModeConfig) => Promise<boolean>;
  setConfig: (config: ModeConfig) => void;
  toggleConnection: (enabled: boolean) => Promise<boolean>;
  refetch: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
}

export function useProjectSafe() {
  return useContext(ProjectContext);
}

interface ProjectProviderProps {
  projectId: string;
  children: ReactNode;
}

export function ProjectProvider({ projectId, children }: ProjectProviderProps) {
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const [connectionState, setConnectionState] = useState<ConnectionState>("waiting");
  const [mode, setModeState] = useState<ModeValue>("live");
  const [config, setConfig] = useState<ModeConfig>({
    message: null,
    buttonText: null,
    redirectUrl: null,
  });

  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "applying" | "saved" | "error">("idle");

  const sseVersionRef = useRef<number>(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const tabIdRef = useRef<string>(`tab-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);

  const fetchProject = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`/api/v1/projects/${projectId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch project");
      }
      const json = await res.json();
      const data = json.data as ProjectData;
      setProject(data);

      if (data.enabled === true) setConnectionState("connected");
      else if (data.enabled === false) setConnectionState("disconnected");
      else if (data.detected === true) setConnectionState("detected");
      else setConnectionState("waiting");

      if (data.policy) {
        setModeState(data.policy.value);
        setConfig(data.policy.config);
        sseVersionRef.current = data.policy.updatedAt;
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch project"));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

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
          setProject((prev) => (prev ? { ...prev, enabled: true } : prev));
          stopPolling();
        } else if (d.detected === true) {
          setConnectionState("detected");
          setProject((prev) => (prev ? { ...prev, detected: true } : prev));
          stopPolling();
        }
      } catch {
        /* silent */
      }
    };

    function stopPolling() {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
      }
    }

    pollRef.current = setInterval(poll, 5000);
    pollTimeoutRef.current = setTimeout(stopPolling, 120000);

    return stopPolling;
  }, [connectionState, loading, projectId]);

  useEffect(() => {
    if (!project?.publicKey) return;

    const eventsUrl = `/api/v1/events/${projectId}?key=${encodeURIComponent(project.publicKey)}`;
    let evtSource: EventSource | null = null;
    let fallbackTimer: ReturnType<typeof setInterval> | null = null;
    let sseFailStart: number | null = null;

    function stopFallback() {
      if (fallbackTimer) {
        clearInterval(fallbackTimer);
        fallbackTimer = null;
      }
    }

    function startFallback() {
      if (fallbackTimer) return;
      fallbackTimer = setInterval(async () => {
        try {
          const res = await fetch(`/api/v1/projects/${projectId}/policy`, {
            cache: "no-store",
          });
          if (!res.ok) return;
          const json = await res.json();
          const p = json.data as ModePolicy;
          if (!p || p.updatedAt <= sseVersionRef.current) return;
          sseVersionRef.current = p.updatedAt;
          setModeState(p.value);
          setConfig(p.config);
        } catch {
          /* silent */
        }
      }, 15000);
    }

    evtSource = new EventSource(eventsUrl);

    evtSource.addEventListener("mode", (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (!data.version || data.version <= sseVersionRef.current) return;
        sseVersionRef.current = data.version;
        setModeState(data.mode);
        setConfig({
          message: data.message,
          buttonText: data.buttonText,
          redirectUrl: data.redirect,
        });
      } catch {
        /* silent */
      }
    });

    evtSource.onopen = () => {
      sseFailStart = null;
      stopFallback();
    };

    evtSource.onerror = () => {
      if (!sseFailStart) sseFailStart = Date.now();
      if (Date.now() - sseFailStart > 30000) {
        evtSource?.close();
        evtSource = null;
        startFallback();
      }
    };

    return () => {
      evtSource?.close();
      stopFallback();
    };
  }, [project?.publicKey, projectId]);

  // BroadcastChannel for multi-tab sync
  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) {
      return;
    }

    const channel = new BroadcastChannel("switchy-mode-sync");
    broadcastChannelRef.current = channel;

    channel.onmessage = (event: MessageEvent) => {
      const msg = event.data;
      // Ignore messages from this tab or for different projects
      if (msg.source === tabIdRef.current || msg.projectId !== projectId) {
        return;
      }
      // Update state from other tab's broadcast
      if (msg.version > sseVersionRef.current) {
        sseVersionRef.current = msg.version;
        setModeState(msg.mode);
        setConfig(msg.config);
      }
    };

    return () => {
      channel.close();
      broadcastChannelRef.current = null;
    };
  }, [projectId]);

  const setMode = useCallback(
    async (newMode: ModeValue): Promise<boolean> => {
      const prevMode = mode;
      setModeState(newMode);
      setSaving(true);
      setSaveStatus("applying");

      try {
        const res = await fetch(`/api/v1/projects/${projectId}/policy`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value: newMode }),
        });

        if (res.ok) {
          const json = await res.json();
          const updatedPolicy = json.data;
          // Broadcast to other tabs
          if (broadcastChannelRef.current && updatedPolicy) {
            broadcastChannelRef.current.postMessage({
              type: "mode_change",
              projectId,
              mode: newMode,
              config: updatedPolicy.config || config,
              version: updatedPolicy.updatedAt || Date.now(),
              source: tabIdRef.current,
            });
          }
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus("idle"), 2000);
          return true;
        } else {
          setModeState(prevMode);
          setSaveStatus("error");
          return false;
        }
      } catch {
        setModeState(prevMode);
        setSaveStatus("error");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [mode, projectId]
  );

  const saveConfigFn = useCallback(
    async (newConfig: ModeConfig): Promise<boolean> => {
      setSaving(true);
      setSaveStatus("applying");

      try {
        const res = await fetch(`/api/v1/projects/${projectId}/policy`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value: mode, config: newConfig }),
        });

        if (res.ok) {
          setConfig(newConfig);
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus("idle"), 2000);
          return true;
        } else {
          setSaveStatus("error");
          return false;
        }
      } catch {
        setSaveStatus("error");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [mode, projectId]
  );

  const toggleConnection = useCallback(
    async (enabled: boolean): Promise<boolean> => {
      const prevState = connectionState;
      setConnectionState(enabled ? "connected" : "disconnected");

      try {
        const res = await fetch(`/api/v1/projects/${projectId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled }),
        });

        if (res.ok) {
          setProject((prev) => (prev ? { ...prev, enabled } : prev));
          return true;
        } else {
          setConnectionState(prevState);
          return false;
        }
      } catch {
        setConnectionState(prevState);
        return false;
      }
    },
    [connectionState, projectId]
  );

  const value: ProjectContextValue = {
    project,
    loading,
    error,
    connectionState,
    mode,
    config,
    saving,
    saveStatus,
    setMode,
    saveConfig: saveConfigFn,
    setConfig,
    toggleConnection,
    refetch: fetchProject,
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}
