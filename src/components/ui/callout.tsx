import * as React from "react";
import { cn } from "@/lib/utils";

export type CalloutType = "info" | "success" | "warning" | "danger";

export interface CalloutProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: CalloutType;
  title?: string;
  icon?: React.ReactNode;
}

const DEFAULT_ICONS: Record<CalloutType, React.ReactNode> = {
  info: "ℹ️",
  success: "✔",
  warning: "⚠",
  danger: "⛔",
};

export const Callout = React.forwardRef<HTMLDivElement, CalloutProps>(
  ({ type = "info", title, icon, className, children, ...props }, ref) => {
    const colorBase = {
      info: {
        bg: "bg-[hsl(var(--callout-info-bg))]",
        border: "border-[hsl(var(--callout-info-border))]",
        text: "text-[hsl(var(--text-body))]",
      },
      success: {
        bg: "bg-[hsl(var(--callout-success-bg))]",
        border: "border-[hsl(var(--callout-success-border))]",
        text: "text-[hsl(var(--text-body))]",
      },
      warning: {
        bg: "bg-[hsl(var(--callout-warning-bg))]",
        border: "border-[hsl(var(--callout-warning-border))]",
        text: "text-[hsl(var(--text-body))]",
      },
      danger: {
        bg: "bg-[hsl(var(--callout-danger-bg))]",
        border: "border-[hsl(var(--callout-danger-border))]",
        text: "text-[hsl(var(--text-body))]",
      },
    }[type];

    return (
      <div
        ref={ref}
        role="note"
        className={cn(
          "relative flex gap-3 rounded-md border-l-4 p-4",
          colorBase.bg,
          colorBase.text,
          // left border color via pseudo element is not supported in Tailwind, use inline style with box-shadow or border
          className,
        )}
        style={{ borderLeftColor: "hsl(var(--callout-" + type + "-border))" }}
        {...props}
      >
        <div className="mt-0.5 text-base" aria-hidden>
          {icon ?? DEFAULT_ICONS[type]}
        </div>
        <div className="min-w-0">
          {title ? (
            <div className="typo-body font-semibold text-[16px] leading-6">
              {title}
            </div>
          ) : null}
          <div className="typo-caption text-[14px] leading-6">
            {children}
          </div>
        </div>
      </div>
    );
  },
);
Callout.displayName = "Callout";
