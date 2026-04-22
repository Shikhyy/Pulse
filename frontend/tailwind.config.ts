import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        primary: '#1D9E75',
        accent: '#378ADD',
        warning: '#BA7517',
        danger: '#E24B4A',
        neutral: '#F1EFE8',
        surface: '#FFFFFF',
        border: '#E4E2DB',
        'text-main': '#2C2C2A',
        'text-muted': '#5F5E5A',
      },
    },
  },
  plugins: [],
};
export default config;
