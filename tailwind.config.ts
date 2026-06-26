import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#0f0f14',
          panel: '#16161e',
          card: '#1e1e2a',
          border: '#2a2a3a',
          accent: '#6c63ff',
          accentHover: '#857dff',
          gold: '#f0a500',
          text: '#e8e8f0',
          muted: '#8888a8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
