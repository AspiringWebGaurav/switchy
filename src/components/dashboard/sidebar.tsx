"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  ChevronLeft,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface Project {
  id: string;
  name: string;
  mode: string;
}

interface DashboardSidebarProps {
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (id: string) => void;
  onCreateProject: () => void;
}

const modeColors: Record<string, string> = {
  live: "bg-emerald-500",
  maintenance: "bg-amber-500",
  custom: "bg-violet-500",
};

export function DashboardSidebar({
  projects,
  selectedProjectId,
  onSelectProject,
  onCreateProject,
}: DashboardSidebarProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [projectsExpanded, setProjectsExpanded] = useState(true);

  async function handleLogout() {
    await fetch("/api/v1/auth/session", { method: "DELETE" });
    router.push("/");
    router.refresh();
  }

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 56 : 220 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="hidden md:flex flex-col h-[calc(100vh-56px)] bg-white border-r border-zinc-100 sticky top-14 shadow-sm"
    >
      {/* Collapse toggle */}
      <div className={`flex items-center ${collapsed ? "justify-center" : "justify-end"} px-3 py-2`}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
        >
          <ChevronLeft size={16} className={`transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Projects Section */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {!collapsed && (
          <button
            onClick={() => setProjectsExpanded(!projectsExpanded)}
            className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-zinc-400 tracking-widest uppercase hover:text-zinc-600"
          >
            <span>Projects</span>
            <ChevronDown size={14} className={`transition-transform ${projectsExpanded ? "" : "-rotate-90"}`} />
          </button>
        )}

        <AnimatePresence initial={false}>
          {(projectsExpanded || collapsed) && (
            <motion.ul
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-0.5 mt-1 overflow-hidden"
            >
              {projects.map((project) => {
                const isSelected = project.id === selectedProjectId;
                const dotColor = modeColors[project.mode] || modeColors.live;

                return (
                  <li key={project.id} className="relative">
                    {isSelected && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-indigo-500 rounded-r-full" />
                    )}
                    <button
                      onClick={() => onSelectProject(project.id)}
                      className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        isSelected
                          ? "bg-indigo-50/80 text-indigo-700"
                          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                      } ${collapsed ? "justify-center px-2" : ""}`}
                      title={collapsed ? project.name : undefined}
                    >
                      <div className={`shrink-0 h-2 w-2 rounded-full ${dotColor}`} />
                      {!collapsed && (
                        <span className="truncate">{project.name}</span>
                      )}
                    </button>
                  </li>
                );
              })}

              {/* Create Project Button */}
              <li>
                <button
                  onClick={onCreateProject}
                  className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600 transition-all ${
                    collapsed ? "justify-center px-2" : ""
                  }`}
                  title={collapsed ? "New Project" : undefined}
                >
                  <Plus size={16} />
                  {!collapsed && <span>New Project</span>}
                </button>
              </li>
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      {/* User Profile Footer */}
      <div className="border-t border-zinc-100 p-2">
        {user && (
          <div className={`${collapsed ? "flex justify-center" : ""}`}>
            {collapsed ? (
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            ) : (
              <div className="px-2 py-2">
                <div className="flex items-center gap-2.5 mb-2">
                  {user.avatar ? (
                    <Image
                      src={user.avatar}
                      alt={user.name}
                      width={28}
                      height={28}
                      className="rounded-full shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-semibold text-indigo-600 shrink-0">
                      {user.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">{user.name}</p>
                    <p className="text-xs text-zinc-400 truncate">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs font-medium text-zinc-500 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={14} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.aside>
  );
}
