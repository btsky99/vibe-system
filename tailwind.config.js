/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        vibe: {
          primary: '#3B82F6',
          secondary: '#8B5CF6',
          dark: '#1F2937',
          light: '#F9FAFB',
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
        },
        terminal: {
          bg: '#0F172A',
          text: '#E2E8F0',
          cursor: '#3B82F6',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'bounce-slow': 'bounce 2s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}