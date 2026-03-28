"use client";

import { useState, useEffect } from "react";
import { Copy, Check, Code2, Terminal, Key } from "lucide-react";

type ConnectionState = "waiting" | "detected" | "connected" | "disconnected";

interface IntegrationPanelProps {
  projectId: string;
  publicKey: string;
  connectionState: ConnectionState;
}

function StatusBadge({ state }: { state: ConnectionState }) {
  if (state === "connected") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </span>
        Active
      </span>
    );
  }
  if (state === "detected") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-600">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-indigo-500" />
        </span>
        Script Detected
      </span>
    );
  }
  if (state === "disconnected") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-500">
        <span className="h-1.5 w-1.5 rounded-full bg-stone-400" />
        Paused
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-400">
      <span className="h-1.5 w-1.5 rounded-full bg-stone-300" />
      Not Started
    </span>
  );
}

export function IntegrationPanel({ projectId, publicKey, connectionState }: IntegrationPanelProps) {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedApi, setCopiedApi] = useState(false);
  const [appUrl, setAppUrl] = useState("");

  useEffect(() => {
    setAppUrl(window.location.origin);
  }, []);

  const scriptSnippet = `<script src="${appUrl}/switchy.js?key=${publicKey}&project=${projectId}"></script>`;
  const apiEndpoint = `${appUrl}/api/v1/decide?projectId=${projectId}&key=${publicKey}`;

  function copyToClipboard(text: string, setCopied: (v: boolean) => void) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-3">
      {/* Public Key */}
      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-50">
            <Key size={14} className="text-amber-500" />
          </div>
          <h3 className="text-sm font-semibold text-stone-900">Public Key</h3>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-stone-200 bg-stone-50 px-3 py-2">
          <code className="text-xs font-mono text-stone-600 truncate pr-3">
            {publicKey}
          </code>
          <button
            onClick={() => copyToClipboard(publicKey, setCopiedKey)}
            className="shrink-0 flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2 py-1 text-xs font-medium text-stone-500 transition-all hover:border-stone-300 hover:text-stone-700"
          >
            {copiedKey ? <><Check size={12} className="text-emerald-500" /> Copied</> : <><Copy size={12} /> Copy</>}
          </button>
        </div>
      </div>

      {/* Script Tag */}
      <div className={`rounded-xl border bg-white p-4 transition-all ${connectionState === "disconnected" ? "border-stone-200 opacity-60" : "border-stone-200"}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-50">
              <Code2 size={14} className="text-indigo-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-stone-900">Script Tag</h3>
              <p className="text-xs text-stone-400">Add to your HTML head</p>
            </div>
          </div>
          <StatusBadge state={connectionState} />
        </div>
        <div className="relative">
          <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 pr-16">
            <pre className="overflow-x-auto text-xs font-mono text-stone-600 leading-relaxed whitespace-pre-wrap break-all">
              {scriptSnippet}
            </pre>
          </div>
          <button
            onClick={() => copyToClipboard(scriptSnippet, setCopiedScript)}
            className="absolute top-2 right-2 flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2 py-1 text-xs font-medium text-stone-500 transition-all hover:border-stone-300 hover:text-stone-700"
          >
            {copiedScript ? <><Check size={12} className="text-emerald-500" /> Copied</> : <><Copy size={12} /> Copy</>}
          </button>
        </div>
      </div>

      {/* API Endpoint */}
      <div className={`rounded-xl border bg-white p-4 transition-all ${connectionState === "disconnected" ? "border-stone-200 opacity-60" : "border-stone-200"}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50">
              <Terminal size={14} className="text-emerald-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-stone-900">API Endpoint</h3>
              <p className="text-xs text-stone-400">Query mode directly</p>
            </div>
          </div>
          <StatusBadge state={connectionState} />
        </div>
        <div className="relative">
          <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 pr-16">
            <div className="flex items-start gap-1.5">
              <span className="shrink-0 rounded bg-emerald-100 px-1.5 py-0.5 text-[11px] font-bold text-emerald-700 tracking-wide">
                GET
              </span>
              <pre className="overflow-x-auto text-xs font-mono text-stone-600 leading-relaxed whitespace-pre-wrap break-all">
                {apiEndpoint}
              </pre>
            </div>
          </div>
          <button
            onClick={() => copyToClipboard(apiEndpoint, setCopiedApi)}
            className="absolute top-2 right-2 flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2 py-1 text-xs font-medium text-stone-500 transition-all hover:border-stone-300 hover:text-stone-700"
          >
            {copiedApi ? <><Check size={12} className="text-emerald-500" /> Copied</> : <><Copy size={12} /> Copy</>}
          </button>
        </div>
      </div>
    </div>
  );
}
