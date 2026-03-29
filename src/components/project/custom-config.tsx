"use client";

import { useState, useEffect } from "react";
import type { ModeConfig } from "@/types/policy";

interface CustomConfigProps {
  config: ModeConfig;
  onChange: (config: ModeConfig) => void;
  disabled?: boolean;
}

function normalizeUrl(raw: string): { href: string | null; error: string | null } {
  if (!raw) return { href: null, error: null };
  const withScheme = /^https?:\/\//i.test(raw) ? raw : "https://" + raw;
  try {
    const url = new URL(withScheme);
    if (!url.hostname.includes(".")) return { href: null, error: "Enter a valid URL (e.g. https://example.com)" };
    return { href: url.href, error: null };
  } catch {
    return { href: null, error: "Enter a valid URL (e.g. https://example.com)" };
  }
}

export function CustomConfig({ config, onChange, disabled }: CustomConfigProps) {
  const [urlInput, setUrlInput] = useState(config.redirectUrl || "");
  const [urlError, setUrlError] = useState<string | null>(null);

  useEffect(() => {
    setUrlInput(config.redirectUrl || "");
    setUrlError(null);
  }, [config.redirectUrl]);

  function handleUrlChange(raw: string) {
    setUrlInput(raw);
    setUrlError(null);
    if (!raw) {
      onChange({ ...config, redirectUrl: null });
    }
  }

  function handleUrlBlur() {
    if (!urlInput) {
      onChange({ ...config, redirectUrl: null });
      setUrlError(null);
      return;
    }
    const { href, error } = normalizeUrl(urlInput);
    if (href) {
      setUrlInput(href);
      setUrlError(null);
      onChange({ ...config, redirectUrl: href });
    } else {
      setUrlError(error);
      onChange({ ...config, redirectUrl: null });
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">
          Message
        </label>
        <textarea
          value={config.message || ""}
          onChange={(e) =>
            onChange({ ...config, message: e.target.value || null })
          }
          disabled={disabled}
          placeholder="Enter a message for your users..."
          rows={3}
          maxLength={500}
          className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-colors focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100 disabled:opacity-50 resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">
            Button Text
            <span className="text-stone-400 font-normal ml-1">(optional)</span>
          </label>
          <input
            type="text"
            value={config.buttonText || ""}
            onChange={(e) =>
              onChange({ ...config, buttonText: e.target.value || null })
            }
            disabled={disabled}
            placeholder="e.g. Go Back"
            maxLength={100}
            className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-colors focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100 disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">
            Redirect URL
            <span className="text-stone-400 font-normal ml-1">(optional)</span>
          </label>
          <input
            type="text"
            value={urlInput}
            onChange={(e) => handleUrlChange(e.target.value)}
            onBlur={handleUrlBlur}
            disabled={disabled}
            placeholder="https://example.com"
            className={`w-full rounded-xl border bg-stone-50 px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-colors focus:bg-white focus:ring-2 disabled:opacity-50 ${
              urlError
                ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                : "border-stone-200 focus:border-indigo-300 focus:ring-indigo-100"
            }`}
          />
          {urlError && (
            <p className="mt-1 text-xs text-red-500">{urlError}</p>
          )}
        </div>
      </div>
    </div>
  );
}
