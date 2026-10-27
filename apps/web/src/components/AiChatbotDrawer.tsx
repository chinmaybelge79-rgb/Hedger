import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface AiChatbotDrawerProps {
  currentSymbol?: string;
}

export const AiChatbotDrawer: React.FC<AiChatbotDrawerProps> = ({ currentSymbol }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: currentSymbol
        ? `Hedger AI Assistant active for ${currentSymbol}. Ask any question regarding stock valuation, financial statements, DCF mechanics, or market expectations.\n\nAll decisions are strictly at your own risk. While market conditions display some directional momentum, this terminal provides quantitative research only and does not recommend or advise to invest.`
        : 'Hedger AI Assistant active. Ask any question regarding stock valuation, financial statements, DCF mechanics, or market expectations.\n\nAll decisions are strictly at your own risk. While market conditions display some directional momentum, this terminal provides quantitative research only and does not recommend or advise to invest.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const plan = user?.plan || 'basic';

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    if (!isAuthenticated || !user) {
      setIsOpen(false);
      navigate(`/signin?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const apiMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hedger-plan': plan
        },
        body: JSON.stringify({
          messages: apiMessages,
          context: currentSymbol ? `Context: Currently analyzing stock ${currentSymbol}.` : undefined
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to communicate with AI assistant');
      }

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Service unavailable';
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${msg}. Please verify system connectivity.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const samplePrompts = [
    'Explain the WACC calculation mechanics',
    'How does reverse DCF calculate implied growth?',
    'What defines an institutional-grade moat?',
    'How is Free Cash Flow to Firm derived?'
  ];

  return (
    <>
      {/* Floating Launcher Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9990,
          height: '44px',
          padding: '0 16px',
          borderRadius: '22px',
          backgroundColor: 'var(--foreground)',
          color: 'var(--background)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          fontWeight: 600,
          letterSpacing: '0.02em',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
        }}
      >
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            display: 'inline-block'
          }}
        />
        <span>AI Assistant</span>
      </button>

      {/* Slide-over Drawer */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '80px',
            right: '24px',
            width: '400px',
            maxWidth: 'calc(100vw - 32px)',
            height: '560px',
            maxHeight: 'calc(100vh - 120px)',
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            boxShadow: '0 20px 48px rgba(0, 0, 0, 0.35)',
            zIndex: 9991,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px',
              borderBottom: '1px solid var(--border)',
              backgroundColor: 'var(--background)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>
                  Hedger AI Assistant
                </span>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--secondary)',
                    color: 'var(--foreground)',
                    border: '1px solid var(--border)'
                  }}
                >
                  Intelligence
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '18px',
                padding: '4px'
              }}
            >
              ×
            </button>
          </div>

          {/* Messages Area */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            {messages.map((m) => {
              const isAssistant = m.role === 'assistant';
              return (
                <div
                  key={m.id}
                  style={{
                    alignSelf: isAssistant ? 'flex-start' : 'flex-end',
                    maxWidth: '85%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isAssistant ? 'flex-start' : 'flex-end'
                  }}
                >
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      backgroundColor: isAssistant ? 'var(--secondary)' : 'var(--foreground)',
                      color: isAssistant ? 'var(--foreground)' : 'var(--background)',
                      border: isAssistant ? '1px solid var(--border)' : 'none',
                      fontSize: '12px',
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {m.content}
                  </div>
                  <span
                    style={{
                      fontSize: '10px',
                      color: 'var(--text-muted)',
                      marginTop: '4px',
                      padding: '0 4px'
                    }}
                  >
                    {m.timestamp}
                  </span>
                </div>
              );
            })}

            {isLoading && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--secondary)',
                  border: '1px solid var(--border)',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--foreground)',
                    display: 'inline-block',
                    animation: 'pulse 1s infinite ease-in-out'
                  }}
                />
                <span>Analyzing financial data...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts (if only welcome message) */}
          {messages.length === 1 && (
            <div
              style={{
                padding: '0 16px 12px 16px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px'
              }}
            >
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(p)}
                  style={{
                    background: 'none',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    color: 'var(--foreground)',
                    cursor: 'pointer',
                    backgroundColor: 'var(--secondary)',
                    textAlign: 'left'
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Unauthenticated notice */}
          {!isAuthenticated && (
            <div
              style={{
                padding: '8px 16px',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderTop: '1px solid rgba(59, 130, 246, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px'
              }}
            >
              <span style={{ fontSize: '11px', color: '#93c5fd' }}>
                Sign in to proceed with AI analysis
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate(`/signin?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
                }}
                style={{
                  padding: '4px 8px',
                  fontSize: '11px',
                  fontWeight: 600,
                  backgroundColor: '#ffffff',
                  color: '#000000',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Sign In →
              </button>
            </div>
          )}

          {/* Input Footer */}
          <div
            style={{
              padding: '12px 16px',
              borderTop: '1px solid var(--border)',
              backgroundColor: 'var(--background)'
            }}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              style={{ display: 'flex', gap: '8px' }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about valuation or financial health..."
                disabled={isLoading}
                style={{
                  flex: 1,
                  height: '36px',
                  padding: '0 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--secondary)',
                  color: 'var(--foreground)',
                  fontSize: '12px',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="btn btn-primary"
                style={{ height: '36px', padding: '0 14px', fontSize: '12px' }}
              >
                Send
              </button>
            </form>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '6px' }}>
              All decisions on own risk. Market conditions display directional momentum; not investment advice.
            </div>
          </div>
        </div>
      )}
    </>
  );
};
