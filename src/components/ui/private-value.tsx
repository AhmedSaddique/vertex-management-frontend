"use client";

import { cn } from "@/lib/utils";

/**
 * Hides a figure behind a blur until it is revealed, so amounts are not readable by
 * someone glancing at the screen. The content stays in the DOM, this is a privacy
 * screen rather than a permission check.
 */
export function PrivateValue({
  hidden,
  children,
  className,
}: {
  hidden: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block transition-[filter] duration-150",
        hidden && "pointer-events-none select-none blur-[6px]",
        className,
      )}
    >
      {children}
    </span>
  );
}
