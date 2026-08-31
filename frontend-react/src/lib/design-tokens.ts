export const colors = {
  light: {
    paper: '#FFFFFF',
    ink: '#0A0A0A',
    graphite: '#4A4A4A',
    ash: '#8A8A8A',
    hairline: '#E4E4E4',
    fog: '#F7F7F7',
  },
  dark: {
    paper: '#0A0A0A',
    ink: '#F0F0F0',
    graphite: '#B0B0B0',
    ash: '#6A6A6A',
    hairline: '#2A2A2A',
    fog: '#141414',
  },
  reading: {
    paper: '#f5f0e8',
    ink: '#3d3426',
    graphite: '#5d5242',
    ash: '#8d7d6a',
    hairline: '#d4c4a8',
    fog: '#ebe0cf',
  },
  trend: {
    up: '#2d8a4e',
    down: '#c0392b',
  },
  chart: {
    inflation: '#999',
    '7pct': '#6baed6',
    '10pct': '#74c476',
    '15pct': '#fdae6b',
  },
};

export const spacing = {
  gutter: '96px',
  gutterMd: '48px',
  gutterSm: '24px',
  container: '1280px',
};

export const typography = {
  fontFamily: '"Open Sans", system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
  fontFamilyMono: '"Open Sans", monospace',
  sizes: {
    eyebrow: { size: '10.5px', letterSpacing: '0.11em', textTransform: 'uppercase', weight: 600 },
    navLink: { size: '12.5px', letterSpacing: '0.06em', textTransform: 'uppercase', weight: 600 },
    btn: { size: '12.5px', letterSpacing: '0.07em', textTransform: 'uppercase', weight: 600 },
    btnSm: { size: '11px', letterSpacing: '0.06em', textTransform: 'uppercase', weight: 600 },
    cardTitle: { size: '11px', letterSpacing: '0.10em', textTransform: 'uppercase', weight: 500 },
    tableTh: { size: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', weight: 500 },
    tableTd: { size: '13.5px', lineHeight: 1 },
    recSym: { size: '12px', letterSpacing: '0.04em', weight: 600 },
    recName: { size: '13px', lineHeight: 1 },
    recMeta: { size: '11px', lineHeight: 1 },
    modelKey: { size: '10px', letterSpacing: '0.12em', textTransform: 'uppercase' },
    modelVal: { size: '16px', letterSpacing: '-0.02em', lineHeight: 1 },
    modelDesc: { size: '11px', lineHeight: 1 },
  },
};

export const borderRadius = {
  card: '2px',
  btn: '2px',
  input: '2px',
  search: '2px',
  toggle: '11px',
  dialog: '12px',
  cmdItem: '8px',
};

export const transitions = {
  fast: '80ms',
  normal: '140ms',
  slow: '200ms',
};

export const zIndex = {
  nav: 20,
  dropdown: 30,
  modal: 100,
};

export const shadows = {
  cmd: '0 16px 70px rgba(0,0,0,0.2)',
  focus: '0 0 0 2px var(--ink)',
};

export const breakpoints = {
  sm: '640px',
  md: '700px',
  lg: '900px',
  xl: '1000px',
  xxl: '1200px',
};

export const focusRing = 'outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2';