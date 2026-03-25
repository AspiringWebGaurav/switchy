"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowUpRight, Layers } from "lucide-react";

interface ProjectCardProps {
  id: string;
  name: string;
  mode: string;
  publicKey: string;
  createdAt: number;
}

const modeColors: Record<string, { bg: string; text: string; dot: string; iconBg: string }> = {
  live: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", iconBg: "bg-emerald-50" },
  maintenance: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", iconBg: "bg-amber-50" },
  custom: { bg: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-500", iconBg: "bg-violet-50" },
};

export function ProjectCard({ id, name, mode, publicKey, createdAt }: ProjectCardProps) {
  const router = useRouter();
  const colors = modeColors[mode] || modeColors.live;

  return (
    <motion.button
      onClick={() => router.push(`/project/${id}`)}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.15 }}
      className="group flex w-full flex-col rounded-2xl border border-stone-200 bg-white p-5 text-left transition-all hover:shadow-lg hover:shadow-stone-200/50 hover:border-stone-300 cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors.iconBg}`}>
          <Layers size={18} className={colors.text} />
        </div>
        <ArrowUpRight
          size={16}
          className="text-stone-300 transition-all group-hover:text-indigo-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      </div>

      <h3 className="text-base font-semibold text-stone-900 truncate mb-1">
        {name}
      </h3>

      <p className="text-[11px] text-stone-400 font-mono truncate mb-4">
        {publicKey}
      </p>

      <div className="mt-auto flex items-center justify-between pt-3 border-t border-stone-100">
        <div
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${colors.bg} ${colors.text}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
          {mode}
        </div>
        <span className="text-[11px] text-stone-400">
          {new Date(createdAt).toLocaleDateString()}
        </span>
      </div>
    </motion.button>
  );
}
