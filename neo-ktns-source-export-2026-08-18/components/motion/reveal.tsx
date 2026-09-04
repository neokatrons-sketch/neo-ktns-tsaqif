import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "right" | "left" | "none";
  distance?: number;
  duration?: number;
  variant?: "default" | "scale" | "image";
};

export function Reveal({
  children,
  className,
  delay = 0,
  direction = "up",
  distance = 20,
  duration = 620,
  variant = "default",
}: RevealProps) {
  const style = {
    "--motion-delay": `${delay}ms`,
    "--motion-distance": `${distance}px`,
    "--motion-duration": `${duration}ms`,
  } as CSSProperties;

  return (
    <div
      className={cn(className)}
      data-motion-direction={direction}
      data-motion-variant={variant}
      data-reveal
      style={style}
    >
      {children}
    </div>
  );
}
