/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(${name}) / <alpha-value>)`
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  // Theme is set on <html data-theme="dark|light"> (see src/hooks/useTheme.js)
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Semantic, theme-aware tokens (values live in src/index.css)
        ink: { DEFAULT: v('--ink'), 1: v('--ink-1'), 2: v('--ink-2'), 3: v('--ink-3') },
        gold: { DEFAULT: v('--gold'), deep: v('--gold-deep'), soft: v('--gold-soft'), ink: v('--gold-ink') },
        cream: v('--cream'), mist: v('--mist'), muted: v('--muted'),
        wash: v('--wash'), // neutral overlay tint: white in dark mode, black in light mode
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      maxWidth: { shell: '1280px' },
    },
  },
  plugins: [],
}
