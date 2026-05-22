import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#1e6091",
          dark: "#144d75",
          light: "#3b8acb",
        },
        risk: {
          none: "#6b7280",
          low: "#eab308",
          medium: "#ea580c",
          high: "#dc2626",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
