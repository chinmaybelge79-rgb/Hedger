import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext.js';

interface ThesisJob {
  symbol: string;
  status: 'idle' | 'generating' | 'ready' | 'error';
  thesis?: string | null;
  error?: string | null;
  startedAt?: number;
  completedAt?: number;
  dismissed?: boolean;
}

interface ThesisContextValue {
  activeJob: ThesisJob | null;
  startGeneration: (symbol: string, dcfInputs?: any, analysis?: any) => Promise<string | null>;
  dismissNotification: () => void;
  getThesisForSymbol: (symbol: string) => string | null;
  isGeneratingSymbol: (symbol: string) => boolean;
}

const STORAGE_KEY = 'hedger_thesis_background_job';

const ThesisContext = createContext<ThesisContextValue | null>(null);

export const ThesisProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const plan = user?.plan || 'basic';

  const [activeJob, setActiveJob] = useState<ThesisJob | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Expire jobs older than 1 hour
        if (parsed.startedAt && Date.now() - parsed.startedAt < 3600000) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return null;
  });

  // Sync active job to localStorage
  useEffect(() => {
    try {
      if (activeJob) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(activeJob));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, [activeJob]);

  // If a job was left in 'generating' state on reload, poll for completion
  useEffect(() => {
    if (activeJob && activeJob.status === 'generating') {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/ai/thesis/${encodeURIComponent(activeJob.symbol)}`);
          if (res.ok) {
            const data = await res.json();
            if (data?.thesis) {
              setActiveJob((prev) =>
                prev
                  ? {
                      ...prev,
                      status: 'ready',
                      thesis: data.thesis,
                      completedAt: Date.now(),
                      dismissed: false
                    }
                  : null
              );
              clearInterval(interval);
            }
          }
        } catch {
          // ignore
        }
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [activeJob?.status, activeJob?.symbol]);

  const startGeneration = useCallback(
    async (rawSymbol: string, dcfInputs?: any, analysis?: any): Promise<string | null> => {
      const sym = rawSymbol.toUpperCase().trim();
      const newJob: ThesisJob = {
        symbol: sym,
        status: 'generating',
        startedAt: Date.now(),
        dismissed: false
      };
      setActiveJob(newJob);

      try {
        const res = await fetch('/api/ai/thesis/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-hedger-plan': plan
          },
          body: JSON.stringify({
            symbol: sym,
            dcfInputs,
            analysis
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData.error || 'Failed to generate investment thesis';
          setActiveJob({
            symbol: sym,
            status: 'error',
            error: errMsg,
            dismissed: false
          });
          return null;
        }

        const data = await res.json();
        try {
          const item = localStorage.getItem('hedger_theses_generated_symbols');
          const list = item ? JSON.parse(item) : [];
          if (!list.includes(sym)) {
            list.push(sym);
            localStorage.setItem('hedger_theses_generated_symbols', JSON.stringify(list));
          }
        } catch {
          // ignore
        }
        const readyJob: ThesisJob = {
          symbol: sym,
          status: 'ready',
          thesis: data.thesis,
          completedAt: Date.now(),
          dismissed: false
        };
        setActiveJob(readyJob);
        return data.thesis;
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : 'Network error during thesis generation';
        setActiveJob({
          symbol: sym,
          status: 'error',
          error: errMsg,
          dismissed: false
        });
        return null;
      }
    },
    [plan]
  );

  const dismissNotification = useCallback(() => {
    setActiveJob((prev) => (prev ? { ...prev, dismissed: true } : null));
  }, []);

  const getThesisForSymbol = useCallback(
    (sym: string) => {
      if (activeJob && activeJob.symbol === sym.toUpperCase().trim() && activeJob.thesis) {
        return activeJob.thesis;
      }
      return null;
    },
    [activeJob]
  );

  const isGeneratingSymbol = useCallback(
    (sym: string) => {
      return Boolean(activeJob && activeJob.symbol === sym.toUpperCase().trim() && activeJob.status === 'generating');
    },
    [activeJob]
  );

  return (
    <ThesisContext.Provider
      value={{
        activeJob,
        startGeneration,
        dismissNotification,
        getThesisForSymbol,
        isGeneratingSymbol
      }}
    >
      {children}

      {/* Floating Ready Notification: Only shows after generation finishes, does not interrupt until user clicks */}
      {activeJob && activeJob.status === 'ready' && !activeJob.dismissed && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9990,
            maxWidth: '380px',
            padding: '16px 20px',
            backgroundColor: '#121215',
            color: '#FFFFFF',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            borderRadius: '12px',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.8), 0 0 20px rgba(59, 130, 246, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#22C55E',
                  boxShadow: '0 0 8px #22C55E'
                }}
              />
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Hedger Intelligence
              </span>
            </div>
            <button
              onClick={dismissNotification}
              aria-label="Dismiss notification"
              style={{
                background: 'none',
                border: 'none',
                color: '#71717A',
                cursor: 'pointer',
                fontSize: '14px',
                lineHeight: 1,
                padding: '2px'
              }}
            >
              ✕
            </button>
          </div>

          <div style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF', lineHeight: 1.35 }}>
            Investment Thesis for {activeJob.symbol} Ready
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <button
              onClick={() => {
                dismissNotification();
                navigate(`/company/${activeJob.symbol}/thesis`);
              }}
              style={{
                flex: 1,
                padding: '8px 14px',
                backgroundColor: '#3B82F6',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Open Thesis
            </button>
            <button
              onClick={dismissNotification}
              style={{
                padding: '8px 12px',
                backgroundColor: 'transparent',
                color: '#A1A1AA',
                border: '1px solid #27272A',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </ThesisContext.Provider>
  );
};

export const useThesis = (): ThesisContextValue => {
  const ctx = useContext(ThesisContext);
  if (!ctx) {
    throw new Error('useThesis must be used within a ThesisProvider');
  }
  return ctx;
};
