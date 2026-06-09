/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#F5F3FF",
          100: "#EDE9FE",
          200: "#DDD6FE",
          300: "#C4B5FD",
          400: "#A78BFA",
          500: "#8B5CF6",
          600: "#7C3AED",
          700: "#6D28D9",
          800: "#5B21B6",
          900: "#4C1D95",
        },
        study: {
          ink: "#18233d",
          muted: "#65708f",
          purple: "#6b45d9",
          violet: "#8e62f4",
          lavender: "#f0ebff",
          gold: "#f3a400",
          flame: "#ff6334",
          success: "#37b487",
        },
      },
      boxShadow: {
        soft: "0 18px 45px rgba(58, 65, 105, 0.09)",
        card: "0 18px 45px rgba(58, 65, 105, 0.09)",
        lift: "0 14px 28px rgba(107, 69, 217, 0.22)",
      },
      borderRadius: {
        card: "22px",
      },
    },
  },
  plugins: [],
};
