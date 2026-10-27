import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { HedgerOrb } from '../components/HedgerOrb.js';

export const InvestmentThesisPage: React.FC = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

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

  // Handle Download Request
  const handleDownload = async (format: 'pdf' | 'docx' | 'excel' | 'sheets' | 'md') => {
    if (!thesisMarkdown) return;

    // Free tier users are redirected to pricing
    if (plan === 'basic') {
      navigate('/pricing');
      return;
    }

    setDownloadingFormat(format);
    try {
      const res = await fetch('/api/ai/thesis/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hedger-plan': plan
        },
        body: JSON.stringify({
          symbol: cleanSym,
          thesis: thesisMarkdown,
          format
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 403 && errData.upgradeRequired) {
          navigate('/pricing');
          return;
        }
        throw new Error(errData.error || 'Download failed');
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

    const flushTable = (keyPrefix: number) => {
      if (tableBuffer.length < 2) {
        tableBuffer = [];
        inTable = false;
        return null;
      }
      const headerLine = tableBuffer[0];
      const rows = tableBuffer.slice(2);

      const headers = headerLine
        .split('|')
        .map((c) => c.trim())
        .filter((c) => c.length > 0);

      const tableEl = (
        <div key={`table-${keyPrefix}`} style={{ overflowX: 'auto', marginBottom: '24px' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '12px',
              fontFamily: 'monospace',
              border: '1px solid var(--border)'
            }}
          >
            <thead>
              <tr style={{ backgroundColor: 'var(--secondary)' }}>
                {headers.map((h, i) => (
                  <th
                    key={i}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--border)',
                      textAlign: i === 0 ? 'left' : 'right',
                      fontWeight: 600,
                      color: 'var(--foreground)'
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((rowStr, rIdx) => {
                const cells = rowStr
                  .split('|')
                  .map((c) => c.trim())
                  .filter((c) => c.length > 0);
                return (
                  <tr
                    key={rIdx}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      backgroundColor: rIdx % 2 === 0 ? 'transparent' : 'var(--secondary)'
                    }}
                  >
                    {cells.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        style={{
                          padding: '12px 16px',
                          textAlign: cIdx === 0 ? 'left' : 'right',
                          color: 'var(--foreground)'
                        }}
                      >
                        {cell}
                      </td>
                    ))}
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

      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
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
      )}
    </div>
  );
};
