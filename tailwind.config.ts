import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Sistema de color oscuro — fondos tomados de la referencia (verde bosque + negro cálido)
        ink: {
          DEFAULT: "#F1F2EC", // texto principal: claro, sobre fondo oscuro
          soft: "#A6A795",
          faint: "#6E705F",
        },
        surface: {
          DEFAULT: "#1E1F19", // tarjetas
          base: "#121309", // fondo general de la app: negro cálido
          raised: "#262719", // variante un poco más clara, para elementos elevados sobre una tarjeta
          line: "#33342A", // divisores sutiles sobre fondo oscuro
        },
        brand: {
          DEFAULT: "#1B3A2E", // verde bosque oscuro — bloques sólidos / CTAs (antes bg-ink)
          soft: "#15281F",
        },
        accent: {
          DEFAULT: "#1FBE82", // verde esmeralda, un poco más vivo para contrastar en fondo oscuro
          soft: "#15392B", // tinte oscuro (no pastel) para chips/badges en dark mode
          dark: "#0B7F57",
        },
        expense: {
          DEFAULT: "#EF5A4E", // rojo coral, ligeramente más claro para contraste en oscuro
          soft: "#3B1E1A",
        },
        gold: {
          DEFAULT: "#E0B354",
          soft: "#3A2E15",
        },
        balance: {
          positive: "#2DD4BF", // verde azulado (teal) — distinto del verde esmeralda de ingresos
          negative: "#E0814F", // naranja quemado — distinto del rojo coral de gastos
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "Inter",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        display: [
          "-apple-system",
          "SF Pro Display",
          "BlinkMacSystemFont",
          "Inter",
          "Segoe UI",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SF Mono",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },
      borderRadius: {
        ios: "22px",
        "ios-lg": "28px",
      },
      boxShadow: {
        card: "0 1px 0 rgba(255, 255, 255, 0.03) inset, 0 6px 16px -6px rgba(0, 0, 0, 0.5)",
        fab: "0 10px 24px -6px rgba(31, 190, 130, 0.5), 0 2px 10px rgba(0, 0, 0, 0.45)",
        tabbar: "0 -1px 0 rgba(255, 255, 255, 0.04)",
      },
      transitionTimingFunction: {
        ios: "cubic-bezier(0.25, 0.1, 0.25, 1)",
      },
      keyframes: {
        "pop-in": {
          "0%": { transform: "scale(0.5)", opacity: "0" },
          "60%": { transform: "scale(1.06)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "fade-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        "slide-up": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
      },
      animation: {
        "tap-scale": "tap-scale 0.18s ease-out",
        "pop-in": "pop-in 0.4s cubic-bezier(0.25, 0.1, 0.25, 1) forwards",
        "fade-out": "fade-out 0.3s ease-out forwards",
        "slide-up": "slide-up 0.28s cubic-bezier(0.25, 0.1, 0.25, 1) forwards",
      },
    },
  },
  plugins: [],
};

export default config;
