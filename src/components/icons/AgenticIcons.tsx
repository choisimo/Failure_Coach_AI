import type { SVGProps } from "react";
import { cn } from "@/lib/utils";

type IconProps = SVGProps<SVGSVGElement>;

const baseProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
} as const;

export const MindMirrorMark = ({ className, ...props }: IconProps) => (
  <svg {...baseProps} className={cn("h-5 w-5", className)} {...props}>
    <defs>
      <linearGradient id="mindMirrorGradient" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
        <stop stopColor="currentColor" stopOpacity="0.95" />
        <stop offset="1" stopColor="currentColor" stopOpacity="0.6" />
      </linearGradient>
    </defs>
    <rect x="3" y="3" width="18" height="18" rx="5" stroke="url(#mindMirrorGradient)" strokeWidth="1.5" />
    <path d="M8.8 12C8.8 9.35 10.62 7.4 12.95 7.4C15.28 7.4 17.1 9.35 17.1 12C17.1 14.65 15.28 16.6 12.95 16.6C10.62 16.6 8.8 14.65 8.8 12Z" stroke="currentColor" strokeOpacity="0.85" strokeWidth="1.3" />
    <path d="M12.2 9.2L12.8 10.7L14.35 11.25L12.8 11.85L12.2 13.35L11.65 11.85L10.1 11.25L11.65 10.7L12.2 9.2Z" fill="currentColor" />
    <path d="M8 17.4L9 15.8" stroke="currentColor" strokeOpacity="0.75" strokeWidth="1.3" strokeLinecap="round" />
    <path d="M16 17.4L15 15.8" stroke="currentColor" strokeOpacity="0.75" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

export const DialogOrbitIcon = ({ className, ...props }: IconProps) => (
  <svg {...baseProps} className={cn("h-5 w-5", className)} {...props}>
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.35" />
    <ellipse cx="12" cy="12" rx="8" ry="4.25" stroke="currentColor" strokeWidth="1.4" />
    <path d="M7.2 9.6V14.7C7.2 15.8 8.1 16.7 9.2 16.7H14.8C15.9 16.7 16.8 15.8 16.8 14.7V9.6C16.8 8.5 15.9 7.6 14.8 7.6H9.2C8.1 7.6 7.2 8.5 7.2 9.6Z" stroke="currentColor" strokeWidth="1.4" />
    <path d="M9.4 11H14.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M9.4 13.3H12.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

export const InsightPrismIcon = ({ className, ...props }: IconProps) => (
  <svg {...baseProps} className={cn("h-5 w-5", className)} {...props}>
    <path d="M12 3.5L4.2 8V16L12 20.5L19.8 16V8L12 3.5Z" stroke="currentColor" strokeWidth="1.5" />
    <path d="M12 3.5V12.1L19.8 8" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.8" />
    <path d="M12 12.1L4.2 8" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.8" />
    <path d="M12 12.1V20.5" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.8" />
    <circle cx="12" cy="12.1" r="1.2" fill="currentColor" />
  </svg>
);

export const PromptCircuitIcon = ({ className, ...props }: IconProps) => (
  <svg {...baseProps} className={cn("h-5 w-5", className)} {...props}>
    <rect x="4" y="4" width="16" height="16" rx="4.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8.3 8.3H15.7V15.7H8.3V8.3Z" stroke="currentColor" strokeWidth="1.4" strokeOpacity="0.9" />
    <path d="M12 8.3V6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M12 18V15.7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M8.3 12H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M18 12H15.7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="12" cy="12" r="1.25" fill="currentColor" />
  </svg>
);

export const WorkspaceStackIcon = ({ className, ...props }: IconProps) => (
  <svg {...baseProps} className={cn("h-5 w-5", className)} {...props}>
    <path d="M5 7.3C5 6.58 5.58 6 6.3 6H14.2L18.2 9.9V16.7C18.2 17.42 17.62 18 16.9 18H6.3C5.58 18 5 17.42 5 16.7V7.3Z" stroke="currentColor" strokeWidth="1.5" />
    <path d="M14.2 6V8.9C14.2 9.45 14.65 9.9 15.2 9.9H18.2" stroke="currentColor" strokeWidth="1.5" />
    <rect x="8" y="4" width="11" height="14" rx="2.2" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.35" />
    <path d="M8.8 12.4H14.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

export const FlowBranchIcon = ({ className, ...props }: IconProps) => (
  <svg {...baseProps} className={cn("h-5 w-5", className)} {...props}>
    <circle cx="6.6" cy="6.6" r="2.2" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="17.4" cy="9.3" r="2.2" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="12" cy="17.4" r="2.2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8.8 7.1L15.2 8.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M7.8 8.5L10.8 15.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M16.1 11.1L13.4 15.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

export const CloseGlyphIcon = ({ className, ...props }: IconProps) => (
  <svg {...baseProps} className={cn("h-4 w-4", className)} {...props}>
    <path d="M7.5 7.5L16.5 16.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    <path d="M16.5 7.5L7.5 16.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
  </svg>
);

export const GuidedPathIcon = ({ className, ...props }: IconProps) => (
  <svg {...baseProps} className={cn("h-5 w-5", className)} {...props}>
    <rect x="4" y="4" width="16" height="16" rx="4" stroke="currentColor" strokeWidth="1.5" />
    <path d="M7.8 15.3C9.2 13.1 10.8 12 12.4 12C14 12 15.3 12.9 16.2 14.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="9" cy="9" r="1.5" fill="currentColor" />
    <circle cx="15.4" cy="10.1" r="1.35" stroke="currentColor" strokeWidth="1.3" />
    <path d="M11.7 8.2L14 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

export const PersonaForgeIcon = ({ className, ...props }: IconProps) => (
  <svg {...baseProps} className={cn("h-5 w-5", className)} {...props}>
    <path d="M12 3.8L19.2 8.2V15.8L12 20.2L4.8 15.8V8.2L12 3.8Z" stroke="currentColor" strokeWidth="1.5" />
    <path d="M12 7.2V16.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M8.4 9.1L15.6 13.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M15.6 9.1L8.4 13.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" />
  </svg>
);

export const SidebarSplitIcon = ({ className, ...props }: IconProps) => (
  <svg {...baseProps} className={cn("h-4 w-4", className)} {...props}>
    <rect x="3.8" y="5" width="16.4" height="14" rx="2.6" stroke="currentColor" strokeWidth="1.5" />
    <path d="M9.2 5V19" stroke="currentColor" strokeWidth="1.4" />
    <path d="M11.6 9.2L13.9 12L11.6 14.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
