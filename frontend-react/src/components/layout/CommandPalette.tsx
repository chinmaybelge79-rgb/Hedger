import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';
import { Search, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useSearch } from '../../hooks/useSearch';
import { useNavigate } from 'react-router-dom';

const UNIVERSE = [
  { sym: 'AAPL', name: 'Apple Inc.', exch: 'NASDAQ' },
  { sym: 'MSFT', name: 'Microsoft Corp.', exch: 'NASDAQ' },
  { sym: 'GOOGL', name: 'Alphabet Inc.', exch: 'NASDAQ' },
  { sym: 'GOOG', name: 'Alphabet Inc.', exch: 'NASDAQ' },
  { sym: 'AMZN', name: 'Amazon.com Inc.', exch: 'NASDAQ' },
  { sym: 'NVDA', name: 'NVIDIA Corp.', exch: 'NASDAQ' },
  { sym: 'TSLA', name: 'Tesla Inc.', exch: 'NASDAQ' },
  { sym: 'META', name: 'Meta Platforms Inc.', exch: 'NASDAQ' },
  { sym: 'BRK.B', name: 'Berkshire Hathaway Inc.', exch: 'NYSE' },
  { sym: 'JPM', name: 'JPMorgan Chase & Co.', exch: 'NYSE' },
  { sym: 'JNJ', name: 'Johnson & Johnson', exch: 'NYSE' },
  { sym: 'V', name: 'Visa Inc.', exch: 'NYSE' },
  { sym: 'WMT', name: 'Walmart Inc.', exch: 'NYSE' },
  { sym: 'PG', name: 'Procter & Gamble Co.', exch: 'NYSE' },
  { sym: 'UNH', name: 'UnitedHealth Group Inc.', exch: 'NYSE' },
  { sym: 'HD', name: 'Home Depot Inc.', exch: 'NYSE' },
  { sym: 'MA', name: 'Mastercard Inc.', exch: 'NYSE' },
  { sym: 'DIS', name: 'Walt Disney Co.', exch: 'NYSE' },
  { sym: 'PYPL', name: 'PayPal Holdings Inc.', exch: 'NASDAQ' },
  { sym: 'ADBE', name: 'Adobe Inc.', exch: 'NASDAQ' },
  { sym: 'NFLX', name: 'Netflix Inc.', exch: 'NASDAQ' },
  { sym: 'CRM', name: 'Salesforce Inc.', exch: 'NYSE' },
  { sym: 'INTC', name: 'Intel Corp.', exch: 'NASDAQ' },
  { sym: 'CSCO', name: 'Cisco Systems Inc.', exch: 'NASDAQ' },
  { sym: 'PFE', name: 'Pfizer Inc.', exch: 'NYSE' },
  { sym: 'KO', name: 'Coca-Cola Co.', exch: 'NYSE' },
  { sym: 'PEP', name: 'PepsiCo Inc.', exch: 'NASDAQ' },
  { sym: 'T', name: 'AT&T Inc.', exch: 'NYSE' },
  { sym: 'VZ', name: 'Verizon Communications Inc.', exch: 'NYSE' },
  { sym: 'XOM', name: 'Exxon Mobil Corp.', exch: 'NYSE' },
  { sym: 'CVX', name: 'Chevron Corp.', exch: 'NYSE' },
  { sym: 'LLY', name: 'Eli Lilly and Co.', exch: 'NYSE' },
  { sym: 'ABBV', name: 'AbbVie Inc.', exch: 'NYSE' },
  { sym: 'MRK', name: 'Merck & Co. Inc.', exch: 'NYSE' },
  { sym: 'TMO', name: 'Thermo Fisher Scientific Inc.', exch: 'NYSE' },
  { sym: 'AVGO', name: 'Broadcom Inc.', exch: 'NASDAQ' },
  { sym: 'ORCL', name: 'Oracle Corp.', exch: 'NYSE' },
  { sym: 'COST', name: 'Costco Wholesale Corp.', exch: 'NASDAQ' },
].sort((a, b) => a.sym.localeCompare(b.sym));

export function CommandPalette() {
  const { isOpen, open, close } = useSearch();
  const navigate = useNavigate();
  const { searchCompanies } = useCompanySearch();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [results, setResults] = useState<typeof UNIVERSE>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const filteredResults = useMemo(() => {
    if (!query.trim()) return UNIVERSE.slice(0, 8);
    const q = query.trim().toUpperCase();
    return UNIVERSE.filter(u => u.sym.startsWith(q) || u.name.toUpperCase().includes(q));
  }, [query]);

  const handleSelect = (symbol: string) => {
    close();
    navigate(`/ticker/${symbol}`);
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setQuery('');
      setSelectedIndex(-1);
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      document.body.style.overflow = '';
    }
    return () => document.body.style.overflow = '';
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      const items = filteredResults;
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, items.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedIndex >= 0 && filteredResults[selectedIndex]) {
          handleSelect(filteredResults[selectedIndex].sym);
        } else if (items.length > 0) {
          handleSelect(items[0].sym);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredResults, selectedIndex, close]);

  if (!isOpen) return null;

  return createPortal(
    (() => {
      return (
        <div
          ref={overlayRef}
          className="cmd-overlay fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-start justify-center pt-[18vh]"
          onClick={(e) => { if (e.target === overlayRef.current) close(); }}
          role="dialog"
          aria-label="Search tickers"
        >
          <div className="cmd-dialog w-[560px] max-w-[92vw] bg-paper border border-hairline rounded-dialog shadow-cmd overflow-hidden animate-cmdSlideIn">
            <div className="cmd-input-wrap flex items-center px-4 border-b border-hairline">
              <Search className="w-5 h-5 text-ash flex-shrink-0" aria-hidden="true" />
              <input
                ref={inputRef}
                id="cmdInput"
                className="cmd-input flex-1 h-13 border-none outline-none bg-transparent text-base text-ink font-sans px-3"
                type="text"
                placeholder="Search tickers, companies..."
                autoComplete="off"
                aria-label="Search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(-1);
                }}
                onFocus={() => setSelectedIndex(-1)}
              />
              <div className="cmd-badge flex items-center gap-1">
                <Kbd>ESC</Kbd>
              </div>
            </div>

            <div className="cmd-results max-h-[340px] overflow-y-auto p-1.5" role="listbox" id="cmdResults">
              {isLoading ? (
                <div className="cmd-empty py-7 text-center text-[13px] text-ash">Loading...</div>
              ) : filteredResults.length === 0 ? (
                <div className="cmd-empty py-7 text-center text-[13px] text-ash">No results for "{query}"</div>
              ) : (
                <>
                  <div className="cmd-section px-2.5 py-1 text-[11px] tracking-wide uppercase text-ash font-medium">
                    {query ? 'RESULTS' : 'SUGGESTED'}
                  </div>
                  {filteredResults.map((item, index) => (
                    <button
                      key={item.sym}
                      type="button"
                      role="option"
                      tabIndex={-1}
                      className={cn(
                        'cmd-item flex items-center gap-3 px-3 py-2.5 rounded-cmd-item cursor-pointer transition-colors duration-fast',
                        index === selectedIndex && 'active bg-fog'
                      )}
                      onClick={() => handleSelect(item.sym)}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <span className="cmd-item-sym w-[56px] flex-shrink-0 text-[13px] font-semibold tracking-wide">{item.sym}</span>
                      <span className="cmd-item-name text-[13px] text-graphite flex-1 truncate">{item.name}</span>
                      <span className="cmd-item-meta text-[11px] text-ash flex-shrink-0">{item.exch}</span>
                      <span className="cmd-item-arrow text-[13px] text-ash opacity-0 transition-opacity duration-fast group-hover:opacity-100">
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </button>
                  ))}
                </>
              )}
            </div>

            <div className="cmd-footer flex items-center gap-4 px-4 py-2.5 border-t border-hairline bg-fog">
              <span className="flex items-center gap-1 text-[11px] text-ash">
                <ChevronUp className="w-3 h-3" /><ChevronDown className="w-3 h-3" /> navigate
              </span>
              <span className="flex items-center gap-1 text-[11px] text-ash">
                <Kbd>Enter</Kbd> select
              </span>
              <span className="flex items-center gap-1 text-[11px] text-ash">
                <Kbd>ESC</Kbd> close
              </span>
            </div>
          </div>
        </div>
      );
    })(),
    document.body
  );
}