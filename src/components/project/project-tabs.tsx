"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, Key, Sliders, Activity } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface TabItem {
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
}

interface ProjectTabsProps {
  projectId: string;
}

export function ProjectTabs({ projectId }: ProjectTabsProps) {
  const pathname = usePathname();
  
  const tabs: TabItem[] = [
    { 
      label: "Overview", 
      href: `/project/${projectId}`, 
      icon: LayoutDashboard,
      exact: true 
    },
    { 
      label: "Keys", 
      href: `/project/${projectId}/keys`, 
      icon: Key 
    },
    { 
      label: "Modes", 
      href: `/project/${projectId}/modes`, 
      icon: Sliders 
    },
    { 
      label: "Events", 
      href: `/project/${projectId}/events`, 
      icon: Activity 
    },
  ];

  const isActive = (tab: TabItem) => {
    if (tab.exact) return pathname === tab.href;
    return pathname.startsWith(tab.href);
  };

  return (
    <div className="flex gap-1 px-6 lg:px-10">
      {tabs.map((tab) => {
        const active = isActive(tab);
        const Icon = tab.icon;
        
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="relative"
          >
            <motion.div
              whileHover={{ backgroundColor: active ? undefined : "rgba(0,0,0,0.02)" }}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors rounded-t-lg ${
                active
                  ? "text-zinc-900"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              <Icon size={15} strokeWidth={active ? 2 : 1.5} />
              <span>{tab.label}</span>
            </motion.div>
            
            {active && (
              <motion.div
                layoutId="active-tab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
          </Link>
        );
      })}
    </div>
  );
}
