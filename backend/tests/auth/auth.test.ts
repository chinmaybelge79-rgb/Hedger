import { describe, it, expect, beforeAll } from 'vitest';
import { hashPassword, verifyPassword, signJwt, verifyJwt } from '../../src/utils/auth';

describe('password hashing', () => {
  it('hashes and verifies a password', async () => {
    const hash = await hashPassword('correct horse battery staple');
    expect(hash).toMatch(/^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
    expect(await verifyPassword('correct horse battery staple', hash)).toBe(true);
  });

  it('rejects wrong password', async () => {
    const hash = await hashPassword('password123');
    expect(await verifyPassword('password124', hash)).toBe(false);
  });

  it('rejects malformed stored hash', async () => {
    expect(await verifyPassword('x', 'garbage')).toBe(false);
    expect(await verifyPassword('x', 'scrypt$only$two')).toBe(false);
  });

  it('produces unique salts', async () => {
    const a = await hashPassword('same-password');
    const b = await hashPassword('same-password');
    expect(a).not.toEqual(b);
  });
});

describe('JWT sign/verify', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-32ch!';
  });

  it('round-trips a valid token', () => {
    const token = signJwt({ sub: 'user-1', email: 'a@b.co' }, 1);
    const payload = verifyJwt(token);
    expect(payload).not.toBeNull();
    expect(payload!.sub).toBe('user-1');
    expect(payload!.email).toBe('a@b.co');
  });

  it('rejects tampered tokens', () => {
    const token = signJwt({ sub: 'user-1', email: 'a@b.co' }, 1);
    const [h, p, s] = token.split('.');
    const forged = `${h}.${p}.${s.slice(0, -1)}${s.endsWith('A') ? 'B' : 'A'}`;
    expect(verifyJwt(forged)).toBeNull();
  });

  it('rejects expired tokens', () => {
    // Token signed with exp in the past
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const now = Math.floor(Date.now() / 1000);
    const body = Buffer.from(JSON.stringify({ sub: 'u', email: 'e@x.co', iat: now - 7200, exp: now - 3600 })).toString('base64url');
    const { createHmac } = require('node:crypto');
    const sig = createHmac('sha256', process.env.JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    expect(verifyJwt(`${header}.${body}.${sig}`)).toBeNull();
  });

  it('rejects garbage tokens', () => {
    expect(verifyJwt('not-a-jwt')).toBeNull();
    expect(verifyJwt('a.b.c.d')).toBeNull();
  });
});
