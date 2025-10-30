import * as React from "react";
import { cn } from "@/lib/utils";

export type TagVariant = "info" | "success" | "warning" | "danger" | "default";
export type TagSize = "sm" | "md";

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: TagVariant;
  size?: TagSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Tag = React.forwardRef<HTMLSpanElement, TagProps>(
  ({ variant = "default", size = "md", className, leftIcon, rightIcon, children, ...props }, ref) => {
    const variantClasses: Record<TagVariant, string> = {
      default: "bg-muted text-foreground/90",
      info: "bg-[hsl(var(--tag-info-bg))] text-[hsl(var(--tag-info-text))]",
      success: "bg-[hsl(var(--tag-success-bg))] text-[hsl(var(--tag-success-text))]",
      warning: "bg-[hsl(var(--tag-warning-bg))] text-[hsl(var(--tag-warning-text))]",
      danger: "bg-[hsl(var(--tag-danger-bg))] text-[hsl(var(--tag-danger-text))]",
    };

    const sizeClasses: Record<TagSize, string> = {
      sm: "text-[12px] leading-5 py-1 px-2.5",
      md: "text-[14px] leading-6 py-1.5 px-3",
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1 rounded-full font-medium",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {leftIcon ? <span aria-hidden className="text-[1em]">{leftIcon}</span> : null}
        <span className="truncate">{children}</span>
        {rightIcon ? <span aria-hidden className="text-[1em]">{rightIcon}</span> : null}
      </span>
    );
  },
);
Tag.displayName = "Tag";
