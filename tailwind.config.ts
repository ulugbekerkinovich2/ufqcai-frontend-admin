import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#FAFAF8",
          raised: "#FFFFFF",
          sunken: "#F4F4F1",
        },
        ink: {
          DEFAULT: "#1A1D21",
          muted: "#6B7280",
          subtle: "#9CA3AF",
          faint: "#D1D5DB",
        },
        accent: {
          50: "#F0FDFA",
          100: "#CCFBF1",
          200: "#99F6E4",
          300: "#5EEAD4",
          400: "#2DD4BF",
          500: "#14B8A6",
          600: "#0F766E",
          700: "#0E6660",
          800: "#115E59",
          900: "#134E4A",
          DEFAULT: "#0F766E",
        },
        risk: {
          none: { bg: "#F3F4F6", fg: "#4B5563", dot: "#9CA3AF" },
          low: { bg: "#FEF7E6", fg: "#92660A", dot: "#D97706" },
          medium: { bg: "#FDEFE3", fg: "#9A4F1A", dot: "#EA580C" },
          high: { bg: "#FDECEC", fg: "#9C2A2A", dot: "#DC2626" },
        },
      },
      fontFamily: {
        sans: [
          '"Public Sans"',
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "sans-serif",
        ],
        serif: ['"Fraunces"', "ui-serif", "Georgia", "serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      fontSize: {
        xs: ["12.5px", { lineHeight: "1.5" }],
        sm: ["13.5px", { lineHeight: "1.55" }],
        base: ["15px", { lineHeight: "1.65" }],
        lg: ["17px", { lineHeight: "1.6" }],
        xl: ["20px", { lineHeight: "1.45" }],
        "2xl": ["24px", { lineHeight: "1.35" }],
        "3xl": ["30px", { lineHeight: "1.25" }],
        "4xl": ["36px", { lineHeight: "1.2" }],
      },
      borderRadius: {
        xl: "14px",
        "2xl": "18px",
        "3xl": "22px",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(16, 24, 40, 0.04), 0 1px 3px rgba(16, 24, 40, 0.04)",
        card: "0 1px 3px rgba(16, 24, 40, 0.04), 0 6px 16px -8px rgba(16, 24, 40, 0.08)",
        raised: "0 4px 6px -2px rgba(16, 24, 40, 0.04), 0 12px 24px -8px rgba(16, 24, 40, 0.10)",
        focus: "0 0 0 4px rgba(15, 118, 110, 0.12)",
      },
      transitionDuration: {
        DEFAULT: "180ms",
      },
      transitionTimingFunction: {
        DEFAULT: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
      },
      animation: {
        "fade-in": "fadeIn 200ms ease-out",
        "pulse-soft": "pulseSoft 1.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
