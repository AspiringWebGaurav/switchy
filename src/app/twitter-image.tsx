import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/config/seo";

export const runtime = "edge";
export const alt = SITE_NAME;
export const size = { width: 1200, height: 600 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 32,
          }}
        >
          <svg width="72" height="72" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="6" fill="rgba(255,255,255,0.2)" />
            <rect x="7" y="12" width="18" height="8" rx="4" fill="rgba(255,255,255,0.4)" />
            <circle cx="21" cy="16" r="3" fill="#fff" />
            <path d="M14 7L12 13h2l-1.5 6 4-5.5h-2L16 7z" fill="#fff" opacity="0.9" />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            fontSize: 56,
            fontWeight: 800,
            color: "white",
            textAlign: "center",
            letterSpacing: "-0.02em",
            marginBottom: 12,
          }}
        >
          {SITE_NAME}
        </div>

        {/* Tagline */}
        <div
          style={{
            display: "flex",
            fontSize: 24,
            color: "rgba(255,255,255,0.9)",
            textAlign: "center",
            maxWidth: 700,
          }}
        >
          Real-time Mode Control for Your Apps
        </div>
      </div>
    ),
    { ...size }
  );
}
