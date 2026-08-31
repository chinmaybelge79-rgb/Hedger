import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { cn, formatCurrency, formatPercent, formatCompactNumber, formatDelta } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useCompanyProfile, useCompanyPriceHistory, useMarketData, useFinancials } from '../hooks/useCompanies';
import { useWacc, useDcf, useValuationSummary, useRisk, useConfidence } from '../hooks/useValuation';
import { ChevronLeft, ChevronRight, TrendingUp, BarChart3, Brain, FileText, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area } from 'recharts';

const CHART_COLORS = {
  stock: '#2d8a4e',
  inflation: '#999',
  '7pct': '#6baed6',
  '10pct': '#74c476',
  '15pct': '#fdae6b',
};

const TABS = ['income', 'balance', 'cashflow'];

export function TickerPage() {
  const { ticker } = useParams<{ ticker: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('income');
  const [annual, setAnnual] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [benchmarks, setBenchmarks] = useState<any[]>([]);
  const [isUp, setIsUp] = useState(true);

  const { data: profile } = useCompanyProfile(ticker || null);
  const { data: priceHistory } = useCompanyPriceHistory(ticker || null, 7);
  const { data: marketData } = useMarketData(ticker || null);
  const { data: financials } = useFinancials(ticker || null, annual ? 'annual' : 'quarterly', 5);
  const { data: summary } = useValuationSummary(ticker || null);
  const { data: risk } = useRisk(ticker || null);
  const { data: confidence } = useConfidence(ticker || null);

  useEffect(() => {
    if (priceHistory && priceHistory.length > 0) {
      const data = priceHistory;
      const startPrice = data[0].close;
      const n = data.length;

      const inflation = data.map((d, i) => {
        const yr = (i / (n - 1)) * 7;
        return { date: d.date, value: startPrice * Math.pow(1.025, yr), name: 'Inflation (2.5%)' };
      });
      const ret7 = data.map((d, i) => {
        const yr = (i / (n - 1)) * 7;
        return { date: d.date, value: startPrice * Math.pow(1.07, yr), name: '7% Return' };
      });
      const ret10 = data.map((d, i) => {
        const yr = (i / (n - 1)) * 7;
        return { date: d.date, value: startPrice * Math.pow(1.10, yr), name: '10% Return' };
      });
      const ret15 = data.map((d, i) => {
        const yr = (i / (n - 1)) * 7;
        return { date: d.date, value: startPrice * Math.pow(1.15, yr), name: '15% Return' };
      });

      const lastPrice = data[n - 1].close;
      const peak = Math.max(...data.map(d => d.close));
      const trough = Math.min(...data.map(d => d.close));
      const up = lastPrice >= peak - (peak - trough) * 0.05;

      setIsUp(up);
      setChartData(data);
      setBenchmarks([{ data: inflation, color: CHART_COLORS.inflation, dash: '6 4', name: 'Inflation (2.5%)' },
        { data: ret7, color: CHART_COLORS['7pct'], dash: '4 4', name: '7% Return' },
        { data: ret10, color: CHART_COLORS['10pct'], dash: '4 4', name: '10% Return' },
        { data: ret15, color: CHART_COLORS['15pct'], dash: '4 4', name: '15% Return' }]);
    }
  }, [priceHistory]);

  if (!ticker) return navigate('/');

  const price = marketData?.snapshot?.price || 0;
  const change = marketData?.snapshot?.change || 0;
  const changePercent = marketData?.snapshot?.changePercent || 0;
  const mcap = marketData?.snapshot?.marketCap ? formatCompactNumber(marketData.snapshot.marketCap) : '\u2014';

  const delta = formatDelta(price, price - change);

  return (
    <div id="view-ticker" className="view">
      <div className="border-b border-hairline bg-paper" id="tickerBar">
        <div className="wrap flex items-center gap-4 h-12 text-sm overflow-x-auto whitespace-nowrap">
          <span className="mono font-semibold tracking-wide">{ticker}</span>
          <span>{profile?.identity?.name}</span>
          <span className="mono font-semibold">${price.toFixed(2)}</span>
          <span className="mono text-[12px]">
            <span className="delta">{delta.value}</span>
          </span>
          <span className="text-[11px] text-ash">Mkt Cap {mcap}</span>
          <span className="ml-auto text-[11px] text-ash">Data as of {new Date().toLocaleDateString()}</span>
        </div>
      </div>

      <div className="wrap pt-6 pb-15">
        <div className="mb-6 flex items-center gap-2">
          <Link to="/" className="text-ash hover:text-ink flex items-center gap-1 text-sm">
            <ChevronLeft className="w-4 h-4" /> Home
          </Link>
          <ChevronRight className="w-4 h-4 text-ash" />
          <span className="mono font-semibold">{ticker}</span>
        </div>

        <div>
          <h1 className="flex items-baseline gap-3 flex-wrap font-bold tracking-tight" style={{ fontSize: 'clamp(32px, 4vw, 44px)', lineHeight: '1' }}>
            <span>{profile?.identity?.name}</span>
            <span className="mono text-[16px] text-ash font-normal">({ticker})</span>
          </h1>
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <span className="mono text-3xl tracking-tight font-semibold">${price.toFixed(2)}</span>
            <span className="delta">{delta.value}</span>
          </div>
          <p className="text-graphite mt-3 text-[14px] leading-relaxed">{profile?.identity?.name} operates in the {profile?.identity?.sector} sector.</p>
        </div>

        <Card className="mt-6">
          <div className="px-5 py-4 border-b border-hairline flex justify-between items-center">
            <span className="mono text-[11px] tracking-wider uppercase text-ash">7Y Price</span>
            <span className="mono text-[11px] tracking-wider uppercase font-semibold" style={{ color: isUp ? '#2d8a4e' : '#c0392b' }}>
              {isUp ? 'UPTREND' : 'DOWNTREND'}
            </span>
          </div>
          <CardContent className="p-5">
            <div style={{ width: '100%', height: '400px', position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <defs>
                    <linearGradient id="stockAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS.stock} stopOpacity={0.18} />
                      <stop offset="100%" stopColor={CHART_COLORS.stock} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 6" stroke="var(--hairline)" vertical={false} opacity={0.5} />
                  <XAxis dataKey="date" tickFormatter={(v) => format(new Date(v), 'yyyy')} tick={{ fill: 'var(--ash)', fontSize: 10, fontFamily: 'monospace' }} />
                  <YAxis orientation="right" tickFormatter={v => '$' + formatCompactNumber(v)} tick={{ fill: 'var(--ash)', fontSize: 10, fontFamily: 'monospace' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--paper)', border: '1px solid var(--hairline)', borderRadius: '2px' }}
                    labelFormatter={v => format(new Date(v), 'MMM d, yyyy')}
                    formatter={(value: number) => [formatCurrency(value), 'Price']}
                  />
                  <Legend
                    layout="horizontal"
                    align="center"
                    verticalAlign="bottom"
                    height={36}
                    wrapperStyle={{ paddingTop: 8 }}
                  />
                  {benchmarks.map((b, i) => (
                    <Line
                      key={b.name}
                      type="monotone"
                      data={b.data}
                      xKey="date"
                      yKey="value"
                      stroke={b.color}
                      strokeWidth={i === 0 ? 1.2 : 1}
                      strokeDasharray={b.dash}
                      dot={false}
                      opacity={i === 0 ? 1 : 0.7}
                    />
                  ))}
                  <Area
                    type="monotone"
                    data={chartData}
                    xKey="date"
                    yKey="close"
                    stroke={CHART_COLORS.stock}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#stockAreaGrad)"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    data={chartData}
                    xKey="date"
                    yKey="close"
                    stroke={CHART_COLORS.stock}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-4 gap-4 mt-6" id="modelCards" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {[
            { icon: <BarChart3 className="w-5 h-5" />, title: 'Valuation', desc: 'Intrinsic value across multiple independent methodologies' },
            { icon: <TrendingUp className="w-5 h-5" />, title: 'DCF', desc: 'Discounted cash flow with editable assumptions and sensitivity' },
            { icon: <Brain className="w-5 h-5" />, title: 'AI Analysis', desc: 'Synthesized investment assessment and conviction scoring' },
            { icon: <FileText className="w-5 h-5" />, title: 'Financials', desc: 'Income statement, balance sheet, and cash flow data' },
          ].map((m, i) => (
            <Link key={m.title} to={i === 3 ? `/financials/${ticker}` : `/ticker/${ticker}`} className={cn('card p-5 hover:border-ink transition-colors duration-normal flex flex-col', i === 3 && 'cursor-pointer')}>
              <div className="flex items-center gap-2 mb-2">
                <span className="p-2 bg-fog rounded-[4px] text-ink">{m.icon}</span>
                <span className="mono text-[10px] tracking-wider uppercase text-ash">Model</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">{m.title}</h3>
              <p className="text-graphite text-sm leading-relaxed mb-3 flex-1">{m.desc}</p>
              <div className="flex justify-end pt-3 border-t border-hairline">
                <span className="text-ash">\u2192</span>
              </div>
            </Link>
          ))}
        </div>

        {summary && (
          <section className="mt-10">
            <h2 className="text-xl font-semibold mb-4">Valuation Summary</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardHeader title="DCF" subtitle={`WACC ${summary.models?.dcf ? '\u2014' : ''}`} />
                <CardContent>
                  <div className="text-3xl font-bold">${summary.models?.dcf ? summary.models.dcf.toFixed(2) : '\u2014'}</div>
                  <div className="text-sm text-graphite mt-1">Fair Value</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader title="Comps" subtitle="Median multiples" />
                <CardContent>
                  <div className="text-3xl font-bold">${summary.models?.comps ? summary.models.comps.toFixed(2) : '\u2014'}</div>
                  <div className="text-sm text-graphite mt-1">Fair Value</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader title="Consensus" subtitle="Weighted average" />
                <CardContent>
                  <div className="text-3xl font-bold">${summary.consensus?.fairValue ? summary.consensus.fairValue.toFixed(2) : '\u2014'}</div>
                  <div className="text-sm text-graphite mt-1">Upside: {formatPercent(summary.consensus?.upside)}</div>
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        <section className="mt-10">
          <h2 className="text-xl font-semibold mb-4">Risk & Confidence</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {risk && (
              <Card>
                <CardHeader title="Risk Analysis" subtitle={`Overall Score: ${risk.overallScore}/100`} />
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm"><span>Business Risk</span><span className="font-medium">{risk.businessRisk}</span></div>
                    <div className="flex justify-between text-sm"><span>Financial Risk</span><span className="font-medium">{risk.financialRisk}</span></div>
                    <div className="flex justify-between text-sm"><span>Valuation Risk</span><span className="font-medium">{risk.valuationRisk}</span></div>
                    <div className="flex justify-between text-sm"><span>Growth Risk</span><span className="font-medium">{risk.growthRisk}</span></div>
                    <div className="flex justify-between text-sm"><span>Margin Risk</span><span className="font-medium">{risk.marginRisk}</span></div>
                    <div className="flex justify-between text-sm"><span>Leverage Risk</span><span className="font-medium">{risk.leverageRisk}</span></div>
                    <div className="flex justify-between text-sm"><span>Cash Flow Risk</span><span className="font-medium">{risk.cashFlowRisk}</span></div>
                    <div className="flex justify-between text-sm"><span>Market Risk</span><span className="font-medium">{risk.marketRisk}</span></div>
                  </div>
                </CardContent>
              </Card>
            )}
            {confidence && (
              <Card>
                <CardHeader title="Confidence Score" subtitle={`Grade: ${confidence.grade}`} />
                <CardContent>
                  <div className="text-4xl font-bold mb-4">{confidence.score}</div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span>Data Quality</span><span className="font-medium">{confidence.components.dataQuality}</span></div>
                    <div className="flex justify-between"><span>Model Agreement</span><span className="font-medium">{confidence.components.modelAgreement}</span></div>
                    <div className="flex justify-between"><span>Assumption Stability</span><span className="font-medium">{confidence.components.assumptionStability}</span></div>
                    <div className="flex justify-between"><span>Financial Quality</span><span className="font-medium">{confidence.components.financialQuality}</span></div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}