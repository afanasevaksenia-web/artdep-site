import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes } from "react";

export function Button({
  className,
  variant = "solid",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "solid" | "ghost" | "line" }) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition-colors duration-200",
        variant === "solid" && "bg-accent text-bg hover:bg-accent/90",
        variant === "ghost" && "bg-transparent text-fg hover:bg-card",
        variant === "line" && "border border-line bg-card text-fg hover:border-accent/40",
        className,
      )}
      {...props}
    />
  );
}
