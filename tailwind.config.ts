import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{tsx,ts,html}', './src/newtab/index.html', './src/settings/index.html'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        obs: {
          base:    '#0D1117',
          surface: '#161B22',
          raised:  '#1C2128',
          border:  '#30363D',
          muted:   '#21262D',
        },
      },
    },
  },
  plugins: [],
}

export default config
