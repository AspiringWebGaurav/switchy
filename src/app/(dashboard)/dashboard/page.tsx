"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, FolderOpen } from "lucide-react";
import { ProjectCard } from "@/components/dashboard/project-card";
import { CreateProjectModal } from "@/components/dashboard/create-project-modal";

interface ProjectWithMode {
  id: string;
  name: string;
  publicKey: string;
  mode: string;
  createdAt: number;
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<ProjectWithMode[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/projects");
      if (res.ok) {
        const json = await res.json();
        setProjects(json.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (
    <div className="flex flex-1 flex-col">
      {/* Dashboard Header Bar */}
      <div className="border-b border-stone-200 bg-white">
        <div className="flex items-center justify-between px-6 lg:px-10 py-4">
          <div>
            <h1 className="text-lg font-semibold text-stone-900">Projects</h1>
            <p className="text-xs text-stone-500">
              Manage your applications and their modes
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-500/25"
          >
            <Plus size={16} />
            New Project
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 lg:px-10 py-8">
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-44 animate-pulse rounded-2xl border border-stone-200 bg-stone-100"
              />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-1 flex-col items-center justify-center py-28"
          >
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100">
              <FolderOpen size={28} className="text-stone-400" />
            </div>
            <h3 className="text-lg font-semibold text-stone-900 mb-1">
              No projects yet
            </h3>
            <p className="text-sm text-stone-500 mb-6 max-w-xs text-center">
              Create your first project to start controlling your apps in real-time
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-indigo-600"
            >
              <Plus size={16} />
              Create Project
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ProjectCard
                  id={project.id}
                  name={project.name}
                  mode={project.mode}
                  publicKey={project.publicKey}
                  createdAt={project.createdAt}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      <CreateProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={fetchProjects}
      />
    </div>
  );
}
