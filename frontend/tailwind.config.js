/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./pages/**/*.html",
    "./js/**/*.js",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          900: "#0a2b4d",
          800: "#0f3a66",
          700: "#155189",
          500: "#1c6dc4",
          400: "#2f8ae0",
          300: "#6fb4ee",
          200: "#b7dcfb",
        },
        surface: {
          900: "#f4f7fb",
          800: "#ffffff",
          700: "#eef2f8",
          600: "#e2e8f2",
          500: "#cfd8e6",
        },
        ink: {
          100: "#16233a",
          300: "#55627a",
          500: "#8895a8",
        },
        danger: "#d93b52",
        warning: "#c98a1f",
        success: "#1f9d63",
        border: {
          DEFAULT: "#dfe5ef",
          light: "#c9d3e2",
        },
      },
      fontFamily: {
        display: ["Sora", "Segoe UI", "system-ui", "sans-serif"],
        body: ["Inter", "Segoe UI", "system-ui", "sans-serif"],
        logo: ["Baloo 2", "Sora", "Segoe UI", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 10px rgba(20, 40, 70, 0.08)",
        "card-hover": "0 16px 36px rgba(20, 40, 70, 0.16)",
        glow: "0 0 0 1px rgba(47, 138, 224, 0.25), 0 8px 24px rgba(47, 138, 224, 0.18)",
        "inner-top": "inset 0 1px 0 rgba(255,255,255,0.6)",
      },
      backgroundImage: {
        "brand-radial": "radial-gradient(120% 120% at 10% 0%, rgba(47,138,224,0.12) 0%, rgba(244,247,251,0) 55%)",
        "brand-gradient": "linear-gradient(135deg, #1c6dc4 0%, #0a2b4d 100%)",
        "card-sheen": "linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 100%)",
        shimmer: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0) 100%)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-down": {
          from: { opacity: "0", transform: "translateY(-8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        spin: {
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease both",
        "fade-in-up": "fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in-down": "fade-in-down 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        "scale-in": "scale-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
        shimmer: "shimmer 1.6s ease-in-out infinite",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        float: "float 4s ease-in-out infinite",
        "spin-fast": "spin 0.6s linear infinite",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
