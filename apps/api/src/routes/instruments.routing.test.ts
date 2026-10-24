import { describe, it, expect } from 'vitest';

const API_BASE = 'http://localhost:3001/api/instruments';

describe('Workstream A: Backend Routing & Symbol Isolation Tests', { timeout: 20000 }, () => {
  it('resolves valid Indian stock (TCS.NS) to exact match', async () => {
    const res = await fetch(`${API_BASE}/resolve?symbol=TCS.NS`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('exact');
    expect(body.symbol).toBe('TCS.NS');
    expect(body.meta.symbol).toBe('TCS.NS');
    expect(body.name).toContain('Tata Consultancy');
  });

  it('resolves valid US stock (AAPL) to exact match', async () => {
    const res = await fetch(`${API_BASE}/resolve?symbol=AAPL`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('exact');
    expect(body.symbol).toBe('AAPL');
    expect(body.meta.symbol).toBe('AAPL');
    expect(body.name).toContain('Apple');
  });

  it('rejects invalid symbol format with 400', async () => {
    const res = await fetch(`${API_BASE}/resolve?symbol=INVALID$$%`);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.status).toBe('invalid');
  });

  it('returns 404 for unknown ticker with not_found status, never a silent default', async () => {
    const res = await fetch(`${API_BASE}/resolve?symbol=UNKNOWNXYZ.NS`);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.status).toBe('not_found');
    expect(body.error).toContain('not found');
  });

  it('overview endpoint isolates data: TCS.NS vs INFY.NS vs AAPL never cross-contaminate', async () => {
    const [tcsRes, infyRes, aaplRes] = await Promise.all([
      fetch(`${API_BASE}/TCS.NS/overview`),
      fetch(`${API_BASE}/INFY.NS/overview`),
      fetch(`${API_BASE}/AAPL/overview`)
    ]);

    expect(tcsRes.status).toBe(200);
    expect(infyRes.status).toBe(200);
    expect(aaplRes.status).toBe(200);

    const [tcsBody, infyBody, aaplBody] = await Promise.all([
      tcsRes.json(),
      infyRes.json(),
      aaplRes.json()
    ]);

    // Response guard verification: meta.symbol matches
    expect(tcsBody.meta.symbol).toBe('TCS.NS');
    expect(infyBody.meta.symbol).toBe('INFY.NS');
    expect(aaplBody.meta.symbol).toBe('AAPL');

    // Names are distinct and match reality
    expect(tcsBody.data.name).toContain('Tata Consultancy');
    expect(infyBody.data.name).toContain('Infosys');
    expect(aaplBody.data.name).toContain('Apple');

    // Currencies and prices differ
    expect(tcsBody.data.currency).toBe('INR');
    expect(aaplBody.data.currency).toBe('USD');
    expect(tcsBody.data.price).not.toBe(infyBody.data.price);
    expect(tcsBody.data.price).not.toBe(aaplBody.data.price);

    // Never returns Reliance for non-Reliance stocks
    expect(tcsBody.data.name).not.toContain('Reliance');
    expect(infyBody.data.name).not.toContain('Reliance');
    expect(aaplBody.data.name).not.toContain('Reliance');
  });
});
