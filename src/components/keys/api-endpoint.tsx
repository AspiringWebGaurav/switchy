"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Terminal } from "lucide-react";
import { CopyButton } from "@/components/ui/copy-button";
import { ConnectionBadge, ConnectionState } from "@/components/ui/status-badge";

interface ApiEndpointProps {
  projectId: string;
  publicKey: string;
  connectionState: ConnectionState;
}

export function ApiEndpoint({ projectId, publicKey, connectionState }: ApiEndpointProps) {
  const [appUrl, setAppUrl] = useState("");

  useEffect(() => {
    setAppUrl(window.location.origin);
  }, []);

  const apiEndpoint = `${appUrl}/api/v1/decide?projectId=${projectId}&key=${publicKey}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className={`rounded-xl border bg-white p-5 transition-all ${
        connectionState === "disconnected"
          ? "border-zinc-200/60 opacity-60"
          : "border-zinc-200 hover:shadow-sm"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100">
            <Terminal size={18} className="text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">API Endpoint</h3>
            <p className="text-xs text-zinc-500">Query mode status directly</p>
          </div>
        </div>
        <ConnectionBadge state={connectionState} />
      </div>

      <div className="relative">
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 pr-20">
          <div className="flex items-start gap-2">
            <span className="shrink-0 rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700 tracking-wide">
              GET
            </span>
            <pre className="overflow-x-auto text-xs font-mono text-zinc-600 leading-relaxed whitespace-pre-wrap break-all">
              {apiEndpoint}
            </pre>
          </div>
        </div>
        
        <div className="absolute top-3 right-3">
          <CopyButton value={apiEndpoint} variant="outline" />
        </div>
      </div>

      <div className="mt-4 p-3 rounded-lg bg-zinc-50 border border-zinc-100">
        <p className="text-xs text-zinc-500 leading-relaxed">
          <strong className="text-zinc-700">Response:</strong> Returns the current mode, config, and overlay settings for your project. Use this to build custom integrations.
        </p>
      </div>
    </motion.div>
  );
}
