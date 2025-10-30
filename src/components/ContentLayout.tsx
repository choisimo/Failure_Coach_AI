import { cn } from "@/lib/utils";
import type { PropsWithChildren } from "react";

interface ContentLayoutProps {
  className?: string;
}

export function ContentLayout({ className, children }: PropsWithChildren<ContentLayoutProps>) {
  return (
    <div className={cn("w-full max-w-5xl mx-auto px-4 sm:px-6", className)}>
      {children}
    </div>
  );
}
