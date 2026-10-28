import pg from 'pg';
import { Redis } from 'ioredis';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { config } from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface DbUser {
  id: string;
  name: string;
  email: string;
  provider: 'google' | 'apple' | 'github' | 'email';
  avatar?: string | undefined;
  plan: 'basic' | 'plus' | 'pro' | 'ultra';
  passwordHash?: string | undefined;
  salt?: string | undefined;
  createdAt: string;
  updatedAt: string;
}

export interface DbSession {
  token: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
}

export interface DbOAuthAccount {
  id: string;
  userId: string;
  provider: 'google' | 'apple' | 'github';
  providerUserId: string;
  email: string;
  profileData?: any;
  createdAt: string;
}

export interface DbSavedModel {
  id: string;
  userId?: string | undefined;
  symbol: string;
  name: string;
  savedAt: string;
  priceAtSave: number;
  currency: string;
  intrinsicValuePerShare: number;
  marginOfSafety: number;
  engineVersion: string;
  inputs: Record<string, any>;
  outputs?: Record<string, any> | undefined;
  notes?: string | undefined;
}

export interface DbAiUsage {
  id: string;
  userId?: string | undefined;
  identifier: string;
  monthBucket: string;
  stockAnalysesCount: number;
  thesisGeneratedCount: number;
  thesisDownloadsCount: number;
  valuationVisitsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DbActivityLog {
  id: string;
  userId?: string | undefined;
  action: string;
  details?: Record<string, any> | undefined;
  ipAddress?: string | undefined;
  createdAt: string;
}

export interface UserTelemetry extends DbUser {
  savedModelsCount: number;
  thesesGeneratedCount: number;
  thesesDownloadedCount: number;
  stockAnalysesCount: number;
  valuationVisitsCount: number;
  lastActive?: string | number | undefined;
}

class DatabaseService {
  private pgPool: pg.Pool | null = null;
  private redisClient: Redis | null = null;
  private isPgConnected = false;
  private isRedisConnected = false;
  private inMemoryFallbackUsers = new Map<string, DbUser>();
  private inMemoryFallbackSessions = new Map<string, DbSession>();
  private inMemoryFallbackModels: DbSavedModel[] = [];
  private inMemoryFallbackAiUsage = new Map<string, DbAiUsage>();
  private inMemoryFallbackTheses = new Map<string, { symbol: string; thesis: string; createdAt: string }>();
  private inMemoryFallbackActivityLogs: DbActivityLog[] = [];

  constructor() {
    this.initPostgres();
    this.initRedis();
  }

  private async initPostgres() {
    try {
      const connectionString = config.DATABASE_URL || 'postgresql://chinmayb@localhost:5432/hedger';
      this.pgPool = new pg.Pool({
        connectionString,
        connectionTimeoutMillis: 3000,
        idleTimeoutMillis: 30000,
        max: 10
      });

      const client = await this.pgPool.connect();
      this.isPgConnected = true;
      console.log('[DatabaseService] Connected to PostgreSQL at', connectionString.replace(/:[^:@]+@/, ':***@'));
      await this.runMigrations(client);
      client.release();
    } catch (err: any) {
      console.warn('[DatabaseService] PostgreSQL not available, using persistent fallback:', err.message);
      this.isPgConnected = false;
      this.initSeedFallback();
    }
  }

  private async initRedis() {
    try {
      const redisUrl = config.REDIS_URL || 'redis://localhost:6379';
      this.redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        connectTimeout: 2000,
        retryStrategy: () => null // Don't infinite loop if redis is down
      });

      this.redisClient.on('connect', () => {
        this.isRedisConnected = true;
        console.log('[DatabaseService] Connected to Redis cache at', redisUrl);
      });

      this.redisClient.on('error', (_err: any) => {
        this.isRedisConnected = false;
      });
    } catch (err: any) {
      console.warn('[DatabaseService] Redis not available, using in-memory cache:', err.message);
      this.isRedisConnected = false;
    }
  }

  private async runMigrations(client: pg.PoolClient) {
    const ddl = `
      CREATE TABLE IF NOT EXISTS hedger_users (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        provider VARCHAR(32) NOT NULL DEFAULT 'email',
        avatar TEXT,
        plan VARCHAR(32) NOT NULL DEFAULT 'basic',
        password_hash TEXT,
        salt TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS hedger_sessions (
        token VARCHAR(128) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL REFERENCES hedger_users(id) ON DELETE CASCADE,
        created_at BIGINT NOT NULL,
        expires_at BIGINT NOT NULL,
        ip_address VARCHAR(128),
        user_agent TEXT
      );

      CREATE TABLE IF NOT EXISTS hedger_oauth_accounts (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL REFERENCES hedger_users(id) ON DELETE CASCADE,
        provider VARCHAR(32) NOT NULL,
        provider_user_id VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        profile_data JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(provider, provider_user_id)
      );

      CREATE TABLE IF NOT EXISTS hedger_saved_models (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES hedger_users(id) ON DELETE CASCADE,
        symbol VARCHAR(32) NOT NULL,
        name VARCHAR(255) NOT NULL,
        saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        price_at_save NUMERIC NOT NULL DEFAULT 0,
        currency VARCHAR(16) NOT NULL DEFAULT 'USD',
        intrinsic_value_per_share NUMERIC NOT NULL DEFAULT 0,
        margin_of_safety NUMERIC NOT NULL DEFAULT 0,
        engine_version VARCHAR(64) NOT NULL DEFAULT 'dcf-10y-v2.0-pure-decimal',
        inputs JSONB NOT NULL DEFAULT '{}'::jsonb,
        outputs JSONB,
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS hedger_ai_usage (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES hedger_users(id) ON DELETE CASCADE,
        identifier VARCHAR(128) NOT NULL,
        month_bucket VARCHAR(16) NOT NULL,
        stock_analyses_count INT NOT NULL DEFAULT 0,
        thesis_generated_count INT NOT NULL DEFAULT 0,
        thesis_downloads_count INT NOT NULL DEFAULT 0,
        valuation_visits_count INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(identifier, month_bucket)
      );

      CREATE TABLE IF NOT EXISTS hedger_theses (
        id VARCHAR(64) PRIMARY KEY,
        symbol VARCHAR(32) NOT NULL,
        user_id VARCHAR(64) REFERENCES hedger_users(id) ON DELETE SET NULL,
        thesis_text TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS hedger_activity_logs (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64),
        action VARCHAR(64) NOT NULL,
        details JSONB DEFAULT '{}'::jsonb,
        ip_address VARCHAR(128),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    await client.query(ddl);
    console.log('[DatabaseService] PostgreSQL schema verified successfully.');

    // Purge all legacy demo credentials and pre-seeded accounts from database
    await client.query(`
      DELETE FROM hedger_users WHERE id IN ('usr_chinusha', 'usr_sumit', 'usr_sumit_hedger', 'usr_chinu', 'usr_founder_chinmay') 
         OR email IN ('chinusha@gmail.com', 'sumit@gmail.com', 'sumit@hedger.capital', 'chinu@hedger.capital', 'medimianusha@gmail.com', 'alex.researcher@gmail.com', 'elena.rostova@gmail.com', 'sarah.quant@gmail.com');
      DELETE FROM hedger_saved_models WHERE id LIKE 'seed-%';
    `);
  }

  private initSeedFallback() {
    // Zero demo logins: clean in-memory state
    this.inMemoryFallbackUsers = new Map();
    this.inMemoryFallbackModels = [];
  }

  // ==========================================
  // USER METHODS
  // ==========================================

  async findUserByEmail(email: string): Promise<DbUser | null> {
    const cleanEmail = email.trim().toLowerCase();

    if (this.isPgConnected && this.pgPool) {
      try {
        const res = await this.pgPool.query(
          `SELECT id, email, name, provider, avatar, plan, password_hash as "passwordHash", salt, created_at as "createdAt", updated_at as "updatedAt"
           FROM hedger_users WHERE LOWER(email) = $1`,
          [cleanEmail]
        );
        if (res.rows.length > 0) return res.rows[0];
      } catch (err: any) {
        console.error('[DatabaseService] findUserByEmail error:', err.message);
      }
    }

    // Fallback
    for (const u of this.inMemoryFallbackUsers.values()) {
      if (u.email.toLowerCase() === cleanEmail) return u;
    }
    return null;
  }

  async findUserById(id: string): Promise<DbUser | null> {
    if (this.isPgConnected && this.pgPool) {
      try {
        const res = await this.pgPool.query(
          `SELECT id, email, name, provider, avatar, plan, password_hash as "passwordHash", salt, created_at as "createdAt", updated_at as "updatedAt"
           FROM hedger_users WHERE id = $1`,
          [id]
        );
        if (res.rows.length > 0) return res.rows[0];
      } catch (err: any) {
        console.error('[DatabaseService] findUserById error:', err.message);
      }
    }

    return this.inMemoryFallbackUsers.get(id) || null;
  }

  async createUser(user: Omit<DbUser, 'createdAt' | 'updatedAt'> & { createdAt?: string | undefined; updatedAt?: string | undefined }): Promise<DbUser> {
    const now = new Date().toISOString();
    const newUser: DbUser = {
      ...user,
      createdAt: user.createdAt || now,
      updatedAt: user.updatedAt || now
    };

    if (this.isPgConnected && this.pgPool) {
      try {
        await this.pgPool.query(
          `INSERT INTO hedger_users (id, email, name, provider, avatar, plan, password_hash, salt, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             avatar = EXCLUDED.avatar,
             plan = EXCLUDED.plan,
             updated_at = EXCLUDED.updated_at`,
          [
            newUser.id,
            newUser.email.toLowerCase(),
            newUser.name,
            newUser.provider,
            newUser.avatar || null,
            newUser.plan,
            newUser.passwordHash || null,
            newUser.salt || null,
            newUser.createdAt,
            newUser.updatedAt
          ]
        );
      } catch (err: any) {
        console.error('[DatabaseService] createUser error:', err.message);
      }
    }

    this.inMemoryFallbackUsers.set(newUser.id, newUser);
    return newUser;
  }

  async updateUser(id: string, updates: Partial<DbUser>): Promise<DbUser | null> {
    const user = await this.findUserById(id);
    if (!user) return null;

    const updated: DbUser = {
      ...user,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    if (this.isPgConnected && this.pgPool) {
      try {
        await this.pgPool.query(
          `UPDATE hedger_users
           SET name = $1, avatar = $2, plan = $3, updated_at = $4
           WHERE id = $5`,
          [updated.name, updated.avatar || null, updated.plan, updated.updatedAt, id]
        );
      } catch (err: any) {
        console.error('[DatabaseService] updateUser error:', err.message);
      }
    }

    this.inMemoryFallbackUsers.set(id, updated);
    return updated;
  }

  // ==========================================
  // SESSION METHODS (With Redis Caching)
  // ==========================================

  async createSession(userId: string, token: string, expiresAt: number, ip?: string | undefined, userAgent?: string | undefined): Promise<DbSession> {
    const session: DbSession = {
      token,
      userId,
      createdAt: Date.now(),
      expiresAt,
      ipAddress: ip,
      userAgent
    };

    // 1. Write to Redis (TTL in seconds)
    if (this.isRedisConnected && this.redisClient) {
      try {
        const ttlSeconds = Math.max(1, Math.floor((expiresAt - Date.now()) / 1000));
        await this.redisClient.set(
          `hedger:session:${token}`,
          JSON.stringify(session),
          'EX',
          ttlSeconds
        );
      } catch (err: any) {
        console.warn('[DatabaseService] Redis cache write error:', err.message);
      }
    }

    // 2. Write to PostgreSQL
    if (this.isPgConnected && this.pgPool) {
      try {
        await this.pgPool.query(
          `INSERT INTO hedger_sessions (token, user_id, created_at, expires_at, ip_address, user_agent)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (token) DO UPDATE SET
             expires_at = EXCLUDED.expires_at`,
          [session.token, session.userId, session.createdAt, session.expiresAt, session.ipAddress || null, session.userAgent || null]
        );
      } catch (err: any) {
        console.error('[DatabaseService] createSession pg error:', err.message);
      }
    }

    this.inMemoryFallbackSessions.set(token, session);
    return session;
  }

  async getSession(token: string): Promise<DbSession | null> {
    if (!token) return null;

    // 1. Check Redis fast cache first
    if (this.isRedisConnected && this.redisClient) {
      try {
        const cached = await this.redisClient.get(`hedger:session:${token}`);
        if (cached) {
          const session = JSON.parse(cached) as DbSession;
          if (Date.now() <= session.expiresAt) {
            return session;
          }
          await this.redisClient.del(`hedger:session:${token}`);
          return null;
        }
      } catch (err: any) {
        // Ignore cache miss / error
      }
    }

    // 2. Check PostgreSQL
    if (this.isPgConnected && this.pgPool) {
      try {
        const res = await this.pgPool.query(
          `SELECT token, user_id as "userId", created_at as "createdAt", expires_at as "expiresAt",
                  ip_address as "ipAddress", user_agent as "userAgent"
           FROM hedger_sessions WHERE token = $1`,
          [token]
        );
        if (res.rows.length > 0) {
          const session = res.rows[0] as DbSession;
          if (Date.now() > session.expiresAt) {
            await this.deleteSession(token);
            return null;
          }
          // Backfill into Redis
          if (this.isRedisConnected && this.redisClient) {
            const ttlSeconds = Math.max(1, Math.floor((session.expiresAt - Date.now()) / 1000));
            await this.redisClient.set(`hedger:session:${token}`, JSON.stringify(session), 'EX', ttlSeconds);
          }
          return session;
        }
      } catch (err: any) {
        console.error('[DatabaseService] getSession pg error:', err.message);
      }
    }

    // Fallback
    const fallback = this.inMemoryFallbackSessions.get(token);
    if (fallback) {
      if (Date.now() > fallback.expiresAt) {
        this.inMemoryFallbackSessions.delete(token);
        return null;
      }
      return fallback;
    }

    return null;
  }

  async deleteSession(token: string): Promise<void> {
    if (!token) return;

    if (this.isRedisConnected && this.redisClient) {
      try {
        await this.redisClient.del(`hedger:session:${token}`);
      } catch (err: any) {
        // ignore
      }
    }

    if (this.isPgConnected && this.pgPool) {
      try {
        await this.pgPool.query(`DELETE FROM hedger_sessions WHERE token = $1`, [token]);
      } catch (err: any) {
        // ignore
      }
    }

    this.inMemoryFallbackSessions.delete(token);
  }

  // ==========================================
  // OAUTH ACCOUNT METHODS
  // ==========================================

  async upsertOAuthAccount(account: DbOAuthAccount): Promise<void> {
    if (this.isPgConnected && this.pgPool) {
      try {
        await this.pgPool.query(
          `INSERT INTO hedger_oauth_accounts (id, user_id, provider, provider_user_id, email, profile_data, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (provider, provider_user_id) DO UPDATE SET
             user_id = EXCLUDED.user_id,
             email = EXCLUDED.email,
             profile_data = EXCLUDED.profile_data`,
          [
            account.id,
            account.userId,
            account.provider,
            account.providerUserId,
            account.email,
            JSON.stringify(account.profileData || {}),
            account.createdAt
          ]
        );
      } catch (err: any) {
        console.error('[DatabaseService] upsertOAuthAccount error:', err.message);
      }
    }
  }

  // ==========================================
  // SAVED VALUATION MODELS METHODS
  // ==========================================

  async getSavedModels(userId?: string | undefined): Promise<DbSavedModel[]> {
    if (this.isPgConnected && this.pgPool) {
      try {
        const query = userId
          ? `SELECT id, user_id as "userId", symbol, name, saved_at as "savedAt",
                    price_at_save::float as "priceAtSave", currency,
                    intrinsic_value_per_share::float as "intrinsicValuePerShare",
                    margin_of_safety::float as "marginOfSafety",
                    engine_version as "engineVersion", inputs, outputs, notes
             FROM hedger_saved_models
             WHERE user_id = $1 OR user_id IS NULL
             ORDER BY saved_at DESC`
          : `SELECT id, user_id as "userId", symbol, name, saved_at as "savedAt",
                    price_at_save::float as "priceAtSave", currency,
                    intrinsic_value_per_share::float as "intrinsicValuePerShare",
                    margin_of_safety::float as "marginOfSafety",
                    engine_version as "engineVersion", inputs, outputs, notes
             FROM hedger_saved_models
             ORDER BY saved_at DESC`;

        const res = await this.pgPool.query(query, userId ? [userId] : []);
        return res.rows;
      } catch (err: any) {
        console.error('[DatabaseService] getSavedModels pg error:', err.message);
      }
    }

    if (userId) {
      return this.inMemoryFallbackModels.filter((m) => !m.userId || m.userId === userId);
    }
    return this.inMemoryFallbackModels;
  }

  async getSavedModelById(id: string): Promise<DbSavedModel | null> {
    if (this.isPgConnected && this.pgPool) {
      try {
        const res = await this.pgPool.query(
          `SELECT id, user_id as "userId", symbol, name, saved_at as "savedAt",
                  price_at_save::float as "priceAtSave", currency,
                  intrinsic_value_per_share::float as "intrinsicValuePerShare",
                  margin_of_safety::float as "marginOfSafety",
                  engine_version as "engineVersion", inputs, outputs, notes
           FROM hedger_saved_models WHERE id = $1`,
          [id]
        );
        if (res.rows.length > 0) return res.rows[0];
      } catch (err: any) {
        console.error('[DatabaseService] getSavedModelById error:', err.message);
      }
    }

    return this.inMemoryFallbackModels.find((m) => m.id === id) || null;
  }

  async saveModel(model: DbSavedModel): Promise<DbSavedModel> {
    if (this.isPgConnected && this.pgPool) {
      try {
        await this.pgPool.query(
          `INSERT INTO hedger_saved_models
           (id, user_id, symbol, name, saved_at, price_at_save, currency, intrinsic_value_per_share, margin_of_safety, engine_version, inputs, outputs, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           ON CONFLICT (id) DO UPDATE SET
             inputs = EXCLUDED.inputs,
             outputs = EXCLUDED.outputs,
             notes = EXCLUDED.notes`,
          [
            model.id,
            model.userId || null,
            model.symbol,
            model.name,
            model.savedAt,
            model.priceAtSave,
            model.currency,
            model.intrinsicValuePerShare,
            model.marginOfSafety,
            model.engineVersion,
            JSON.stringify(model.inputs || {}),
            model.outputs ? JSON.stringify(model.outputs) : null,
            model.notes || null
          ]
        );
      } catch (err: any) {
        console.error('[DatabaseService] saveModel error:', err.message);
      }
    }

    this.inMemoryFallbackModels = this.inMemoryFallbackModels.filter((m) => m.id !== model.id);
    this.inMemoryFallbackModels.unshift(model);
    return model;
  }

  async deleteSavedModel(id: string): Promise<boolean> {
    if (this.isPgConnected && this.pgPool) {
      try {
        await this.pgPool.query(`DELETE FROM hedger_saved_models WHERE id = $1`, [id]);
      } catch (err: any) {
        console.error('[DatabaseService] deleteSavedModel error:', err.message);
      }
    }

    const initialLen = this.inMemoryFallbackModels.length;
    this.inMemoryFallbackModels = this.inMemoryFallbackModels.filter((m) => m.id !== id);
    return this.inMemoryFallbackModels.length < initialLen;
  }

  // ==========================================
  // AI USAGE & QUOTA METHODS
  // ==========================================

  async getAiUsage(identifier: string, monthBucket: string): Promise<DbAiUsage> {
    if (this.isPgConnected && this.pgPool) {
      try {
        const res = await this.pgPool.query(
          `SELECT id, user_id as "userId", identifier, month_bucket as "monthBucket",
                  stock_analyses_count as "stockAnalysesCount",
                  thesis_generated_count as "thesisGeneratedCount",
                  thesis_downloads_count as "thesisDownloadsCount",
                  valuation_visits_count as "valuationVisitsCount",
                  created_at as "createdAt", updated_at as "updatedAt"
           FROM hedger_ai_usage
           WHERE identifier = $1 AND month_bucket = $2`,
          [identifier, monthBucket]
        );
        if (res.rows.length > 0) return res.rows[0];
      } catch (err: any) {
        console.error('[DatabaseService] getAiUsage error:', err.message);
      }
    }

    const key = `${identifier}:${monthBucket}`;
    let item = this.inMemoryFallbackAiUsage.get(key);
    if (!item) {
      item = {
        id: `usage_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        identifier,
        monthBucket,
        stockAnalysesCount: 0,
        thesisGeneratedCount: 0,
        thesisDownloadsCount: 0,
        valuationVisitsCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.inMemoryFallbackAiUsage.set(key, item);
    }
    return item;
  }

  async incrementAiUsage(
    identifier: string,
    monthBucket: string,
    field: 'analyses' | 'thesis' | 'downloads' | 'visits',
    userId?: string | undefined
  ): Promise<DbAiUsage> {
    const id = `usage_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    if (this.isPgConnected && this.pgPool) {
      try {
        const colToIncrement =
          field === 'analyses'
            ? 'stock_analyses_count'
            : field === 'thesis'
            ? 'thesis_generated_count'
            : field === 'downloads'
            ? 'thesis_downloads_count'
            : 'valuation_visits_count';

        const res = await this.pgPool.query(
          `INSERT INTO hedger_ai_usage (id, user_id, identifier, month_bucket, stock_analyses_count, thesis_generated_count, thesis_downloads_count, valuation_visits_count, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (identifier, month_bucket) DO UPDATE SET
             ${colToIncrement} = hedger_ai_usage.${colToIncrement} + 1,
             updated_at = EXCLUDED.updated_at
           RETURNING id, user_id as "userId", identifier, month_bucket as "monthBucket",
                     stock_analyses_count as "stockAnalysesCount",
                     thesis_generated_count as "thesisGeneratedCount",
                     thesis_downloads_count as "thesisDownloadsCount",
                     valuation_visits_count as "valuationVisitsCount",
                     created_at as "createdAt", updated_at as "updatedAt"`,
          [
            id,
            userId || null,
            identifier,
            monthBucket,
            field === 'analyses' ? 1 : 0,
            field === 'thesis' ? 1 : 0,
            field === 'downloads' ? 1 : 0,
            field === 'visits' ? 1 : 0,
            now,
            now
          ]
        );

        if (res.rows.length > 0) {
          const updated = res.rows[0] as DbAiUsage;
          this.inMemoryFallbackAiUsage.set(`${identifier}:${monthBucket}`, updated);
          return updated;
        }
      } catch (err: any) {
        console.error('[DatabaseService] incrementAiUsage error:', err.message);
      }
    }

    const usage = await this.getAiUsage(identifier, monthBucket);
    if (field === 'analyses') usage.stockAnalysesCount += 1;
    if (field === 'thesis') usage.thesisGeneratedCount += 1;
    if (field === 'downloads') usage.thesisDownloadsCount += 1;
    if (field === 'visits') usage.valuationVisitsCount += 1;
    usage.updatedAt = now;
    if (userId) usage.userId = userId;
    this.inMemoryFallbackAiUsage.set(`${identifier}:${monthBucket}`, usage);
    return usage;
  }

  // ==========================================
  // INVESTMENT THESIS CACHE
  // ==========================================

  async getThesis(symbol: string): Promise<{ symbol: string; thesis: string; createdAt: string } | null> {
    const cleanSym = symbol.toUpperCase().trim();
    if (this.isPgConnected && this.pgPool) {
      try {
        const res = await this.pgPool.query(
          `SELECT symbol, thesis_text as "thesis", created_at as "createdAt"
           FROM hedger_theses
           WHERE symbol = $1
           ORDER BY created_at DESC LIMIT 1`,
          [cleanSym]
        );
        if (res.rows.length > 0) return res.rows[0];
      } catch (err: any) {
        console.error('[DatabaseService] getThesis error:', err.message);
      }
    }

    return this.inMemoryFallbackTheses.get(cleanSym) || null;
  }

  async saveThesis(symbol: string, thesis: string, userId?: string | undefined): Promise<void> {
    const cleanSym = symbol.toUpperCase().trim();
    const id = `ths_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    if (this.isPgConnected && this.pgPool) {
      try {
        await this.pgPool.query(
          `INSERT INTO hedger_theses (id, symbol, user_id, thesis_text, created_at)
           VALUES ($1, $2, $3, $4, $5)`,
          [id, cleanSym, userId || null, thesis, now]
        );
      } catch (err: any) {
        console.error('[DatabaseService] saveThesis error:', err.message);
      }
    }

    this.inMemoryFallbackTheses.set(cleanSym, { symbol: cleanSym, thesis, createdAt: now });
  }

  // ==========================================
  // ADMIN & TELEMETRY METHODS
  // ==========================================

  async getAllUsers(): Promise<DbUser[]> {
    if (this.isPgConnected && this.pgPool) {
      try {
        const res = await this.pgPool.query(
          `SELECT id, email, name, provider, avatar, plan, created_at as "createdAt", updated_at as "updatedAt"
           FROM hedger_users ORDER BY created_at DESC`
        );
        return res.rows;
      } catch (err: any) {
        console.error('[DatabaseService] getAllUsers error:', err.message);
      }
    }
    return Array.from(this.inMemoryFallbackUsers.values());
  }

  async getUsersWithTelemetry(): Promise<UserTelemetry[]> {
    if (this.isPgConnected && this.pgPool) {
      try {
        const res = await this.pgPool.query(`
          SELECT 
            u.id, u.email, u.name, u.provider, u.avatar, u.plan, u.created_at as "createdAt", u.updated_at as "updatedAt",
            COALESCE(m.models_count, 0)::int as "savedModelsCount",
            COALESCE(a.thesis_generated_count, 0)::int as "thesesGeneratedCount",
            COALESCE(a.thesis_downloads_count, 0)::int as "thesesDownloadedCount",
            COALESCE(a.stock_analyses_count, 0)::int as "stockAnalysesCount",
            COALESCE(a.valuation_visits_count, 0)::int as "valuationVisitsCount",
            s.last_session as "lastActive"
          FROM hedger_users u
          LEFT JOIN (
            SELECT user_id, COUNT(*) as models_count FROM hedger_saved_models GROUP BY user_id
          ) m ON u.id = m.user_id
          LEFT JOIN (
            SELECT user_id, 
                   SUM(thesis_generated_count) as thesis_generated_count,
                   SUM(thesis_downloads_count) as thesis_downloads_count,
                   SUM(stock_analyses_count) as stock_analyses_count,
                   SUM(valuation_visits_count) as valuation_visits_count
            FROM hedger_ai_usage GROUP BY user_id
          ) a ON u.id = a.user_id
          LEFT JOIN (
            SELECT user_id, MAX(created_at) as last_session FROM hedger_sessions GROUP BY user_id
          ) s ON u.id = s.user_id
          ORDER BY u.created_at DESC
        `);
        return res.rows;
      } catch (err: any) {
        console.error('[DatabaseService] getUsersWithTelemetry error:', err.message);
      }
    }

    return Array.from(this.inMemoryFallbackUsers.values()).map(u => ({
      ...u,
      savedModelsCount: this.inMemoryFallbackModels.filter(m => m.userId === u.id).length,
      thesesGeneratedCount: 0,
      thesesDownloadedCount: 0,
      stockAnalysesCount: 0,
      valuationVisitsCount: 0,
      lastActive: u.updatedAt
    }));
  }

  async updateUserPlan(userId: string, plan: 'basic' | 'plus' | 'pro' | 'ultra'): Promise<DbUser | null> {
    const updated = await this.updateUser(userId, { plan });
    if (updated) {
      await this.logActivity(userId, 'ADMIN_SUBSCRIPTION_OVERRIDE', { newPlan: plan });
    }
    return updated;
  }

  async deleteUser(userId: string): Promise<boolean> {
    if (this.isPgConnected && this.pgPool) {
      try {
        await this.pgPool.query(`DELETE FROM hedger_users WHERE id = $1`, [userId]);
      } catch (err: any) {
        console.error('[DatabaseService] deleteUser error:', err.message);
        return false;
      }
    }
    this.inMemoryFallbackUsers.delete(userId);
    return true;
  }

  async getAllSessions(): Promise<Array<DbSession & { userName?: string | undefined; userEmail?: string | undefined; userPlan?: string | undefined }>> {
    if (this.isPgConnected && this.pgPool) {
      try {
        const res = await this.pgPool.query(
          `SELECT s.token, s.user_id as "userId", s.created_at as "createdAt", s.expires_at as "expiresAt",
                  s.ip_address as "ipAddress", s.user_agent as "userAgent",
                  u.name as "userName", u.email as "userEmail", u.plan as "userPlan"
           FROM hedger_sessions s
           LEFT JOIN hedger_users u ON s.user_id = u.id
           ORDER BY s.created_at DESC LIMIT 100`
        );
        return res.rows.map(r => ({
          token: r.token,
          userId: r.userId,
          createdAt: Number(r.createdAt),
          expiresAt: Number(r.expiresAt),
          ipAddress: r.ipAddress,
          userAgent: r.userAgent,
          userName: r.userName,
          userEmail: r.userEmail,
          userPlan: r.userPlan
        }));
      } catch (err: any) {
        console.error('[DatabaseService] getAllSessions error:', err.message);
      }
    }
    return Array.from(this.inMemoryFallbackSessions.values()).map(s => {
      const u = this.inMemoryFallbackUsers.get(s.userId);
      return {
        ...s,
        userName: u?.name,
        userEmail: u?.email,
        userPlan: u?.plan
      };
    });
  }

  async logActivity(userId: string | undefined, action: string, details: Record<string, any> = {}, ip?: string): Promise<void> {
    const id = `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    if (this.isPgConnected && this.pgPool) {
      try {
        await this.pgPool.query(
          `INSERT INTO hedger_activity_logs (id, user_id, action, details, ip_address, created_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [id, userId || null, action, JSON.stringify(details), ip || null, now]
        );
      } catch (err: any) {
        console.error('[DatabaseService] logActivity error:', err.message);
      }
    }
    this.inMemoryFallbackActivityLogs.unshift({
      id,
      userId,
      action,
      details,
      ipAddress: ip,
      createdAt: now
    });
    if (this.inMemoryFallbackActivityLogs.length > 500) {
      this.inMemoryFallbackActivityLogs.pop();
    }
  }

  async getActivityLogs(limit = 100): Promise<Array<DbActivityLog & { userName?: string | undefined; userEmail?: string | undefined; userPlan?: string | undefined }>> {
    if (this.isPgConnected && this.pgPool) {
      try {
        const res = await this.pgPool.query(
          `SELECT l.id, l.user_id as "userId", l.action, l.details, l.ip_address as "ipAddress", l.created_at as "createdAt",
                  u.name as "userName", u.email as "userEmail", u.plan as "userPlan"
           FROM hedger_activity_logs l
           LEFT JOIN hedger_users u ON l.user_id = u.id
           ORDER BY l.created_at DESC LIMIT $1`,
          [limit]
        );
        return res.rows;
      } catch (err: any) {
        console.error('[DatabaseService] getActivityLogs error:', err.message);
      }
    }
    return this.inMemoryFallbackActivityLogs.slice(0, limit).map(l => {
      const u = l.userId ? this.inMemoryFallbackUsers.get(l.userId) : undefined;
      return {
        ...l,
        userName: u?.name,
        userEmail: u?.email,
        userPlan: u?.plan
      };
    });
  }

  // Health inspection
  getHealthStatus() {
    return {
      postgres: this.isPgConnected ? 'connected' : 'fallback_active',
      redis: this.isRedisConnected ? 'connected' : 'memory_fallback'
    };
  }
}

export const db = new DatabaseService();
