import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Mail, ChevronRight, X, Linkedin, Github } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer border-t border-ink pt-8 pb-10">
      <div className="wrap">
        <div className="footer-grid grid gap-8">
          <div className="col-span-1 lg:col-span-1.4">
            <Link to="/" className="footer-logo inline-block mb-4" aria-label="Hedger Home">
              <svg width="120" height="32" viewBox="0 0 120 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <text x="0" y="24" fontFamily="Open Sans, sans-serif" fontSize="24" fontWeight="800" letterSpacing="0.14em" fill="currentColor">HEDGER</text>
              </svg>
            </Link>
            <p className="text-graphite max-w-[320px] leading-relaxed mb-3">
              Multiple perspectives over single-model certainty. Institutional-grade valuation, rendered in black and white.
            </p>
            <p className="text-graphite text-[13px] leading-relaxed mb-3 max-w-[320px]">
              Made by <strong>Chinmay Belge</strong> — founder and investor of Hedger. Designed, built, and data-engineered by Chinmay.
            </p>
            <p className="mono text-[11px] text-ash">
              © {currentYear} Hedger Research LLC · New York<br />
              Not investment advice. Do your own work.
            </p>
          </div>

          <div>
            <h5>Product</h5>
            <nav className="footer-links">
              <Link to="/pricing">Pricing</Link>
              <Link to="/changelog">Changelog</Link>
            </nav>
          </div>

          <div>
            <h5>Resources</h5>
            <nav className="footer-links">
              <Link to="/glossary">Filing glossary</Link>
              <Link to="/about">About</Link>
              <Link to="/by-chinmay">By Chinmay Belge</Link>
            </nav>
          </div>

          <div className="newsletter border border-hairline rounded-card p-4 bg-fog">
            <h5 className="mb-2">Get the weekly breakdown</h5>
            <p className="text-graphite text-[12px] leading-relaxed mb-3">
              One ticker, three models, one email. No spam, no marketing. Example: MSFT last week.
            </p>
            <form onSubmit={(e) => { e.preventDefault(); e.currentTarget.querySelector('button')!.textContent = 'Subscribed ✓'; e.currentTarget.querySelector('button')!.classList.add('bg-fog'); }}>
              <label className="mono text-[11px] tracking-wider uppercase text-ash block mb-1">Email</label>
              <input type="email" placeholder="you@firm.com" required className="w-full border-none border-b border-hairline bg-transparent py-2 text-[13px] outline-none placeholder:text-ash mb-3" />
              <Button type="submit" className="w-full text-btn">Subscribe — free</Button>
            </form>
            <p className="mono text-[10px] text-ash mt-2">By subscribing you agree to receive Hedger emails. Unsubscribe anytime.</p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-hairline flex flex-col md:flex-row justify-between gap-4 flex-wrap">
          <span className="mono text-[11px] text-ash">
            Hedger uses grayscale only: Paper #FFFFFF · Ink #0A0A0A · Graphite #4A4A4A · Ash #8A8A8A · Hairline #E4E4E4 · Fog #F7F7F7
          </span>
          <span className="mono text-[11px] text-ash">Built for photocopying</span>
        </div>
      </div>
    </footer>
  );
}