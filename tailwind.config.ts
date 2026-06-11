import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: '#FFFFFF',
        ink: '#1B1F23',
        rule: '#D6D9DD',
        series: '#2A5DB0',
        good: '#1E7F4F',
        bad: '#B3261E',
        recession: '#EFF1F3',
      },
      fontFamily: {
        sans: ['var(--font-public-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-ibm-plex-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
