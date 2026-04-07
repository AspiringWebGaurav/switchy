"use client";

import { useEffect, useCallback, useRef } from "react";
import type { ModeValue, ModeConfig } from "@/types/policy";

export interface ModeBroadcastMessage {
  type: "mode_change";
  projectId: string;
  mode: ModeValue;
  config: ModeConfig;
  version: number;
  source: string; // Tab ID to prevent echo
}

const CHANNEL_NAME = "switchy-mode-sync";

let tabId: string | null = null;
function getTabId(): string {
  if (tabId) return tabId;
  tabId = `tab-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return tabId;
}

export function useBroadcastChannel(
  projectId: string,
  onMessage: (msg: ModeBroadcastMessage) => void
) {
  const channelRef = useRef<BroadcastChannel | null>(null);
  const currentTabId = getTabId();

  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) {
      return;
    }

    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;

    channel.onmessage = (event: MessageEvent<ModeBroadcastMessage>) => {
      const msg = event.data;
      // Ignore messages from this tab or for different projects
      if (msg.source === currentTabId || msg.projectId !== projectId) {
        return;
      }
      onMessage(msg);
    };

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [projectId, onMessage, currentTabId]);

  const broadcast = useCallback(
    (mode: ModeValue, config: ModeConfig, version: number) => {
      if (!channelRef.current) return;

      const msg: ModeBroadcastMessage = {
        type: "mode_change",
        projectId,
        mode,
        config,
        version,
        source: currentTabId,
      };

      channelRef.current.postMessage(msg);
    },
    [projectId, currentTabId]
  );

  return { broadcast };
}
