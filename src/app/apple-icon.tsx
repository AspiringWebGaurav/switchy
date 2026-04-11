import { ImageResponse } from 'next/og'

// Image metadata
export const size = {
  width: 180,
  height: 180,
}
export const contentType = 'image/png'

// Image generation
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(to bottom right, #6366f1, #8b5cf6)',
          position: 'relative'
        }}
      >
        <svg fill="none" viewBox="0 0 32 32" height="100%" width="100%" style={{ position: 'absolute' }}>
          <rect x="7" y="12" width="18" height="8" rx="4" fill="rgba(255,255,255,0.3)" />
          <circle cx="21" cy="16" r="3" fill="#fff" />
          <path d="M14 7L12 13h2l-1.5 6 4-5.5h-2L16 7z" fill="#fff" fillOpacity="0.9" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
