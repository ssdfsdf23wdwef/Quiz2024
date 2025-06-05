import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";
import typography from "@tailwindcss/typography";
import aspectRatio from "@tailwindcss/aspect-ratio";

const config: Config = {
  // Koyu tema desteği için `dark` class'ını kullan
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Ana tema renkleri - hem açık hem de koyu tema için kullanılabilir
        primary: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
          950: "#082f49",
        },
        secondary: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
          950: "#2e1065",
        },
        success: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
          950: "#052e16",
        },
        warning: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
          950: "#451a03",
        },
        danger: {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
          800: "#991b1b",
          900: "#7f1d1d",
          950: "#450a0a",
        },
        // Açık tema için özel renkler
        light: {
          background: "#ffffff",
          "background-secondary": "#f9fafb",
          "background-tertiary": "#f3f4f6",
          "text-primary": "#111827",
          "text-secondary": "#4b5563",
          "text-tertiary": "#9ca3af",
          border: "#e5e7eb",
          "border-focus": "#d1d5db",
        },
        // Koyu tema için özel renkler
        dark: {
          "bg-primary": "#121212",
          "bg-secondary": "#1e1e1e",
          "bg-tertiary": "#2d2d2d",
          "text-primary": "#e6e6e6",
          "text-secondary": "#a0a0a0",
          "text-tertiary": "#6b7280",
          border: "#374151",
          "border-focus": "#4b5563",
          accent: "#6366f1",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      // Duyarlı ekran boyutları
      screens: {
        xs: "475px",
        // sm, md, lg, xl default Tailwind değerleri
        "2xl": "1536px",
      },
      // Geçiş animasyonları
      transitionProperty: {
        height: "height",
        spacing: "margin, padding",
      },
      // Gölgeler
      boxShadow: {
        soft: "0 2px 15px 0 rgba(0, 0, 0, 0.05)",
        light: "0 0 10px rgba(0, 0, 0, 0.035)",
      },
    },
  },
  plugins: [forms, typography, aspectRatio],
};

export default config;
