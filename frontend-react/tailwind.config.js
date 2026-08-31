/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light mode (default)
        paper: '#FFFFFF',
        ink: '#0A0A0A',
        graphite: '#4A4A4A',
        ash: '#8A8A8A',
        hairline: '#E4E4E4',
        fog: '#F7F7F7',
        // Semantic aliases
        background: 'var(--paper)',
        foreground: 'var(--ink)',
        muted: 'var(--graphite)',
        mutedForeground: 'var(--ash)',
        border: 'var(--hairline)',
        accent: 'var(--fog)',
        // Trend colors
        'trend-up': '#2d8a4e',
        'trend-down': '#c0392b',
        // Chart colors
        'chart-inflation': '#999',
        'chart-7pct': '#6baed6',
        'chart-10pct': '#74c476',
        'chart-15pct': '#fdae6b',
      },
      fontFamily: {
        sans: ['Open Sans', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['Open Sans', 'monospace'],
      },
      fontSize: {
        'eyebrow': ['10.5px', { letterSpacing: '0.11em', textTransform: 'uppercase', fontWeight: '600' }],
        'nav-link': ['12.5px', { letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: '600' }],
        'btn': ['12.5px', { letterSpacing: '0.07em', textTransform: 'uppercase', fontWeight: '600' }],
        'btn-sm': ['11px', { letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: '600' }],
        'card-title': ['11px', { letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: '500' }],
        'table-th': ['11px', { letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: '500' }],
        'table-td': ['13.5px', { lineHeight: '1' }],
        'rec-sym': ['12px', { letterSpacing: '0.04em', fontWeight: '600' }],
        'rec-name': ['13px', { lineHeight: '1' }],
        'rec-meta': ['11px', { lineHeight: '1' }],
        'model-key': ['10px', { letterSpacing: '0.12em', textTransform: 'uppercase' }],
        'model-val': ['16px', { letterSpacing: '-0.02em', lineHeight: '1' }],
        'model-desc': ['11px', { lineHeight: '1' }],
      },
      spacing: {
        'gutter': '96px',
        'gutter-md': '48px',
        'gutter-sm': '24px',
      },
      maxWidth: {
        'container': '1280px',
      },
      borderRadius: {
        'card': '2px',
        'btn': '2px',
        'input': '2px',
        'search': '2px',
        'toggle': '11px',
        'dialog': '12px',
        'cmd-item': '8px',
      },
      boxShadow: {
        'cmd': '0 16px 70px rgba(0,0,0,0.2)',
        'focus': '0 0 0 2px var(--ink)',
      },
      transitionDuration: {
        'fast': '80ms',
        'normal': '140ms',
        'slow': '200ms',
      },
      transitionTimingFunction: {
        'default': 'ease',
      },
      zIndex: {
        'nav': '20',
        'dropdown': '30',
        'modal': '100',
      },
    },
  },
  plugins: [],
}