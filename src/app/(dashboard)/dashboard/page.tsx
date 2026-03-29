"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, FolderOpen, LayoutDashboard, Key, Sliders, Activity, Copy, Check } from "lucide-react";
import { CreateProjectModal } from "@/components/dashboard/create-project-modal";
import { InlineLoader } from "@/components/shared/logo-loader";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { ProjectOverview } from "@/components/dashboard/tabs/overview";
import { ProjectKeys } from "@/components/dashboard/tabs/keys";
import { ProjectModes } from "@/components/dashboard/tabs/modes";
import { ProjectEvents } from "@/components/dashboard/tabs/events";

interface ProjectWithMode {
  id: string;
  name: string;
  publicKey: string;
  mode: string;
  createdAt: number;
  updatedAt: number;
  enabled?: boolean;
  detected?: boolean;
}

type TabId = "overview" | "keys" | "modes" | "events";

const tabs: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "keys", label: "Keys", icon: Key },
  { id: "modes", label: "Modes", icon: Sliders },
  { id: "events", label: "Events", icon: Activity },
];

const statusMessages = [
  "Ready to create your first project...",
  "Real-time mode switching enabled...",
  "No deployments required...",
  "Connect any website or app...",
  "Sub-100ms response time...",
];

function TypewriterStatus() {
  const [messageIndex, setMessageIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    const message = statusMessages[messageIndex];
    
    if (isTyping) {
      if (displayText.length < message.length) {
        const timeout = setTimeout(() => {
          setDisplayText(message.slice(0, displayText.length + 1));
        }, 50);
        return () => clearTimeout(timeout);
      } else {
        const timeout = setTimeout(() => setIsTyping(false), 2000);
        return () => clearTimeout(timeout);
      }
    } else {
      if (displayText.length > 0) {
        const timeout = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1));
        }, 30);
        return () => clearTimeout(timeout);
      } else {
        setMessageIndex((prev) => (prev + 1) % statusMessages.length);
        setIsTyping(true);
      }
    }
  }, [displayText, isTyping, messageIndex]);

  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-100/80">
      <div className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-pulse" />
      <span className="text-xs font-mono text-zinc-500 min-w-[200px]">
        {displayText}
        <span className="animate-pulse">|</span>
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<ProjectWithMode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || null;

  const handleCopy = (value: string, field: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const fetchProjects = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/v1/projects");
      if (res.ok) {
        const json = await res.json();
        const data = json.data || [];
        setProjects(data);
        if (data.length > 0 && !selectedProjectId) {
          setSelectedProjectId(data[0].id);
        }
      } else {
        setError("Failed to load projects");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Auto-refresh when waiting for connection detection
  useEffect(() => {
    if (!selectedProject) return;
    const isOnboarding = selectedProject.enabled === undefined && !selectedProject.detected;
    const isDetected = selectedProject.detected && selectedProject.enabled === undefined;
    
    if (isOnboarding || isDetected) {
      const interval = setInterval(() => {
        fetchProjects();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedProject, fetchProjects]);

  const handleSelectProject = (id: string) => {
    setSelectedProjectId(id);
    setActiveTab("overview");
  };

  const handleProjectCreated = () => {
    fetchProjects();
    setModalOpen(false);
  };

  return (
    <>
      {/* Sidebar */}
      <DashboardSidebar
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={handleSelectProject}
        onCreateProject={() => setModalOpen(true)}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-zinc-50 overflow-y-auto">
        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <InlineLoader text="Loading..." />
          </div>
        ) : error ? (
          <div className="flex flex-1 flex-col items-center justify-center py-20">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100">
              <FolderOpen size={28} className="text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 mb-1">Unable to load projects</h3>
            <p className="text-sm text-zinc-500 mb-6 max-w-xs text-center">{error}</p>
            <button
              onClick={() => { setLoading(true); fetchProjects(); }}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center py-20">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100">
              <FolderOpen size={28} className="text-zinc-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 mb-1">No projects yet</h3>
            <p className="text-sm text-zinc-500 mb-6 max-w-xs text-center">
              Create your first project to start controlling your apps
            </p>
            <motion.button
              onClick={() => setModalOpen(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 mb-8"
            >
              <Plus size={16} />
              Create Project
            </motion.button>
            
            {/* Typewriter Status Messages */}
            <TypewriterStatus />
          </div>
        ) : selectedProject ? (
          <>
            {/* Project Header + Tabs */}
            <div className="border-b border-zinc-200 bg-white shrink-0">
              <div className="px-6 lg:px-8 py-4">
                <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-500">Project Name:</span>
                    <span className="text-sm font-semibold text-zinc-900">{selectedProject.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-500">Project ID:</span>
                    <code className="text-sm font-mono text-zinc-700">{selectedProject.id}</code>
                    <button
                      onClick={() => handleCopy(selectedProject.id, "id")}
                      className="p-1 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
                    >
                      {copiedField === "id" ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-500">Public Key:</span>
                    <code className="text-sm font-mono text-zinc-700">{selectedProject.publicKey}</code>
                    <button
                      onClick={() => handleCopy(selectedProject.publicKey, "key")}
                      className="p-1 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
                    >
                      {copiedField === "key" ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-1 px-6 lg:px-8">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                        isActive ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
                      }`}
                    >
                      <Icon size={15} strokeWidth={isActive ? 2 : 1.5} />
                      <span>{tab.label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="active-tab-indicator"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"
                          transition={{ type: "spring", stiffness: 500, damping: 35 }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${selectedProjectId}-${activeTab}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="px-6 lg:px-8 py-6"
                >
                  {activeTab === "overview" && (
                    <ProjectOverview 
                      project={selectedProject} 
                      onRefresh={fetchProjects}
                      onNavigateToModes={() => setActiveTab("modes")}
                    />
                  )}
                  {activeTab === "keys" && (
                    <ProjectKeys project={selectedProject} />
                  )}
                  {activeTab === "modes" && (
                    <ProjectModes project={selectedProject} onRefresh={fetchProjects} />
                  )}
                  {activeTab === "events" && (
                    <ProjectEvents project={selectedProject} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </>
        ) : null}
      </main>

      <CreateProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleProjectCreated}
      />
    </>
  );
}
