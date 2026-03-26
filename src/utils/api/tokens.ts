// src/utils/api/tokens.ts
// Token-related API endpoints: search, info, price, liquidity, trades, holders, update

import axios from 'axios';
import type {
  Token,
  PaginatedResponse,
  CursorPaginatedResponse,
  TokenHolder,
  TokenHoldersResponse,
  TokenInfoResponse,
  TokenPriceResponse,
  TokenLiquidityResponse,
  TokenPriceTimeframe,
  TokenTradesResponse,
  Transaction,
} from '@/interface/types';
import {
  getViaProxy,
  getAuthHeaders,
  clampLimit,
  toLegacyPaginated,
} from './core';

// =====================
// Token search types
// =====================
export type TokenCategory = 'trending' | 'marketcap' | 'new' | 'finalized' | 'pre-active' | 'all';

export type TokenSearchFilters = {
  category?: TokenCategory;
  includeNsfw?: boolean | null;
  mcapMin?: number | null;
  mcapMax?: number | null;
  volMin?: number | null;
  volMax?: number | null;
  bcurveMin?: number | null;
  bcurveMax?: number | null;
  holdersMin?: number | null;
  holdersMax?: number | null;
  coinAgeMin?: number | null;
  coinAgeMax?: number | null;
  onlyShow?: string[];
  doNotShow?: string[];
};

type TokenSearchParams = {
  q?: string;
  category?: TokenCategory;
  includeNsfw?: boolean | null;
  mcapMin?: number | null;
  mcapMax?: number | null;
  volMin?: number | null;
  volMax?: number | null;
  limit?: number;
  cursor?: string;
};

// =====================
// Token update (STUB)
// =====================
export type UpdateTokenRequest = {
  address: string;
  name?: string;
  symbol?: string;
  description?: string;
  imageUrl?: string;
  socials?: {
    website?: string;
    twitter?: string;
    telegram?: string;
    discord?: string;
    youtube?: string;
  };
};

export async function updateToken(_payload: UpdateTokenRequest): Promise<Token> {
  throw new Error('updateToken API is not implemented on backend yet.');
}

// =====================
// Core helper: /token/search
// =====================
async function tokenSearch(params: TokenSearchParams): Promise<CursorPaginatedResponse<Token>> {
  const safe: TokenSearchParams = {
    ...params,
    includeNsfw: params.includeNsfw ?? false,
    limit: clampLimit(params.limit ?? 20),
  };

  if (safe.q !== undefined && !String(safe.q).trim()) delete safe.q;

  const headers = getAuthHeaders();
  const { data } = await getViaProxy<CursorPaginatedResponse<Token>>('/token/search', safe, headers);

  return {
    items: data.items ?? [],
    nextCursor: data.nextCursor ?? null,
  };
}

// =====================
// Token info / price / liquidity / trades / holders
// =====================
export async function getTokenInfo(address: string): Promise<TokenInfoResponse> {
  const addr = (address || '').trim();
  if (!addr) throw new Error('Missing token address');
  const headers = getAuthHeaders();
  const { data } = await getViaProxy<TokenInfoResponse>('/token/info', { address: addr }, headers);
  return data;
}

export async function getTokenPrice(address: string, timeframe: TokenPriceTimeframe = '5m'): Promise<TokenPriceResponse> {
  const addr = (address || '').trim();
  if (!addr) throw new Error('Missing token address');
  const headers = getAuthHeaders();
  const { data } = await getViaProxy<TokenPriceResponse>('/token/price', { address: addr, timeframe }, headers);
  return data;
}

export async function getTokenLiquidity(address: string): Promise<TokenLiquidityResponse> {
  const addr = (address || '').trim();
  if (!addr) throw new Error('Missing token address');
  const headers = getAuthHeaders();
  const { data } = await getViaProxy<TokenLiquidityResponse>('/token/liquidity', { address: addr }, headers);
  return data;
}

export async function getTokenTrades(
  address: string,
  opts?: { limit?: number; cursor?: string | null }
): Promise<TokenTradesResponse> {
  const addr = (address || '').trim();
  if (!addr) throw new Error('Missing token address');

  const limitRaw = opts?.limit ?? 50;
  const limit = Math.min(Math.max(Number(limitRaw) || 50, 1), 200);

  const headers = getAuthHeaders();
  const { data } = await getViaProxy<TokenTradesResponse>(
    '/token/trades',
    { address: addr, limit, cursor: opts?.cursor ?? undefined },
    headers
  );

  return {
    tokenAddress: data?.tokenAddress ?? addr,
    nextCursor: data?.nextCursor ?? null,
    trades: data?.trades ?? [],
  };
}

export async function getTokenHolders(
  address: string,
  opts?: { limit?: number; cursor?: string | null }
): Promise<TokenHoldersResponse> {
  const addr = (address || '').trim();
  if (!addr) throw new Error('Missing token address');

  const limitRaw = opts?.limit ?? 50;
  const limit = Math.min(Math.max(Number(limitRaw) || 50, 1), 200);

  const headers = getAuthHeaders();
  const { data } = await getViaProxy<TokenHoldersResponse>(
    '/token/holders',
    { address: addr, limit, cursor: opts?.cursor ?? undefined },
    headers
  );

  return {
    tokenAddress: data?.tokenAddress ?? addr,
    totalHolders: Number(data?.totalHolders ?? (data?.holders?.length ?? 0)),
    nextCursor: data?.nextCursor ?? null,
    holders: (data?.holders ?? []) as TokenHolder[],
  };
}

// =====================
// Legacy exports
// =====================
export async function getAllTokens(page = 1, pageSize = 13): Promise<PaginatedResponse<Token>> {
  const { data } = await getViaProxy<PaginatedResponse<Token>>('/ports/getAllTokens', { page, pageSize });
  return data;
}

export async function getAllTokensWithoutLiquidity(): Promise<Token[]> {
  const { data } = await getViaProxy<Token[]>('/ports/getAllTokensWithoutLiquidity');
  return data;
}

export async function getTotalVolume(): Promise<{ totalVolume: number }> {
  const { data } = await getViaProxy<{ totalVolume: number }>('/ports/getTotalVolume');
  return data;
}

export async function getVolumeRange(hours: number): Promise<{ totalVolume: number }> {
  const { data } = await getViaProxy<{ totalVolume: number }>('/ports/getVolumeRange', { hours });
  return data;
}

export async function getTotalTokenCount(): Promise<{ totalTokens: number }> {
  const { data } = await getViaProxy<{ totalTokens: number }>('/ports/getTotalTokenCount');
  return data;
}

export async function getRecentTokens(page = 1, pageSize = 20, hours = 24): Promise<PaginatedResponse<Token> | null> {
  try {
    const { data } = await getViaProxy<PaginatedResponse<Token>>('/ports/getRecentTokens', { page, pageSize, hours });
    return data;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return null;
    throw error;
  }
}

export async function searchTokens(
  query: string,
  page = 1,
  pageSize = 20,
  cursor?: string,
  filters?: TokenSearchFilters
): Promise<PaginatedResponse<Token>> {
  const limit = clampLimit(pageSize);
  if (page > 1 && !cursor) return toLegacyPaginated<Token>([], null);

  const res = await tokenSearch({
    q: query,
    category: filters?.category,
    includeNsfw: filters?.includeNsfw ?? false,
    mcapMin: filters?.mcapMin ?? undefined,
    mcapMax: filters?.mcapMax ?? undefined,
    volMin: filters?.volMin ?? undefined,
    volMax: filters?.volMax ?? undefined,
    limit,
    cursor,
  });

  return toLegacyPaginated<Token>(res.items ?? [], res.nextCursor ?? null);
}

// =====================
// Dashboard helpers
// =====================
export async function getTokensByCreator(
  creatorAddress: string,
  page = 1,
  limit = 20
): Promise<{ tokens: Token[]; totalPages: number }> {
  const creator = String(creatorAddress ?? '').trim();
  if (!creator) return { tokens: [], totalPages: 1 };

  try {
    const headers = getAuthHeaders();
    const { data } = await getViaProxy<{ tokens?: Token[]; totalPages?: number }>(
      '/token/by-creator',
      { creator, page, limit },
      headers
    );

    return {
      tokens: data?.tokens ?? [],
      totalPages: Number(data?.totalPages ?? 1),
    };
  } catch {
    return { tokens: [], totalPages: 1 };
  }
}

export async function getAllTokenAddresses(): Promise<string[]> {
  try {
    const headers = getAuthHeaders();
    const { data } = await getViaProxy<any>('/token/addresses', {}, headers);
    if (Array.isArray(data)) return data.filter(Boolean).map(String);
    if (Array.isArray(data?.addresses)) return data.addresses.filter(Boolean).map(String);
    return [];
  } catch {
    return [];
  }
}

export async function getTransactionsByAddress(
  userAddress: string,
  page = 1,
  limit = 20
): Promise<{ transactions: Transaction[]; totalPages: number }> {
  const addr = String(userAddress ?? '').trim();
  if (!addr) return { transactions: [], totalPages: 1 };

  try {
    const headers = getAuthHeaders();
    const { data } = await getViaProxy<any>('/wallet/transactions', { address: addr, page, limit }, headers);

    return {
      transactions: (data?.transactions ?? data?.items ?? []) as Transaction[],
      totalPages: Number(data?.totalPages ?? 1),
    };
  } catch {
    return { transactions: [], totalPages: 1 };
  }
}
