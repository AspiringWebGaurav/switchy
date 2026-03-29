import { APP_NAME } from "@/config/constants";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const sizeMap = {
  sm: { box: "h-7 w-7", text: "text-lg" },
  md: { box: "h-8 w-8", text: "text-xl" },
  lg: { box: "h-10 w-10", text: "text-2xl" },
};

function LogoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className}>
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1"/>
          <stop offset="100%" stopColor="#8b5cf6"/>
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="6" fill="url(#logoGrad)"/>
      <rect x="7" y="12" width="18" height="8" rx="4" fill="rgba(255,255,255,0.3)"/>
      <circle cx="21" cy="16" r="3" fill="#fff"/>
      <path d="M14 7L12 13h2l-1.5 6 4-5.5h-2L16 7z" fill="#fff" opacity="0.9"/>
    </svg>
  );
}

export function Logo({ size = "md", showText = true }: LogoProps) {
  const s = sizeMap[size];
  return (
    <div className="flex items-center gap-2.5">
      <LogoIcon className={s.box} />
      {showText && (
        <span className={`font-bold tracking-tight text-stone-900 ${s.text}`}>
          {APP_NAME}
        </span>
      )}
    </div>
  );
}
