import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Search, ArrowRight, Check, X, TrendingUp, BarChart3, Brain, Zap, ChevronLeft } from 'lucide-react';

export function HomePage() {
  return (
    <div id="view-home" className="view active flex flex-col items-center min-h-[calc(100vh-64px-160px)] pb-10">
      <section className="wrap hero--minimal text-center">
        <div className="eyebrow flex items-center justify-center gap-3 mb-6">
          <span className="w-5 h-px bg-ash" />
          <span>INSTITUTIONAL VALUATION PLATFORM</span>
          <span className="w-5 h-px bg-ash" />
        </div>
        <h1 className="font-bold tracking-tight leading-[0.92] max-w-[14ch] mx-auto mb-6" style={{ fontSize: 'clamp(48px, 7vw, 88px)' }}>
          Understand<br />
          the true value<br />
          <span className="text-ash">of any company</span>
        </h1>
        <p className="text-graphite max-w-[520px] mx-auto mb-10" style={{ fontSize: '17px', lineHeight: '1.6' }}>
          Institutional grade valuations in minutes.
        </p>

        <div className="search-wrap max-w-[640px] mx-auto" role="button" tabIndex={0} onClick={() => document.getElementById('cmdInput')?.focus()} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); document.getElementById('cmdInput')?.focus(); } }} aria-label="Search tickers" style={{ cursor: 'pointer' }}>
          <div className="search-bar lp-search flex items-center border border-ink rounded-search bg-paper h-14 overflow-hidden max-w-[640px]">
            <div className="search-icon flex items-center justify-center w-13 flex-shrink-0 text-ash">
              <Search className="w-5 h-5" />
            </div>
            <input
              id="cmdInput"
              className="search-input flex-1 border-none outline-none bg-transparent text-base text-ink px-1 h-full"
              type="text"
              placeholder="Search any ticker..."
              autoComplete="off"
              aria-label="Search tickers"
            />
            <button className="search-btn flex-shrink-0 h-full border-none border-l border-ink bg-ink text-paper text-xs tracking-wider uppercase px-5.5 cursor-pointer transition-colors duration-normal min-w-[88px]">
              Search
            </button>
          </div>
        </div>

        <div className="search-hints mt-4 flex gap-4 flex-wrap justify-center items-center">
          <span className="text-[11px] text-ash">Popular:</span>
          {['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'TSLA'].map((sym) => (
            <Link key={sym} to={`/ticker/${sym}`} className="mono text-[11px] text-graphite font-semibold tracking-wide border-b border-hairline pb-px hover:text-ink transition-colors">
              {sym}
            </Link>
          ))}
        </div>
      </section>

      <section className="wrap pt-8 pb-10">
        <div className="border-t border-ink border-b border-hairline bg-paper py-3 overflow-x-auto scrollbar-none">
          <div className="sig-models flex gap-0 items-stretch flex-shrink-0 whitespace-nowrap" id="sigModels">
            {[
              { k: 'DCF', v: '$387.20', d: 'WACC 8.5% \u00B7 g 3.0%', delta: '\u25BC 6.1%' },
              { k: 'VALUATION', v: '$401.10', d: 'Median 3 models', delta: '\u25BC 2.7%' },
              { k: 'AI ANALYSIS', v: 'Strong Buy', d: 'Conviction 87%', delta: '\u25B2 to price' },
            ].map((m, i) => (
              <Link key={m.k} to="/models" className={cn(
                'model-cell flex items-center gap-2 px-4.5 py-2.5 border-l border-hairline min-w-[132px]',
                i === 0 && 'border-l-0'
              )}>
                <div className="flex flex-col items-start">
                  <span className="model-key">{m.k}</span>
                  <span className="model-val">{m.v}</span>
                  <span className="model-desc">{m.d}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="wrap py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="eyebrow mb-4">01</div>
            <h2 className="font-bold tracking-tight leading-tight mb-4" style={{ fontSize: 'clamp(32px, 4vw, 48px)' }}>
              The market has a price.<br />
              <span className="text-ash">We have a model.</span>
            </h2>
            <p className="text-graphite leading-relaxed">Every assumption is transparent. Every number traced to its filing line.</p>
          </div>
          <div className="card p-6">
            <div className="flex justify-between mb-2">
              <span className="mono text-[10px] tracking-widest uppercase text-ash">Overvalued</span>
              <span className="mono text-[10px] tracking-widest uppercase text-ash">Fair Value</span>
              <span className="mono text-[10px] tracking-widest uppercase font-semibold text-ink">Undervalued</span>
            </div>
            <div className="h-2 rounded-full bg-gradient-to-r from-hairline via-hairline to-hairline relative mb-6" style={{ background: 'linear-gradient(to right, var(--hairline) 0%, var(--hairline) 30%, var(--ash) 50%, var(--graphite) 75%, var(--ink) 100%)' }}>
              <div className="absolute left-[35%] top-1/2 w-3 h-3 rounded-full border-2 border-ink bg-paper -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute left-[72%] top-1/2 w-[10px] h-[10px] rounded-full bg-ink -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="flex justify-between mt-4 border-t border-hairline pt-4">
              <div>
                <div className="mono text-[10px] tracking-widest uppercase text-ash mb-1">Market Price</div>
                <div className="text-3xl font-bold tracking-tight">$412.34</div>
              </div>
              <div className="text-right">
                <div className="mono text-[10px] tracking-widest uppercase text-ash mb-1">Intrinsic Value</div>
                <div className="text-3xl font-bold tracking-tight">$387.20</div>
              </div>
            </div>
            <div className="text-center mt-3"><span className="mono text-[13px] text-graphite font-semibold">\u25BC 6.1% to model median</span></div>
          </div>
        </div>
      </section>

      <section className="wrap py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="card p-6 order-2 lg:order-1">
            <div className="flex justify-between mb-4">
              <span className="mono text-[10px] tracking-widest uppercase text-ash">WACC \u00D7 Terminal Growth Rate</span>
              <span className="mono text-[10px] tracking-widest uppercase text-ash">Implied Upside</span>
            </div>
            <div className="grid grid-cols-6 gap-1">
              <div></div>
              {['8.5%', '9.5%', '10.5%', '11.5%', '12.5%'].map(w => <div key={w} className="mono text-[10px] text-ash text-center py-1.5">{w}</div>)}
              <div className="mono text-[10px] text-ash py-2">3.0%</div>
              <div className="bg-fog rounded-[4px] p-2 text-center text-[12px] font-medium">+82%</div>
              <div className="bg-fog rounded-[4px] p-2 text-center text-[12px] font-medium">+61%</div>
              <div className="bg-fog rounded-[4px] p-2 text-center text-[12px] font-medium">+44%</div>
              <div className="bg-fog rounded-[4px] p-2 text-center text-[12px] font-medium">+29%</div>
              <div className="bg-fog rounded-[4px] p-2 text-center text-[12px] font-medium">+17%</div>
              <div className="mono text-[10px] text-ash py-2">4.0%</div>
              <div className="bg-fog rounded-[4px] p-2 text-center text-[12px] font-medium">+68%</div>
              <div className="bg-fog rounded-[4px] p-2 text-center text-[12px] font-medium">+48%</div>
              <div className="bg-fog rounded-[4px] p-2 text-center text-[12px] font-medium">+32%</div>
              <div className="bg-fog rounded-[4px] p-2 text-center text-[12px] font-medium">+19%</div>
              <div className="bg-fog rounded-[4px] p-2 text-center text-[12px] font-medium">+8%</div>
              <div className="mono text-[10px] text-ash py-2">5.0%</div>
              <div className="bg-fog rounded-[4px] p-2 text-center text-[12px] font-medium">+54%</div>
              <div className="bg-fog rounded-[4px] p-2 text-center text-[12px] font-medium">+36%</div>
              <div className="bg-fog rounded-[4px] p-2 text-center text-[12px] font-medium text-ink font-bold">+22%</div>
              <div className="bg-fog rounded-[4px] p-2 text-center text-[12px] font-medium">+10%</div>
              <div className="bg-fog rounded-[4px] p-2 text-center text-[12px] font-medium">+1%</div>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <div className="eyebrow mb-4">02</div>
            <h2 className="font-bold tracking-tight leading-tight mb-4" style={{ fontSize: 'clamp(32px, 4vw, 48px)' }}>
              Every number<br />
              <span className="text-ash">explained.</span>
            </h2>
            <p className="text-graphite leading-relaxed">No black boxes. Edit any assumption, see how it ripples through the model.</p>
          </div>
        </div>
      </section>

      <section className="wrap py-16 border-t border-hairline">
        <div className="text-center mb-10">
          <div className="eyebrow flex items-center justify-center gap-3 mb-3">
            <span className="w-5 h-px bg-ash" />
            <span>3 MODELS</span>
            <span className="w-5 h-px bg-ash" />
          </div>
          <h2 className="font-bold tracking-tight mb-2" style={{ fontSize: 'clamp(28px, 3.5vw, 40px)' }}>Professional valuation models</h2>
          <p className="text-graphite max-w-[520px] mx-auto leading-relaxed">Three focused valuation approaches. Each includes full methodology, formulas, and guidance on when to use it.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {[
            { icon: <TrendingUp className="w-5 h-5" />, title: 'DCF', desc: 'Discounted cash flow with editable assumptions and sensitivity analysis.', tags: ['85% accuracy', '60 min'] },
            { icon: <BarChart3 className="w-5 h-5" />, title: 'Valuation', desc: 'Intrinsic value across multiple independent methodologies.', tags: ['80% accuracy', '45 min'] },
            { icon: <Brain className="w-5 h-5" />, title: 'AI Analysis', desc: 'Synthesized investment assessment and conviction scoring.', tags: ['High', 'Instant'] },
          ].map((m, i) => (
            <Link key={m.title} to="/ticker/AAPL" className="card p-5 hover:border-ink transition-colors duration-normal group">
              <div className="flex items-center gap-2 mb-2">
                <span className="p-2 bg-fog rounded-[4px] text-ink">{m.icon}</span>
                <span className="mono text-[10px] tracking-widest uppercase text-ash">{i + 1}</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">{m.title}</h3>
              <p className="text-graphite text-sm leading-relaxed mb-3 flex-1">{m.desc}</p>
              <div className="flex gap-2 pt-3 border-t border-hairline">
                {m.tags.map(t => <span key={t} className="mono text-[10px] border border-hairline px-2 py-0.5 rounded-full text-ash">{t}</span>)}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="wrap py-20 text-center">
        <h2 className="font-bold tracking-tight mb-3" style={{ fontSize: 'clamp(28px, 3.5vw, 40px)' }}>Built by investors, for investors.</h2>
        <p className="text-graphite max-w-[480px] mx-auto mb-7 leading-relaxed">Multiple perspectives over single-model certainty. Every table cites its source line, every assumption is editable.</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Button size="lg" onClick={() => document.getElementById('cmdInput')?.focus()}>Start searching</Button>
          <Button variant="secondary" size="lg" asChild>
            <Link to="/models">View all 3 models</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}