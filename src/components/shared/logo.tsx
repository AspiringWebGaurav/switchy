import { Zap } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const sizeMap = {
  sm: { icon: 16, text: "text-lg" },
  md: { icon: 20, text: "text-xl" },
  lg: { icon: 24, text: "text-2xl" },
};

export function Logo({ size = "md", showText = true }: LogoProps) {
  const s = sizeMap[size];
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500">
        <Zap size={s.icon} className="text-white" fill="currentColor" />
      </div>
      {showText && (
        <span
          className={`font-semibold tracking-tight text-stone-900 ${s.text}`}
        >
          Switchy
        </span>
      )}
    </div>
  );
}
