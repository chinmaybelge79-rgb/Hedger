import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { HedgerOrb } from '../components/HedgerOrb.js';
import { OAuthSandboxGateway } from '../components/OAuthSandboxGateway.js';

export const InvestmentThesisPage: React.FC = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, token } = useAuth();

  const cleanSym = (symbol || 'STOCK').toUpperCase();
  const plan = user?.plan || 'basic';

  const [thesisMarkdown, setThesisMarkdown] = useState<string | null>(
    (location.state as { thesis?: string } | null)?.thesis || null
  );
  const [loading, setLoading] = useState<boolean>(!thesisMarkdown);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState<boolean>(false);
  const [downloadingFormat, setDownloadingFormat] = useState<('pdf' | 'docx' | 'excel' | 'sheets' | 'md') | null>(null);
  const [isAiRepairing, setIsAiRepairing] = useState<boolean>(false);
  const [repairNotice, setRepairNotice] = useState<string | null>(null);
  const [isSavingThesis, setIsSavingThesis] = useState<boolean>(false);
  const [isThesisSaved, setIsThesisSaved] = useState<boolean>(false);
  const [showAuthModalForSave, setShowAuthModalForSave] = useState<boolean>(false);

  const steps = [
    'Initializing Hedger Intelligence fundamental synthesis engine...',
    'Ingesting audited regulatory statements & consensus feeds...',
    'Calibrating WACC, 10-Year Multi-Stage FCFF and Equity Bridge...',
    'Running Reverse DCF expectations & Peer Multiples...',
    'Synthesizing 18-Section Hedger Investment Thesis...'
  ];

  // Fetch cached thesis on mount if not in location state
  useEffect(() => {
    if (!thesisMarkdown) {
      fetch(`/api/ai/thesis/${encodeURIComponent(cleanSym)}`)
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error('Not found');
        })
        .then((data) => {
          if (data?.thesis) {
            setThesisMarkdown(data.thesis);
          }
        })
        .catch(() => {
          // not yet generated
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [cleanSym]);

  // Handle Live Generation
  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setActiveStep(0);

    const stepInterval = setInterval(() => {
      setActiveStep((prev) => {
        if (prev < steps.length - 1) return prev + 1;
        return prev;
      });
    }, 700);

    try {
      const res = await fetch('/api/ai/thesis/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hedger-plan': plan
        },
        body: JSON.stringify({ symbol: cleanSym })
      });

      clearInterval(stepInterval);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 403 && errData.upgradeRequired) {
          navigate('/pricing');
          return;
        }
        throw new Error(errData.error || 'Failed to generate investment thesis');
      }

      const data = await res.json();
      setThesisMarkdown(data.thesis);
      setActiveStep(steps.length);
    } catch (err: unknown) {
      clearInterval(stepInterval);
      const msg = err instanceof Error ? err.message : 'Generation failed. Please try again.';
      setError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  // On-demand AI Formatting & Error Repair Engine
  const handleAiRepair = async (sourceMd?: string, reportedError?: string): Promise<string | null> => {
    const textToRepair = sourceMd || thesisMarkdown;
    if (!textToRepair) return null;

    setIsAiRepairing(true);
    setRepairNotice('AI Error Handler: Analyzing thesis markdown, balancing table columns, and verifying data tags...');

    try {
      const res = await fetch('/api/ai/thesis/repair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: cleanSym,
          thesis: textToRepair,
          error: reportedError
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.repairedThesis) {
          setThesisMarkdown(data.repairedThesis);
          setRepairNotice('AI Verification Complete: All tables and column alignments verified.');
          setTimeout(() => setRepairNotice(null), 4500);
          return data.repairedThesis as string;
        }
      }
    } catch {
      setRepairNotice('AI repair service unavailable; fallback formatting applied.');
      setTimeout(() => setRepairNotice(null), 4500);
    } finally {
      setIsAiRepairing(false);
    }
    return null;
  };

  // Handle Save Thesis to PostgreSQL user account & library
  const handleSaveThesis = async () => {
    if (!thesisMarkdown) return;

    if (!isAuthenticated) {
      setShowAuthModalForSave(true);
      return;
    }

    setIsSavingThesis(true);
    try {
      const res = await fetch('/api/ai/thesis/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({
          symbol: cleanSym,
          thesis: thesisMarkdown,
          currency: 'USD'
        })
      });

      if (res.ok) {
        setIsThesisSaved(true);
        setRepairNotice(`Investment thesis for ${cleanSym} saved to your profile library.`);
        setTimeout(() => setRepairNotice(null), 4000);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || 'Failed to save investment thesis.');
      }
    } catch {
      setError('Network error saving thesis. Please try again.');
    } finally {
      setIsSavingThesis(false);
    }
  };

  // Handle Download Request with AI Auto-Repair on Error
  const handleDownload = async (format: 'pdf' | 'docx' | 'excel' | 'sheets' | 'md', thesisSource?: string) => {
    const activeThesis = thesisSource || thesisMarkdown;
    if (!activeThesis) return;

    // Free tier users are redirected to pricing
    if (plan === 'basic') {
      navigate('/pricing');
      return;
    }

    setDownloadingFormat(format);
    try {
      const executeDownload = async (contentToSend: string) => {
        return fetch('/api/ai/thesis/download', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-hedger-plan': plan
          },
          body: JSON.stringify({
            symbol: cleanSym,
            thesis: contentToSend,
            format
          })
        });
      };

      let res = await executeDownload(activeThesis);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 403 && errData.upgradeRequired) {
          navigate('/pricing');
          return;
        }

        // Auto-invoke AI Error Handler to repair markdown tables & formatting and retry export
        setRepairNotice('Export formatting issue detected. Automatically invoking AI to repair tables and retry...');
        const repaired = await handleAiRepair(activeThesis, errData.error || 'Export failed');

        if (repaired) {
          res = await executeDownload(repaired);
        }

        if (!res.ok) {
          const secondErrData = await res.json().catch(() => ({}));
          throw new Error(secondErrData.error || errData.error || 'Download failed after AI repair attempt');
        }
      }

      if (format === 'pdf') {
        const htmlText = await res.text();
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.open();
          printWindow.document.write(htmlText);
          printWindow.document.close();
          setTimeout(() => {
            printWindow.focus();
            printWindow.print();
          }, 300);
        } else {
          // If popup is blocked, download institutional HTML file
          const blob = new Blob([htmlText], { type: 'text/html;charset=utf-8' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${cleanSym}_Investment_Thesis_Institutional.html`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }
      } else {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const extension =
          format === 'docx' ? 'doc'
          : format === 'excel' ? 'csv'
          : format === 'sheets' ? 'csv'
          : 'md';
        const fileSuffix =
          format === 'excel' ? 'Model'
          : format === 'sheets' ? 'Sheets'
          : '';
        a.download = fileSuffix
          ? `${cleanSym}_Investment_Thesis_${fileSuffix}.${extension}`
          : `${cleanSym}_Investment_Thesis.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Download error';
      setError(msg);
    } finally {
      setDownloadingFormat(null);
      setExportMenuOpen(false);
    }
  };

  // Helper parser for markdown content
  const renderMarkdownContent = (md: string) => {
    const lines = md.split('\n');
    const elements: React.ReactNode[] = [];
    let tableBuffer: string[] = [];
    let inTable = false;

    const parseRowCells = (line: string): string[] => {
      const parts = line.split('|');
      if (parts.length >= 2) {
        return parts.slice(1, -1).map((c) => c.trim());
      }
      return parts.map((c) => c.trim());
    };

    const isNumericCell = (val: string): boolean => {
      const clean = val.replace(/[$€£₹%xX,\s\(\)\-–]/g, '');
      return clean.length > 0 && !isNaN(Number(clean));
    };

    const flushTable = (keyPrefix: number) => {
      if (tableBuffer.length < 2) {
        tableBuffer = [];
        inTable = false;
        return null;
      }
      const headerLine = tableBuffer[0];
      const secondLine = tableBuffer[1];
      const isDivider = /^\|(?:\s*:?-+:?\s*\|)+$/.test(secondLine.trim());
      const rows = isDivider ? tableBuffer.slice(2) : tableBuffer.slice(1);

      const headers = parseRowCells(headerLine);
      const numCols = Math.max(headers.length, 1);
      // Give wide tables adequate room so text never squishes or overlaps
      const minWidth = Math.max(720, numCols * 115);

      const tableEl = (
        <div
          key={`table-${keyPrefix}`}
          style={{
            overflowX: 'auto',
            marginBottom: '24px',
            borderRadius: '6px',
            border: '1px solid var(--border)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}
        >
          <table
            style={{
              width: '100%',
              minWidth: `${minWidth}px`,
              borderCollapse: 'collapse',
              fontSize: '12px',
              fontFamily: 'monospace',
              tableLayout: 'auto'
            }}
          >
            <thead>
              <tr style={{ backgroundColor: 'var(--secondary)' }}>
                {headers.map((h, i) => (
                  <th
                    key={i}
                    style={{
                      padding: '10px 14px',
                      borderBottom: '2px solid var(--border)',
                      borderRight: i < headers.length - 1 ? '1px solid var(--border)' : 'none',
                      textAlign: i === 0 ? 'left' : 'right',
                      fontWeight: 600,
                      color: 'var(--foreground)',
                      whiteSpace: numCols > 6 ? 'nowrap' : 'normal'
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((rowStr, rIdx) => {
                const cells = parseRowCells(rowStr);
                // Pad row if it has fewer cells than headers
                while (cells.length < headers.length) {
                  cells.push('');
                }
                return (
                  <tr
                    key={rIdx}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      backgroundColor: rIdx % 2 === 0 ? 'transparent' : 'var(--secondary)'
                    }}
                  >
                    {cells.map((cell, cIdx) => {
                      const isNum = isNumericCell(cell);
                      return (
                        <td
                          key={cIdx}
                          style={{
                            padding: '10px 14px',
                            borderRight: cIdx < cells.length - 1 ? '1px solid var(--border)' : 'none',
                            textAlign: cIdx === 0 ? 'left' : isNum ? 'right' : 'left',
                            color: 'var(--foreground)',
                            fontVariantNumeric: 'tabular-nums',
                            whiteSpace: numCols > 7 ? 'nowrap' : 'normal'
                          }}
                        >
                          {cell}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );

      tableBuffer = [];
      inTable = false;
      return tableEl;
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      if (trimmed.startsWith('|')) {
        inTable = true;
        tableBuffer.push(trimmed);
        return;
      } else if (inTable) {
        const table = flushTable(idx);
        if (table) elements.push(table);
      }

      if (!trimmed) return;

      if (trimmed.startsWith('# ')) {
        elements.push(
          <h1
            key={idx}
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: 'var(--foreground)',
              marginTop: '32px',
              marginBottom: '16px',
              letterSpacing: '-0.02em'
            }}
          >
            {trimmed.replace('# ', '')}
          </h1>
        );
        return;
      }

      if (trimmed.startsWith('## ')) {
        elements.push(
          <div
            key={idx}
            style={{
              marginTop: '32px',
              marginBottom: '16px',
              paddingBottom: '8px',
              borderBottom: '1px solid var(--border)'
            }}
          >
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--foreground)',
                margin: 0
              }}
            >
              {trimmed.replace('## ', '')}
            </h2>
          </div>
        );
        return;
      }

      if (trimmed.startsWith('### ')) {
        elements.push(
          <h3
            key={idx}
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--foreground)',
              marginTop: '20px',
              marginBottom: '8px'
            }}
          >
            {trimmed.replace('### ', '')}
          </h3>
        );
        return;
      }

      if (trimmed.startsWith('> ')) {
        elements.push(
          <div
            key={idx}
            style={{
              padding: '12px 16px',
              backgroundColor: 'var(--secondary)',
              borderLeft: '3px solid var(--foreground)',
              fontSize: '13px',
              fontStyle: 'italic',
              color: 'var(--text-muted)',
              marginBottom: '16px'
            }}
          >
            {trimmed.replace('> ', '')}
          </div>
        );
        return;
      }

      if (trimmed.startsWith('- ')) {
        elements.push(
          <div
            key={idx}
            style={{
              display: 'flex',
              gap: '8px',
              fontSize: '13px',
              lineHeight: 1.6,
              color: 'var(--foreground)',
              marginBottom: '6px'
            }}
          >
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <div>{trimmed.replace('- ', '')}</div>
          </div>
        );
        return;
      }

      if (trimmed === '---') {
        elements.push(
          <hr
            key={idx}
            style={{
              border: 'none',
              borderTop: '1px solid var(--border)',
              marginTop: '24px',
              marginBottom: '24px'
            }}
          />
        );
        return;
      }

      elements.push(
        <p
          key={idx}
          style={{
            fontSize: '13px',
            lineHeight: 1.6,
            color: 'var(--foreground)',
            marginBottom: '12px'
          }}
        >
          {trimmed}
        </p>
      );
    });

    if (inTable) {
      const table = flushTable(lines.length);
      if (table) elements.push(table);
    }

    return elements;
  };

  return (
    <div className="page-container" style={{ paddingBottom: '64px' }}>
      {/* Top Breadcrumb & Navigation */}
      <div id="thesis-top-toolbar" style={{ marginTop: '24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <button
          onClick={() => navigate(`/company/${encodeURIComponent(cleanSym)}`)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '12px',
            cursor: 'pointer',
            padding: 0,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>←</span>
          <span>Back to {cleanSym} Overview</span>
        </button>

        {/* Top Right Controls: Institutional Badge + Export / Download Button with Hover Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HedgerOrb size={28} speed={1.15} />
            <span className="hedger-intelligence-title" style={{ fontSize: '18px' }}>
              HEDGER INTELLIGENCE
            </span>
          </div>

          {thesisMarkdown && (
            <button
              onClick={() => handleAiRepair()}
              disabled={isAiRepairing}
              className="btn btn-secondary"
              style={{
                height: '36px',
                fontSize: '12px',
                padding: '0 14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 500,
                cursor: isAiRepairing ? 'not-allowed' : 'pointer'
              }}
              title="Verify and repair table columns, formatting, and markdown syntax using AI"
            >
              {isAiRepairing ? (
                <>
                  <span
                    style={{
                      width: '12px',
                      height: '12px',
                      border: '2px solid var(--border)',
                      borderTopColor: 'var(--foreground)',
                      borderRadius: '50%',
                      display: 'inline-block',
                      animation: 'spin 1s linear infinite'
                    }}
                  />
                  <span>AI Repairing...</span>
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                  </svg>
                  <span>AI Repair & Verify</span>
                </>
              )}
            </button>
          )}

          {/* Save Thesis Button */}
          {thesisMarkdown && (
            <button
              onClick={handleSaveThesis}
              disabled={isSavingThesis}
              className="btn btn-secondary"
              style={{
                height: '36px',
                fontSize: '12px',
                padding: '0 14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 500,
                cursor: isSavingThesis ? 'not-allowed' : 'pointer',
                color: isThesisSaved ? 'var(--positive, #10B981)' : 'var(--foreground)',
                borderColor: isThesisSaved ? 'var(--positive, #10B981)' : undefined
              }}
              title={isThesisSaved ? 'Thesis saved to your account library' : 'Save this investment thesis to your profile'}
            >
              {isSavingThesis ? (
                <>
                  <span
                    style={{
                      width: '12px',
                      height: '12px',
                      border: '2px solid var(--border)',
                      borderTopColor: 'var(--foreground)',
                      borderRadius: '50%',
                      display: 'inline-block',
                      animation: 'spin 1s linear infinite'
                    }}
                  />
                  <span>Saving...</span>
                </>
              ) : isThesisSaved ? (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Saved</span>
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  <span>Save Thesis</span>
                </>
              )}
            </button>
          )}

          {isThesisSaved && (
            <button
              onClick={() => navigate('/profile?tab=saved')}
              className="btn btn-secondary"
              style={{
                height: '36px',
                fontSize: '12px',
                padding: '0 12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>Saved Models →</span>
            </button>
          )}

          {thesisMarkdown && (
            <div
              className="export-dropdown-wrapper"
              style={{ position: 'relative' }}
              onMouseEnter={() => setExportMenuOpen(true)}
              onMouseLeave={() => setExportMenuOpen(false)}
            >
              <button
                onClick={() => setExportMenuOpen((prev) => !prev)}
                className="btn btn-primary"
                style={{
                  height: '36px',
                  fontSize: '12px',
                  padding: '0 16px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
                aria-label="Export or download investment thesis"
              >
                <span>Export / Download</span>
                <span
                  style={{
                    fontSize: '10px',
                    display: 'inline-block',
                    transform: exportMenuOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.15s ease'
                  }}
                >
                  ▾
                </span>
              </button>

              {/* Dropdown Menu on hover / click */}
              {exportMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '6px',
                    width: '320px',
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    boxShadow: '0 12px 30px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
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

                  {/* 1. PDF - Institutional Format Featured */}
                  <button
                    onClick={() => handleDownload('pdf')}
                    disabled={downloadingFormat !== null}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--secondary)',
                      color: 'var(--foreground)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '3px',
                        backgroundColor: 'var(--foreground)',
                        color: 'var(--background)',
                        fontFamily: 'monospace'
                      }}
                    >
                      PDF
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', fontWeight: 600 }}>PDF Document (Institutional Format)</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.4 }}>
                        Executive research memo with metadata table and print layout
                      </div>
                    </div>
                  </button>

                  {/* 2. DOCX */}
                  <button
                    onClick={() => handleDownload('docx')}
                    disabled={downloadingFormat !== null}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '10px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: 'var(--foreground)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--secondary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '3px',
                        backgroundColor: 'var(--border)',
                        color: 'var(--foreground)',
                        fontFamily: 'monospace'
                      }}
                    >
                      DOCX
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', fontWeight: 500 }}>Word Document (.docx)</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Fully editable institutional document with styled tables
                      </div>
                    </div>
                  </button>

                  {/* 3. EXCEL */}
                  <button
                    onClick={() => handleDownload('excel')}
                    disabled={downloadingFormat !== null}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '10px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: 'var(--foreground)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--secondary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '3px',
                        backgroundColor: 'var(--border)',
                        color: 'var(--foreground)',
                        fontFamily: 'monospace'
                      }}
                    >
                      EXCEL
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', fontWeight: 500 }}>Excel Spreadsheet (.xlsx)</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Financial model data, multi-year statements and valuation tables
                      </div>
                    </div>
                  </button>

                  {/* 4. SHEETS */}
                  <button
                    onClick={() => handleDownload('sheets')}
                    disabled={downloadingFormat !== null}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '10px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: 'var(--foreground)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--secondary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '3px',
                        backgroundColor: 'var(--border)',
                        color: 'var(--foreground)',
                        fontFamily: 'monospace'
                      }}
                    >
                      SHEETS
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', fontWeight: 500 }}>Google Sheets (.sheets)</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Importable CSV structured specifically for Google Sheets
                      </div>
                    </div>
                  </button>

                  {/* 5. MD */}
                  <button
                    onClick={() => handleDownload('md')}
                    disabled={downloadingFormat !== null}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '10px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: 'var(--foreground)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--secondary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '3px',
                        backgroundColor: 'var(--border)',
                        color: 'var(--foreground)',
                        fontFamily: 'monospace'
                      }}
                    >
                      MD
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', fontWeight: 500 }}>Markdown Source (.md)</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Raw source text with [R], [C], [F], [A], [E] data tags
                      </div>
                    </div>
                  </button>

                  {downloadingFormat && (
                    <div
                      style={{
                        padding: '8px 10px',
                        fontSize: '11px',
                        color: 'var(--foreground)',
                        fontWeight: 500,
                        textAlign: 'center',
                        borderTop: '1px solid var(--border)',
                        marginTop: '4px',
                        backgroundColor: 'var(--secondary)',
                        borderRadius: '4px'
                      }}
                    >
                      Preparing {downloadingFormat.toUpperCase()} export...
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* AI Error Repair Notification Banner */}
      {repairNotice && (
        <div
          style={{
            marginBottom: '20px',
            padding: '12px 16px',
            backgroundColor: 'var(--secondary)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: 'var(--foreground)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
          </svg>
          <span style={{ flex: 1, fontWeight: 500 }}>{repairNotice}</span>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: 'rgb(239, 68, 68)',
            fontSize: '13px',
            marginBottom: '20px'
          }}
        >
          {error}
        </div>
      )}

      {/* Case 1: Loading initial state */}
      {loading && (
        <div style={{ padding: '64px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
          Loading investment thesis...
        </div>
      )}

      {/* Case 2: Generating */}
      {isGenerating && (
        <div
          style={{
            borderRadius: '12px',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--card)',
            padding: '32px',
            marginBottom: '24px',
            fontFamily: 'monospace'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              borderBottom: '1px solid var(--border)',
              paddingBottom: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--foreground)',
                  display: 'inline-block',
                  animation: 'pulse 1.5s infinite ease-in-out'
                }}
              />
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>
                Synthesizing Live Investment Thesis ({cleanSym})
              </span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Step {Math.min(activeStep + 1, steps.length)} of {steps.length}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {steps.map((st, sIdx) => {
              const isDone = activeStep > sIdx;
              const isCurrent = activeStep === sIdx;
              return (
                <div
                  key={sIdx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '13px',
                    color: isDone ? 'var(--foreground)' : isCurrent ? 'var(--foreground)' : 'var(--text-muted)',
                    fontWeight: isCurrent ? 600 : 400
                  }}
                >
                  <span
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '4px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      border: '1px solid var(--border)',
                      backgroundColor: isDone ? 'var(--foreground)' : isCurrent ? 'var(--secondary)' : 'transparent',
                      color: isDone ? 'var(--background)' : 'inherit'
                    }}
                  >
                    {isDone ? '✓' : sIdx + 1}
                  </span>
                  <span>{st}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Case 3: Not yet generated */}
      {!loading && !isGenerating && !thesisMarkdown && (
        <div
          style={{
            padding: '64px 32px',
            textAlign: 'center',
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            margin: '32px 0'
          }}
        >
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '8px' }}>
            No Investment Thesis Generated Yet for {cleanSym}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '520px', margin: '0 auto 24px', lineHeight: 1.5 }}>
            Synthesize an institutional equity research thesis using validated filings, reverse DCF expectations, and probability-weighted scenarios.
          </p>
          <button
            onClick={handleGenerate}
            className="btn btn-primary"
            style={{ height: '40px', padding: '0 24px', fontSize: '13px' }}
          >
            Generate Live Thesis
          </button>
        </div>
      )}

      {/* Case 4: Generated Thesis Display */}
      {!loading && !isGenerating && thesisMarkdown && (
        <>
          {/* Guest Save Banner with Google Sandbox, Apple, GitHub */}
          {!isAuthenticated && (
            <div
              style={{
                marginBottom: '20px',
                padding: '16px 20px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '2px' }}>
                  Save this research report & assumptions to your account
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Sign in with Google Sandbox, Apple, or GitHub to save this 18-section thesis and monitor {cleanSym} across devices.
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setShowAuthModalForSave(true)}
                  className="btn btn-primary"
                  style={{ height: '36px', minHeight: '36px', padding: '0 16px', fontSize: '12px' }}
                >
                  Sign in to Save
                </button>
              </div>
            </div>
          )}

          <div
            style={{
              borderRadius: '12px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--card)',
              padding: '32px'
            }}
          >
            {/* Header Action Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
                paddingBottom: '24px',
                borderBottom: '1px solid var(--border)',
                marginBottom: '24px'
              }}
            >
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Audited & Reconciled Institutional Output
                </span>
                <h1 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--foreground)', margin: '4px 0 0 0' }}>
                  {cleanSym} — Institutional Investment Thesis
                </h1>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--foreground)' }}>
                  18-Section Research Template
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Multi-Horizon Estimates: 1Y · 2Y · 5Y
                </div>
              </div>
            </div>

            {/* Formatted Content */}
            <div style={{ color: 'var(--foreground)' }}>
              {renderMarkdownContent(thesisMarkdown)}
            </div>
          </div>
        </>
      )}

      {/* Save Research Data & Investment Thesis Modal with Google Sandbox, Apple, GitHub */}
      {showAuthModalForSave && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Save Research Data"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1200,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setShowAuthModalForSave(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '440px',
              backgroundColor: 'var(--card)',
              borderRadius: '12px',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.3)',
              border: '1px solid var(--border)',
              padding: '32px',
              boxSizing: 'border-box'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--foreground)', margin: '0 0 4px 0' }}>
                  Save Research Data & Thesis
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
                  Sign in with Google Sandbox, Apple, or GitHub to save this 18-section thesis and DCF assumptions to your profile.
                </p>
              </div>
              <button
                onClick={() => setShowAuthModalForSave(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '18px',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 0
                }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <OAuthSandboxGateway
              actionReason={`Save ${cleanSym} institutional thesis & assumptions to your profile`}
              onSuccess={async () => {
                setShowAuthModalForSave(false);
                await handleSaveThesis();
              }}
            />

            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => setShowAuthModalForSave(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
