import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#F5F7FA",
          raised: "#FFFFFF",
          sunken: "#EDF1F5",
        },
        ink: {
          DEFAULT: "#152233",
          muted: "#5A6B7D",
          subtle: "#8B99A8",
          faint: "#CBD3DB",
        },
        accent: {
          50: "#EEF3FA",
          100: "#D7E3F3",
          200: "#B0C7E8",
          300: "#82A5D6",
          400: "#5581BF",
          500: "#33619F",
          600: "#1E4D8C",
          700: "#173C6E",
          800: "#132F57",
          900: "#0F2444",
          DEFAULT: "#1E4D8C",
        },
        risk: {
          none: { bg: "#F3F4F6", fg: "#4B5563", dot: "#9CA3AF" },
          low: { bg: "#FEF7E6", fg: "#92660A", dot: "#D97706" },
          medium: { bg: "#FDEFE3", fg: "#9A4F1A", dot: "#EA580C" },
          high: { bg: "#FEF3EE", fg: "#7C2D12", dot: "#C2410C" },
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
        serif: ['"PT Serif"', "ui-serif", "Georgia", "serif"],
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
        xl: "8px",
        "2xl": "10px",
        "3xl": "12px",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(16, 24, 40, 0.05)",
        card: "0 1px 2px rgba(16, 24, 40, 0.05), 0 1px 0 rgba(16, 24, 40, 0.04)",
        raised: "0 2px 4px -2px rgba(16, 24, 40, 0.06), 0 4px 10px -6px rgba(16, 24, 40, 0.08)",
        focus: "0 0 0 3px rgba(30, 77, 140, 0.18)",
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
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.96) translateY(4px)" },
          to: { opacity: "1", transform: "scale(1) translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fadeIn 200ms ease-out",
        "pulse-soft": "pulseSoft 1.8s ease-in-out infinite",
        "scale-in": "scaleIn 220ms cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
} satisfies Config;
