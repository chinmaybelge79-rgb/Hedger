import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext.js';
import * as simpleIcons from 'simple-icons';

export interface CompanyLogoProps {
  symbol: string;
  name?: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  rounded?: boolean;
  withContainer?: boolean;
}

// Clean symbol normalizer
function cleanSymbolKey(sym: string): string {
  if (!sym) return '';
  return sym.toUpperCase().trim();
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({
  symbol,
  name,
  size = 24,
  className = '',
  style = {},
  rounded = true,
  withContainer = false
}) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const rawKey = cleanSymbolKey(symbol);
  // Strip exchange suffix if present for matching (e.g. TCS.NS -> TCS)
  const baseTicker = rawKey.split('.')[0];

  const containerStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: size,
    height: size,
    minWidth: size,
    minHeight: size,
    flexShrink: 0,
    verticalAlign: 'middle',
    borderRadius: rounded ? '6px' : undefined,
    backgroundColor: withContainer
      ? isDark
        ? 'rgba(255, 255, 255, 0.06)'
        : 'rgba(0, 0, 0, 0.04)'
      : 'transparent',
    border: withContainer
      ? isDark
        ? '1px solid rgba(255, 255, 255, 0.1)'
        : '1px solid rgba(0, 0, 0, 0.08)'
      : 'none',
    boxSizing: 'border-box',
    overflow: 'hidden',
    ...style
  };

  // 1. Google 4-Color Official SVG
  if (rawKey === 'GOOGL' || rawKey === 'GOOG' || rawKey === 'ALPHABET') {
    return (
      <span className={`company-logo-container ${className}`} style={containerStyle} title={name || 'Alphabet / Google'}>
        <svg viewBox="0 0 533.5 544.3" width={Math.round(size * 0.76)} height={Math.round(size * 0.76)} style={{ display: 'block' }}>
          <path fill="#4285F4" d="M533.5 278.4c0-18.5-1.5-37.1-4.7-55.3H272.1v104.8h147c-6.1 33.8-25.7 63.7-54.4 82.7v68h87.7c51.5-47.4 81.1-117.4 81.1-200.2z"/>
          <path fill="#34A853" d="M272.1 544.3c73.4 0 135.3-24.1 180.4-65.7l-87.7-68c-24.4 16.6-55.9 26-92.6 26-71 0-131.2-47.9-152.8-112.3H28.9v70.1c46.2 91.9 140.3 149.9 243.2 149.9z"/>
          <path fill="#FBBC04" d="M119.3 324.3c-5.4-16.1-8.5-33.3-8.5-51.3s3.1-35.2 8.5-51.3v-70.1H28.9c-18.2 36.4-28.9 77.4-28.9 121.4s10.7 85 28.9 121.4l90.4-70.1z"/>
          <path fill="#EA4335" d="M272.1 107.7c39.9 0 75.8 13.7 104.1 40.5l78.1-78.1C407.3 29.1 345.5 0 272.1 0 169.2 0 75.1 58 28.9 149.9l90.4 70.1c21.6-64.4 81.8-112.3 152.8-112.3z"/>
        </svg>
      </span>
    );
  }

  // 2. Microsoft 4-Square Official SVG
  if (rawKey === 'MSFT' || rawKey === 'MICROSOFT') {
    return (
      <span className={`company-logo-container ${className}`} style={containerStyle} title={name || 'Microsoft'}>
        <svg viewBox="0 0 216 216" width={Math.round(size * 0.72)} height={Math.round(size * 0.72)} style={{ display: 'block' }}>
          <path fill="#F25022" d="M0 0h104v104H0z"/>
          <path fill="#7FBA00" d="M112 0h104v104H112z"/>
          <path fill="#00A4EF" d="M0 112h104v104H0z"/>
          <path fill="#FFB900" d="M112 112h104v104H112z"/>
        </svg>
      </span>
    );
  }

  // 3. Amazon Official Curved Arrow & Smile SVG
  if (rawKey === 'AMZN' || rawKey === 'AMAZON') {
    return (
      <span className={`company-logo-container ${className}`} style={containerStyle} title={name || 'Amazon'}>
        <svg viewBox="0 0 24 24" width={Math.round(size * 0.8)} height={Math.round(size * 0.8)} style={{ display: 'block' }}>
          <path
            fill="#FF9900"
            d="M2.027 17.023c.061-.098.156-.105.289-.02 3.035 1.76 6.338 2.645 9.906 2.645 2.381 0 4.73-.447 7.051-1.332l.262-.117c.115-.051.195-.084.244-.109.189-.074.326-.037.438.109.102.143.076.279-.1.4-.213.158-.5.342-.84.545-1.037.619-2.203 1.098-3.492 1.441a14.815 14.815 0 0 1-3.77.508c-1.889 0-3.68-.33-5.369-.99a14.875 14.875 0 0 1-4.531-2.797c-.084-.061-.125-.123-.125-.184 0-.039.016-.074.041-.109l-.004.01zm16.256.676c.025-.051.063-.092.109-.143.301-.201.596-.342.877-.416a6.597 6.597 0 0 1 1.344-.201c.117-.01.234 0 .346.025.539.051.873.141.977.273.053.078.074.191.074.328v.125c0 .426-.117.926-.348 1.502s-.553 1.041-.963 1.258z"
          />
          <path
            fill={isDark ? '#FFFFFF' : '#111111'}
            d="M7.506 11.834c0-.84.207-1.555.619-2.152.414-.592.977-1.041 1.703-1.346.666-.281 1.465-.48 2.43-.602.326-.037.861-.086 1.6-.145v-.31c0-.773-.084-1.299-.248-1.564-.252-.359-.65-.541-1.203-.541h-.15c-.4.039-.746.162-1.039.383a1.51 1.51 0 0 0-.564.916c-.049.25-.172.387-.361.426l-2.105-.264c-.209-.051-.311-.15-.311-.326 0-.037.006-.074.018-.123.209-1.078.715-1.881 1.52-2.404.814-.514 1.752-.814 2.828-.875h.451c1.379 0 2.469.361 3.244 1.076.115.123.227.25.34.398.1.139.188.264.234.377.063.111.127.275.164.475.051.213.088.352.113.426.023.086.051.25.064.514.006.262.016.41.016.461v4.406c0 .314.049.602.137.865.088.26.174.451.262.563l.428.561a.598.598 0 0 1 .111.303c0 .102-.049.188-.148.26-1.002.877-1.553 1.352-1.639 1.428-.137.113-.313.125-.525.039a5.397 5.397 0 0 1-.439-.414l-.258-.291c-.051-.063-.141-.174-.266-.352l-.25-.363c-.676.74-1.338 1.205-2.002 1.393-.414.125-.914.188-1.529.188-.926 0-1.701-.285-2.303-.863-.598-.576-.9-1.389-.9-2.453l-.043-.063.001-.007zm3.131-.367c0 .475.117.852.355 1.139.236.285.563.428.965.428.035 0 .088-.008.16-.018.078-.012.111-.02.141-.02.512-.133.902-.461 1.189-.982a2.62 2.62 0 0 0 .299-.758c.076-.268.1-.494.111-.666.016-.166.016-.453.016-.84v-.451c-.703 0-1.24.049-1.604.148-1.063.303-1.604.977-1.604 2.029l-.029-.016v.007z"
          />
        </svg>
      </span>
    );
  }

  // 4. State Bank of India (SBIN.NS) Official Azure Keyhole SVG
  if (rawKey === 'SBIN.NS' || rawKey === 'SBIN' || rawKey === 'STATE BANK OF INDIA') {
    return (
      <span className={`company-logo-container ${className}`} style={containerStyle} title={name || 'State Bank of India'}>
        <svg viewBox="0 0 24 24" width={Math.round(size * 0.8)} height={Math.round(size * 0.8)} style={{ display: 'block' }}>
          <circle cx="12" cy="12" r="11" fill="#0092D6" />
          <circle cx="12" cy="9.5" r="3.2" fill="#FFFFFF" />
          <rect x="10.6" y="9.5" width="2.8" height="9" fill="#FFFFFF" />
        </svg>
      </span>
    );
  }

  // 5. BP Helios Sunburst SVG
  if (rawKey === 'BP.L' || rawKey === 'BP') {
    return (
      <span className={`company-logo-container ${className}`} style={containerStyle} title={name || 'BP p.l.c.'}>
        <svg viewBox="0 0 24 24" width={Math.round(size * 0.8)} height={Math.round(size * 0.8)} style={{ display: 'block' }}>
          <circle cx="12" cy="12" r="11" fill="#007A33" />
          <circle cx="12" cy="12" r="7.5" fill="#78BE20" />
          <circle cx="12" cy="12" r="4.5" fill="#FFDF00" />
          <circle cx="12" cy="12" r="2.2" fill="#FFFFFF" />
        </svg>
      </span>
    );
  }

  // 6. ASML Vector Mark
  if (rawKey === 'ASML' || rawKey === 'ASML.AS') {
    return (
      <span className={`company-logo-container ${className}`} style={containerStyle} title={name || 'ASML Holding'}>
        <svg viewBox="0 0 100 36" width={Math.round(size * 0.9)} height={Math.round(size * 0.36)} style={{ display: 'block' }}>
          <text x="50" y="27" fill="#0071C5" fontSize="26" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif" textAnchor="middle" letterSpacing="1">
            ASML
          </text>
        </svg>
      </span>
    );
  }

  // 7. TSMC Semiconductor Red Wafer Mark
  if (rawKey === 'TSM' || rawKey === 'TSMC') {
    return (
      <span className={`company-logo-container ${className}`} style={containerStyle} title={name || 'TSMC'}>
        <svg viewBox="0 0 24 24" width={Math.round(size * 0.8)} height={Math.round(size * 0.8)} style={{ display: 'block' }}>
          <rect x="2" y="2" width="20" height="20" rx="4" fill="#CC0000" />
          <text x="12" y="16" fill="#FFFFFF" fontSize="9" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif" textAnchor="middle">
            tsmc
          </text>
        </svg>
      </span>
    );
  }

  // 8. ExxonMobil Red Double-X Mark
  if (rawKey === 'XOM' || rawKey === 'EXXON') {
    return (
      <span className={`company-logo-container ${className}`} style={containerStyle} title={name || 'ExxonMobil'}>
        <svg viewBox="0 0 24 24" width={Math.round(size * 0.8)} height={Math.round(size * 0.8)} style={{ display: 'block' }}>
          <rect x="2" y="2" width="20" height="20" rx="4" fill="#ED1C24" />
          <text x="12" y="16" fill="#FFFFFF" fontSize="11" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">
            X
          </text>
        </svg>
      </span>
    );
  }

  // 9. Berkshire Hathaway Classic Monogram
  if (rawKey === 'BRK-B' || rawKey === 'BRK.B' || rawKey === 'BRK') {
    return (
      <span className={`company-logo-container ${className}`} style={containerStyle} title={name || 'Berkshire Hathaway'}>
        <svg viewBox="0 0 24 24" width={Math.round(size * 0.8)} height={Math.round(size * 0.8)} style={{ display: 'block' }}>
          <rect x="2" y="2" width="20" height="20" rx="4" fill="#1E2D40" />
          <text x="12" y="16" fill="#FFFFFF" fontSize="9" fontWeight="800" fontFamily="Georgia, serif" textAnchor="middle">
            BRK
          </text>
        </svg>
      </span>
    );
  }

  // 10. BHP Group Orange & Navy Mark
  if (rawKey === 'BHP') {
    return (
      <span className={`company-logo-container ${className}`} style={containerStyle} title={name || 'BHP Group'}>
        <svg viewBox="0 0 24 24" width={Math.round(size * 0.8)} height={Math.round(size * 0.8)} style={{ display: 'block' }}>
          <rect x="2" y="2" width="20" height="20" rx="4" fill="#ED553B" />
          <text x="12" y="16" fill="#FFFFFF" fontSize="9" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">
            BHP
          </text>
        </svg>
      </span>
    );
  }

  // 11. Commodities & Benchmark Assets
  if (rawKey === 'GC=F') {
    return (
      <span className={`company-logo-container ${className}`} style={containerStyle} title="Gold Bullion">
        <svg viewBox="0 0 24 24" width={Math.round(size * 0.8)} height={Math.round(size * 0.8)} fill="none" stroke="#E5A93C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 3h12l3 7-9 11-9-11 3-7z" fill="#E5A93C" fillOpacity="0.3" />
          <path d="M12 21L3 10h18l-9 11z" />
          <path d="M6 3l6 7 6-7" />
        </svg>
      </span>
    );
  }

  if (rawKey === 'CL=F') {
    return (
      <span className={`company-logo-container ${className}`} style={containerStyle} title="Crude Oil">
        <svg viewBox="0 0 24 24" width={Math.round(size * 0.8)} height={Math.round(size * 0.8)} fill="none" stroke="#00A3E0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill="#00A3E0" fillOpacity="0.3" />
        </svg>
      </span>
    );
  }

  if (rawKey === 'SI=F') {
    return (
      <span className={`company-logo-container ${className}`} style={containerStyle} title="Silver">
        <svg viewBox="0 0 24 24" width={Math.round(size * 0.8)} height={Math.round(size * 0.8)} fill="none" stroke="#A8B2BD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" fill="#A8B2BD" fillOpacity="0.3" />
          <path d="M9 12h6" />
        </svg>
      </span>
    );
  }

  if (rawKey === 'NG=F') {
    return (
      <span className={`company-logo-container ${className}`} style={containerStyle} title="Natural Gas">
        <svg viewBox="0 0 24 24" width={Math.round(size * 0.8)} height={Math.round(size * 0.8)} fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" fill="#3B82F6" fillOpacity="0.3" />
        </svg>
      </span>
    );
  }

  if (rawKey === 'HG=F' || rawKey === 'FCX') {
    return (
      <span className={`company-logo-container ${className}`} style={containerStyle} title={name || 'Copper'}>
        <svg viewBox="0 0 24 24" width={Math.round(size * 0.8)} height={Math.round(size * 0.8)} fill="none" stroke="#C87D20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="9" r="6" fill="#C87D20" fillOpacity="0.3" />
          <path d="M12 15v7M9 19h6" />
        </svg>
      </span>
    );
  }

  // 12. Benchmark Market Indices
  if (rawKey === '^GSPC' || rawKey === '^IXIC' || rawKey === '^DJI' || rawKey === '^RUT' || rawKey === '^VIX' || rawKey === '^NSEI' || rawKey === '^BSESN') {
    const idxColor = rawKey.includes('GSPC') || rawKey.includes('DJI') ? '#0A2540' : rawKey.includes('NSE') || rawKey.includes('BSE') ? '#FF671F' : '#00A3E0';
    const idxInitial = rawKey.replace('^', '').slice(0, 3);
    return (
      <span className={`company-logo-container ${className}`} style={containerStyle} title={name || symbol}>
        <svg viewBox="0 0 24 24" width={Math.round(size * 0.8)} height={Math.round(size * 0.8)} style={{ display: 'block' }}>
          <rect x="2" y="2" width="20" height="20" rx="4" fill={idxColor} />
          <path d="M5 16l4-5 3 3 7-8" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }

  // 13. Curated Simple Icons Vector Registry
  const iconMap: Record<string, keyof typeof simpleIcons> = {
    // US Mega Tech & Finance
    'AAPL': 'siApple',
    'APPLE': 'siApple',
    'NVDA': 'siNvidia',
    'NVIDIA': 'siNvidia',
    'META': 'siMeta',
    'TSLA': 'siTesla',
    'TESLA': 'siTesla',
    'INTC': 'siIntel',
    'INTEL': 'siIntel',
    'V': 'siVisa',
    'VISA': 'siVisa',
    'MA': 'siMastercard',
    'MASTERCARD': 'siMastercard',
    'PYPL': 'siPaypal',
    'PAYPAL': 'siPaypal',
    'JPM': 'siChase',
    'CHASE': 'siChase',
    'JPMORGAN': 'siChase',
    // Europe
    'SHEL': 'siShell',
    'SHEL.L': 'siShell',
    'SHELL': 'siShell',
    'SAP': 'siSap',
    'SAP.DE': 'siSap',
    'SIE.DE': 'siSiemens',
    'SIEMENS': 'siSiemens',
    // Asia & Pacific
    '7203.T': 'siToyota',
    '7203': 'siToyota',
    'TOYOTA': 'siToyota',
    '6758.T': 'siSony',
    '6758': 'siSony',
    'SONY': 'siSony',
    '005930.KS': 'siSamsung',
    '005930': 'siSamsung',
    'SAMSUNG': 'siSamsung',
    '9988.HK': 'siAlibabadotcom',
    '9988': 'siAlibabadotcom',
    'BABA': 'siAlibabadotcom',
    'ALIBABA': 'siAlibabadotcom',
    '0700.HK': 'siTencenthy',
    '0700': 'siTencenthy',
    'TENCENT': 'siTencenthy',
    '3690.HK': 'siMeituan',
    '3690': 'siMeituan',
    'MEITUAN': 'siMeituan',
    // India Majors
    'TCS.NS': 'siTcs',
    'TCS': 'siTcs',
    'RELIANCE.NS': 'siRelianceindustrieslimited',
    'RELIANCE': 'siRelianceindustrieslimited',
    'HDFCBANK.NS': 'siHdfcbank',
    'HDFCBANK': 'siHdfcbank',
    'ICICIBANK.NS': 'siIcicibank',
    'ICICIBANK': 'siIcicibank',
    'AXISBANK.NS': 'siAxisbank',
    'AXISBANK': 'siAxisbank',
    'BHARTIARTL.NS': 'siAirtel',
    'BHARTIARTL': 'siAirtel',
    'AIRTEL': 'siAirtel',
    'M&M.NS': 'siMahindra',
    'M&M': 'siMahindra',
    'MAHINDRA': 'siMahindra',
    'INFY.NS': 'siInfosys',
    'INFY': 'siInfosys',
    'INFOSYS': 'siInfosys',
    'WIPRO.NS': 'siWipro',
    'WIPRO': 'siWipro',
    'TATAMOTORS.NS': 'siTata',
    'TATAMOTORS': 'siTata',
    'TATA': 'siTata',
    'MARUTI.NS': 'siSuzuki',
    'MARUTI': 'siSuzuki',
    'SUZUKI': 'siSuzuki'
  };

  const matchedIconKey = iconMap[rawKey] || iconMap[baseTicker];
  if (matchedIconKey && simpleIcons[matchedIconKey]) {
    const iconObj = simpleIcons[matchedIconKey] as { title: string; hex: string; path: string };

    let fillColor = `#${iconObj.hex}`;
    if (matchedIconKey === 'siApple' || iconObj.hex === '000000') {
      fillColor = isDark ? '#FFFFFF' : '#000000';
    } else if (matchedIconKey === 'siSony' || iconObj.hex === 'FFFFFF') {
      fillColor = isDark ? '#FFFFFF' : '#000000';
    }

    return (
      <span className={`company-logo-container ${className}`} style={containerStyle} title={name || iconObj.title || symbol}>
        <svg
          role="img"
          viewBox="0 0 24 24"
          width={Math.round(size * 0.78)}
          height={Math.round(size * 0.78)}
          fill={fillColor}
          style={{ display: 'block' }}
        >
          <path d={iconObj.path} />
        </svg>
      </span>
    );
  }

  // 14. Deterministic High-Contrast Vector Monogram Badge
  // For long-tail securities: clean, crisp, colorful badge matching 21st.dev style
  const initials = (baseTicker.length > 3 ? baseTicker.slice(0, 3) : baseTicker) || symbol.slice(0, 2);
  const colorPalette = [
    { bg: '#00539F', fg: '#FFFFFF' }, // Blue
    { bg: '#DD052B', fg: '#FFFFFF' }, // Crimson
    { bg: '#76B900', fg: '#000000' }, // Lime
    { bg: '#FF9900', fg: '#000000' }, // Amber
    { bg: '#00A4EF', fg: '#FFFFFF' }, // Cyan
    { bg: '#971A4D', fg: '#FFFFFF' }, // Magenta
    { bg: '#107C41', fg: '#FFFFFF' }, // Emerald
    { bg: '#486AAE', fg: '#FFFFFF' }, // Indigo
    { bg: '#FF6A00', fg: '#FFFFFF' }, // Orange
    { bg: '#0FAAFF', fg: '#FFFFFF' }  // Sky
  ];
  let hash = 0;
  for (let i = 0; i < baseTicker.length; i++) {
    hash = baseTicker.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % colorPalette.length;
  const { bg, fg } = colorPalette[colorIndex];

  return (
    <span
      className={`company-logo-container ${className}`}
      style={{
        ...containerStyle,
        backgroundColor: bg,
        color: fg,
        fontWeight: 700,
        fontSize: Math.max(9, Math.round(size * 0.42)),
        letterSpacing: '-0.02em',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        userSelect: 'none',
        lineHeight: 1
      }}
      title={name || symbol}
    >
      {initials}
    </span>
  );
};
