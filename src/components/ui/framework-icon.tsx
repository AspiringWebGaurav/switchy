"use client";

interface FrameworkIconProps {
  svg: string;
  hex: string;
  size?: number;
  className?: string;
}

export function FrameworkIcon({ svg, hex, size = 16, className = "" }: FrameworkIconProps) {
  // Add fill color to SVG
  const coloredSvg = svg.replace('<svg', `<svg fill="#${hex}"`);
  
  return (
    <span
      className={`inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: coloredSvg }}
    />
  );
}
