export interface ProviderQuotaState {
  provider: 'finnhub' | 'alphavantage' | 'yfinance';
  limitPerMinute: number;
  callsThisMinute: number;
  dailyLimit?: number;
  callsToday: number;
  rateLimitHits: number;
  lastResetMinute: number;
  lastResetDay: string;
}

class QuotaBudgeterService {
  private quotas: Record<string, ProviderQuotaState> = {
    finnhub: {
      provider: 'finnhub',
      limitPerMinute: 60,
      callsThisMinute: 0,
      callsToday: 0,
      rateLimitHits: 0,
      lastResetMinute: Date.now(),
      lastResetDay: new Date().toISOString().slice(0, 10)
    },
    alphavantage: {
      provider: 'alphavantage',
      limitPerMinute: 5,
      callsThisMinute: 0,
      dailyLimit: 25,
      callsToday: 0,
      rateLimitHits: 0,
      lastResetMinute: Date.now(),
      lastResetDay: new Date().toISOString().slice(0, 10)
    },
    yfinance: {
      provider: 'yfinance',
      limitPerMinute: 10000,
      callsThisMinute: 0,
      callsToday: 0,
      rateLimitHits: 0,
      lastResetMinute: Date.now(),
      lastResetDay: new Date().toISOString().slice(0, 10)
    }
  };

  private resetIfExpired(provider: string) {
    const q = this.quotas[provider];
    if (!q) return;

    const now = Date.now();
    if (now - q.lastResetMinute > 60000) {
      q.callsThisMinute = 0;
      q.lastResetMinute = now;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    if (q.lastResetDay !== todayStr) {
      q.callsToday = 0;
      q.lastResetDay = todayStr;
    }
  }

  public canExecute(provider: 'finnhub' | 'alphavantage' | 'yfinance', isUserPath: boolean = true): boolean {
    // Standing rule: Alpha Vantage is strictly blocked from the user request path
    if (provider === 'alphavantage' && isUserPath) {
      return false;
    }

    this.resetIfExpired(provider);
    const q = this.quotas[provider];
    if (!q) return false;

    if (q.callsThisMinute >= q.limitPerMinute) {
      return false;
    }

    if (q.dailyLimit && q.callsToday >= q.dailyLimit) {
      return false;
    }

    return true;
  }

  public recordCall(provider: 'finnhub' | 'alphavantage' | 'yfinance') {
    this.resetIfExpired(provider);
    const q = this.quotas[provider];
    if (q) {
      q.callsThisMinute++;
      q.callsToday++;
    }
  }

  public recordRateLimitHit(provider: 'finnhub' | 'alphavantage' | 'yfinance') {
    const q = this.quotas[provider];
    if (q) {
      q.rateLimitHits++;
    }
  }

  public getStatus(): Record<string, ProviderQuotaState> {
    Object.keys(this.quotas).forEach((k) => this.resetIfExpired(k));
    return { ...this.quotas };
  }
}

export const quotaBudgeter = new QuotaBudgeterService();
