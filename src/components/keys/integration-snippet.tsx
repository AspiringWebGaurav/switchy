"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Code2, ChevronLeft, ChevronRight } from "lucide-react";
import { CopyButton } from "@/components/ui/copy-button";
import { ConnectionBadge, ConnectionState } from "@/components/ui/status-badge";

type Framework = "html" | "react" | "nextjs" | "vue" | "angular" | "svelte";

const frameworks: { id: Framework; label: string; icon: string }[] = [
  { id: "html", label: "HTML", icon: "🌐" },
  { id: "react", label: "React", icon: "⚛️" },
  { id: "nextjs", label: "Next.js", icon: "▲" },
  { id: "vue", label: "Vue", icon: "💚" },
  { id: "angular", label: "Angular", icon: "🅰️" },
  { id: "svelte", label: "Svelte", icon: "🔥" },
];

function highlightCode(code: string): React.ReactNode[] {
  const lines = code.split("\n");
  return lines.map((line, i) => {
    const parts: React.ReactNode[] = [];
    let remaining = line;
    let key = 0;

    while (remaining.length > 0) {
      if (remaining.startsWith("<!--")) {
        const end = remaining.indexOf("-->");
        if (end !== -1) {
          parts.push(<span key={key++} className="text-zinc-500">{remaining.slice(0, end + 3)}</span>);
          remaining = remaining.slice(end + 3);
          continue;
        }
      }
      if (remaining.startsWith("//")) {
        parts.push(<span key={key++} className="text-zinc-500">{remaining}</span>);
        break;
      }
      const strMatch = remaining.match(/^("[^"]*"|'[^']*'|`[^`]*`)/);
      if (strMatch) {
        parts.push(<span key={key++} className="text-emerald-400">{strMatch[0]}</span>);
        remaining = remaining.slice(strMatch[0].length);
        continue;
      }
      const tagMatch = remaining.match(/^(<\/?)([\w]+)/);
      if (tagMatch) {
        parts.push(<span key={key++} className="text-zinc-500">{tagMatch[1]}</span>);
        parts.push(<span key={key++} className="text-rose-400">{tagMatch[2]}</span>);
        remaining = remaining.slice(tagMatch[0].length);
        continue;
      }
      if (remaining.startsWith("/>") || remaining.startsWith(">")) {
        const br = remaining.startsWith("/>") ? "/>" : ">";
        parts.push(<span key={key++} className="text-zinc-500">{br}</span>);
        remaining = remaining.slice(br.length);
        continue;
      }
      const attrMatch = remaining.match(/^(\s*)([\w]+)(=)/);
      if (attrMatch) {
        parts.push(<span key={key++}>{attrMatch[1]}</span>);
        parts.push(<span key={key++} className="text-violet-400">{attrMatch[2]}</span>);
        parts.push(<span key={key++} className="text-zinc-500">{attrMatch[3]}</span>);
        remaining = remaining.slice(attrMatch[0].length);
        continue;
      }
      const kwMatch = remaining.match(/^\b(import|from|export|default|const|function|return)\b/);
      if (kwMatch) {
        parts.push(<span key={key++} className="text-purple-400">{kwMatch[0]}</span>);
        remaining = remaining.slice(kwMatch[0].length);
        continue;
      }
      if ("{}".includes(remaining[0])) {
        parts.push(<span key={key++} className="text-amber-400">{remaining[0]}</span>);
        remaining = remaining.slice(1);
        continue;
      }
      parts.push(<span key={key++}>{remaining[0]}</span>);
      remaining = remaining.slice(1);
    }
    return <div key={i}>{parts.length > 0 ? parts : " "}</div>;
  });
}

interface IntegrationSnippetProps {
  projectId: string;
  publicKey: string;
  connectionState: ConnectionState;
}

export function IntegrationSnippet({ projectId, publicKey, connectionState }: IntegrationSnippetProps) {
  const [appUrl, setAppUrl] = useState("");
  const [framework, setFramework] = useState<Framework>("html");
  const [isHovered, setIsHovered] = useState(false);
  const autoSlideRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setAppUrl(window.location.origin);
  }, []);

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
    }, 4000);
    return () => {
      if (autoSlideRef.current) clearInterval(autoSlideRef.current);
    };
  }, [isHovered]);

  const scriptUrl = `${appUrl}/switchy.js?key=${publicKey}&project=${projectId}`;

  const snippets: Record<Framework, { code: string; file: string }> = {
    html: {
      file: "index.html",
      code: `<!-- Switchyy: Add to <head> -->\n<script src="${scriptUrl}"></script>`,
    },
    react: {
      file: "public/index.html",
      code: `<!-- Switchyy: Add to <head> -->\n<script src="${scriptUrl}"></script>`,
    },
    nextjs: {
      file: "app/layout.tsx",
      code: `import Script from "next/script";

// In <head>:
<Script src="${scriptUrl}" strategy="beforeInteractive" />`,
    },
    vue: {
      file: "index.html",
      code: `<!-- Switchyy: Add to <head> -->\n<script src="${scriptUrl}"></script>`,
    },
    angular: {
      file: "src/index.html",
      code: `<!-- Switchyy: Add to <head> -->\n<script src="${scriptUrl}"></script>`,
    },
    svelte: {
      file: "app.html",
      code: `<!-- Switchyy: Add to <head> -->\n<script src="${scriptUrl}"></script>`,
    },
  };

  const currentSnippet = snippets[framework];

  const goNext = () => {
    const idx = frameworks.findIndex((f) => f.id === framework);
    setFramework(frameworks[(idx + 1) % frameworks.length].id);
  };

  const goPrev = () => {
    const idx = frameworks.findIndex((f) => f.id === framework);
    setFramework(frameworks[(idx - 1 + frameworks.length) % frameworks.length].id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`rounded-xl border bg-white p-5 transition-all ${
        connectionState === "disconnected"
          ? "border-zinc-200/60 opacity-60"
          : "border-zinc-200 hover:shadow-sm"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100">
            <Code2 size={18} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">Integration Snippet</h3>
            <p className="text-xs text-zinc-500">{currentSnippet.file}</p>
          </div>
        </div>
        <ConnectionBadge state={connectionState} />
      </div>

      {/* Framework Selector */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={goPrev}
          className="shrink-0 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex-1 flex gap-1 p-1 bg-zinc-100 rounded-lg overflow-x-auto">
          {frameworks.map((fw) => (
            <button
              key={fw.id}
              onClick={() => setFramework(fw.id)}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                framework === fw.id
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              <span>{fw.icon}</span>
              <span>{fw.label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={goNext}
          className="shrink-0 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Code Block */}
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={framework}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 pr-16"
          >
            <pre className="overflow-x-auto text-xs font-mono text-zinc-300 leading-relaxed">
              {highlightCode(currentSnippet.code)}
            </pre>
          </motion.div>
        </AnimatePresence>
        
        <div className="absolute top-3 right-3">
          <CopyButton
            value={currentSnippet.code}
            variant="ghost"
            className="bg-white/10 text-white border-white/20 hover:bg-white/20"
          />
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-1.5 mt-4">
        {frameworks.map((fw) => (
          <button
            key={fw.id}
            onClick={() => setFramework(fw.id)}
            className={`h-1.5 rounded-full transition-all ${
              framework === fw.id
                ? "w-5 bg-indigo-500"
                : "w-1.5 bg-zinc-300 hover:bg-zinc-400"
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
}
