import React from 'react';

export const DcfFormulaImage: React.FC = () => (
  <svg
    viewBox="0 0 680 80"
    style={{ width: '100%', maxWidth: '640px', height: 'auto', display: 'block' }}
    role="img"
    aria-label="10-Year FCFF DCF Mathematical Formula"
  >
    <g fill="currentColor">
      {/* EV = */}
      <text x="8" y="47" fontSize="22" fontWeight="700" fontFamily="serif">EV</text>
      <text x="50" y="46" fontSize="20" fontWeight="400">=</text>
      
      {/* Summation 1 to 10 */}
      <text x="80" y="22" fontSize="11" fontWeight="600" textAnchor="middle" fontFamily="sans-serif">10</text>
      <text x="80" y="49" fontSize="32" fontWeight="300" textAnchor="middle" fontFamily="sans-serif">∑</text>
      <text x="80" y="68" fontSize="10" fontWeight="600" textAnchor="middle" fontFamily="sans-serif">t = 1</text>
      
      {/* FCFF_t / (1 + WACC)^t */}
      <text x="160" y="31" fontSize="15" fontWeight="600" textAnchor="middle" fontFamily="sans-serif">
        FCFF<tspan fontSize="11" dy="3">t</tspan>
      </text>
      <line x1="108" y1="41" x2="212" y2="41" stroke="currentColor" strokeWidth="1.5" />
      <text x="160" y="60" fontSize="14" textAnchor="middle" fontFamily="sans-serif">
        (1 + WACC)<tspan fontSize="10" dy="-5">t</tspan>
      </text>

      {/* + */}
      <text x="232" y="46" fontSize="20" fontWeight="400">+</text>

      {/* FCFF_11 / ((WACC - g)(1+WACC)^10) */}
      <text x="400" y="31" fontSize="15" fontWeight="600" textAnchor="middle" fontFamily="sans-serif">
        FCFF<tspan fontSize="11" dy="3">11</tspan>
      </text>
      <line x1="260" y1="41" x2="540" y2="41" stroke="currentColor" strokeWidth="1.5" />
      <text x="400" y="60" fontSize="14" textAnchor="middle" fontFamily="sans-serif">
        (WACC − g) · (1 + WACC)<tspan fontSize="10" dy="-5">10</tspan>
      </text>
    </g>
  </svg>
);

export const ResidualIncomeFormulaImage: React.FC = () => (
  <svg
    viewBox="0 0 740 80"
    style={{ width: '100%', maxWidth: '700px', height: 'auto', display: 'block' }}
    role="img"
    aria-label="Residual Income Edwards-Bell-Ohlson Formula"
  >
    <g fill="currentColor">
      {/* Equity Value = BV_0 + */}
      <text x="8" y="47" fontSize="20" fontWeight="700" fontFamily="serif">Equity</text>
      <text x="78" y="46" fontSize="20" fontWeight="400">=</text>
      <text x="110" y="47" fontSize="16" fontWeight="600" fontFamily="sans-serif">BV<tspan fontSize="11" dy="3">0</tspan></text>
      <text x="155" y="46" fontSize="20" fontWeight="400">+</text>

      {/* Summation 1 to 10 */}
      <text x="185" y="22" fontSize="11" fontWeight="600" textAnchor="middle" fontFamily="sans-serif">10</text>
      <text x="185" y="49" fontSize="32" fontWeight="300" textAnchor="middle" fontFamily="sans-serif">∑</text>
      <text x="185" y="68" fontSize="10" fontWeight="600" textAnchor="middle" fontFamily="sans-serif">t = 1</text>

      {/* [NI_t - Ke * BV_{t-1}] / (1 + Ke)^t */}
      <text x="310" y="31" fontSize="14" fontWeight="600" textAnchor="middle" fontFamily="sans-serif">
        NI<tspan fontSize="10" dy="3">t</tspan><tspan dy="-3"> − (K</tspan><tspan fontSize="10" dy="3">e</tspan><tspan dy="-3"> × BV</tspan><tspan fontSize="10" dy="3">t−1</tspan><tspan dy="-3">)</tspan>
      </text>
      <line x1="215" y1="41" x2="405" y2="41" stroke="currentColor" strokeWidth="1.5" />
      <text x="310" y="60" fontSize="14" textAnchor="middle" fontFamily="sans-serif">
        (1 + K<tspan fontSize="10" dy="3">e</tspan><tspan dy="-3">)</tspan><tspan fontSize="10" dy="-5">t</tspan>
      </text>

      {/* + */}
      <text x="425" y="46" fontSize="20" fontWeight="400">+</text>

      {/* Terminal RI */}
      <text x="515" y="31" fontSize="14" fontWeight="600" textAnchor="middle" fontFamily="sans-serif">
        RI<tspan fontSize="10" dy="3">10</tspan><tspan dy="-3"> × ω</tspan>
      </text>
      <line x1="450" y1="41" x2="580" y2="41" stroke="currentColor" strokeWidth="1.5" />
      <text x="515" y="60" fontSize="14" textAnchor="middle" fontFamily="sans-serif">
        1 + K<tspan fontSize="10" dy="3">e</tspan><tspan dy="-3"> − ω</tspan>
      </text>
    </g>
  </svg>
);

export const DdmFormulaImage: React.FC = () => (
  <svg
    viewBox="0 0 340 70"
    style={{ width: '100%', maxWidth: '300px', height: 'auto', display: 'block' }}
    role="img"
    aria-label="Dividend Discount Model Gordon Growth Formula"
  >
    <g fill="currentColor">
      <text x="8" y="42" fontSize="22" fontWeight="700" fontFamily="serif">P<tspan fontSize="12" dy="4">0</tspan></text>
      <text x="50" y="40" fontSize="20" fontWeight="400">=</text>
      
      <text x="135" y="27" fontSize="16" fontWeight="600" textAnchor="middle" fontFamily="sans-serif">
        DPS<tspan fontSize="11" dy="3">1</tspan>
      </text>
      <line x1="80" y1="36" x2="190" y2="36" stroke="currentColor" strokeWidth="1.5" />
      <text x="135" y="55" fontSize="15" textAnchor="middle" fontFamily="sans-serif">
        K<tspan fontSize="11" dy="3">e</tspan><tspan dy="-3"> − g</tspan>
      </text>
    </g>
  </svg>
);

export const EpvFormulaImage: React.FC = () => (
  <svg
    viewBox="0 0 660 76"
    style={{ width: '100%', maxWidth: '620px', height: 'auto', display: 'block' }}
    role="img"
    aria-label="Earnings Power Value Bruce Greenwald Formula"
  >
    <g fill="currentColor">
      <text x="8" y="45" fontSize="22" fontWeight="700" fontFamily="serif">EPV</text>
      <text x="65" y="44" fontSize="20" fontWeight="400">=</text>

      <text x="215" y="29" fontSize="14" fontWeight="600" textAnchor="middle" fontFamily="sans-serif">
        Normalized Adjusted EBIT × (1 − τ)
      </text>
      <line x1="95" y1="39" x2="335" y2="39" stroke="currentColor" strokeWidth="1.5" />
      <text x="215" y="57" fontSize="14" fontWeight="600" textAnchor="middle" fontFamily="sans-serif">
        WACC
      </text>

      <text x="355" y="44" fontSize="20" fontWeight="400">+</text>
      <text x="385" y="45" fontSize="15" fontWeight="600" fontFamily="sans-serif">Cash</text>
      <text x="445" y="44" fontSize="20" fontWeight="400">−</text>
      <text x="475" y="45" fontSize="15" fontWeight="600" fontFamily="sans-serif">Total Debt</text>
    </g>
  </svg>
);

export const ReverseDcfFormulaImage: React.FC = () => (
  <svg
    viewBox="0 0 660 64"
    style={{ width: '100%', maxWidth: '620px', height: 'auto', display: 'block' }}
    role="img"
    aria-label="Reverse DCF Expectations Inversion Formula"
  >
    <g fill="currentColor">
      <text x="8" y="38" fontSize="16" fontWeight="700" fontFamily="serif">Solve for θ ∈ {'{'} CAGR<tspan fontSize="11" dy="3">5y</tspan><tspan dy="-3">, Margin, g {'}'}</tspan></text>
      <text x="350" y="38" fontSize="15" fontWeight="400" fontFamily="sans-serif">such that</text>
      <rect x="430" y="16" width="160" height="34" rx="6" fill="transparent" stroke="currentColor" strokeWidth="1.2" />
      <text x="510" y="38" fontSize="14" fontWeight="700" textAnchor="middle" fontFamily="monospace">DCF(θ) = P<tspan fontSize="10" dy="2">market</tspan></text>
    </g>
  </svg>
);

export const SensitivityFormulaImage: React.FC = () => (
  <svg
    viewBox="0 0 540 64"
    style={{ width: '100%', maxWidth: '500px', height: 'auto', display: 'block' }}
    role="img"
    aria-label="5x5 Sensitivity Grid Scenario Valuation Formula"
  >
    <g fill="currentColor">
      <text x="8" y="38" fontSize="20" fontWeight="700" fontFamily="serif">E[V]</text>
      <text x="60" y="37" fontSize="20" fontWeight="400">=</text>
      <text x="90" y="38" fontSize="15" fontWeight="600" fontFamily="sans-serif">P<tspan fontSize="11" dy="3">bear</tspan><tspan dy="-3"> · V</tspan><tspan fontSize="11" dy="3">bear</tspan></text>
      <text x="195" y="37" fontSize="20" fontWeight="400">+</text>
      <text x="225" y="38" fontSize="15" fontWeight="600" fontFamily="sans-serif">P<tspan fontSize="11" dy="3">base</tspan><tspan dy="-3"> · V</tspan><tspan fontSize="11" dy="3">base</tspan></text>
      <text x="330" y="37" fontSize="20" fontWeight="400">+</text>
      <text x="360" y="38" fontSize="15" fontWeight="600" fontFamily="sans-serif">P<tspan fontSize="11" dy="3">bull</tspan><tspan dy="-3"> · V</tspan><tspan fontSize="11" dy="3">bull</tspan></text>
    </g>
  </svg>
);

export const PredictionFormulaImage: React.FC = () => (
  <svg
    viewBox="0 0 660 64"
    style={{ width: '100%', maxWidth: '620px', height: 'auto', display: 'block' }}
    role="img"
    aria-label="Deterministic Price Trajectory Formula"
  >
    <g fill="currentColor">
      <text x="8" y="38" fontSize="18" fontWeight="700" fontFamily="serif">P(t)</text>
      <text x="50" y="37" fontSize="20" fontWeight="400">=</text>
      <text x="75" y="38" fontSize="15" fontWeight="600" fontFamily="sans-serif">P<tspan fontSize="11" dy="3">0</tspan></text>
      <text x="100" y="38" fontSize="15" fontWeight="400" fontFamily="sans-serif">· exp</text>
      <text x="140" y="38" fontSize="15" fontWeight="500" fontFamily="sans-serif">( (μ − σ<tspan fontSize="10" dy="-5">2</tspan><tspan dy="5">/2)t + σ√t · Z ) · Anchor(t)</tspan></text>
    </g>
  </svg>
);
