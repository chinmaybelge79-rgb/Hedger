import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { TrendingUp, BarChart3, Brain, ArrowRight, ChevronLeft } from 'lucide-react';

const MODELS = [
  {
    id: 'dcf',
    number: '01',
    title: 'DCF',
    icon: <TrendingUp className="w-5 h-5" />,
    desc: 'Discounted cash flow · WACC · terminal growth',
    tags: ['85% accuracy', '60 min'],
  },
  {
    id: 'valuation',
    number: '02',
    title: 'Valuation',
    icon: <BarChart3 className="w-5 h-5" />,
    desc: 'Intrinsic value across methodologies',
    tags: ['80% accuracy', '45 min'],
  },
  {
    id: 'ai',
    number: '03',
    title: 'AI Analysis',
    icon: <Brain className="w-5 h-5" />,
    desc: 'Synthesized investment assessment',
    tags: ['High', 'Instant'],
  },
];

export function ModelsPage() {
  return (
    <div id="view-models" className="view">
      <div className="wrap pt-8">
        <div className="eyebrow mb-6 flex items-center gap-2">
          <Link to="/" className="text-ash underline underline-offset-2 hover:text-ink flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" /> Home
          </Link>
          <span className="text-ash">&middot;</span>
          <span>Models</span>
        </div>
        <div className="max-w-[720px]">
          <h1 className="font-bold tracking-tight mb-4" style={{ fontSize: '40px' }}>Three models.<br />One comparison.</h1>
          <p className="text-graphite leading-relaxed">Every ticker runs DCF, valuation, and AI analysis. Click a model to open its ticker trace — assumptions are editable in the ticker view. Founder-built by Chinmay Belge.</p>
        </div>
        <div className="mt-6 grid md:grid-cols-3 gap-1 border border-hairline rounded-card overflow-hidden" id="modelsGrid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {MODELS.map((m) => (
            <Link key={m.id} to="/ticker/AAPL" className="card border-none rounded-none p-4 hover:bg-fog transition-colors duration-normal">
              <div className="flex items-center gap-2 mb-1">
                <span className="p-2 bg-fog rounded-[4px] text-ink">{m.icon}</span>
                <span className="mono text-[10px] tracking-widest uppercase text-ash">{m.number}</span>
              </div>
              <h3 className="text-lg font-semibold mb-1">{m.title}</h3>
              <p className="text-graphite text-sm leading-relaxed mb-3">{m.desc}</p>
              <div className="flex items-center justify-between pt-3 border-t border-hairline">
                <div className="flex gap-1.5">
                  {m.tags.map(t => <span key={t} className="mono text-[10px] border border-hairline px-2 py-0.5 rounded-full text-ash">{t}</span>)}
                </div>
                <ArrowRight className="w-4 h-4 text-ash group-hover:text-ink transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}