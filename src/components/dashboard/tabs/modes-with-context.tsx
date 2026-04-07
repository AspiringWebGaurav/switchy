"use client";

import { ProjectProvider, useProject } from "@/contexts/project-context";
import { ProjectModesContent } from "./modes-content";

interface ProjectModesWithContextProps {
  projectId: string;
  onRefresh: () => void;
}

export function ProjectModesWithContext({ projectId, onRefresh }: ProjectModesWithContextProps) {
  return (
    <ProjectProvider projectId={projectId}>
      <ProjectModesContent onRefresh={onRefresh} />
    </ProjectProvider>
  );
}
