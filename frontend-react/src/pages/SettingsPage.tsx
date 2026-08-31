import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Toggle } from '../components/ui/Toggle';
import { useTheme } from '../hooks/useTheme';
import { ChevronLeft, Mail, Lock, User, Settings as SettingsIcon } from 'lucide-react';

export function SettingsPage() {
  const { isDark, isReading, toggleDark, toggleReading } = useTheme();

  return (
    <div id="view-settings" className="view">
      <div className="wrap pt-8 pb-15 max-w-[720px]">
        <div className="eyebrow mb-6 flex items-center gap-2">
          <Link to="/" className="text-ash underline underline-offset-2 hover:text-ink flex items-center gap-1">
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 5l-6 6 6 6"/></svg>
            Home
          </Link>
          <span className="text-ash">&middot;</span>
          <span>Settings</span>
        </div>
        <h1 className="text-2xl font-bold mb-8">Settings</h1>

        <div className="mb-8">
          <h2 className="text-base font-semibold mb-4 pb-2 border-b border-hairline">Appearance</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3.5 border-b border-hairline">
              <div className="flex items-center gap-3">
                <Sun className="w-5 h-5 text-ash flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium">Dark mode</div>
                  <div className="text-[12px] text-ash mt-0.5">Switch between light and dark theme</div>
                </div>
              </div>
              <Toggle checked={false} onChange={toggleDark} aria-label="Toggle dark mode" />
            </div>
            <div className="flex items-center justify-between py-3.5 border-b border-hairline">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 text-ash flex-shrink-0">📖</div>
                <div>
                  <div className="text-sm font-medium">Reading mode</div>
                  <div className="text-[12px] text-ash mt-0.5">Warm colors for comfortable night reading</div>
                </div>
              </div>
              <Toggle checked={false} onChange={toggleReading} aria-label="Toggle reading mode" />
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-base font-semibold mb-4 pb-2 border-b border-hairline">Account</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3.5 border-b border-hairline">
              <div>
                <div className="text-sm font-medium">Email</div>
                <div className="text-[12px] text-ash mt-0.5">Sign in to manage your account</div>
              </div>
              <Button variant="secondary" size="sm">Sign in</Button>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-base font-semibold mb-4 pb-2 border-b border-hairline">About</h2>
          <div className="py-3.5 text-sm text-graphite leading-relaxed">
            <p>Hedger v1.0 — Institutional-grade valuations for investors and portfolio managers.</p>
            <p className="mt-2">Built by <strong>Chinmay Belge</strong>. Not investment advice.</p>
          </div>
        </div>
      </div>
    </div>
  );
}