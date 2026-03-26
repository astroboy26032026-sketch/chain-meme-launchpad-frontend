// src/utils/api/core.ts
// Shared API infrastructure: axios instances, proxy helpers, auth token management

import axios from 'axios';
import type { PaginatedResponse } from '@/interface/types';

// =====================
// AUTH base & token helpers
// =====================
export const AUTH_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, '') || 'https://dev.cosmox.app';

const AUTH_TOKEN_KEY = 'cx_token';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
  else localStorage.removeItem(AUTH_TOKEN_KEY);
}

/**
 * Axios instance for direct BE calls (NO proxy)
 */
export const authApi = axios.create({
  baseURL: AUTH_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

authApi.interceptors.request.use((config) => {
  try {
    if (typeof window !== 'undefined') {
      const t = localStorage.getItem(AUTH_TOKEN_KEY);
      if (t) {
        config.headers = {
          ...(config.headers || {}),
          Authorization: `Bearer ${t}`,
        } as any;
      }
    }
  } catch {
    // ignore
  }
  return config;
});

export function setAuthToken(token: string | null, persist = true) {
  if (persist) setStoredToken(token);

  if (token) authApi.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete authApi.defaults.headers.common.Authorization;
}

if (typeof window !== 'undefined') {
  const token = getStoredToken();
  if (token) setAuthToken(token, false);
}

authApi.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err)
);

// =====================
// Proxy helpers
// =====================
const PROXY_BASE = '/api/proxy';
const isServer = typeof window === 'undefined';

const computeSiteUrl = () => {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
};
const SITE_URL = computeSiteUrl();

export const absProxy = (path: string) => (isServer ? `${SITE_URL}${PROXY_BASE}${path}` : `${PROXY_BASE}${path}`);

export const API_TIMEOUT = 15_000;
const MAX_RETRIES = 2;

export const getViaProxy = async <T = any>(path: string, params?: any, headers?: Record<string, string>) => {
  const url = absProxy(path);
  let lastErr: any;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await axios.get<T>(url, { params, headers, timeout: API_TIMEOUT });
    } catch (e: any) {
      lastErr = e;
      const status = e?.response?.status;
      if (status && status >= 400 && status < 500) throw e;
      if (attempt < MAX_RETRIES) await new Promise(r => setTimeout(r, 300 * (attempt + 1)));
    }
  }
  throw lastErr;
};

export const UPLOAD_TIMEOUT = 60_000;

export const postViaProxy = async <T = any>(path: string, body?: any, headers?: Record<string, string>, timeout?: number) => {
  const url = absProxy(path);
  return axios.post<T>(url, body ?? {}, { headers, timeout: timeout ?? API_TIMEOUT });
};

export const patchViaProxy = async <T = any>(path: string, body?: any, headers?: Record<string, string>) => {
  const url = absProxy(path);
  return axios.patch<T>(url, body ?? {}, { headers, timeout: API_TIMEOUT });
};

// =====================
// Common helpers
// =====================
export const clampLimit = (n: number, min = 1, max = 50) => Math.min(Math.max(n, min), max);

export const toLegacyPaginated = <T>(items: T[], nextCursor: string | null | undefined): PaginatedResponse<T> => ({
  data: items,
  tokens: [],
  totalCount: items.length,
  currentPage: 1,
  totalPages: 1,
  nextCursor: nextCursor ?? null,
});

export const getAuthHeaders = (): Record<string, string> | undefined => {
  const t = getStoredToken();
  return t ? { Authorization: `Bearer ${t}` } : undefined;
};

// =====================
// Tracking endpoint normalizer
// =====================
export function normalizeTrackingPath(input: string): string {
  let s = String(input ?? '').trim();
  if (!s) throw new Error('Missing tracking endpoint');

  try {
    if (/^https?:\/\//i.test(s)) {
      const u = new URL(s);
      s = `${u.pathname}${u.search || ''}`;
    }
  } catch {
    // ignore
  }

  s = s.replace(/^(GET|POST|PUT|PATCH|DELETE)\s*:\s*/i, '');
  s = s.replace(/^(GET|POST|PUT|PATCH|DELETE)\s+/i, '');

  if (!s.startsWith('/')) s = `/${s}`;
  s = s.replace(/\/{2,}/g, '/');

  return s;
}

// =====================
// Idempotency helpers
// =====================
export type IdempotencyOptions = { idempotencyKey?: string };

export function newIdempotencyKey(prefix?: string) {
  const rand =
    typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function'
      ? (crypto as any).randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
  return prefix ? `${prefix}-${rand}` : rand;
}

export function withIdempotencyHeader(headers?: Record<string, string>, key?: string): Record<string, string> | undefined {
  if (!key) return headers;
  return { ...(headers || {}), 'Idempotency-Key': key };
}

// =====================
// Validation helpers
// =====================
export const assertNonEmpty = (v: any, msg: string) => {
  if (!String(v ?? '').trim()) throw new Error(msg);
};

export const toInt = (v: any, field: string) => {
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error(`${field} must be a number`);
  return Math.trunc(n);
};

export const toNonNegInt = (v: any, field: string) => {
  const n = toInt(v, field);
  if (n < 0) throw new Error(`${field} must be >= 0`);
  return n;
};

export const toNumericString = (v: any, field: string) => {
  const s = String(v ?? '').trim();
  if (!/^\d+$/.test(s)) throw new Error(`${field} must be a numeric string`);
  return s;
};

// =====================
// Symbol validation
// =====================
const SYMBOL_MIN = 2;
const SYMBOL_MAX = 10;
const SYMBOL_RE = new RegExp(`^[A-Z0-9]{${SYMBOL_MIN},${SYMBOL_MAX}}$`);

export const normalizeSymbol = (v: any) =>
  String(v ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, SYMBOL_MAX);

export const assertSymbol = (v: any) => {
  const s = normalizeSymbol(v);
  if (!SYMBOL_RE.test(s)) throw new Error(`symbol must be uppercase alphanumeric, ${SYMBOL_MIN}-${SYMBOL_MAX} chars`);
  return s;
};
