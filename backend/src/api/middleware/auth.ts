import { FastifyRequest } from 'fastify';
import { prisma } from '@config/database';
import { verifyJwt } from '@utils/auth';
import { AppError } from '@utils/errors';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  plan: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

export async function authenticate(request: FastifyRequest): Promise<AuthUser | null> {
  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length).trim();
  const payload = verifyJwt(token);
  if (!payload) return null;
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) return null;
  return { id: user.id, email: user.email, displayName: user.displayName, plan: user.plan };
}

/**
 * Lightweight auth parse (no DB hit): attaches a provisional user when the
 * bearer token is structurally valid. requireAuth() upgrades to a verified user.
 */
export function authenticateLight(request: FastifyRequest): AuthUser | null {
  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length).trim();
  const payload = verifyJwt(token);
  if (!payload) return null;
  return { id: payload.sub, email: payload.email, displayName: null, plan: 'unverified' };
}

export async function requireAuth(request: FastifyRequest): Promise<AuthUser> {
  const user = await authenticate(request);
  if (!user) throw AppError.unauthorized('Authentication required');
  return user;
}

export function getOptionalUser(request: FastifyRequest): AuthUser | null {
  return request.user ?? null;
}
