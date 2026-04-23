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
        primary: '#E87F24',
        accent: '#73A5CA',
        warning: '#FFC81E',
        danger: '#ef4444',
        neutral: '#FEFDDF',
        surface: '#FFFFFF',
        border: 'rgba(232, 127, 36, 0.15)',
        'text-main': '#1A1A1A',
        'text-muted': '#5C5C5C',
      },
    },
  },
  plugins: [],
};
export default config;
