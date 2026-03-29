"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Code2, Terminal, Key, ChevronLeft, ChevronRight } from "lucide-react";

type Framework = "html" | "react" | "nextjs" | "vue" | "angular" | "svelte";

const frameworks: { id: Framework; label: string; icon: string }[] = [
  { id: "html", label: "HTML", icon: "🌐" },
  { id: "react", label: "React", icon: "⚛️" },
  { id: "nextjs", label: "Next.js", icon: "▲" },
  { id: "vue", label: "Vue", icon: "💚" },
  { id: "angular", label: "Angular", icon: "🅰️" },
  { id: "svelte", label: "Svelte", icon: "🔥" },
];

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
  const [framework, setFramework] = useState<Framework>("html");
  const [isHovered, setIsHovered] = useState(false);
  const autoSlideRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setAppUrl(window.location.origin);
  }, []);

  // Auto-slide when not hovered
  useEffect(() => {
    if (isHovered) {
      if (autoSlideRef.current) clearInterval(autoSlideRef.current);
      return;
    }
    autoSlideRef.current = setInterval(() => {
      setFramework((prev) => {
        const idx = frameworks.findIndex((f) => f.id === prev);
        return frameworks[(idx + 1) % frameworks.length].id;
      });
    }, 3000);
    return () => {
      if (autoSlideRef.current) clearInterval(autoSlideRef.current);
    };
  }, [isHovered]);

  const scriptUrl = `${appUrl}/switchy.js?key=${publicKey}&project=${projectId}`;
  const hideStyle = `<style id="switchy-hide">html{visibility:hidden!important;background:#fff}</style>`;
  
  // Framework-specific snippets
  const snippets: Record<Framework, { code: string; file: string }> = {
    html: {
      file: "index.html",
      code: `<!-- Switchyy: Add to <head> -->\n${hideStyle}\n<script src="${scriptUrl}"></script>`
    },
    react: {
      file: "public/index.html",
      code: `<!-- Switchyy: Add to <head> -->\n${hideStyle}\n<script src="${scriptUrl}"></script>`
    },
    nextjs: {
      file: "app/layout.tsx",
      code: `import Script from "next/script";

// In <head>:
<style id="switchy-hide" dangerouslySetInnerHTML={{
  __html: "html{visibility:hidden!important;background:#fff}"
}} />
<Script src="${scriptUrl}" strategy="beforeInteractive" />`
    },
    vue: {
      file: "index.html",
      code: `<!-- Switchyy: Add to <head> -->\n${hideStyle}\n<script src="${scriptUrl}"></script>`
    },
    angular: {
      file: "src/index.html",
      code: `<!-- Switchyy: Add to <head> -->\n${hideStyle}\n<script src="${scriptUrl}"></script>`
    },
    svelte: {
      file: "app.html",
      code: `<!-- Switchyy: Add to <head> -->\n${hideStyle}\n<script src="${scriptUrl}"></script>`
    }
  };

  const currentSnippet = snippets[framework];
  const apiEndpoint = `${appUrl}/api/v1/decide?projectId=${projectId}&key=${publicKey}`;

  function copyToClipboard(text: string, setCopied: (v: boolean) => void) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const }
    })
  };

  return (
    <div className="space-y-4">
      {/* Public Key */}
      <motion.div 
        custom={0}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className="group rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm hover:shadow-md hover:border-stone-300/80 transition-all duration-300"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 shadow-sm group-hover:shadow transition-shadow">
            <Key size={16} className="text-amber-500" />
          </div>
          <h3 className="text-sm font-semibold text-stone-900">Public Key</h3>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-stone-200/80 bg-gradient-to-r from-stone-50 to-stone-100/50 px-4 py-3">
          <code className="text-xs font-mono text-stone-600 truncate pr-3">
            {publicKey}
          </code>
          <button
            onClick={() => copyToClipboard(publicKey, setCopiedKey)}
            className="shrink-0 flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-500 transition-all hover:border-indigo-300 hover:text-indigo-600 hover:shadow-sm active:scale-95"
          >
            {copiedKey ? <><Check size={12} className="text-emerald-500" /> Copied!</> : <><Copy size={12} /> Copy</>}
          </button>
        </div>
      </motion.div>

      {/* Integration Snippet */}
      <motion.div 
        custom={1}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`group rounded-2xl border bg-white p-5 shadow-sm transition-all duration-300 ${connectionState === "disconnected" ? "border-stone-200/60 opacity-60" : "border-stone-200/80 hover:shadow-md hover:border-stone-300/80"}`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 shadow-sm group-hover:shadow transition-shadow">
              <Code2 size={16} className="text-indigo-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-stone-900">Integration Snippet</h3>
              <p className="text-[11px] text-stone-400 mt-0.5">{currentSnippet.file}</p>
            </div>
          </div>
          <StatusBadge state={connectionState} />
        </div>
        
        {/* Framework Carousel */}
        <div className="relative mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const idx = frameworks.findIndex((f) => f.id === framework);
                setFramework(frameworks[(idx - 1 + frameworks.length) % frameworks.length].id);
              }}
              className="shrink-0 p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            
            {/* Sliding container */}
            <div className="flex-1 overflow-hidden">
              <motion.div 
                className="flex gap-1 p-1 bg-stone-100/80 rounded-xl"
                animate={{ x: `-${frameworks.findIndex((f) => f.id === framework) * (100 / 3)}%` }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                style={{ width: `${(frameworks.length / 3) * 100}%` }}
              >
                {frameworks.map((fw) => (
                  <button
                    key={fw.id}
                    onClick={() => setFramework(fw.id)}
                    style={{ width: `${100 / frameworks.length}%` }}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                      framework === fw.id
                        ? "bg-white text-stone-900 shadow-sm ring-1 ring-stone-200/50"
                        : "text-stone-500 hover:text-stone-700 hover:bg-white/50"
                    }`}
                  >
                    <span className="text-base">{fw.icon}</span>
                    <span>{fw.label}</span>
                  </button>
                ))}
              </motion.div>
            </div>

            <button
              onClick={() => {
                const idx = frameworks.findIndex((f) => f.id === framework);
                setFramework(frameworks[(idx + 1) % frameworks.length].id);
              }}
              className="shrink-0 p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          
          {/* Progress indicator */}
          <div className="flex justify-center gap-1.5 mt-3">
            {frameworks.map((fw) => (
              <button
                key={fw.id}
                onClick={() => setFramework(fw.id)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  framework === fw.id 
                    ? "w-6 bg-indigo-500" 
                    : "w-1.5 bg-stone-300 hover:bg-stone-400"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Code Block */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={framework}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="rounded-xl border border-stone-200/80 bg-gradient-to-br from-stone-900 to-stone-800 p-4 pr-16"
            >
              <pre className="overflow-x-auto text-xs font-mono text-stone-300 leading-relaxed whitespace-pre-wrap break-all">
                {currentSnippet.code}
              </pre>
            </motion.div>
          </AnimatePresence>
          <button
            onClick={() => copyToClipboard(currentSnippet.code, setCopiedScript)}
            className="absolute top-3 right-3 flex items-center gap-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-white/20 active:scale-95"
          >
            {copiedScript ? <><Check size={12} className="text-emerald-500" /> Copied!</> : <><Copy size={12} /> Copy</>}
          </button>
        </div>
      </motion.div>

      {/* API Endpoint */}
      <motion.div 
        custom={2}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className={`group rounded-2xl border bg-white p-5 shadow-sm transition-all duration-300 ${connectionState === "disconnected" ? "border-stone-200/60 opacity-60" : "border-stone-200/80 hover:shadow-md hover:border-stone-300/80"}`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 shadow-sm group-hover:shadow transition-shadow">
              <Terminal size={16} className="text-emerald-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-stone-900">API Endpoint</h3>
              <p className="text-[11px] text-stone-400 mt-0.5">Query mode directly</p>
            </div>
          </div>
          <StatusBadge state={connectionState} />
        </div>
        <div className="relative">
          <div className="rounded-xl border border-stone-200/80 bg-gradient-to-r from-stone-50 to-stone-100/50 p-4 pr-20">
            <div className="flex items-start gap-2">
              <span className="shrink-0 rounded-md bg-gradient-to-r from-emerald-100 to-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 tracking-wide shadow-sm">
                GET
              </span>
              <pre className="overflow-x-auto text-xs font-mono text-stone-600 leading-relaxed whitespace-pre-wrap break-all">
                {apiEndpoint}
              </pre>
            </div>
          </div>
          <button
            onClick={() => copyToClipboard(apiEndpoint, setCopiedApi)}
            className="absolute top-3 right-3 flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-500 transition-all hover:border-indigo-300 hover:text-indigo-600 hover:shadow-sm active:scale-95"
          >
            {copiedApi ? <><Check size={12} className="text-emerald-500" /> Copied!</> : <><Copy size={12} /> Copy</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
