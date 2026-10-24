import React, { useState } from 'react';
import {
  Button,
  Input,
  Select,
  Card,
  Stat,
  Delta,
  Badge,
  FreshnessBadge,
  Tabs,
  SegmentedControl,
  Kbd,
  Dialog
} from '@hedger/ui';
import { formatPrice, formatCompact, formatPercent, formatMultiple } from '@hedger/format';
import { Sparkline } from '../components/Sparkline.js';

export const DesignPage: React.FC = () => {
  const [tab, setTab] = useState('components');
  const [segment, setSegment] = useState('1Y');
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Design System & Architecture
          </h1>
          <p className="page-subtitle">
            Strict Apple-minimalist aesthetic combined with Koyfin tabular precision: White major, Black minor, Green upside, Red downside.
          </p>
        </div>
      </div>

      <Tabs
        items={[
          { id: 'components', label: 'UI Components' },
          { id: 'tokens', label: 'Strict Color Tokens' },
          { id: 'formatting', label: 'Formatting Examples' }
        ]}
        activeId={tab}
        onChange={setTab}
        className="mb-8"
      />

      {tab === 'components' && (
        <div className="flex flex-col gap-10">
          {/* Buttons */}
          <section>
            <h3 className="text-sm font-semibold text-[#1D1D1F] mb-3">1. Buttons</h3>
            <div className="flex flex-wrap gap-3 items-center">
              <Button variant="primary" size="md">Primary Action</Button>
              <Button variant="secondary" size="md">Secondary Action</Button>
              <Button variant="ghost" size="md">Ghost Action</Button>
              <Button variant="primary" size="sm">Small Primary</Button>
              <Button variant="secondary" size="sm">Small Secondary</Button>
              <Button variant="primary" disabled>Disabled State</Button>
            </div>
          </section>

          {/* Form Controls */}
          <section>
            <h3 className="text-sm font-semibold text-[#1D1D1F] mb-3">2. Inputs & Selects</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
              <Input placeholder="Search company or ticker..." />
              <Input placeholder="Invalid field state..." error />
              <Select>
                <option>Annual Reporting</option>
                <option>Quarterly Reporting</option>
              </Select>
            </div>
          </section>

          {/* Badges & Freshness */}
          <section>
            <h3 className="text-sm font-semibold text-[#1D1D1F] mb-3">3. Badges & Freshness</h3>
            <div className="flex flex-wrap gap-3 items-center">
              <Badge variant="neutral">NSE · Equity</Badge>
              <Badge variant="up">Undervalued (+18.4%)</Badge>
              <Badge variant="down">Overvalued (−12.1%)</Badge>
              <FreshnessBadge type="LIVE" source="Direct Feed" />
              <FreshnessBadge type="DELAYED" detail="15m" />
              <FreshnessBadge type="EOD" detail="22 Oct 2026" />
              <FreshnessBadge type="CALCULATED" />
            </div>
          </section>

          {/* Stats & Deltas */}
          <section>
            <h3 className="text-sm font-semibold text-[#1D1D1F] mb-3">4. Stat Cards & Deltas</h3>
            <div className="grid-3">
              <Card className="card">
                <Stat
                  label="Reliance Industries"
                  value="₹1,184.50"
                  delta={<Delta value={-0.0202} />}
                  meta="Delayed 15m · NSE"
                />
              </Card>
              <Card className="card">
                <Stat
                  label="Apple Inc."
                  value="$345.11"
                  delta={<Delta value={0.0032} />}
                  meta="Real-time · NASDAQ"
                />
              </Card>
              <Card className="card">
                <Stat
                  label="Intrinsic Value Delta"
                  value="+18.4%"
                  delta={<Delta value={0.184} />}
                  meta="Intrinsic Value: ₹1,380.00"
                />
              </Card>
            </div>
          </section>

          {/* Segmented Controls & Kbd */}
          <section>
            <h3 className="text-sm font-semibold text-[#1D1D1F] mb-3">5. Segmented Controls & Keybindings</h3>
            <div className="flex items-center gap-6">
              <SegmentedControl
                options={[
                  { label: '1M', value: '1M' },
                  { label: '6M', value: '6M' },
                  { label: '1Y', value: '1Y' },
                  { label: '5Y', value: '5Y' }
                ]}
                value={segment}
                onChange={setSegment}
              />
              <div className="flex items-center gap-2 text-xs text-[#6E6E73]">
                <span>Spotlight shortcut:</span>
                <Kbd>⌘</Kbd>
                <Kbd>K</Kbd>
              </div>
            </div>
          </section>

          {/* Sparklines & Financial Micro-Visuals */}
          <section>
            <h3 className="text-sm font-semibold text-[#1D1D1F] mb-3">6. Financial Sparklines (Koyfin Precision)</h3>
            <div className="flex flex-wrap items-center gap-6 p-4 rounded-xl border border-[#E5E5EA] bg-white">
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#6E6E73]">Positive Trend:</span>
                <Sparkline data={[100, 102, 101, 105, 104, 108, 112]} isPositive={true} width={80} height={22} />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#6E6E73]">Negative Trend:</span>
                <Sparkline data={[112, 109, 110, 105, 103, 104, 98]} isPositive={false} width={80} height={22} />
              </div>
            </div>
          </section>

          {/* Dialog */}
          <section>
            <h3 className="text-sm font-semibold text-[#1D1D1F] mb-3">7. Modal Dialog</h3>
            <Button size="sm" onClick={() => setDialogOpen(true)}>Open Modal Dialog</Button>
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="System Dialog">
              <p className="text-xs text-[#6E6E73] mb-4 leading-relaxed">
                Clean modal with no backdrop blur distortions or layout clipping, styled to Apple minimalist guidelines.
              </p>
              <Button size="sm" onClick={() => setDialogOpen(false)}>Close Dialog</Button>
            </Dialog>
          </section>
        </div>
      )}

      {tab === 'tokens' && (
        <div className="grid-4">
          <Card subtle className="card-subtle">
            <div className="w-full h-14 rounded-md border border-[#E5E5EA] bg-[#FFFFFF] mb-3" />
            <div className="text-xs font-semibold text-[#1D1D1F]">Primary Background (White)</div>
            <div className="text-[11px] text-[#6E6E73] font-mono">#FFFFFF</div>
          </Card>
          <Card subtle className="card-subtle">
            <div className="w-full h-14 rounded-md border border-[#E5E5EA] bg-[#F9F9FB] mb-3" />
            <div className="text-xs font-semibold text-[#1D1D1F]">Secondary Surface (Subtle)</div>
            <div className="text-[11px] text-[#6E6E73] font-mono">#F9F9FB</div>
          </Card>
          <Card subtle className="card-subtle">
            <div className="w-full h-14 rounded-md border border-[#B7E4C7] bg-[#107C41] mb-3" />
            <div className="text-xs font-semibold text-[#1D1D1F]">Positive Value / Upside</div>
            <div className="text-[11px] text-[#6E6E73] font-mono">#107C41 (Restrained Green)</div>
          </Card>
          <Card subtle className="card-subtle">
            <div className="w-full h-14 rounded-md border border-[#F8C8C8] bg-[#D32F2F] mb-3" />
            <div className="text-xs font-semibold text-[#1D1D1F]">Negative Value / Downside</div>
            <div className="text-[11px] text-[#6E6E73] font-mono">#D32F2F (Clean Red)</div>
          </Card>
        </div>
      )}

      {tab === 'formatting' && (
        <div className="card">
          <h3 className="text-sm font-semibold text-[#1D1D1F] mb-4">
            Formatting Precision (Phase 02 Specifications)
          </h3>
          <div className="flex flex-col gap-3 text-xs">
            <div className="flex justify-between py-2 border-b border-[#E5E5EA]">
              <span className="text-[#6E6E73]">₹1,45,000.50 (Indian locale grouping, 2 dp)</span>
              <strong className="font-mono text-[#1D1D1F]">{formatPrice({ amount: '145000.50', currency: 'INR' })}</strong>
            </div>
            <div className="flex justify-between py-2 border-b border-[#E5E5EA]">
              <span className="text-[#6E6E73]">19.6 Trillion INR (Lakh Crore format)</span>
              <strong className="font-mono text-[#1D1D1F]">{formatCompact({ amount: 19600000000000, currency: 'INR' }, 'indian')}</strong>
            </div>
            <div className="flex justify-between py-2 border-b border-[#E5E5EA]">
              <span className="text-[#6E6E73]">19.6 Trillion INR (International compact format)</span>
              <strong className="font-mono text-[#1D1D1F]">{formatCompact({ amount: 19600000000000, currency: 'INR' }, 'intl')}</strong>
            </div>
            <div className="flex justify-between py-2 border-b border-[#E5E5EA]">
              <span className="text-[#6E6E73]">1.25 Million USD</span>
              <strong className="font-mono text-[#1D1D1F]">{formatCompact({ amount: 1250000, currency: 'USD' })}</strong>
            </div>
            <div className="flex justify-between py-2 border-b border-[#E5E5EA]">
              <span className="text-[#6E6E73]">Negative P/E (Not Meaningful)</span>
              <strong className="font-mono text-[#1D1D1F]">{formatMultiple(-3.2)}</strong>
            </div>
            <div className="flex justify-between py-2 border-b border-[#E5E5EA]">
              <span className="text-[#6E6E73]">Signed Percentage with True Minus (U+2212)</span>
              <strong className="font-mono text-[#D32F2F]">{formatPercent(-0.0015)}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};