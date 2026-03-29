"use client";

import { motion } from "framer-motion";
import { Key } from "lucide-react";
import { CopyButton } from "@/components/ui/copy-button";

interface PublicKeyDisplayProps {
  publicKey: string;
}

export function PublicKeyDisplay({ publicKey }: PublicKeyDisplayProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border border-zinc-200 bg-white p-5 hover:shadow-sm transition-shadow"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
          <Key size={18} className="text-amber-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">Public Key</h3>
          <p className="text-xs text-zinc-500">Use this key to identify your project</p>
        </div>
      </div>
      
      <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
        <code className="text-sm font-mono text-zinc-700 truncate">
          {publicKey}
        </code>
        <CopyButton value={publicKey} variant="outline" />
      </div>
    </motion.div>
  );
}
