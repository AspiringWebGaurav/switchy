"use client";

import type { ModeConfig } from "@/types/policy";

interface CustomConfigProps {
  config: ModeConfig;
  onChange: (config: ModeConfig) => void;
  disabled?: boolean;
}

export function CustomConfig({ config, onChange, disabled }: CustomConfigProps) {
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
            type="url"
            value={config.redirectUrl || ""}
            onChange={(e) =>
              onChange({ ...config, redirectUrl: e.target.value || null })
            }
            disabled={disabled}
            placeholder="https://..."
            className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-colors focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100 disabled:opacity-50"
          />
        </div>
      </div>
    </div>
  );
}
