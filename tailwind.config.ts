import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        /* PRD text + semantic tokens */
        "text-primary": "hsl(var(--text-primary))",
        "text-body": "hsl(var(--text-body))",
        "text-secondary": "hsl(var(--text-secondary))",
        "text-muted": "hsl(var(--text-muted))",
        "link-default": "hsl(var(--link-default))",
        /* Callout */
        "callout-info-bg": "hsl(var(--callout-info-bg))",
        "callout-info-border": "hsl(var(--callout-info-border))",
        "callout-success-bg": "hsl(var(--callout-success-bg))",
        "callout-success-border": "hsl(var(--callout-success-border))",
        "callout-warning-bg": "hsl(var(--callout-warning-bg))",
        "callout-warning-border": "hsl(var(--callout-warning-border))",
        "callout-danger-bg": "hsl(var(--callout-danger-bg))",
        "callout-danger-border": "hsl(var(--callout-danger-border))",
        /* Table */
        "table-header-bg": "hsl(var(--table-header-bg))",
        "table-row-bg": "hsl(var(--table-row-bg))",
        "table-row-alt-bg": "hsl(var(--table-row-alt-bg))",
        "table-row-hover-bg": "hsl(var(--table-row-hover-bg))",
        /* Tag */
        "tag-info-bg": "hsl(var(--tag-info-bg))",
        "tag-info-text": "hsl(var(--tag-info-text))",
        "tag-success-bg": "hsl(var(--tag-success-bg))",
        "tag-success-text": "hsl(var(--tag-success-text))",
        "tag-warning-bg": "hsl(var(--tag-warning-bg))",
        "tag-warning-text": "hsl(var(--tag-warning-text))",
        "tag-danger-bg": "hsl(var(--tag-danger-bg))",
        "tag-danger-text": "hsl(var(--tag-danger-text))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-left": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
        "typing": {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in-left": "slide-in-left 0.3s ease-out",
        "typing": "typing 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
