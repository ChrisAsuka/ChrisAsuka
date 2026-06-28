/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1.5rem",
        lg: "3rem",
      },
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1a1f36",
          light: "#2d3561",
          dark: "#0f1325",
        },
        accent: {
          DEFAULT: "#d4af37",
          light: "#f5e6c0",
          dark: "#b8941f",
        },
        background: "#f5f6f8",
        surface: "#ffffff",
        success: "#10b981",
        warning: "#f59e0b",
        danger: "#ef4444",
        muted: "#6b7280",
      },
      fontFamily: {
        display: ['"Playfair Display"', "serif"],
        sans: ['"Noto Sans SC"', "sans-serif"],
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, #d4af37 0%, #f5e6c0 50%, #d4af37 100%)",
        "navy-gradient": "linear-gradient(135deg, #1a1f36 0%, #2d3561 100%)",
        "glass-light": "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
      },
      boxShadow: {
        "gold-glow": "0 0 20px rgba(212, 175, 55, 0.3)",
        "card": "0 4px 24px rgba(26, 31, 54, 0.08)",
        "card-hover": "0 8px 32px rgba(26, 31, 54, 0.12)",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(212, 175, 55, 0.3)" },
          "50%": { boxShadow: "0 0 30px rgba(212, 175, 55, 0.5)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.5s ease-out forwards",
        "shimmer": "shimmer 2s linear infinite",
        "glow": "glow 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
