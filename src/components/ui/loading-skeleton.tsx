"use client";

import { motion } from "framer-motion";

interface SkeletonProps {
  className?: string;
  animate?: boolean;
  style?: React.CSSProperties;
}

export function Skeleton({ className = "", animate = true, style }: SkeletonProps) {
  return (
    <div
      className={`rounded-lg bg-zinc-200/60 ${animate ? "animate-pulse" : ""} ${className}`}
      style={style}
    />
  );
}

export function SkeletonText({ lines = 1, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === lines - 1 && lines > 1 ? "w-3/4" : "w-full"}`}
        />
      ))}
    </div>
  );
}

export function ProjectHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Skeleton className="h-6 w-6 rounded-lg" />
        <div className="h-5 w-px bg-zinc-200" />
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
}

export function ProjectTabsSkeleton() {
  return (
    <div className="flex gap-1 border-b border-zinc-200 px-6">
      {[80, 60, 70, 65].map((width, i) => (
        <Skeleton key={i} className="h-9 rounded-t-lg mb-[-1px]" style={{ width }} />
      ))}
    </div>
  );
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-xl border border-zinc-200 bg-white p-5"
    >
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="h-9 w-9 rounded-xl" />
        <Skeleton className="h-4 w-28" />
      </div>
      <SkeletonText lines={lines} />
    </motion.div>
  );
}

export function ModeGridSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-20 rounded-xl" />
      ))}
    </div>
  );
}

export function ProjectPageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-4">
          <CardSkeleton lines={2} />
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="flex items-center gap-3 mb-5">
              <Skeleton className="h-9 w-9 rounded-xl" />
              <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
            <ModeGridSkeleton />
          </div>
        </div>
        <div className="space-y-4">
          <CardSkeleton lines={1} />
          <CardSkeleton lines={4} />
          <CardSkeleton lines={2} />
        </div>
      </div>
    </div>
  );
}

export function DashboardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="rounded-xl border border-zinc-200 bg-white p-5"
        >
          <div className="flex items-start justify-between mb-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-4 w-4" />
          </div>
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-3 w-full mb-4" />
          <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-3 w-16" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
