import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { companyPath, normalizeSymbol } from '../lib/navigation.js';
import {
  dcf,
  pathsFromSliders,
  sensitivity as computeSensitivity,
  scenarios as computeScenarios,
  reverseDcf as computeReverseDcf,
  wacc as calculateWacc,
  costOfEquity as calculateKe,
  blume as calculateBlume,
  residualIncome as computeResidualIncome,
  ddm as computeDdm,
  isFinancialCompany,
  type DcfInputs,
  type DcfResult
} from '@hedger/valuation';
import type { InstitutionalDcfInputsPackage } from '@hedger/types';
import {
  formatPrice,
  formatCompact
} from '@hedger/format';

/**
 * Calculates a pure monochrome linear-gradient for range sliders (White Major, Black Minor).
 * Exactly synchronizes the active track with the thumb position with zero overlap or bleed.
 */
function getSliderTrackStyle(value: number, min: number, max: number): React.CSSProperties {
  const minNum = Number(min);
  const maxNum = Number(max);
  const valNum = Number(value);
  const clamped = Math.min(maxNum, Math.max(minNum, valNum));
  const pct = maxNum > minNum ? ((clamped - minNum) / (maxNum - minNum)) * 100 : 0;
  return {
    background: `linear-gradient(to right, var(--primary, #18181B) 0%, var(--primary, #18181B) ${pct}%, var(--border, #E5E5EA) ${pct}%, var(--border, #E5E5EA) 100%)`
  };
}

export const ModelWorkbenchPage: React.FC = () => {
  const { symbol: rawSymbol = 'TCS.NS' } = useParams<{ model?: string; symbol?: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const symbol = normalizeSymbol(rawSymbol || 'TCS.NS');
  const activeTab = searchParams.get('tab') || 'summary';

  // Backend Data Package
  const [pkg, setPkg] = useState<InstitutionalDcfInputsPackage | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Editable Assumptions State
  // 1. Growth
  const [growth5y, setGrowth5y] = useState<number>(8.0);
  const [terminalGrowth, setTerminalGrowth] = useState<number>(4.0);

  // 2. Margins & Reinvestment
  const [baseMargin, setBaseMargin] = useState<number>(18.0);
  const [targetMargin, setTargetMargin] = useState<number>(20.0);
  const [taxRate, setTaxRate] = useState<number>(25.0);
  const [terminalTaxRate, setTerminalTaxRate] = useState<number>(25.17);
  const [salesToCapital, setSalesToCapital] = useState<number>(1.5);
  const [roicTerminalAuto, setRoicTerminalAuto] = useState<boolean>(true);
  const [roicTerminalCustom, setRoicTerminalCustom] = useState<number>(12.0);

  // 3. Discount Rate (WACC)
  const [waccOverride, setWaccOverride] = useState<string>(''); // blank = auto
  const [rf, setRf] = useState<number>(7.05);
  const [betaRaw, setBetaRaw] = useState<number>(1.05);
  const [erp, setErp] = useState<number>(5.5);
  const [costOfDebt, setCostOfDebt] = useState<number>(8.25);
  const [debtWeight, setDebtWeight] = useState<number>(15.0);

  const [auditTrail, setAuditTrail] = useState<Array<{ id: string; timestamp: string; text: string }>>([]);
  const hasMountedAuditRef = useRef(false);

  // 4. Bridge Items
  const [baseRevenue, setBaseRevenue] = useState<number>(1000000000);
  const [debt, setDebt] = useState<number>(0);
  const [leases, setLeases] = useState<number>(0);
  const [preferred, setPreferred] = useState<number>(0);
  const [minorities, setMinorities] = useState<number>(0);
  const [cash, setCash] = useState<number>(0);
  const [nonOperating, setNonOperating] = useState<number>(0);
  const [dilutedShares, setDilutedShares] = useState<number>(100000000);
  const [marketPrice, setMarketPrice] = useState<number>(100);

  // 5. Model Configuration Toggles
  const [midYear, setMidYear] = useState<boolean>(true);
  const [leaseTreatment, setLeaseTreatment] = useState<'debt' | 'operating'>('debt');
  const [terminalMethod, setTerminalMethod] = useState<'value-driver' | 'plain'>('value-driver');

  // 6. Bank Specific Assumptions
  const [bv0, setBv0] = useState<number>(1000000000);
  const [roe10y, setRoe10y] = useState<number[]>([15, 15, 14, 14, 13, 13, 12, 12, 12, 12]);
  const [payoutRatio, setPayoutRatio] = useState<number>(20.0);
  const [keBank, setKeBank] = useState<number>(12.5);
  const [omega, setOmega] = useState<number>(0.70);
  const [ddmGrowth, setDdmGrowth] = useState<number>(4.0);

  // 7. Scenarios probabilities
  const [probBear, setProbBear] = useState<number>(25);
  const [probBase, setProbBase] = useState<number>(50);
  const [probBull, setProbBull] = useState<number>(25);

  // 8. Reverse DCF Driver
  const [reverseDriver, setReverseDriver] = useState<'growth' | 'margin' | 'wacc'>('growth');

  // UI States
  const [copyCsvSuccess, setCopyCsvSuccess] = useState<boolean>(false);
  const [saveModalOpen, setSaveModalOpen] = useState<boolean>(false);
  const [saveNotes, setSaveNotes] = useState<string>('');
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [switcherSymbol, setSwitcherSymbol] = useState<string>('');
  const [exportMenuOpen, setExportMenuOpen] = useState<boolean>(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close export menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false);
      }
    };
    if (exportMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [exportMenuOpen]);

  // Fetch Institutional DCF Inputs Package
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setFetchError(null);

    fetch(`/api/v1/instruments/${encodeURIComponent(symbol)}/dcf-inputs`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          const err = body?.error || `Unavailable: Filings not available for ${symbol}`;
          throw new Error(err);
        }
        return res.json();
      })
      .then((data: InstitutionalDcfInputsPackage) => {
        if (!isMounted) return;
        setPkg(data);

        // Populate state from canonical package
        setBaseRevenue(data.baseRevenue.value);
        setGrowth5y(data.growth5y.value * 100);
        setTerminalGrowth(data.terminalGrowth.value * 100);
        setBaseMargin(data.baseMargin.value * 100);
        setTargetMargin(data.targetMargin.value * 100);
        setTaxRate(data.taxRate.value * 100);
        setTerminalTaxRate(data.terminalTaxRate.value * 100);
        setSalesToCapital(data.salesToCapital.value);
        setRoicTerminalCustom(data.roicTerminal.value * 100);

        setRf(data.riskFreeRate.value * 100);
        setBetaRaw(data.betaRaw.value);
        setErp(data.erp.value * 100);
        setCostOfDebt(data.costOfDebt.value * 100);
        setDebtWeight(data.debtWeight.value * 100);

        setDebt(data.debt.value);
        setLeases(data.leases.value);
        setPreferred(data.preferred.value);
        setMinorities(data.minorities.value);
        setCash(data.cash.value);
        setNonOperating(data.nonOperating.value);
        setDilutedShares(data.dilutedShares.value);
        setMarketPrice(data.currentPrice);

        setMidYear(data.midYear);
        setLeaseTreatment(data.leaseTreatment);
        setTerminalMethod(data.terminalMethod);

        if (data.bv0) setBv0(data.bv0.value);
        if (data.roe10y) setRoe10y(data.roe10y.value.map((r) => r * 100));
        if (data.payoutRatio) setPayoutRatio(data.payoutRatio.value * 100);
        if (data.ke) setKeBank(data.ke.value * 100);
        if (data.omega) setOmega(data.omega.value);
        if (data.ddmGrowth) setDdmGrowth(data.ddmGrowth.value * 100);

        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setFetchError(err.message);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [symbol]);

  // Sync tab with URL
  const handleTabChange = (tab: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      return next;
    });
  };

  // Live WACC calculation
  const blumeBeta = useMemo(() => {
    return calculateBlume(betaRaw).toNumber();
  }, [betaRaw]);

  const computedKe = useMemo(() => {
    return calculateKe({ rf: rf / 100, beta: blumeBeta, erp: erp / 100 }).toNumber();
  }, [rf, blumeBeta, erp]);

  const effectiveTaxForWacc = (terminalTaxRate || 25.17) / 100;
  const computedWacc = useMemo(() => {
    const dW = Math.max(0, Math.min(0.9, debtWeight / 100));
    const eW = 1 - dW;
    const ke = computedKe;
    const kd = costOfDebt / 100;
    const raw = calculateWacc({
      ke,
      kd,
      tax: effectiveTaxForWacc,
      equity: eW * 100,
      debt: dW * 100
    }).toNumber();
    return Math.max(0.05, Math.min(0.25, raw));
  }, [computedKe, costOfDebt, effectiveTaxForWacc, debtWeight]);

  const activeWacc = useMemo(() => {
    if (waccOverride.trim() !== '') {
      const parsed = parseFloat(waccOverride);
      if (!isNaN(parsed) && parsed > 0) return parsed / 100;
    }
    return computedWacc;
  }, [waccOverride, computedWacc]);

  useEffect(() => {
    if (!hasMountedAuditRef.current) {
      hasMountedAuditRef.current = true;
      return;
    }
    const time = new Date().toLocaleTimeString();
    setAuditTrail((prev) => [
      {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: time,
        text: `WACC parameter updated to ${(activeWacc * 100).toFixed(2)}% (Growth: ${growth5y.toFixed(1)}%)`
      },
      ...prev.slice(0, 9)
    ]);
  }, [growth5y, terminalGrowth, baseMargin, targetMargin, taxRate, activeWacc]);

  const activeRoicTerminal = useMemo(() => {
    if (roicTerminalAuto) return activeWacc;
    return roicTerminalCustom / 100;
  }, [roicTerminalAuto, activeWacc, roicTerminalCustom]);

  // Determine Company Type & Routing
  const isBankModel = useMemo(() => {
    if (!pkg) return false;
    return (
      pkg.recommendedModel === 'residual_income' ||
      isFinancialCompany(pkg.companyType) ||
      isFinancialCompany(pkg.sector) ||
      isFinancialCompany(pkg.industry)
    );
  }, [pkg]);

  // Assemble pure DCF inputs
  const dcfInputs: DcfInputs = useMemo(() => {
    const sliderPaths = pathsFromSliders({
      baseMargin: baseMargin / 100,
      targetMargin: targetMargin / 100,
      growth5y: growth5y / 100,
      terminalGrowth: terminalGrowth / 100,
      tax: taxRate / 100
    });

    return {
      currency: pkg?.currency || 'INR',
      baseRevenue,
      growth: sliderPaths.growth,
      ebitMargin: sliderPaths.ebitMargin,
      taxRate: sliderPaths.taxRate,
      terminalGrowth: terminalGrowth / 100,
      terminalMargin: targetMargin / 100,
      terminalTax: terminalTaxRate / 100,
      salesToCapital,
      roicTerminal: activeRoicTerminal,
      wacc: activeWacc,
      midYear,
      leaseTreatment,
      terminalMethod,
      bridge: {
        debt,
        leases,
        preferred,
        minorities,
        cash,
        nonOperating
      },
      dilutedShares: Math.max(1, dilutedShares),
      price: marketPrice,
      maxTerminalGrowth: pkg?.country === 'India' ? 0.06 : 0.045
    };
  }, [
    pkg,
    baseRevenue,
    baseMargin,
    targetMargin,
    growth5y,
    terminalGrowth,
    taxRate,
    terminalTaxRate,
    salesToCapital,
    activeRoicTerminal,
    activeWacc,
    midYear,
    leaseTreatment,
    terminalMethod,
    debt,
    leases,
    preferred,
    minorities,
    cash,
    nonOperating,
    dilutedShares,
    marketPrice
  ]);

  // Run pure DCF model calculation
  const dcfResult: DcfResult = useMemo(() => {
    if (isBankModel) {
      return { ok: false, errors: [{ code: 'FINANCIAL_COMPANY', message: 'Bank routed to Residual Income model' }] };
    }
    return dcf(dcfInputs);
  }, [isBankModel, dcfInputs]);

  // Run Bank Residual Income & DDM calculation
  const bankResult = useMemo(() => {
    if (!isBankModel) return null;
    const ri = computeResidualIncome({
      bv0,
      ke: keBank / 100,
      roe: roe10y.map((r) => r / 100),
      payout: Array(10).fill(payoutRatio / 100),
      omega,
      shares: Math.max(1, dilutedShares)
    });
    const dps1 = (bv0 / Math.max(1, dilutedShares)) * (roe10y[0]! / 100) * (payoutRatio / 100);
    const ddmVal = computeDdm({ dps1, ke: keBank / 100, g: ddmGrowth / 100 });
    return { ri, dps1, ddmVal };
  }, [isBankModel, bv0, keBank, roe10y, payoutRatio, omega, dilutedShares, ddmGrowth]);

  // Sensitivity calculation (lazy computed when sensitivity tab is active for 60+ FPS slider performance)
  const sensitivityData = useMemo(() => {
    if (isBankModel || !dcfResult.ok || activeTab !== 'sensitivity') return null;
    return computeSensitivity(dcfInputs, 0.005, 2);
  }, [isBankModel, dcfResult.ok, dcfInputs, activeTab]);

  // Scenarios calculation
  const scenariosData = useMemo(() => {
    if (isBankModel || !dcfResult.ok) return null;
    const bearWacc = Math.min(0.25, Math.max(0.05, activeWacc + 0.01));
    const bearG = Math.min(bearWacc - 0.006, Math.max(0.005, (terminalGrowth - 0.5) / 100));
    const bearShift = {
      wacc: bearWacc,
      terminalGrowth: bearG,
      ...pathsFromSliders({
        baseMargin: Math.max(0.01, (baseMargin - 3) / 100),
        targetMargin: Math.max(0.01, (targetMargin - 3) / 100),
        growth5y: Math.max(-0.1, (growth5y - 4) / 100),
        terminalGrowth: bearG,
        tax: taxRate / 100
      })
    };
    const bullWacc = Math.max(0.05, activeWacc - 0.01);
    const bullG = Math.min(bullWacc - 0.006, Math.min(0.06, (terminalGrowth + 0.5) / 100));
    const bullShift = {
      wacc: bullWacc,
      terminalGrowth: bullG,
      ...pathsFromSliders({
        baseMargin: Math.min(0.6, (baseMargin + 3) / 100),
        targetMargin: Math.min(0.6, (targetMargin + 3) / 100),
        growth5y: Math.min(0.3, (growth5y + 4) / 100),
        terminalGrowth: bullG,
        tax: taxRate / 100
      })
    };

    const pBear = probBear / 100;
    const pBase = probBase / 100;
    const pBull = probBull / 100;

    return computeScenarios(dcfInputs, { bear: bearShift, bull: bullShift }, { bear: pBear, base: pBase, bull: pBull });
  }, [
    isBankModel,
    dcfResult.ok,
    dcfInputs,
    activeWacc,
    baseMargin,
    targetMargin,
    growth5y,
    terminalGrowth,
    taxRate,
    probBear,
    probBase,
    probBull
  ]);

  // Reverse DCF calculation (lazy computed when reverse DCF tab is active)
  const reverseDcfData = useMemo(() => {
    if (isBankModel || !dcfResult.ok || marketPrice <= 0 || activeTab !== 'reverse') return null;
    return computeReverseDcf(dcfInputs, marketPrice, reverseDriver);
  }, [isBankModel, dcfResult.ok, dcfInputs, marketPrice, reverseDriver, activeTab]);

  // Range Bar computations
  const rangeBounds = useMemo(() => {
    if (isBankModel && bankResult) {
      const baseVal = bankResult.ri.valuePerShare.toNumber();
      const riLow = computeResidualIncome({
        bv0,
        ke: (keBank + 1) / 100,
        roe: roe10y.map((r) => r / 100),
        payout: Array(10).fill(payoutRatio / 100),
        omega,
        shares: Math.max(1, dilutedShares)
      }).valuePerShare.toNumber();
      const riHigh = computeResidualIncome({
        bv0,
        ke: Math.max(0.05, (keBank - 1) / 100),
        roe: roe10y.map((r) => r / 100),
        payout: Array(10).fill(payoutRatio / 100),
        omega,
        shares: Math.max(1, dilutedShares)
      }).valuePerShare.toNumber();
      return {
        low: Math.min(riLow, marketPrice * 0.7),
        high: Math.max(riHigh, marketPrice * 1.3),
        base: baseVal
      };
    }
    if (dcfResult.ok) {
      const baseVal = dcfResult.valuePerShare.toNumber();
      const bearVal = scenariosData && scenariosData.bear.ok ? scenariosData.bear.valuePerShare.toNumber() : baseVal * 0.82;
      const bullVal = scenariosData && scenariosData.bull.ok ? scenariosData.bull.valuePerShare.toNumber() : baseVal * 1.25;
      const low = Math.min(bearVal, marketPrice > 0 ? marketPrice : baseVal, baseVal) * 0.9;
      const high = Math.max(bullVal, marketPrice > 0 ? marketPrice : baseVal, baseVal) * 1.1;
      return { low, high, base: baseVal, bear: bearVal, bull: bullVal };
    }
    return null;
  }, [isBankModel, bankResult, dcfResult, scenariosData, bv0, keBank, roe10y, payoutRatio, omega, dilutedShares, marketPrice]);

  // Copy CSV handler
  const handleCopyCsv = () => {
    if (!dcfResult.ok) return;
    const headers = [
      'Year',
      'Phase',
      'Revenue',
      'Growth %',
      'EBIT Margin %',
      'EBIT',
      'Tax Rate %',
      'NOPAT',
      'Reinvestment',
      'FCFF',
      'Discount Factor',
      'PV of FCFF'
    ];
    const rows = dcfResult.rows.map((r) => [
      `Year ${r.t}`,
      r.phase,
      r.revenue.toFixed(0),
      (r.growth.toNumber() * 100).toFixed(2),
      (r.ebitMargin.toNumber() * 100).toFixed(2),
      r.ebit.toFixed(0),
      (r.taxRate.toNumber() * 100).toFixed(2),
      r.nopat.toFixed(0),
      r.reinvestment.toFixed(0),
      r.fcff.toFixed(0),
      r.discountFactor.toFixed(4),
      r.pv.toFixed(0)
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const triggerSuccess = () => {
      setCopyCsvSuccess(true);
      setTimeout(() => setCopyCsvSuccess(false), 2500);
    };
    if (typeof navigator !== 'undefined' && navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(csvContent)
        .then(triggerSuccess)
        .catch(triggerSuccess);
    } else {
      triggerSuccess();
    }
  };

  // Export Model Handler (CSV, Excel, PDF, JSON)
  const handleExport = (format: 'csv' | 'excel' | 'pdf' | 'json') => {
    setExportMenuOpen(false);
    if (!pkg) return;

    const companyName = pkg.name || symbol;
    const curVal = isBankModel
      ? (bankResult?.ri.valuePerShare.toNumber() || 0)
      : (dcfResult.ok ? dcfResult.valuePerShare.toNumber() : 0);
    const evVal = isBankModel
      ? (bankResult?.ri.equity.toNumber() || 0)
      : (dcfResult.ok ? dcfResult.ev.toNumber() : 0);
    const pvExplicitVal = isBankModel ? 0 : (dcfResult.ok ? dcfResult.pvExplicit.toNumber() : 0);
    const pvTvVal = isBankModel ? 0 : (dcfResult.ok ? dcfResult.terminal.pv.toNumber() : 0);
    const totalEquityVal = isBankModel ? (bankResult?.ri.equity.toNumber() || 0) : (dcfResult.ok ? dcfResult.equityValue.toNumber() : 0);

    if (format === 'csv' || format === 'excel') {
      const csvLines: string[] = [];
      csvLines.push(`"Hedger Institutional 10-Year DCF Valuation Model"`);
      csvLines.push(`"Company:","${companyName} (${symbol})"`);
      csvLines.push(`"Date:","${new Date().toISOString().split('T')[0]}"`);
      csvLines.push(`"Currency:","${currency}"`);
      csvLines.push(`"Current Market Price:","${marketPrice.toFixed(2)}"`);
      csvLines.push(`"Implied Fair Value per Share:","${curVal.toFixed(2)}"`);
      csvLines.push(`"Upside / Downside:","${curVal > 0 ? (((curVal - marketPrice) / marketPrice) * 100).toFixed(1) + '%' : 'N/A'}"`);
      csvLines.push('');
      csvLines.push('"Valuation Bridge"');
      csvLines.push(`"PV of Explicit 10Y Cash Flows","${pvExplicitVal.toFixed(0)}"`);
      csvLines.push(`"PV of Terminal Value","${pvTvVal.toFixed(0)}"`);
      csvLines.push(`"Enterprise Value (EV)","${evVal.toFixed(0)}"`);
      csvLines.push(`"Less: Total Debt & Leases","${(debt + leases).toFixed(0)}"`);
      csvLines.push(`"Plus: Cash & Equivalents","${cash.toFixed(0)}"`);
      csvLines.push(`"Total Implied Equity Value","${totalEquityVal.toFixed(0)}"`);
      csvLines.push(`"Diluted Shares Outstanding","${dilutedShares.toFixed(0)}"`);
      csvLines.push(`"Implied Intrinsic Value Per Share","${curVal.toFixed(2)}"`);
      csvLines.push('');
      csvLines.push('"Key Assumptions"');
      csvLines.push(`"5-Year Revenue CAGR","${growth5y.toFixed(2)}%"`);
      csvLines.push(`"Terminal Growth Rate (g)","${terminalGrowth.toFixed(2)}%"`);
      csvLines.push(`"Target Operating Margin","${targetMargin.toFixed(2)}%"`);
      csvLines.push(`"Sales to Capital Ratio","${salesToCapital.toFixed(2)}x"`);
      csvLines.push(`"Effective Cash Tax Rate","${taxRate.toFixed(2)}%"`);
      csvLines.push(`"Weighted Average Cost of Capital (WACC)","${activeWacc.toFixed(2)}%"`);
      csvLines.push('');

      if (!isBankModel && dcfResult.ok) {
        csvLines.push('"10-Year Explicit Financial Projection Schedule"');
        const headers = [
          'Year', 'Phase', 'Revenue', 'Growth %', 'EBIT', 'Margin %', 'Taxes', 'NOPAT', 'Reinvestment', 'FCFF', 'Discount Factor', 'PV of FCFF'
        ];
        csvLines.push(headers.map((h) => `"${h}"`).join(','));
        dcfResult.rows.forEach((r) => {
          csvLines.push([
            `"Year ${r.t}"`,
            `"${r.phase}"`,
            r.revenue.toFixed(0),
            (r.growth.toNumber() * 100).toFixed(2) + '%',
            r.ebit.toFixed(0),
            (r.ebitMargin.toNumber() * 100).toFixed(2) + '%',
            (r.revenue.toNumber() * r.ebitMargin.toNumber() * r.taxRate.toNumber()).toFixed(0),
            r.nopat.toFixed(0),
            r.reinvestment.toFixed(0),
            r.fcff.toFixed(0),
            r.discountFactor.toFixed(4),
            r.pv.toFixed(0)
          ].join(','));
        });
      }

      const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${symbol}_DCF_Model_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSaveToast(`Exported ${symbol} DCF Model to CSV.`);
      setTimeout(() => setSaveToast(null), 3000);
      return;
    }

    if (format === 'json') {
      const exportData = {
        meta: {
          title: 'Hedger Institutional DCF Model',
          company: companyName,
          symbol,
          currency,
          date: new Date().toISOString(),
          marketPrice,
          impliedValuePerShare: curVal
        },
        valuationBridge: {
          pvExplicit10Y: pvExplicitVal,
          pvTerminalValue: pvTvVal,
          enterpriseValue: evVal,
          netDebt: debt + leases - cash,
          dilutedShares,
          impliedSharePrice: curVal
        },
        assumptions: {
          growth5y,
          terminalGrowth,
          baseMargin,
          targetMargin,
          taxRate,
          salesToCapital,
          wacc: activeWacc,
          midYear,
          terminalMethod
        },
        projections: !isBankModel && dcfResult.ok ? dcfResult.rows : null
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${symbol}_DCF_Model_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSaveToast(`Exported ${symbol} DCF Model to JSON.`);
      setTimeout(() => setSaveToast(null), 3000);
      return;
    }

    if (format === 'pdf') {
      const printWindow = window.open('', '_blank');
      const upside = curVal > 0 ? (((curVal - marketPrice) / marketPrice) * 100).toFixed(1) + '%' : 'N/A';
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Hedger Institutional DCF Valuation — ${companyName} (${symbol})</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 32px; color: #111; line-height: 1.5; }
            h1 { font-size: 22px; margin-bottom: 4px; }
            .sub { color: #666; font-size: 13px; margin-bottom: 24px; }
            .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
            .card { border: 1px solid #ddd; padding: 12px 16px; border-radius: 6px; }
            .card-lbl { font-size: 11px; color: #666; text-transform: uppercase; font-weight: 600; }
            .card-val { font-size: 18px; font-weight: 700; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 16px; }
            th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: right; }
            th { background-color: #f5f5f5; font-weight: 600; }
            th:first-child, td:first-child { text-align: left; }
            .footer { margin-top: 32px; font-size: 11px; color: #888; border-top: 1px solid #eee; padding-top: 12px; }
          </style>
        </head>
        <body>
          <h1>Hedger Institutional DCF Valuation Report</h1>
          <div class="sub">${companyName} (${symbol}) · Currency: ${currency} · Valuation Date: ${new Date().toLocaleDateString()}</div>
          <div class="grid">
            <div class="card"><div class="card-lbl">Current Price</div><div class="card-val">${marketPrice.toFixed(2)}</div></div>
            <div class="card"><div class="card-lbl">Implied Fair Value</div><div class="card-val">${curVal.toFixed(2)}</div></div>
            <div class="card"><div class="card-lbl">Implied Upside</div><div class="card-val">${upside}</div></div>
            <div class="card"><div class="card-lbl">WACC</div><div class="card-val">${activeWacc.toFixed(2)}%</div></div>
          </div>
          <h3>Valuation Bridge</h3>
          <table>
            <tr><th>Metric</th><th>Value (${currency})</th></tr>
            <tr><td>PV of Explicit 10-Year Cash Flows</td><td>${pvExplicitVal.toLocaleString()}</td></tr>
            <tr><td>PV of Terminal Value</td><td>${pvTvVal.toLocaleString()}</td></tr>
            <tr><td><strong>Enterprise Value (EV)</strong></td><td><strong>${evVal.toLocaleString()}</strong></td></tr>
            <tr><td>Total Debt & Leases</td><td>(${(debt + leases).toLocaleString()})</td></tr>
            <tr><td>Cash & Equivalents</td><td>${cash.toLocaleString()}</td></tr>
            <tr><td><strong>Total Implied Equity Value</strong></td><td><strong>${(curVal * dilutedShares).toLocaleString()}</strong></td></tr>
            <tr><td>Diluted Share Count</td><td>${dilutedShares.toLocaleString()} shares</td></tr>
            <tr><td><strong>Implied Intrinsic Value Per Share</strong></td><td><strong>${curVal.toFixed(2)}</strong></td></tr>
          </table>
          <div class="footer">Generated by Hedger Terminal · Real-time institutional financial valuation platform. All calculations strictly for quantitative evaluation on own risk.</div>
        </body>
        </html>
      `;

      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
        }, 300);
      } else {
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${symbol}_DCF_Report.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      setSaveToast(`Exported ${symbol} DCF Report.`);
      setTimeout(() => setSaveToast(null), 3000);
    }
  };

  // Save Model Handler
  const handleSaveModel = async () => {
    const curVal = isBankModel
      ? (bankResult?.ri.valuePerShare.toNumber() || 0)
      : (dcfResult.ok ? dcfResult.valuePerShare.toNumber() : 0);
    const mos = curVal > 0 ? (curVal - marketPrice) / curVal : 0;

    const payload = {
      symbol,
      name: pkg?.name || symbol,
      priceAtSave: marketPrice,
      currency: pkg?.currency || 'INR',
      intrinsicValuePerShare: curVal,
      marginOfSafety: mos,
      engineVersion: 'dcf-10y-v2.0-pure-decimal',
      inputs: {
        growth5y,
        terminalGrowth,
        baseMargin,
        targetMargin,
        taxRate,
        salesToCapital,
        wacc: activeWacc,
        midYear,
        terminalMethod,
        leaseTreatment
      },
      notes: saveNotes
    };

    try {
      const res = await fetch('/api/v1/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setSaveModalOpen(false);
        setSaveToast('Model configuration and assumptions saved successfully.');
        setTimeout(() => setSaveToast(null), 3000);
      }
    } catch {
      setSaveToast('Error saving model.');
      setTimeout(() => setSaveToast(null), 3000);
    }
  };

  // Company Switcher Handler
  const handleSwitcherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!switcherSymbol.trim()) return;
    const target = normalizeSymbol(switcherSymbol.trim());
    navigate(`/models/dcf/${encodeURIComponent(target)}`);
    setSwitcherSymbol('');
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', gap: '24px' }}>
          <div style={{ width: '360px', height: '600px', backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)' }} />
          <div style={{ flex: 1, height: '600px', backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)' }} />
        </div>
      </div>
    );
  }

  if (fetchError || !pkg) {
    return (
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '64px 24px', textAlign: 'center' }}>
        <div style={{ padding: '32px', backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', display: 'inline-block', maxWidth: '600px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text)', marginBottom: '12px' }}>
            {fetchError ? (fetchError.startsWith('Unavailable:') ? fetchError : `Unavailable: ${fetchError}`) : 'Unavailable: Unable to load company filing data'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
            Historical financial statements and normalised balance sheet data are not available for {symbol}.
          </p>
          <button
            onClick={() => navigate('/markets')}
            style={{
              padding: '10px 20px',
              backgroundColor: 'var(--primary)',
              color: 'var(--primary-foreground)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 500,
              minHeight: '40px'
            }}
          >
            Explore Market Universe
          </button>
        </div>
      </div>
    );
  }

  const currency = pkg.currency;
  const fmt = (amount: number | null | undefined, cur: string = currency) => {
    if (amount === null || amount === undefined || isNaN(amount)) return '—';
    return formatPrice({ amount, currency: cur });
  };
  const fmtComp = (amount: number | null | undefined, cur: string = currency) => {
    if (amount === null || amount === undefined || isNaN(amount)) return '—';
    return formatCompact({ amount, currency: cur });
  };
  const fmtNum = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined || isNaN(amount)) return '—';
    if (Math.abs(amount) >= 1e9) return `${(amount / 1e9).toFixed(2)} B`;
    if (Math.abs(amount) >= 1e6) return `${(amount / 1e6).toFixed(2)} M`;
    if (Math.abs(amount) >= 1e3) return `${(amount / 1e3).toFixed(1)} K`;
    return amount.toLocaleString();
  };
  const intrinsicVal = isBankModel
    ? bankResult?.ri.valuePerShare.toNumber() || 0
    : (dcfResult.ok ? dcfResult.valuePerShare.toNumber() : 0);
  const deltaPct = marketPrice > 0 ? ((intrinsicVal - marketPrice) / marketPrice) * 100 : 0;
  const isDeltaPositive = deltaPct >= 0;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      {/* 1. STICKY TOP NAVIGATION BAR */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          backgroundColor: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          padding: '12px 24px'
        }}
      >
        <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          {/* Breadcrumbs & Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <Link to="/markets" style={{ color: 'inherit', textDecoration: 'none' }}>Markets</Link>
              <span>/</span>
              <Link to={companyPath(symbol)} style={{ color: 'inherit', textDecoration: 'none' }}>{pkg.symbol}</Link>
              <span>/</span>
              <span style={{ color: 'var(--text)', fontWeight: 600 }}>DCF Model</span>
            </nav>

            <form onSubmit={handleSwitcherSubmit} style={{ display: 'flex', alignItems: 'center', marginLeft: '12px' }}>
              <input
                type="text"
                placeholder="Switch symbol (e.g. NVDA, TCS.NS)..."
                value={switcherSymbol}
                onChange={(e) => setSwitcherSymbol(e.target.value)}
                style={{
                  height: '40px',
                  padding: '0 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: '13px',
                  outline: 'none',
                  minWidth: '220px'
                }}
              />
            </form>
          </div>

          {/* Right Header Actions: Export / Download + Save Model */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {pkg.isSampleData && (
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 8px', borderRadius: '4px', backgroundColor: '#eab308', color: '#000000' }}>
                SAMPLE DATA
              </span>
            )}

            {/* Export / Download Menu */}
            <div style={{ position: 'relative' }} ref={exportMenuRef}>
              <button
                type="button"
                data-testid="dcf-export-btn"
                onClick={() => setExportMenuOpen((prev) => !prev)}
                style={{
                  height: '40px',
                  padding: '0 16px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Export Model</span>
                <span style={{ fontSize: '10px', marginLeft: '2px' }}>{exportMenuOpen ? '▲' : '▼'}</span>
              </button>

              {/* Export Dropdown Popover */}
              {exportMenuOpen && (
                <div
                  data-testid="dcf-export-menu"
                  style={{
                    position: 'absolute',
                    top: '46px',
                    right: 0,
                    width: '280px',
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.25)',
                    padding: '8px',
                    zIndex: 100,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div
                    style={{
                      padding: '6px 10px 4px 10px',
                      fontSize: '10px',
                      fontWeight: 600,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: 'var(--text-muted)'
                    }}
                  >
                    Export Options (Select Format)
                  </div>

                  <button
                    type="button"
                    data-testid="export-dcf-csv"
                    onClick={() => handleExport('csv')}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--secondary)',
                      color: 'var(--foreground)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                    <div>
                      <div style={{ fontWeight: 600 }}>Excel / CSV Spreadsheet</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>10Y projections, WACC, valuation bridge</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    data-testid="export-dcf-pdf"
                    onClick={() => handleExport('pdf')}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--secondary)',
                      color: 'var(--foreground)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <path d="M12 18v-6" />
                      <path d="M9 15l3 3 3-3" />
                    </svg>
                    <div>
                      <div style={{ fontWeight: 600 }}>Institutional PDF Report</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Printable executive valuation dossier</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    data-testid="export-dcf-json"
                    onClick={() => handleExport('json')}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--secondary)',
                      color: 'var(--foreground)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="16 18 22 12 16 6" />
                      <polyline points="8 6 2 12 8 18" />
                    </svg>
                    <div>
                      <div style={{ fontWeight: 600 }}>JSON Quantitative Dossier</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Raw parameters for algorithmic models</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Save Model Button */}
            <button
              type="button"
              data-testid="dcf-save-model-btn"
              onClick={() => setSaveModalOpen(true)}
              style={{
                height: '40px',
                padding: '0 16px',
                borderRadius: '6px',
                backgroundColor: 'var(--card)',
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
              <span>Save Model</span>
            </button>
          </div>
        </div>
      </header>

      {/* Save Toast notification */}
      {saveToast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 100, backgroundColor: 'var(--surface)', border: '1px solid var(--accent)', color: 'var(--text)', padding: '12px 20px', borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', fontSize: '13px', fontWeight: 500 }}>
          {saveToast}
        </div>
      )}

      {/* 2. MAIN TWO-COLUMN CONTENT */}
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px', display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        
        {/* LEFT COLUMN: ASSUMPTIONS PANEL (360px sticky on desktop) */}
        <aside
          style={{
            flex: '0 0 360px',
            width: '360px',
            position: 'sticky',
            top: '72px',
            maxHeight: 'calc(100vh - 96px)',
            overflowY: 'auto',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '20px',
            boxSizing: 'border-box'
          }}
          aria-label="Valuation Assumptions Sidebar"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Model Parameters & Inputs</h2>
            <button
              onClick={() => {
                // Reset all to defaults
                setGrowth5y(pkg.growth5y.defaultValue * 100);
                setTerminalGrowth(pkg.terminalGrowth.defaultValue * 100);
                setBaseMargin(pkg.baseMargin.defaultValue * 100);
                setTargetMargin(pkg.targetMargin.defaultValue * 100);
                setTaxRate(pkg.taxRate.defaultValue * 100);
                setSalesToCapital(pkg.salesToCapital.defaultValue);
                setWaccOverride('');
                setRf(pkg.riskFreeRate.defaultValue * 100);
                setErp(pkg.erp.defaultValue * 100);
                setDebtWeight(pkg.debtWeight.defaultValue * 100);
                setCostOfDebt(pkg.costOfDebt.defaultValue * 100);
                setMidYear(pkg.midYear);
                setLeaseTreatment(pkg.leaseTreatment);
                setTerminalMethod(pkg.terminalMethod);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '4px 8px',
                minHeight: '40px'
              }}
              title="Reset all assumptions to normalised filings defaults"
            >
              Reset All
            </button>
          </div>

          {/* FINANCIAL INSTITUTION NOTICE */}
          {isBankModel && (
            <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '12px', color: 'var(--text)' }}>
              <strong>Institutional Bank Valuation:</strong> As a banking / financial institution, debt constitutes operating inventory rather than capital structure. Valued via <strong>Residual Income (Equity-Only)</strong> with DDM cross-check.
            </div>
          )}

          {/* GENERAL COMPANY ASSUMPTION GROUPS */}
          {!isBankModel && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* GROUP 1: REVENUE GROWTH */}
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: 'var(--text)' }}>
                  1. Revenue Growth Trajectory
                </div>
                
                {/* 5-Year Revenue Growth */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>5-Year Growth (CAGR)</label>
                    <button
                      onClick={() => setGrowth5y(pkg.growth5y.defaultValue * 100)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '11px', cursor: 'pointer' }}
                      title={`Default: ${(pkg.growth5y.defaultValue * 100).toFixed(1)}% (${pkg.growth5y.source})`}
                    >
                      Reset
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      step="0.5"
                      value={growth5y}
                      onChange={(e) => setGrowth5y(parseFloat(e.target.value))}
                      style={{ flex: 1, ...getSliderTrackStyle(growth5y, 0, 50) }}
                    />
                    <input
                      type="number"
                      value={growth5y}
                      onChange={(e) => setGrowth5y(parseFloat(e.target.value) || 0)}
                      style={{ width: '70px', height: '40px', padding: '0 8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)', textAlign: 'right', fontSize: '13px' }}
                    />
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>%</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {pkg.growth5y.source}
                  </div>
                </div>

                {/* Terminal Growth */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Terminal Growth (g)</label>
                    <button
                      onClick={() => setTerminalGrowth(pkg.terminalGrowth.defaultValue * 100)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '11px', cursor: 'pointer' }}
                      title={`Default: ${(pkg.terminalGrowth.defaultValue * 100).toFixed(1)}% (${pkg.terminalGrowth.source})`}
                    >
                      Reset
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="range"
                      min="1.0"
                      max={pkg.country === 'India' ? '6.0' : '4.5'}
                      step="0.25"
                      value={terminalGrowth}
                      onChange={(e) => setTerminalGrowth(parseFloat(e.target.value))}
                      style={{ flex: 1, ...getSliderTrackStyle(terminalGrowth, 1.0, pkg.country === 'India' ? 6.0 : 4.5) }}
                    />
                    <input
                      type="number"
                      value={terminalGrowth}
                      onChange={(e) => setTerminalGrowth(parseFloat(e.target.value) || 0)}
                      style={{ width: '70px', height: '40px', padding: '0 8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)', textAlign: 'right', fontSize: '13px' }}
                    />
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>%</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {pkg.terminalGrowth.source}
                  </div>
                </div>
              </div>

              {/* GROUP 2: OPERATING MARGINS & CAPITAL INTENSITY */}
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: 'var(--text)' }}>
                  2. Margins & Reinvestment
                </div>

                {/* Target Operating Margin */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Year-5 Target Margin</label>
                    <button
                      onClick={() => setTargetMargin(pkg.targetMargin.defaultValue * 100)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '11px', cursor: 'pointer' }}
                      title={`Default: ${(pkg.targetMargin.defaultValue * 100).toFixed(1)}%`}
                    >
                      Reset
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="range"
                      min="0"
                      max="80"
                      step="0.5"
                      value={targetMargin}
                      onChange={(e) => setTargetMargin(parseFloat(e.target.value))}
                      style={{ flex: 1, ...getSliderTrackStyle(targetMargin, 0, 80) }}
                    />
                    <input
                      type="number"
                      value={targetMargin}
                      onChange={(e) => setTargetMargin(parseFloat(e.target.value) || 0)}
                      style={{ width: '70px', height: '40px', padding: '0 8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)', textAlign: 'right', fontSize: '13px' }}
                    />
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>%</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Moves linearly from TTM {baseMargin.toFixed(1)}% to {targetMargin.toFixed(1)}%
                  </div>
                </div>

                {/* Sales to Capital */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Sales-to-Capital Ratio</label>
                    <button
                      onClick={() => setSalesToCapital(pkg.salesToCapital.defaultValue)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '11px', cursor: 'pointer' }}
                    >
                      Reset
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="range"
                      min="0.2"
                      max="5.0"
                      step="0.1"
                      value={salesToCapital}
                      onChange={(e) => setSalesToCapital(parseFloat(e.target.value))}
                      style={{ flex: 1, ...getSliderTrackStyle(salesToCapital, 0.2, 5.0) }}
                    />
                    <input
                      type="number"
                      value={salesToCapital}
                      onChange={(e) => setSalesToCapital(parseFloat(e.target.value) || 1)}
                      style={{ width: '70px', height: '40px', padding: '0 8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)', textAlign: 'right', fontSize: '13px' }}
                    />
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>x</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Reinvestment = ΔRevenue ÷ {salesToCapital.toFixed(2)}
                  </div>
                </div>

                {/* Effective Tax Rate */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Cash Tax Rate (Fade to {terminalTaxRate.toFixed(2)}%)</label>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      step="0.5"
                      value={taxRate}
                      onChange={(e) => setTaxRate(parseFloat(e.target.value))}
                      style={{ flex: 1, ...getSliderTrackStyle(taxRate, 0, 40) }}
                    />
                    <input
                      type="number"
                      value={taxRate}
                      onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                      style={{ width: '70px', height: '40px', padding: '0 8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)', textAlign: 'right', fontSize: '13px' }}
                    />
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>%</span>
                  </div>
                </div>
              </div>

              {/* GROUP 3: DISCOUNT RATE (WACC) */}
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>3. Discount Rate: Weighted Average Cost of Capital (WACC)</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)' }}>
                    {(activeWacc * 100).toFixed(2)}%
                  </span>
                </div>

                {/* WACC Override */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Direct WACC Override (Blank = Computed)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder={`Computed: ${(computedWacc * 100).toFixed(2)}%`}
                    value={waccOverride}
                    onChange={(e) => setWaccOverride(e.target.value)}
                    style={{ width: '100%', height: '40px', padding: '0 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)', boxSizing: 'border-box', fontSize: '13px' }}
                  />
                </div>

                {/* Risk-free Rate */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    <span>Risk-Free Rate (Rf)</span>
                    <span>{rf.toFixed(2)}%</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="15.0"
                    step="0.05"
                    value={rf}
                    onChange={(e) => setRf(parseFloat(e.target.value))}
                    style={{ width: '100%', ...getSliderTrackStyle(rf, 1.0, 15.0) }}
                  />
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{pkg.riskFreeRate.source}</div>
                </div>

                {/* Blume Beta */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    <span>Blume-Adjusted Beta</span>
                    <span>{blumeBeta.toFixed(3)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="2.5"
                    step="0.05"
                    value={betaRaw}
                    onChange={(e) => setBetaRaw(parseFloat(e.target.value))}
                    style={{ width: '100%', ...getSliderTrackStyle(betaRaw, 0.2, 2.5) }}
                  />
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>0.67 × {betaRaw.toFixed(2)} + 0.33</div>
                </div>

                {/* Debt Weight */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    <span>Target Debt Weight (D/V)</span>
                    <span>{debtWeight.toFixed(1)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    step="1"
                    value={debtWeight}
                    onChange={(e) => setDebtWeight(parseFloat(e.target.value))}
                    style={{ width: '100%', ...getSliderTrackStyle(debtWeight, 0, 60) }}
                  />
                </div>
              </div>

              {/* GROUP 4: TERMINAL ROIC */}
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text)' }}>
                  4. Terminal Return on Capital
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer', marginBottom: '8px' }}>
                  <input
                    type="checkbox"
                    checked={roicTerminalAuto}
                    onChange={(e) => setRoicTerminalAuto(e.target.checked)}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <span>Equal to WACC ({(activeWacc * 100).toFixed(2)}% — no excess return)</span>
                </label>
                {!roicTerminalAuto && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="range"
                      min="5"
                      max="40"
                      step="0.5"
                      value={roicTerminalCustom}
                      onChange={(e) => setRoicTerminalCustom(parseFloat(e.target.value))}
                      style={{ flex: 1, ...getSliderTrackStyle(roicTerminalCustom, 5, 40) }}
                    />
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>{roicTerminalCustom.toFixed(1)}%</span>
                  </div>
                )}
              </div>

              {/* GROUP 5: MODEL TOGGLES */}
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px', color: 'var(--text)' }}>
                  5. Engine Options & Toggles
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={midYear}
                      onChange={(e) => setMidYear(e.target.checked)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <span>Mid-Year Discounting (^(t - 0.5))</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={leaseTreatment === 'debt'}
                      onChange={(e) => setLeaseTreatment(e.target.checked ? 'debt' : 'operating')}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <span>Subtract Lease Liabilities in Bridge</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={terminalMethod === 'plain'}
                      onChange={(e) => setTerminalMethod(e.target.checked ? 'plain' : 'value-driver')}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <span>Plain Gordon Terminal Value (FCFF_N × (1+g))</span>
                  </label>
                </div>
              </div>

            </div>
          )}

          {/* BANK ASSUMPTIONS GROUPS */}
          {isBankModel && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Cost of Equity (Ke)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="range"
                    min="4"
                    max="25"
                    step="0.25"
                    value={keBank}
                    onChange={(e) => setKeBank(parseFloat(e.target.value))}
                    style={{ flex: 1, ...getSliderTrackStyle(keBank, 4, 25) }}
                  />
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{keBank.toFixed(2)}%</span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Persistence Parameter (ω)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="range"
                    min="0"
                    max="1.0"
                    step="0.05"
                    value={omega}
                    onChange={(e) => setOmega(parseFloat(e.target.value))}
                    style={{ flex: 1, ...getSliderTrackStyle(omega, 0, 1.0) }}
                  />
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{omega.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Dividend Payout Ratio</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="range"
                    min="5"
                    max="90"
                    step="1"
                    value={payoutRatio}
                    onChange={(e) => setPayoutRatio(parseFloat(e.target.value))}
                    style={{ flex: 1, ...getSliderTrackStyle(payoutRatio, 5, 90) }}
                  />
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{payoutRatio.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          )}

          {/* PARAMETER AUDIT TRAIL */}
          {auditTrail.length > 0 && (
            <div
              style={{
                marginTop: '20px',
                padding: '14px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--secondary)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>Parameter Audit Trail</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Real-Time Log</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {auditTrail.map((item) => (
                  <div key={item.id} style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    <div><strong>WACC update</strong>: {item.text}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{item.timestamp}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </aside>

        {/* RIGHT COLUMN: HERO CARD + TABS WORKBENCH */}
        <main style={{ flex: 1, minWidth: 0 }}>
          
          {/* 1. HERO VALUATION CARD */}
          <section
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px'
            }}
            aria-label="Valuation Hero Summary"
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <h1 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', margin: 0 }}>
                    Discounted Cash Flow · Institutional 10-Year DCF Engine · {pkg.name} ({pkg.symbol})
                  </h1>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>
                    {isBankModel ? 'Residual Income / DDM' : 'FCFF 10-Year DCF'}
                  </span>
                </div>

                {/* 56px INTRINSIC VALUE PER SHARE */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: '56px',
                      fontWeight: 700,
                      letterSpacing: '-0.03em',
                      fontVariantNumeric: 'tabular-nums',
                      lineHeight: 1
                    }}
                  >
                    {intrinsicVal !== 0 ? fmt(intrinsicVal) : '—'}
                  </span>

                  {/* PERCENTAGE DELTA WITH SIGN */}
                  {marketPrice > 0 && intrinsicVal !== 0 && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '18px',
                        fontWeight: 600,
                        color: isDeltaPositive ? '#16a34a' : '#dc2626'
                      }}
                    >
                      <span>{isDeltaPositive ? '+ ' : '- '}</span>
                      <span>{Math.abs(deltaPct).toFixed(1)}%</span>
                      <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--text-secondary)' }}>
                        vs market {fmt(marketPrice)}
                      </span>
                    </div>
                  )}

                  {intrinsicVal < 0 && (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--bg)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      Negative Implied Equity
                    </span>
                  )}
                </div>
              </div>

              {/* CHIPS */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: 'var(--bg)', border: '1px solid var(--border)', fontSize: '12px' }}>
                  WACC: <strong>{(activeWacc * 100).toFixed(2)}%</strong>
                </div>
                <div style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: 'var(--bg)', border: '1px solid var(--border)', fontSize: '12px' }}>
                  g: <strong>{terminalGrowth.toFixed(1)}%</strong>
                </div>
                <div style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: 'var(--bg)', border: '1px solid var(--border)', fontSize: '12px' }}>
                  Timing: <strong>{midYear ? 'Mid-Year' : 'Year-End'}</strong>
                </div>
                {dcfResult.ok && (
                  <div style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: 'var(--bg)', border: '1px solid var(--border)', fontSize: '12px' }}>
                    TV Share: <strong>{(dcfResult.tvShare.toNumber() * 100).toFixed(1)}%</strong>
                  </div>
                )}
              </div>
            </div>

            {/* PRICE SCENARIOS ESTIMATION BAR (Matches institutional design reference) */}
            {rangeBounds && (() => {
              const boundsArr = [rangeBounds.low, rangeBounds.base, rangeBounds.high, marketPrice > 0 ? marketPrice : rangeBounds.base];
              const minP = Math.min(...boundsArr) * 0.94;
              const maxP = Math.max(...boundsArr) * 1.06;
              const getPos = (val: number) => {
                if (maxP === minP) return 50;
                const pct = ((val - minP) / (maxP - minP)) * 100;
                return Math.max(8, Math.min(92, pct));
              };

              return (
                <div
                  style={{
                    marginTop: '24px',
                    padding: '24px',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    backgroundColor: 'var(--card-bg, #09090b)'
                  }}
                >
                  <div style={{ marginBottom: '32px' }}>
                    <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--foreground)' }}>
                      Price Scenarios
                    </span>
                  </div>

                  {/* Scenario markers & Track container */}
                  <div style={{ position: 'relative', width: '100%', minHeight: '96px', boxSizing: 'border-box' }}>
                    {/* Top tick labels */}
                    <div style={{ position: 'relative', width: '100%', height: '44px' }}>
                      {/* Bull Case label */}
                      <div
                        style={{
                          position: 'absolute',
                          left: `${getPos(rangeBounds.high)}%`,
                          transform: 'translateX(-50%)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          zIndex: 2
                        }}
                      >
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#22c55e', whiteSpace: 'nowrap' }}>
                          Bull Case • {fmt(rangeBounds.high)}
                        </span>
                        <div style={{ width: '1px', height: '22px', backgroundColor: '#22c55e', opacity: 0.7, marginTop: '4px' }} />
                      </div>

                      {/* Bear Case label */}
                      <div
                        style={{
                          position: 'absolute',
                          left: `${getPos(rangeBounds.low)}%`,
                          transform: 'translateX(-50%)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          zIndex: 2
                        }}
                      >
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#f87171', whiteSpace: 'nowrap' }}>
                          Bear Case • {fmt(rangeBounds.low)}
                        </span>
                        <div style={{ width: '1px', height: '22px', backgroundColor: '#f87171', opacity: 0.7, marginTop: '4px' }} />
                      </div>

                      {/* Base Estimate label */}
                      <div
                        style={{
                          position: 'absolute',
                          left: `${getPos(rangeBounds.base)}%`,
                          transform: 'translateX(-50%)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          zIndex: 2
                        }}
                      >
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#b91c1c', whiteSpace: 'nowrap' }}>
                          Base Estimate • {fmt(rangeBounds.base)}
                        </span>
                        <div style={{ width: '1px', height: '22px', backgroundColor: '#b91c1c', opacity: 0.7, marginTop: '4px' }} />
                      </div>
                    </div>

                    {/* Horizontal Track Container */}
                    <div style={{ position: 'relative', width: '100%', height: '16px', display: 'flex', alignItems: 'center' }}>
                      {/* Base track */}
                      <div
                        style={{
                          width: '100%',
                          height: '8px',
                          backgroundColor: 'var(--border, #27272a)',
                          borderRadius: '9999px'
                        }}
                      />

                      {/* Green highlight band */}
                      <div
                        style={{
                          position: 'absolute',
                          left: `${Math.min(getPos(rangeBounds.base), getPos(rangeBounds.high))}%`,
                          width: `${Math.abs(getPos(rangeBounds.high) - getPos(rangeBounds.base))}%`,
                          height: '14px',
                          backgroundColor: 'rgba(34, 197, 94, 0.38)',
                          borderRadius: '9999px'
                        }}
                      />

                      {/* Red / Coral highlight band */}
                      <div
                        style={{
                          position: 'absolute',
                          left: `${Math.min(getPos(rangeBounds.low), getPos(rangeBounds.base))}%`,
                          width: `${Math.abs(getPos(rangeBounds.base) - getPos(rangeBounds.low))}%`,
                          height: '14px',
                          backgroundColor: 'rgba(239, 68, 68, 0.42)',
                          borderRadius: '9999px'
                        }}
                      />

                      {/* Current Market Price Pin & Tooltip */}
                      {marketPrice > 0 && (
                        <div
                          style={{
                            position: 'absolute',
                            left: `${getPos(marketPrice)}%`,
                            top: '-32px',
                            transform: 'translateX(-50%)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            zIndex: 10
                          }}
                        >
                          {/* Tooltip Badge */}
                          <div
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              padding: '4px 10px',
                              borderRadius: '6px',
                              backgroundColor: '#09090b',
                              color: '#ffffff',
                              border: '1px solid #27272a',
                              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.6)',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            Current Price: {fmt(marketPrice)}
                          </div>

                          {/* Triangle Down Pointer */}
                          <div
                            style={{
                              width: 0,
                              height: 0,
                              borderLeft: '5px solid transparent',
                              borderRight: '5px solid transparent',
                              borderTop: '6px solid #09090b'
                            }}
                          />

                          {/* Center Ring Indicator on Track */}
                          <div
                            style={{
                              width: '12px',
                              height: '12px',
                              borderRadius: '50%',
                              backgroundColor: '#ffffff',
                              border: '2px solid #09090b',
                              boxShadow: '0 0 0 1px #27272a'
                            }}
                          />

                          {/* Drop line beneath track */}
                          <div
                            style={{
                              width: '1px',
                              height: '20px',
                              backgroundColor: '#52525b',
                              marginTop: '2px'
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* INLINE WARNINGS & VALIDATION ERRORS - STRICT MONOCHROME */}
            {!dcfResult.ok && !isBankModel && (
              <div style={{ marginTop: '16px', padding: '14px 18px', backgroundColor: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px' }}>
                <strong style={{ display: 'block', marginBottom: '4px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Validation blocked run:</strong>
                <ul style={{ margin: '6px 0 0 16px', padding: 0, color: 'var(--text-secondary)' }}>
                  {dcfResult.errors.map((e, idx) => (
                    <li key={idx}>{e.message}</li>
                  ))}
                </ul>
              </div>
            )}

            {dcfResult.ok && dcfResult.warnings.length > 0 && (
              <div style={{ marginTop: '16px', padding: '14px 18px', backgroundColor: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px' }}>
                <strong style={{ display: 'block', marginBottom: '4px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Model Observations:</strong>
                <ul style={{ margin: '6px 0 0 16px', padding: 0, color: 'var(--text-secondary)' }}>
                  {dcfResult.warnings.map((w, idx) => (
                    <li key={idx}>{w.message}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* 2. TABS NAVIGATION (WCAG 2.2 AA) */}
          <div
            role="tablist"
            aria-label="Valuation Workbench Tabs"
            style={{
              display: 'flex',
              borderBottom: '1px solid var(--border)',
              marginBottom: '24px',
              gap: '8px',
              overflowX: 'auto'
            }}
          >
            {(!isBankModel ? ['summary', 'projections', 'sensitivity', 'scenarios', 'reverse', 'method'] : ['summary', 'projections', 'sensitivity', 'method']).map((t) => {
              const labels: Record<string, string> = {
                summary: 'Summary',
                projections: 'Projections (10Y)',
                sensitivity: 'Sensitivity (5×5)',
                scenarios: 'Scenarios',
                reverse: 'Reverse DCF',
                method: 'Methodology'
              };
              const isSelected = activeTab === t;
              return (
                <button
                  key={t}
                  role="tab"
                  id={`tab-${t}`}
                  aria-selected={isSelected}
                  aria-controls={`panel-${t}`}
                  onClick={() => handleTabChange(t)}
                  style={{
                    height: '40px',
                    padding: '0 16px',
                    border: 'none',
                    borderBottom: isSelected ? '2px solid var(--accent)' : '2px solid transparent',
                    backgroundColor: 'transparent',
                    color: isSelected ? 'var(--text)' : 'var(--text-secondary)',
                    fontWeight: isSelected ? 600 : 500,
                    fontSize: '13px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {labels[t]}
                </button>
              );
            })}
          </div>

          {/* 3. TAB PANELS */}
          
          {/* TAB 1: SUMMARY */}
          {activeTab === 'summary' && (
            <div id="panel-summary" role="tabpanel" aria-labelledby="tab-summary">
              {!isBankModel && dcfResult.ok && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* WATERFALL: ENTERPRISE VALUE TO EQUITY VALUE */}
                  <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 16px 0' }}>Enterprise Value to Equity Value Bridge</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                      <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>PV of Explicit FCF (10Y)</div>
                        <div style={{ fontSize: '15px', fontWeight: 600, marginTop: '4px' }}>{fmtComp(dcfResult.pvExplicit.toNumber())}</div>
                      </div>
                      <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>PV of Terminal Value</div>
                        <div style={{ fontSize: '15px', fontWeight: 600, marginTop: '4px' }}>{fmtComp(dcfResult.terminal.pv.toNumber())}</div>
                      </div>
                      <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--bg)', border: '1px solid var(--accent)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 600 }}>Enterprise Value (EV)</div>
                        <div style={{ fontSize: '15px', fontWeight: 700, marginTop: '4px', color: 'var(--accent)' }}>{fmtComp(dcfResult.ev.toNumber())}</div>
                      </div>
                      <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>- Net Debt & Leases</div>
                        <div style={{ fontSize: '15px', fontWeight: 600, marginTop: '4px', color: '#dc2626' }}>
                          -{fmtComp(Math.max(0, debt + (leaseTreatment === 'debt' ? leases : 0) - cash))}
                        </div>
                      </div>
                      <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>= Total Equity Value</div>
                        <div style={{ fontSize: '15px', fontWeight: 700, marginTop: '4px' }}>{fmtComp(dcfResult.equityValue.toNumber())}</div>
                      </div>
                      <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Diluted Share Count</div>
                        <div style={{ fontSize: '15px', fontWeight: 600, marginTop: '4px' }}>{fmtNum(dilutedShares)} shares</div>
                      </div>
                    </div>
                  </div>

                  {/* FREE CASH FLOW BY YEAR (MONOCHROME BLACK & WHITE THEME) */}
                  <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', marginBottom: '28px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>Free Cash Flow Trajectory (Years 1–10)</h3>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '12px', height: '12px', backgroundColor: '#18181b', borderRadius: '2px' }} />
                          Explicit Years (1–5)
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '12px', height: '12px', backgroundColor: '#71717a', borderRadius: '2px' }} />
                          Fade Years (6–10)
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '8px', alignItems: 'flex-end', height: '160px', padding: '16px 0 20px', borderBottom: '1px solid var(--border)' }}>
                      {dcfResult.rows.map((r) => {
                        const maxVal = Math.max(...dcfResult.rows.map((row) => row.fcff.toNumber()), 1);
                        const h = Math.max(12, Math.round((r.fcff.toNumber() / maxVal) * 115));
                        const isFade = r.t > 5;
                        return (
                          <div key={r.t} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{fmtNum(r.fcff.toNumber())}</span>
                            <div
                              style={{
                                width: '100%',
                                height: `${h}px`,
                                backgroundColor: isFade ? '#71717a' : '#18181b',
                                borderRadius: '4px 4px 0 0',
                                transition: 'height 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                              }}
                              title={`Year ${r.t} (${r.phase}): FCFF = ${fmtComp(r.fcff.toNumber())}, PV = ${fmtComp(r.pv.toNumber())}`}
                            />
                            <span style={{ fontSize: '11px', fontWeight: 600 }}>Y{r.t}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* IMPLIED MULTIPLES */}
                  <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 16px 0' }}>Implied Valuation Multiples</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                      <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Implied EV / TTM Revenue</div>
                        <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '4px' }}>
                          {baseRevenue > 0 ? (dcfResult.ev.toNumber() / baseRevenue).toFixed(2) : '—'}x
                        </div>
                      </div>
                      <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Implied EV / Year-1 EBIT</div>
                        <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '4px' }}>
                          {dcfResult.rows[0]?.ebit.toNumber() > 0 ? (dcfResult.ev.toNumber() / dcfResult.rows[0]!.ebit.toNumber()).toFixed(2) : '—'}x
                        </div>
                      </div>
                      <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Terminal Value Contribution</div>
                        <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '4px' }}>
                          {(dcfResult.tvShare.toNumber() * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* BANK SUMMARY TAB */}
              {isBankModel && bankResult && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>Residual Income Valuation Breakdown</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                      <div style={{ padding: '12px', backgroundColor: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Starting Book Value (BV0)</div>
                        <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px' }}>{fmtComp(bv0)}</div>
                      </div>
                      <div style={{ padding: '12px', backgroundColor: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>PV of Residual Income (10Y)</div>
                        <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px' }}>{fmtComp(bankResult.ri.pvRi.toNumber())}</div>
                      </div>
                      <div style={{ padding: '12px', backgroundColor: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>PV of Terminal Value (ω = {omega})</div>
                        <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px' }}>{fmtComp(bankResult.ri.pvTv.toNumber())}</div>
                      </div>
                      <div style={{ padding: '12px', backgroundColor: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--accent)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 600 }}>Total Equity Value</div>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent)', marginTop: '4px' }}>{fmtComp(bankResult.ri.equity.toNumber())}</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>Dividend Discount Model (DDM) Cross-Check</h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                      Independent Gordon Dividend Discount Model cross-check using projected Year-1 DPS of {fmt(bankResult.dps1)}:
                    </p>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)' }}>
                      {bankResult.ddmVal ? `${fmt(bankResult.ddmVal.toNumber())} per share` : 'Undefined (Ke ≤ g)'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PROJECTIONS (10-YEAR TABLE WITH STICKY FIRST COLUMN & COPY CSV) */}
          {activeTab === 'projections' && (
            <div id="panel-projections" role="tabpanel" aria-labelledby="tab-projections">
              <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>10-Year Financial Projection Table</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                      Years 1–5 explicit path fading linearly across Years 6–10 into terminal equilibrium.
                    </p>
                  </div>
                  <button
                    onClick={handleCopyCsv}
                    style={{
                      height: '40px',
                      padding: '0 16px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--text)',
                      fontWeight: 600,
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      {copyCsvSuccess ? (
                        <polyline points="20 6 9 17 4 12" />
                      ) : (
                        <>
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </>
                      )}
                    </svg>
                    <span>{copyCsvSuccess ? 'Copied CSV!' : 'Copy CSV'}</span>
                  </button>
                </div>

                {!isBankModel && dcfResult.ok && (
                  <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'right' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                          <th style={{ padding: '10px 12px', textAlign: 'left', position: 'sticky', left: 0, backgroundColor: 'var(--bg)', zIndex: 10 }}>Metric ({currency})</th>
                          {dcfResult.rows.map((r) => (
                            <th key={r.t} style={{ padding: '10px 12px', minWidth: '90px' }}>
                              <div>Year {r.t}</div>
                              <div style={{ fontSize: '10px', fontWeight: 400, color: 'var(--text-secondary)' }}>{r.phase}</div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, position: 'sticky', left: 0, backgroundColor: 'var(--surface)' }}>Revenue</td>
                          {dcfResult.rows.map((r) => <td key={r.t} style={{ padding: '10px 12px', fontVariantNumeric: 'tabular-nums' }}>{fmtNum(r.revenue.toNumber())}</td>)}
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '10px 12px', textAlign: 'left', position: 'sticky', left: 0, backgroundColor: 'var(--surface)' }}>Growth %</td>
                          {dcfResult.rows.map((r) => <td key={r.t} style={{ padding: '10px 12px', fontVariantNumeric: 'tabular-nums' }}>{(r.growth.toNumber() * 100).toFixed(1)}%</td>)}
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '10px 12px', textAlign: 'left', position: 'sticky', left: 0, backgroundColor: 'var(--surface)' }}>EBIT Margin %</td>
                          {dcfResult.rows.map((r) => <td key={r.t} style={{ padding: '10px 12px', fontVariantNumeric: 'tabular-nums' }}>{(r.ebitMargin.toNumber() * 100).toFixed(1)}%</td>)}
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, position: 'sticky', left: 0, backgroundColor: 'var(--surface)' }}>EBIT</td>
                          {dcfResult.rows.map((r) => <td key={r.t} style={{ padding: '10px 12px', fontVariantNumeric: 'tabular-nums' }}>{fmtNum(r.ebit.toNumber())}</td>)}
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '10px 12px', textAlign: 'left', position: 'sticky', left: 0, backgroundColor: 'var(--surface)' }}>Tax Rate %</td>
                          {dcfResult.rows.map((r) => <td key={r.t} style={{ padding: '10px 12px', fontVariantNumeric: 'tabular-nums' }}>{(r.taxRate.toNumber() * 100).toFixed(1)}%</td>)}
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, position: 'sticky', left: 0, backgroundColor: 'var(--surface)' }}>NOPAT</td>
                          {dcfResult.rows.map((r) => <td key={r.t} style={{ padding: '10px 12px', fontVariantNumeric: 'tabular-nums' }}>{fmtNum(r.nopat.toNumber())}</td>)}
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '10px 12px', textAlign: 'left', position: 'sticky', left: 0, backgroundColor: 'var(--surface)' }}>Reinvestment</td>
                          {dcfResult.rows.map((r) => <td key={r.t} style={{ padding: '10px 12px', fontVariantNumeric: 'tabular-nums' }}>{fmtNum(r.reinvestment.toNumber())}</td>)}
                        </tr>
                        <tr style={{ borderBottom: '2px solid var(--border)', backgroundColor: 'rgba(59, 130, 246, 0.05)' }}>
                          <td style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: 'var(--accent)', position: 'sticky', left: 0, backgroundColor: 'var(--surface)' }}>FCFF</td>
                          {dcfResult.rows.map((r) => <td key={r.t} style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>{fmtNum(r.fcff.toNumber())}</td>)}
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '10px 12px', textAlign: 'left', position: 'sticky', left: 0, backgroundColor: 'var(--surface)' }}>Discount Factor</td>
                          {dcfResult.rows.map((r) => <td key={r.t} style={{ padding: '10px 12px', fontVariantNumeric: 'tabular-nums' }}>{r.discountFactor.toFixed(4)}</td>)}
                        </tr>
                        <tr style={{ backgroundColor: 'var(--bg)' }}>
                          <td style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, position: 'sticky', left: 0, backgroundColor: 'var(--bg)' }}>Present Value (PV)</td>
                          {dcfResult.rows.map((r) => <td key={r.t} style={{ padding: '10px 12px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmtNum(r.pv.toNumber())}</td>)}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* BANK 10-YEAR PROJECTIONS */}
                {isBankModel && bankResult && (
                  <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'right' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                          <th style={{ padding: '10px 12px', textAlign: 'left', position: 'sticky', left: 0, backgroundColor: 'var(--bg)' }}>Metric ({currency})</th>
                          {bankResult.ri.rows.map((r) => (
                            <th key={r.t} style={{ padding: '10px 12px', minWidth: '90px' }}>Year {r.t}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, position: 'sticky', left: 0, backgroundColor: 'var(--surface)' }}>Beginning Book Value</td>
                          {bankResult.ri.rows.map((r) => <td key={r.t} style={{ padding: '10px 12px' }}>{fmtNum(r.bvStart.toNumber())}</td>)}
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '10px 12px', textAlign: 'left', position: 'sticky', left: 0, backgroundColor: 'var(--surface)' }}>Net Income</td>
                          {bankResult.ri.rows.map((r) => <td key={r.t} style={{ padding: '10px 12px' }}>{fmtNum(r.ni.toNumber())}</td>)}
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: 'var(--accent)', position: 'sticky', left: 0, backgroundColor: 'var(--surface)' }}>Residual Income</td>
                          {bankResult.ri.rows.map((r) => <td key={r.t} style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--accent)' }}>{fmtNum(r.ri.toNumber())}</td>)}
                        </tr>
                        <tr>
                          <td style={{ padding: '10px 12px', textAlign: 'left', position: 'sticky', left: 0, backgroundColor: 'var(--surface)' }}>Dividends Paid</td>
                          {bankResult.ri.rows.map((r) => <td key={r.t} style={{ padding: '10px 12px' }}>{fmtNum(r.div.toNumber())}</td>)}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SENSITIVITY (5×5 MATRIX RE-RUNNING DCF PER CELL) */}
          {activeTab === 'sensitivity' && (
            <div id="panel-sensitivity" role="tabpanel" aria-labelledby="tab-sensitivity">
              <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>5×5 Valuation Sensitivity Matrix</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                    WACC (±1.0 pp) × Terminal Growth (±1.0 pp) in 0.5 pp steps. Every single cell re-runs the full pure engine. Click any cell to apply its assumptions.
                  </p>
                </div>

                {!isBankModel && sensitivityData && (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ borderCollapse: 'collapse', margin: '0 auto', fontSize: '12px', textAlign: 'center' }}>
                      <thead>
                        <tr>
                          <th style={{ padding: '8px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg)' }}>WACC \ g</th>
                          {sensitivityData.gs.map((g, idx) => (
                            <th key={idx} style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg)' }}>
                              {(g.toNumber() * 100).toFixed(1)}%
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sensitivityData.waccs.map((w, rowIdx) => (
                          <tr key={rowIdx}>
                            <td style={{ padding: '8px 12px', fontWeight: 600, backgroundColor: 'var(--bg)', borderRight: '1px solid var(--border)' }}>
                              {(w.toNumber() * 100).toFixed(1)}%
                            </td>
                            {sensitivityData.gs.map((g, colIdx) => {
                              const cellVal = sensitivityData.values[rowIdx]?.[colIdx];
                              const isBase = rowIdx === sensitivityData.baseIndex[0] && colIdx === sensitivityData.baseIndex[1];
                              const numVal = cellVal ? cellVal.toNumber() : null;

                              let cellBg = 'var(--surface)';
                              if (numVal && marketPrice > 0) {
                                const dist = (numVal - marketPrice) / marketPrice;
                                if (dist > 0.15) cellBg = 'rgba(22, 163, 74, 0.12)';
                                else if (dist < -0.15) cellBg = 'rgba(220, 38, 38, 0.12)';
                              }

                              return (
                                <td
                                  key={colIdx}
                                  onClick={() => {
                                    if (cellVal) {
                                      setWaccOverride((w.toNumber() * 100).toFixed(2));
                                      setTerminalGrowth(Number((g.toNumber() * 100).toFixed(2)));
                                    }
                                  }}
                                  style={{
                                    padding: '10px 14px',
                                    border: isBase ? '2px solid var(--accent)' : '1px solid var(--border)',
                                    backgroundColor: cellBg,
                                    cursor: cellVal ? 'pointer' : 'not-allowed',
                                    fontWeight: isBase ? 700 : 500,
                                    color: cellVal ? 'var(--text)' : 'var(--text-secondary)',
                                    fontVariantNumeric: 'tabular-nums',
                                    transition: 'all 0.15s ease'
                                  }}
                                  title={
                                    cellVal
                                      ? `Click to apply: WACC ${(w.toNumber() * 100).toFixed(1)}%, g ${(g.toNumber() * 100).toFixed(1)}%`
                                      : 'Invalid: WACC ≤ g + 0.5%'
                                  }
                                >
                                  {cellVal ? fmt(cellVal.toNumber()) : '—'}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* BANK SENSITIVITY: Ke × Omega */}
                {isBankModel && (
                  <div style={{ padding: '16px', backgroundColor: 'var(--bg)', borderRadius: '8px', textAlign: 'center', fontSize: '13px' }}>
                    <p style={{ margin: '0 0 12px 0' }}>Cost of Equity (Ke) vs Persistence (ω) Sensitivity:</p>
                    <div style={{ display: 'inline-grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                      {[keBank - 1, keBank, keBank + 1].map((k) => (
                        <div key={k} style={{ padding: '12px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px' }}>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Ke = {k.toFixed(1)}%</div>
                          <div style={{ fontSize: '15px', fontWeight: 700, marginTop: '4px' }}>
                            {fmt(
                              computeResidualIncome({
                                bv0,
                                ke: k / 100,
                                roe: roe10y.map((r) => r / 100),
                                payout: Array(10).fill(payoutRatio / 100),
                                omega,
                                shares: Math.max(1, dilutedShares)
                              }).valuePerShare.toNumber()
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SCENARIOS */}
          {activeTab === 'scenarios' && !isBankModel && (
            <div id="panel-scenarios" role="tabpanel" aria-labelledby="tab-scenarios">
              <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>Scenario Analysis (Bear / Base / Bull)</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                    Standard stress test shifting growth (∓4 pp), margins (∓3 pp) and cost of capital (±1 pp). Assign probabilities to derive a weighted intrinsic value.
                  </p>
                </div>

                {scenariosData && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                      
                      {/* BEAR CASE */}
                      <div style={{ padding: '16px', backgroundColor: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#dc2626' }}>Bear Case</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                              type="number"
                              value={probBear}
                              onChange={(e) => setProbBear(parseFloat(e.target.value) || 0)}
                              style={{ width: '48px', height: '32px', textAlign: 'right', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text)', fontSize: '12px' }}
                            />
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>%</span>
                          </div>
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0', fontVariantNumeric: 'tabular-nums' }}>
                          {scenariosData.bear.ok ? fmt(scenariosData.bear.valuePerShare.toNumber()) : '—'}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          Growth: {(growth5y - 4).toFixed(1)}% · Margin: {(targetMargin - 3).toFixed(1)}% · WACC: {((activeWacc + 0.01) * 100).toFixed(2)}%
                        </div>
                      </div>

                      {/* BASE CASE */}
                      <div style={{ padding: '16px', backgroundColor: 'var(--bg)', borderRadius: '8px', border: '2px solid var(--accent)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent)' }}>Base Case</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                              type="number"
                              value={probBase}
                              onChange={(e) => setProbBase(parseFloat(e.target.value) || 0)}
                              style={{ width: '48px', height: '32px', textAlign: 'right', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text)', fontSize: '12px' }}
                            />
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>%</span>
                          </div>
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0', fontVariantNumeric: 'tabular-nums', color: 'var(--accent)' }}>
                          {scenariosData.base.ok ? fmt(scenariosData.base.valuePerShare.toNumber()) : '—'}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          Growth: {growth5y.toFixed(1)}% · Margin: {targetMargin.toFixed(1)}% · WACC: {(activeWacc * 100).toFixed(2)}%
                        </div>
                      </div>

                      {/* BULL CASE */}
                      <div style={{ padding: '16px', backgroundColor: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#16a34a' }}>Bull Case</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                              type="number"
                              value={probBull}
                              onChange={(e) => setProbBull(parseFloat(e.target.value) || 0)}
                              style={{ width: '48px', height: '32px', textAlign: 'right', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text)', fontSize: '12px' }}
                            />
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>%</span>
                          </div>
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0', fontVariantNumeric: 'tabular-nums' }}>
                          {scenariosData.bull.ok ? fmt(scenariosData.bull.valuePerShare.toNumber()) : '—'}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          Growth: {(growth5y + 4).toFixed(1)}% · Margin: {(targetMargin + 3).toFixed(1)}% · WACC: {((activeWacc - 0.01) * 100).toFixed(2)}%
                        </div>
                      </div>

                    </div>

                    {/* PROBABILITY-WEIGHTED SUMMARY */}
                    <div style={{ padding: '16px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Probability-Weighted Intrinsic Value</div>
                        <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '2px' }}>
                          {scenariosData.weighted ? fmt(scenariosData.weighted.toNumber()) : '—'}
                        </div>
                      </div>
                      {probBear + probBase + probBull !== 100 && (
                        <div style={{ fontSize: '12px', color: '#dc2626', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                          </svg>
                          <span>Probabilities must sum to 100% (currently {probBear + probBase + probBull}%)</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: REVERSE DCF */}
          {activeTab === 'reverse' && !isBankModel && (
            <div id="panel-reverse" role="tabpanel" aria-labelledby="tab-reverse">
              <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>Reverse DCF (Market Implied Expectations)</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                    Solves for the exact single operating assumption required to equate intrinsic value to the current market price of {fmt(marketPrice)}.
                  </p>
                </div>

                {/* Driver Selector */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                  {[
                    { id: 'growth', label: 'Implied 5-Year Growth' },
                    { id: 'margin', label: 'Implied EBIT Margin' },
                    { id: 'wacc', label: 'Implied Cost of Capital (WACC)' }
                  ].map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setReverseDriver(d.id as any)}
                      style={{
                        height: '40px',
                        padding: '0 16px',
                        borderRadius: '6px',
                        border: reverseDriver === d.id ? '2px solid var(--accent)' : '1px solid var(--border)',
                        backgroundColor: reverseDriver === d.id ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg)',
                        color: reverseDriver === d.id ? 'var(--accent)' : 'var(--text)',
                        fontWeight: 600,
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>

                {/* Reverse DCF Result Sentence */}
                <div style={{ padding: '24px', backgroundColor: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  {reverseDcfData && reverseDcfData.solved ? (
                    <div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Market Implied Benchmark:</div>
                      <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums', marginBottom: '12px' }}>
                        {(reverseDcfData.x * 100).toFixed(2)}%
                      </div>
                      <p style={{ fontSize: '14px', lineHeight: 1.6, margin: 0, color: 'var(--text)' }}>
                        To justify the current market price of <strong>{fmt(marketPrice)}</strong>, {pkg.name} must generate an average {reverseDriver === 'growth' ? 'revenue growth rate of' : reverseDriver === 'margin' ? 'operating EBIT margin of' : 'cost of capital discount rate of'}{' '}
                        <strong>{(reverseDcfData.x * 100).toFixed(2)}%</strong> across the projection horizon (converged in {reverseDcfData.iterations} iterations).
                      </p>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '16px' }}>
                      <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)' }}>
                        No solution within plausible bounds
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                        The market price of {fmt(marketPrice)} is outside the feasible range achievable through plausible shifts in {reverseDriver}.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: METHODOLOGY */}
          {activeTab === 'method' && (
            <div id="panel-method" role="tabpanel" aria-labelledby="tab-method">
              <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px 0' }}>Institutional Valuation Methodology & Governance</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '13px', lineHeight: 1.6, color: 'var(--text)' }}>
                  
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 6px 0', color: 'var(--accent)' }}>1. Free Cash Flow to Firm (FCFF) Formula</h4>
                    <p style={{ margin: 0 }}>
                      FCFF = NOPAT − Reinvestment<br />
                      where NOPAT = EBIT × (1 − Tax Rate), and Reinvestment = ΔRevenue ÷ Sales-to-Capital ratio.
                    </p>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 6px 0', color: 'var(--accent)' }}>2. Terminal Value (Value-Driver vs Plain Gordon)</h4>
                    <p style={{ margin: 0 }}>
                      Under Value-Driver formulation: NOPAT_(N+1) = NOPAT_N × (1 + g). FCFF_(N+1) = NOPAT_(N+1) × (1 − g ÷ ROIC_terminal).<br />
                      When ROIC_terminal = WACC, Terminal Value = NOPAT_(N+1) ÷ WACC (growth generates zero economic value added).
                    </p>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 6px 0', color: 'var(--accent)' }}>3. Live WACC Building Blocks</h4>
                    <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                      <li>Risk-Free Rate (Rf): {rf.toFixed(2)}% ({pkg.riskFreeRate.source})</li>
                      <li>Blume-Adjusted Beta: {blumeBeta.toFixed(3)} (0.67 × {betaRaw.toFixed(2)} + 0.33)</li>
                      <li>Equity Risk Premium (ERP): {erp.toFixed(2)}%</li>
                      <li>Cost of Equity (Ke): {(computedKe * 100).toFixed(2)}% (CAPM)</li>
                      <li>Pre-Tax Cost of Debt (Kd): {costOfDebt.toFixed(2)}% · Marginal Tax: {(effectiveTaxForWacc * 100).toFixed(2)}%</li>
                      <li>Capital Structure: {((1 - debtWeight / 100) * 100).toFixed(1)}% Equity / {debtWeight.toFixed(1)}% Debt</li>
                    </ul>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 6px 0', color: 'var(--accent)' }}>4. Validation Rules & Guardrails</h4>
                    <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                      <li>WACC must be strictly between 5.0% and 25.0%.</li>
                      <li>WACC must exceed Terminal Growth (g) by at least 0.5 percentage points (WACC &gt; g + 0.5%).</li>
                      <li>Financial institutions (banks, insurers, NBFCs) are strictly routed to Residual Income / DDM and blocked from FCFF DCF.</li>
                    </ul>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* STATUTORY DISCLAIMER (MANDATORY ON EVERY OUTPUT) */}
          <footer
            style={{
              marginTop: '32px',
              padding: '16px 20px',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              textAlign: 'center',
              lineHeight: 1.5
            }}
          >
            <strong>Estimate based on the assumptions shown. Not investment advice.</strong>
            <br />
            Valuation outputs reflect user-configured inputs and normalized financial statements. Past performance and mechanical cash flow projections do not predict future market prices.
          </footer>

        </main>
      </div>

      {/* SAVE MODEL MODAL */}
      {saveModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setSaveModalOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '480px',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 12px 0' }}>Save DCF Valuation Model</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
              Persist your active assumption parameters, engine version (<code>dcf-10y-v2.0-pure-decimal</code>), and market price at save.
            </p>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Notes / Thesis</label>
              <textarea
                rows={3}
                placeholder="Optional investment thesis notes..."
                value={saveNotes}
                onChange={(e) => setSaveNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setSaveModalOpen(false)}
                style={{
                  height: '40px',
                  padding: '0 16px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'transparent',
                  color: 'var(--text)',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveModel}
                style={{
                  height: '40px',
                  padding: '0 16px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Confirm Save
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
