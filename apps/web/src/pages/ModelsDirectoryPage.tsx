import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMarket } from '../context/MarketContext.js';
import {
  DcfFormulaImage,
  ResidualIncomeFormulaImage,
  DdmFormulaImage,
  EpvFormulaImage,
  ReverseDcfFormulaImage,
  SensitivityFormulaImage,
  PredictionFormulaImage
} from '../components/ModelFormulaImages.js';

interface ModelVariable {
  symbol: string;
  name: string;
  definition: string;
}

interface ModelItem {
  id: string;
  title: string;
  category: 'dcf' | 'financial' | 'expectations' | 'macro';
  badge: string;
  target: string;
  summary: string;
  formulaImage: React.ReactNode;
  variables: ModelVariable[];
  explanation: string;
  factors: { name: string; desc: string }[];
  actionUrl: string;
  actionLabel: string;
}

export const ModelsDirectoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeMarket } = useMarket();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'dcf' | 'financial' | 'expectations' | 'macro'>('all');

  const defaultTicker = activeMarket === 'in' ? 'RELIANCE.NS' : 'NVDA';
  const defaultBankTicker = activeMarket === 'in' ? 'HDFCBANK.NS' : 'JPM';

  const models: ModelItem[] = [
    {
      id: 'dcf-10y',
      title: '10-Year Discounted Cash Flow (FCFF)',
      category: 'dcf',
      badge: 'Institutional Flagship',
      target: 'Operating Corporations (Tech, Retail, Industrials, Energy, Healthcare)',
      summary: 'Deterministic two-stage DCF with 5 explicit forecast years followed by 5 linear fade years to terminal state. Uses pure value-driver terminal value math.',
      formulaImage: <DcfFormulaImage />,
      variables: [
        { symbol: 'EV', name: 'Enterprise Value', definition: 'Aggregate fundamental economic valuation of core operating enterprise assets before debt adjustments.' },
        { symbol: 'FCFF_t', name: 'Free Cash Flow to Firm (Year t)', definition: 'NOPAT − Net Reinvestment (where Reinvestment = ΔRevenue / Sales-to-Capital).' },
        { symbol: 'WACC', name: 'Weighted Average Cost of Capital', definition: 'Blended discount rate from CAPM cost of equity and after-tax marginal borrowing costs.' },
        { symbol: 'g', name: 'Perpetual Growth Rate', definition: 'Sustainable long-term GDP anchor rate (strictly bounded by regional sovereign yields).' },
        { symbol: 'FCFF_11', name: 'Terminal Cash Flow', definition: 'NOPAT_10 × (1 + g) × (1 − g / ROIC_terminal) accounting for economic capital retention.' },
        { symbol: 't', name: 'Projection Horizon', definition: '10 projection periods consisting of 5 explicit operating years and 5 linear competitive fade years.' }
      ],
      explanation: 'FCFF = EBIT × (1 - Tax) - Reinvestment. Reinvestment is modeled via Sales-to-Capital ratio. Terminal Value accounts for required reinvestment to sustain perpetual growth: FCFF_{11} = NOPAT_{10} × (1 + g) × (1 - g / ROIC_terminal). Mid-year discounting accounts for cash flows distributed evenly throughout the fiscal year.',
      factors: [
        { name: '5-Year Revenue Growth', desc: 'Starting compound annual growth rate fading to long-term GDP anchor.' },
        { name: 'EBIT Margin Convergence', desc: 'Current operating margin transitioning to normalized sector target.' },
        { name: 'Sales-to-Capital Ratio', desc: 'Capital efficiency determining net reinvestment from incremental revenue.' },
        { name: 'WACC Discount Rate', desc: 'Weighted average cost of capital from CAPM cost of equity and after-tax cost of debt.' },
        { name: 'Terminal Value Driver', desc: 'Perpetual growth g with reinvestment bounded by terminal return on capital.' }
      ],
      actionUrl: `/models/dcf/${defaultTicker}`,
      actionLabel: 'Inspect DCF Workbench'
    },
    {
      id: 'residual-income',
      title: 'Residual Income Model (Edwards-Bell-Ohlson)',
      category: 'financial',
      badge: 'Banking & Financials',
      target: 'Commercial Banks, NBFCs, Insurance Carriers, Asset Managers',
      summary: 'Equity-only fundamental valuation for financial institutions where customer deposits and debt represent operational inventory rather than leverage.',
      formulaImage: <ResidualIncomeFormulaImage />,
      variables: [
        { symbol: 'Equity', name: 'Intrinsic Equity Value', definition: 'Aggregate fair shareholder value independent of liabilities structure.' },
        { symbol: 'BV_0', name: 'Tangible Book Value', definition: 'Reported equity capital adjusted for intangible assets, goodwill, and reserves.' },
        { symbol: 'NI_t', name: 'Net Income (Year t)', definition: 'Projected accounting profit available to common shareholders in period t.' },
        { symbol: 'K_e', name: 'Cost of Equity', definition: 'Hurdle rate computed via Risk-Free Rate + Beta × Equity Risk Premium.' },
        { symbol: 'BV_{t-1}', name: 'Opening Book Value', definition: 'Shareholders equity base deployed during the operational period.' },
        { symbol: 'ω (omega)', name: 'Persistence Moat Parameter', definition: 'Economic decay rate (0.0 to 1.0) governing competitive erosion of abnormal earnings.' }
      ],
      explanation: 'Valuation is anchored on current tangible book value plus the present value of economic profits (residual income) generated above the required cost of equity Ke. The persistence parameter omega (0.0 to 1.0) models economic moat decay and competitive erosion over time.',
      factors: [
        { name: 'Tangible Book Value (BV0)', desc: 'Reported equity capital after deducting intangibles and goodwill.' },
        { name: 'Cost of Equity (Ke)', desc: 'Equity hurdle rate from Risk-Free Rate + Beta × Equity Risk Premium.' },
        { name: 'Projected ROE Path', desc: 'Return on Equity trajectory across the 10-year projection horizon.' },
        { name: 'Persistence Parameter (ω)', desc: 'Moat retention rate governing perpetual fade of abnormal earnings.' }
      ],
      actionUrl: `/models/dcf/${defaultBankTicker}`,
      actionLabel: 'Inspect Bank Model'
    },
    {
      id: 'dividend-discount',
      title: 'Dividend Discount Model (Gordon Growth)',
      category: 'financial',
      badge: 'Cash Return Valuation',
      target: 'Regulated Utilities, Telecom Cash Cows, Mature Dividend Payers, REITs',
      summary: 'Direct shareholder cash distribution capitalization model. Cross-checks sustainable payout ratios against retained capital requirements.',
      formulaImage: <DdmFormulaImage />,
      variables: [
        { symbol: 'P_0', name: 'Fair Price per Share', definition: 'Capitalized present value of all expected future cash distributions.' },
        { symbol: 'DPS_1', name: 'Forward Dividend per Share', definition: 'Projected common distribution for the upcoming twelve-month period.' },
        { symbol: 'K_e', name: 'Required Rate of Return', definition: 'Cost of equity hurdle rate compensation required by investors.' },
        { symbol: 'g', name: 'Sustainable Dividend Growth', definition: 'Perpetual growth of payout (Retention Ratio × Return on Equity).' }
      ],
      explanation: 'Computes intrinsic per-share value by discounting projected cash dividends directly returned to shareholders. Serves as an institutional sanity check for financial institutions and capital-intensive infrastructure firms.',
      factors: [
        { name: 'Year-1 Dividend per Share', desc: 'Forward projected distribution per diluted equity share.' },
        { name: 'Required Return (Ke)', desc: 'Minimum acceptable annual rate of return for equity holders.' },
        { name: 'Perpetual Growth (g)', desc: 'Sustainable long-term distribution growth rate.' }
      ],
      actionUrl: `/models/dcf/${defaultBankTicker}?tab=summary`,
      actionLabel: 'Inspect DDM Cross-Check'
    },
    {
      id: 'earnings-power',
      title: 'Earnings Power Value (Bruce Greenwald EPV)',
      category: 'dcf',
      badge: 'Zero-Growth Downside Floor',
      target: 'Value Investing, Distressed Equity, Commodity Cyclicals, Margin of Safety',
      summary: 'Strips out all growth speculation to determine the fundamental value of current operating capacity in perpetuity.',
      formulaImage: <EpvFormulaImage />,
      variables: [
        { symbol: 'EPV', name: 'Earnings Power Value', definition: 'Zero-growth reproduction value of the firm operating stationary capacity.' },
        { symbol: 'Adjusted EBIT', name: 'Normalized Operating Profit', definition: 'Operating income stripped of cyclical peaks, one-time charges, and restructuring.' },
        { symbol: 'τ (tau)', name: 'Effective Tax Rate', definition: 'Marginal sustainable tax rate on operating corporate income.' },
        { symbol: 'WACC', name: 'Cost of Capital', definition: 'Operating discount rate capitalization multiple (1 / WACC).' }
      ],
      explanation: 'Assumes maintenance capital expenditures exactly match depreciation and amortization. Compares the resulting reproduction value against current market valuation to isolate how much of the stock price represents pure speculative growth options.',
      factors: [
        { name: 'Normalized NOPAT', desc: 'Cyclically adjusted sustainable operating cash flow after tax.' },
        { name: 'Cost of Capital (WACC)', desc: 'Firm discount rate applied to current stationary capacity.' },
        { name: 'Net Financial Debt', desc: 'Total debt and obligations deducted from enterprise earning power.' }
      ],
      actionUrl: `/models/dcf/${defaultTicker}?tab=methodology`,
      actionLabel: 'Inspect EPV Methodology'
    },
    {
      id: 'reverse-dcf',
      title: 'Reverse DCF (Market Implied Expectations)',
      category: 'expectations',
      badge: 'Expectation Inversion',
      target: 'Any Publicly Traded Security with Live Trading Quotes',
      summary: 'Inverts the valuation engine using high-precision numerical binary search to extract the exact growth rate or margin implied by current market price.',
      formulaImage: <ReverseDcfFormulaImage />,
      variables: [
        { symbol: 'θ (theta)', name: 'Implied Parameter Vector', definition: 'The exact operational assumption being numerically solved via bisection search.' },
        { symbol: 'CAGR_{5y}', name: 'Implied 5Y Revenue Growth', definition: 'Annual revenue growth required over next 5 years to justify price.' },
        { symbol: 'Margin', name: 'Implied Operating Margin', definition: 'Target terminal operating profitability priced into current trading multiple.' },
        { symbol: 'P_{market}', name: 'Live Market Equity Price', definition: 'Observed real-time trading quote on exchange.' }
      ],
      explanation: 'Rather than predicting the future, reverse DCF reveals what consensus is already pricing in. If the stock implies 28% annual growth for 5 years in a 4% growth industry, the hurdle for outperformance is quantitatively exposed.',
      factors: [
        { name: 'Implied 5-Year CAGR', desc: 'Revenue growth necessary to justify current trading multiple.' },
        { name: 'Implied Terminal Margin', desc: 'Operating margin required at year 5 for market parity.' },
        { name: 'Implied Terminal Growth', desc: 'Long-term perpetual growth baked into current equity price.' }
      ],
      actionUrl: `/models/dcf/${defaultTicker}?tab=reverse`,
      actionLabel: 'Inspect Reverse DCF Solver'
    },
    {
      id: 'sensitivity-matrix',
      title: '5×5 Valuation Sensitivity & Macro Scenarios',
      category: 'macro',
      badge: 'Stress Testing & Moat Bounds',
      target: 'Institutional Risk Assessment, Stress Testing, Probability Weighting',
      summary: 'Dynamic 25-cell valuation grid executing pure decimal DCF on every permutation of discount rates and terminal growth.',
      formulaImage: <SensitivityFormulaImage />,
      variables: [
        { symbol: 'E[V]', name: 'Expected Value', definition: 'Probability-weighted composite valuation across macro regimes.' },
        { symbol: 'P_{bear}', name: 'Bear Case Probability', definition: 'Weight assigned to pessimistic scenario (typically 25%).' },
        { symbol: 'V_{bear}', name: 'Bear Case Valuation', definition: 'Intrinsic share price under high WACC and compressed terminal growth.' },
        { symbol: 'P_{base}', name: 'Base Case Probability', definition: 'Weight assigned to central consensus scenario (typically 50%).' },
        { symbol: 'V_{base}', name: 'Base Case Valuation', definition: 'Intrinsic share price under baseline management forecast assumptions.' },
        { symbol: 'P_{bull}', name: 'Bull Case Probability', definition: 'Weight assigned to optimistic scenario (typically 25%).' },
        { symbol: 'V_{bull}', name: 'Bull Case Valuation', definition: 'Intrinsic share price under moat expansion and lower discount hurdle.' }
      ],
      explanation: 'Generates a 5×5 grid evaluating sensitivity to WACC (±100 bps) and Terminal Growth Rate (±50 bps). Visual heat map immediately shows asymmetry of valuation risk and margin of safety.',
      factors: [
        { name: 'Discount Rate Range (WACC ±100bps)', desc: 'Evaluates valuation sensitivity across cost of capital fluctuations.' },
        { name: 'Perpetual Growth Range (g ±50bps)', desc: 'Tests terminal value stability across GDP growth environments.' },
        { name: 'Scenario Probability Weights', desc: 'Composite expected value calculation across market regimes.' }
      ],
      actionUrl: `/models/dcf/${defaultTicker}?tab=sensitivity`,
      actionLabel: 'Inspect 5×5 Sensitivity Matrix'
    },
    {
      id: 'hedger-forecast',
      title: 'Algorithmic Stock Price & Valuation Forecast',
      category: 'macro',
      badge: 'Deterministic Forecasting',
      target: 'Multi-Asset Trajectory Modeling, Stat-Arb & Fundamentals Fusion',
      summary: 'Multi-path deterministic projection model combining historical drift, volatility bounds, and fundamental DCF value convergence.',
      formulaImage: <PredictionFormulaImage />,
      variables: [
        { symbol: 'P(t)', name: 'Projected Share Price', definition: 'Deterministic multi-year trajectory expectation at timestamp t.' },
        { symbol: 'P_0', name: 'Reference Spot Price', definition: 'Starting equity price recorded at model initiation.' },
        { symbol: 'μ (mu)', name: 'Operating Drift Rate', definition: 'Normalized long-term compound growth rate of free cash flow.' },
        { symbol: 'σ (sigma)', name: 'Realized Volatility', definition: 'Historical 3-year standard deviation of price returns bounding the cone.' },
        { symbol: 'Anchor(t)', name: 'Valuation Gravity Anchor', definition: 'Mean-reversion force pulling market multiple towards intrinsic DCF value.' }
      ],
      explanation: 'Integrates 7 deterministic algorithmic trajectory paths (Extreme Bear, Bear, Baseline, Consensus, Bull, Extreme Bull) grounded in verified financial filings, historical operating performance, and statistical confidence intervals.',
      factors: [
        { name: 'Historical Drift (μ)', desc: 'Normalized long-term compound growth rate of operating earnings.' },
        { name: 'Realized Volatility (σ)', desc: 'Historical price and earnings volatility bounding trajectory cone.' },
        { name: 'Fundamental Valuation Anchor', desc: 'Mean-reverting gravity towards pure DCF intrinsic value.' }
      ],
      actionUrl: `/company/${defaultTicker}`,
      actionLabel: 'Inspect Prediction Dossier'
    },
    {
      id: 'capital-structure',
      title: 'Capital Structure & WACC Optimizer',
      category: 'macro',
      badge: 'Standalone Optimizer',
      target: 'Leveraged Corporates, Capital Allocation Desks, Credit Restructuring',
      summary: 'Simulate optimal debt capacity, estimate synthetic credit ratings from interest coverage, and model WACC minimization via the Hamada equation.',
      formulaImage: <SensitivityFormulaImage />,
      variables: [
        { symbol: 'WACC', name: 'Weighted Average Cost of Capital', definition: '(E/V × Ke) + (D/V × Kd × (1 - t)).' },
        { symbol: 'β_L', name: 'Levered Beta', definition: 'β_U × [1 + (1 - t)(D/E)] measuring equity risk under target financial leverage.' },
        { symbol: 'ICR', name: 'Interest Coverage Ratio', definition: 'EBIT / Interest Expense determining synthetic credit rating tier.' },
        { symbol: 'Kd', name: 'Cost of Debt', definition: 'Risk-Free Rate + Damodaran Synthetic Default Spread.' }
      ],
      explanation: 'Evaluates the tradeoff between the interest tax shield and financial distress costs across 0% to 90% debt ratios to identify the cost-minimizing and value-maximizing optimal capital structure.',
      factors: [
        { name: 'Operating Income (EBIT)', desc: 'Pre-interest operating profit available to service financial leverage.' },
        { name: 'Synthetic Credit Rating', desc: 'Damodaran default spread mapping based on interest coverage.' },
        { name: 'Hamada Beta Re-levering', desc: 'Pure asset business risk calibrated across shifting debt-to-equity ratios.' }
      ],
      actionUrl: '/models/capital-structure',
      actionLabel: 'Launch Capital Structure Optimizer'
    }
  ];

  const filteredModels = models.filter((m) => {
    if (selectedCategory === 'all') return true;
    return m.category === selectedCategory;
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      {/* Header Container */}
      <header
        style={{
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--surface)',
          padding: '40px 0 32px'
        }}
      >
        <div className="page-container" style={{ paddingBlock: 0 }}>
          {/* Breadcrumbs */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
            <span>/</span>
            <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>Valuation Models</span>
          </nav>

          <h1 style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--foreground)', margin: '0 0 12px 0' }}>
            Valuation Models & Computational Engines
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-muted)', maxWidth: '780px', lineHeight: 1.5, margin: 0 }}>
            Every fundamental equity valuation framework on Hedger runs on pure, audited mathematics with zero random numbers or black-box estimates. Review methodology, underlying mathematical formulas, and launch workbenches below.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
            <Link
              to="/models/capital-structure"
              style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)', textDecoration: 'none', padding: '6px 12px', borderRadius: '6px', backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}
            >
              Capital Structure Optimizer →
            </Link>
            <Link
              to="/support"
              style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)', textDecoration: 'none', padding: '6px 12px', borderRadius: '6px', backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}
            >
              Methodology Advisory Desk →
            </Link>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '24px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'All Valuation Engines' },
              { id: 'dcf', label: 'Discounted Cash Flow' },
              { id: 'financial', label: 'Financial Institutions & Banks' },
              { id: 'expectations', label: 'Expectation Inversion' },
              { id: 'macro', label: 'Macro & Scenarios' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id as any)}
                style={{
                  height: '36px',
                  padding: '0 16px',
                  borderRadius: '9999px',
                  fontSize: '13px',
                  fontWeight: selectedCategory === tab.id ? 600 : 500,
                  backgroundColor: selectedCategory === tab.id ? 'var(--foreground)' : 'var(--secondary)',
                  color: selectedCategory === tab.id ? 'var(--bg)' : 'var(--foreground)',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Model Cards Grid */}
      <main className="page-container" style={{ padding: '40px 0 80px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {filteredModels.map((model) => (
            <div
              key={model.id}
              style={{
                borderRadius: '16px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--card-bg, #09090b)',
                padding: '32px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--secondary)',
                        color: 'var(--foreground)',
                        border: '1px solid var(--border)'
                      }}
                    >
                      {model.badge}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Best for: {model.target}
                    </span>
                  </div>
                  <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', margin: 0, color: 'var(--foreground)' }}>
                    {model.title}
                  </h2>
                </div>

                {/* Generic Inspect Action Button (No company ticker specified) */}
                <button
                  onClick={() => navigate(model.actionUrl)}
                  style={{
                    height: '44px',
                    minHeight: '44px',
                    padding: '0 20px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--foreground)',
                    color: 'var(--bg)',
                    fontSize: '13px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  className="hover:opacity-90"
                >
                  <span>{model.actionLabel}</span>
                  <span>→</span>
                </button>
              </div>

              {/* Summary */}
              <p style={{ fontSize: '14px', lineHeight: 1.5, color: 'var(--foreground)', margin: 0 }}>
                {model.summary}
              </p>

              {/* Mathematical Formula Visual Presentation Image */}
              <div
                style={{
                  padding: '24px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--bg-subtle, #121215)',
                  border: '1px solid var(--border)',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
                }}
              >
                <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Audited Mathematical Formula
                </div>
                
                {/* Rendered Visual Math Formula Graphic */}
                <div style={{ padding: '8px 0', overflowX: 'auto', display: 'flex', alignItems: 'center' }}>
                  {model.formulaImage}
                </div>
              </div>

              {/* Detailed Calculation Explanation */}
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {model.explanation}
              </div>

              {/* Comprehensive Variable Glossary Defining All Terms */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Audited Terms & Variable Definitions
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                  {model.variables.map((v, vIdx) => (
                    <div
                      key={vIdx}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--secondary)',
                        border: '1px solid var(--border)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--foreground)' }}>
                          {v.symbol}
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
                          ({v.name})
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                        {v.definition}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Factor Inputs Breakdown */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  Critical Computation Factors & Assumptions
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                  {model.factors.map((f, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--bg)',
                        border: '1px solid var(--border)'
                      }}
                    >
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '2px' }}>
                        {f.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                        {f.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ))}
        </div>
      </main>
    </div>
  );
};
