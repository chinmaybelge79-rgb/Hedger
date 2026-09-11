import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { cn, formatCurrency, formatCompactNumber } from '../lib/utils';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Table, Thead, Tbody, Tr, Th, Td, TableWrapper } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { useFinancials } from '../hooks/useCompanies';
import { ChevronLeft, Download } from 'lucide-react';

const TABS = [
  { id: 'income', label: 'Income Statement' },
  { id: 'balance', label: 'Balance Sheet' },
  { id: 'cashflow', label: 'Cash Flow' },
];

export function FinancialsPage() {
  const { ticker } = useParams<{ ticker: string }>();
  const [activeTab, setActiveTab] = useState('income');
  const [annual, setAnnual] = useState(true);

  const { data: financials, isLoading } = useFinancials(ticker || null, annual ? 'annual' : 'quarterly', 5);

  if (!ticker) return null;

  const getData = () => {
    if (!financials) return [];
    switch (activeTab) {
      case 'income': return financials.incomeStatement;
      case 'balance': return financials.balanceSheet;
      case 'cashflow': return financials.cashFlow;
      default: return financials.incomeStatement;
    }
  };

  const columns = ['', 'FY20', 'FY21', 'FY22', 'FY23', 'FY24'];

  // Metric label → API field, per statement tab (matches FinancialsResponse shape)
  const METRICS: Record<string, Array<[string, string]>> = {
    income: [
      ['Revenue', 'revenue'],
      ['Gross Profit', 'grossProfit'],
      ['Operating Income', 'operatingIncome'],
      ['Pretax Income', 'pretaxIncome'],
      ['Tax Expense', 'taxExpense'],
      ['Net Income', 'netIncome'],
      ['Diluted EPS', 'dilutedEPS'],
    ],
    balance: [
      ['Cash & Equivalents', 'cashAndEquivalents'],
      ['Marketable Securities', 'marketableSecurities'],
      ['Total Assets', 'totalAssets'],
      ['Total Debt', 'totalDebt'],
      ['Total Liabilities', 'totalLiabilities'],
      ['Shareholders Equity', 'shareholdersEquity'],
    ],
    cashflow: [
      ['Net Income', 'netIncome'],
      ['D&A', 'depreciationAmortization'],
      ['Operating Cash Flow', 'operatingCashFlow'],
      ['Capital Expenditure', 'capitalExpenditure'],
      ['Free Cash Flow', 'freeCashFlow'],
    ],
  };

  // API returns periods newest-first; table columns run FY20 → FY24 (oldest → newest)
  const data = getData().slice().reverse();

  // Map each period row to its column index by fiscal year
  const colByIndex = data.map(row => {
    const fy = 'FY' + (row.periodEnd?.slice(2, 4) ?? '');
    return columns.indexOf(fy);
  });

  const renderMetricRow = ([label, field]: [string, string]) => {
    const cells = columns.slice(1).map((_, colIdx) => {
      const rowIdx = colByIndex.indexOf(colIdx + 1);
      const row = rowIdx >= 0 ? (data[rowIdx] as unknown as Record<string, unknown>) : null;
      if (!row) return '—';
      const val = row[field];
      if (val === null || val === undefined) return '—';
      if (typeof val === 'number') return formatCompactNumber(val);
      return String(val);
    });
    return (
      <Tr key={label} striped>
        <Td>{label}</Td>
        {cells.map((v, i) => <Td key={i} numeric>{v}</Td>)}
      </Tr>
    );
  };

  const metricRows = METRICS[activeTab] ?? METRICS.income;

  return (
    <div id="view-financials" className="view">
      <div className="wrap pt-8 pb-15">
        <div className="eyebrow mb-6 flex items-center gap-2">
          <Link to={`/ticker/${ticker}`} className="text-ash underline underline-offset-2 hover:text-ink flex items-center gap-1">
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 5l-6 6 6 6"/></svg>
            Back
          </Link>
          <span className="text-ash">&middot;</span>
          <span>Financial Statements</span>
        </div>
        <h1 id="finTickerName" className="text-2xl font-bold mb-2">{ticker}</h1>
        <p id="finTickerSym" className="mono text-[13px] text-ash mb-6">{ticker} · {annual ? 'Annual' : 'Quarterly'}</p>
        <div className="flex gap-2 mb-4">
          <Button variant={!annual ? 'primary' : 'secondary'} onClick={() => setAnnual(false)}>Quarterly</Button>
          <Button variant={annual ? 'primary' : 'secondary'} onClick={() => setAnnual(true)}>Annual</Button>
        </div>
        <div className="flex gap-0 border-b border-hairline mb-4">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-5 py-2.5 text-sm tracking-wider uppercase font-semibold border-b-2 transition-colors duration-normal',
                activeTab === tab.id
                  ? 'border-ink text-ink'
                  : 'border-transparent text-ash hover:text-graphite'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <Card className="rounded-t-none border-t-0">
          <TableWrapper>
            <Table>
              <Thead>
                <Tr>
                  {columns.map((col, i) => (
                    <Th key={col} numeric={i > 0}>{col}</Th>
                  ))}
                </Tr>
              </Thead>
              <Tbody>
                {isLoading ? (
                  <Tr><Td colSpan={columns.length} className="text-center py-8 text-ash">Loading...</Td></Tr>
                ) : data.length === 0 ? (
                  <Tr><Td colSpan={columns.length} className="text-center py-8 text-ash">No data available</Td></Tr>
                ) : (
                  metricRows.map(renderMetricRow)
                )}
              </Tbody>
            </Table>
          </TableWrapper>
        </Card>
      </div>
    </div>
  );
}