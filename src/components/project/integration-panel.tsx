"use client";

import { useState } from "react";
import { Copy, Check, Code2, Terminal, Key } from "lucide-react";
import { APP_NAME } from "@/config/constants";

interface IntegrationPanelProps {
  projectId: string;
  publicKey: string;
}

export function IntegrationPanel({ projectId, publicKey }: IntegrationPanelProps) {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedApi, setCopiedApi] = useState(false);

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";

  const scriptSnippet = `<script src="${appUrl}/switchy.js?key=${publicKey}&project=${projectId}"></script>`;
  const apiEndpoint = `${appUrl}/api/v1/decide?projectId=${projectId}&key=${publicKey}`;

  function copyToClipboard(text: string, setCopied: (v: boolean) => void) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      {/* Public Key */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
            <Key size={15} className="text-amber-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-stone-900">Public Key</h3>
          </div>
        </div>
        <div className="relative group">
          <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
            <code className="text-sm font-mono text-stone-600 truncate pr-4">
              {publicKey}
            </code>
            <button
              onClick={() => copyToClipboard(publicKey, setCopiedKey)}
              className="shrink-0 flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-500 transition-all hover:border-stone-300 hover:text-stone-700"
            >
              {copiedKey ? (
                <>
                  <Check size={12} className="text-emerald-500" />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={12} />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Script Tag */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
            <Code2 size={15} className="text-indigo-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-stone-900">Script Tag</h3>
            <p className="text-xs text-stone-400">Add to your HTML head</p>
          </div>
        </div>
        <div className="relative">
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 pr-20">
            <pre className="overflow-x-auto text-xs font-mono text-stone-600 leading-relaxed whitespace-pre-wrap break-all">
              {scriptSnippet}
            </pre>
          </div>
          <button
            onClick={() => copyToClipboard(scriptSnippet, setCopiedScript)}
            className="absolute top-3 right-3 flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-500 transition-all hover:border-stone-300 hover:text-stone-700"
          >
            {copiedScript ? (
              <>
                <Check size={12} className="text-emerald-500" />
                Copied
              </>
            ) : (
              <>
                <Copy size={12} />
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      {/* API Endpoint */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
            <Terminal size={15} className="text-emerald-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-stone-900">API Endpoint</h3>
            <p className="text-xs text-stone-400">Query your project mode directly</p>
          </div>
        </div>
        <div className="relative">
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 pr-20">
            <div className="flex items-start gap-2">
              <span className="shrink-0 rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 tracking-wide">
                GET
              </span>
              <pre className="overflow-x-auto text-xs font-mono text-stone-600 leading-relaxed whitespace-pre-wrap break-all">
                {apiEndpoint}
              </pre>
            </div>
          </div>
          <button
            onClick={() => copyToClipboard(apiEndpoint, setCopiedApi)}
            className="absolute top-3 right-3 flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-500 transition-all hover:border-stone-300 hover:text-stone-700"
          >
            {copiedApi ? (
              <>
                <Check size={12} className="text-emerald-500" />
                Copied
              </>
            ) : (
              <>
                <Copy size={12} />
                Copy
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
