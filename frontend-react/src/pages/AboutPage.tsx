import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export function AboutPage() {
  return (
    <div id="view-about" className="view">
      <div className="wrap pt-8 pb-15 max-w-[720px]">
        <div className="eyebrow mb-6 flex items-center gap-2">
          <Link to="/" className="text-ash underline underline-offset-2 hover:text-ink flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" /> Home
          </Link>
          <span className="text-ash">&middot;</span>
          <span>About</span>
        </div>
        <h1 className="text-2xl font-bold mb-8">About Hedger</h1>

        <div className="prose prose-gray max-w-none">
          <p className="text-graphite leading-relaxed mb-4">
            Hedger is an institutional-grade valuation platform built for investors, portfolio managers, and analysts who demand transparency over black-box outputs.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">Philosophy</h2>
          <p className="text-graphite leading-relaxed mb-4">
            The market has a price. We have a model. Actually, we have multiple models — and that's the point.
            Single-model certainty is dangerous. Multiple perspectives reveal the range of reasonable outcomes,
            the sensitivity of assumptions, and the risks that a single number hides.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">What Makes Hedger Different</h2>
          <ul className="list-disc list-inside space-y-3 text-graphite leading-relaxed mb-8">
            <li><strong>Every assumption is editable.</strong> Change revenue growth, margins, WACC, terminal growth — see the impact instantly.</li>
            <li><strong>Every number is sourced.</strong> Financial statements trace to SEC filings. Consensus estimates are labeled.</li>
            <li><strong>Multiple models, one view.</strong> DCF, Comps, SOTP, DDM, Residual Income, EVA — all in one place.</li>
            <li><strong>Risk and confidence built-in.</strong> Not just a fair value, but a confidence score and risk decomposition.</li>
            <li><strong>No black boxes.</strong> The math is shown. The formulas are visible. The logic is traceable.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-4">Models Included</h2>
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {[
              'DCF (Discounted Cash Flow)',
              'Reverse DCF',
              'Comparable Companies',
              'Sum-of-the-Parts (SOTP)',
              'Dividend Discount Model (Gordon / 2-Stage / 3-Stage)',
              'Residual Income',
              'EVA (Economic Value Added)',
              'WACC Calculator',
            ].map((m) => (
              <div key={m} className="p-3 border border-hairline rounded-card bg-fog text-sm text-graphite">{m}</div>
            ))}
          </div>

          <h2 className="text-xl font-semibold mt-8 mb-4">Analytics</h2>
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {[
              'Sensitivity Analysis (WACC × Terminal Growth)',
              'Scenario Analysis (Bear / Base / Bull)',
              'Monte Carlo Simulation',
              'Risk Decomposition (9 categories)',
              'Confidence Score (4 components)',
            ].map((a) => (
              <div key={a} className="p-3 border border-hairline rounded-card bg-fog text-sm text-graphite">{a}</div>
            ))}
          </div>

          <h2 className="text-xl font-semibold mt-8 mb-4">Data Sources</h2>
          <p className="text-graphite leading-relaxed mb-4">
            SEC EDGAR for filed financial statements. Consensus estimates from major providers where noted.
            Every figure in every table cites its source line and period.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">The Builder</h2>
          <p className="text-graphite leading-relaxed mb-4">
            Built by <strong>Chinmay Belge</strong> — founder and investor of Hedger.
            Designed, built, and data-engineered by Chinmay.
          </p>

          <div className="mt-10 pt-6 border-t border-hairline">
            <p className="text-graphite text-sm leading-relaxed">
              <strong className="text-ink">Disclaimer:</strong> Hedger is a calculation and comparison tool.
              It does not recommend buys or sells. Not investment advice. Do your own work.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}