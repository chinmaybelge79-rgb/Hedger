import { useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Check, X, ChevronLeft } from 'lucide-react';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    monthly: 0,
    annual: 0,
    period: '/ forever',
    description: 'For exploring',
    features: [
      { label: 'Stocks to analyse', value: '5 stocks', included: true },
      { label: '3 financial statements', included: true },
      { label: 'Valuation + DCF', included: true },
      { label: 'AI Analysis', included: true },
      { label: 'Download financials', included: false },
      { label: 'Assumption editing', included: false },
      { label: 'Watchlist', included: false },
    ],
    cta: { label: 'Get started free', variant: 'secondary' as const },
  },
  {
    id: 'pro',
    name: 'Pro',
    monthly: 24,
    annual: 19,
    period: '/ month',
    description: 'Billed annually',
    badge: 'Most chosen',
    features: [
      { label: 'Stocks to analyse', value: 'Unlimited', included: true },
      { label: '3 financial statements', included: true },
      { label: 'Valuation + DCF', included: true },
      { label: 'AI Analysis', included: true },
      { label: 'Download financials & analysis', included: true },
      { label: 'Assumption editing', included: true },
      { label: 'Unlimited watchlists', included: true },
      { label: 'Devices', value: '1 device', included: true },
    ],
    cta: { label: 'Start Pro trial — 14 days', variant: 'primary' as const },
  },
  {
    id: 'team',
    name: 'Team',
    monthly: 59,
    annual: 49,
    period: '/ month',
    description: 'Everything unlimited',
    features: [
      { label: 'Stocks to analyse', value: 'Unlimited', included: true },
      { label: '3 financial statements', included: true },
      { label: 'Valuation + DCF', included: true },
      { label: 'AI Analysis', included: true },
      { label: 'Download financials & analysis', included: true },
      { label: 'Unlimited everything', included: true },
      { label: 'Devices', value: 'Up to 3', included: true },
    ],
    cta: { label: 'Start Team trial', variant: 'secondary' as const },
  },
];

export function PricingPage() {
  const [annual, setAnnual] = useState(true);

  const price = (plan: typeof PLANS[0]) => annual ? plan.annual : plan.monthly;

  return (
    <div id="view-pricing" className="view">
      <div className="wrap pt-8">
        <div className="eyebrow mb-6 flex items-center gap-2">
          <Link to="/" className="text-ash underline underline-offset-2 hover:text-ink flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" /> Home
          </Link>
          <span className="text-ash">&middot;</span>
          <span>Pricing</span>
        </div>
        <div className="mb-10 grid md:grid-cols-[1fr_auto] gap-6 items-end">
          <div>
            <h1 className="font-bold tracking-tight" style={{ fontSize: '40px' }}>Pricing. No "Most Popular" ribbon.</h1>
            <p className="text-graphite mt-2 max-w-[520px]">Three plans, hairline-ruled. Founder-led by Chinmay Belge. The content sells it — annual saves 20%.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="mono text-[12px] text-ash">Billing</span>
            <Button variant={annual ? 'primary' : 'secondary'} onClick={() => setAnnual(!annual)}>
              {annual ? 'Annual · save 20%' : 'Monthly'}
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {PLANS.map((plan) => (
            <div key={plan.id} className={cn('card flex flex-col', plan.id === 'pro' && 'border-t-2 border-ink')}>
              <div className={cn('p-5 border-b border-hairline', plan.id === 'pro' && 'bg-fog')}>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-xl font-semibold">{plan.name}</span>
                  {plan.badge && <span className="mono text-[11px] tracking-wider uppercase text-ash">{plan.badge}</span>}
                </div>
                <div className="mono text-3xl tracking-tight mb-1">
                  ${price(plan)} <span className="text-[12px] text-ash">{plan.period}</span>
                </div>
                <div className="mono text-[11px] text-ash">{plan.description}</div>
              </div>
              <div className="p-4 flex-1 flex flex-col gap-3 text-sm text-graphite">
                {plan.features.map((f, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{f.label}</span>
                    {typeof f.value === 'string' ? (
                      <span className="mono text-ink">{f.value}</span>
                    ) : f.included ? (
                      <Check className="w-4 h-4 text-ink flex-shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-ash flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-hairline">
                <Button className="w-full justify-center" variant={plan.cta.variant} onClick={() => { alert(plan.id === 'free' ? 'Free — no card required.' : plan.id === 'pro' ? 'Pro — annual billing.' : 'Team — annual billing.'); }}>
                  {plan.cta.label}
                </Button>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center mt-4 mono text-[11px] text-ash">All prices USD. Free forever, no card required. Pro trial is 14 days.</p>
        <div className="mt-6 grid md:grid-cols-3 gap-4 border border-hairline rounded-card p-4">
          <div>
            <div className="mono text-[11px] tracking-wider uppercase text-ash mb-2">FAQ</div>
            <div className="text-graphite text-sm leading-relaxed">
              <strong className="text-ink">Can I do this without paying?</strong><br />
              Yes. Create a free account and explore. Paying unlocks editing and exports, not the data.
            </div>
          </div>
          <div>
            <div className="text-graphite text-sm leading-relaxed">
              <strong className="text-ink">Do you provide investment advice?</strong><br />
              No. Hedger is a calculation and comparison tool. It does not recommend buys or sells.
            </div>
          </div>
          <div>
            <div className="text-graphite text-sm leading-relaxed">
              <strong className="text-ink">What data source do you use?</strong><br />
              SEC EDGAR for filings, consensus estimates where noted. Every figure cites its source line.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}