// src/utils/api/leaderboard.ts
// Leaderboard API endpoints

import { getViaProxy } from './core';

// =====================
// Types
// =====================
export type LeaderboardTopItem = {
  rank: number;
  tokenAddress: string;
  name: string;
  symbol: string;
  subtitle?: string;
  creatorAddress: string;
  marketCap: number;
  marketCapChange24h: number;
  volume24h: number;
  volumeChange24h: number;
  createdAt: string;
  logo: string;
};

export type LeaderboardListItem = {
  rank: number;
  tokenAddress: string;
  name: string;
  symbol: string;
  creatorAddress: string;
  holders: number;
  marketCap: number;
  marketCapChange24h: number;
  logo: string;
};

export type LeaderboardListResponse = {
  items: LeaderboardListItem[];
};

// =====================
// API functions
// =====================
export async function getLeaderboardTop(limit = 3): Promise<LeaderboardTopItem[]> {
  const safeLimit = Math.min(Math.max(limit, 1), 10);
  const { data } = await getViaProxy<LeaderboardTopItem[]>('/leaderboard/top', { limit: safeLimit });
  return data ?? [];
}

export async function getLeaderboardList(params?: {
  limit?: number;
  sort?: 'marketCap' | 'volume24h';
  order?: 'asc' | 'desc';
}): Promise<LeaderboardListResponse> {
  const limit = Math.min(Math.max(params?.limit ?? 50, 1), 200);
  const sort = params?.sort ?? 'marketCap';
  const order = params?.order ?? 'desc';
  const { data } = await getViaProxy<LeaderboardListResponse>('/leaderboard/list', { limit, sort, order });
  return { items: data?.items ?? [] };
}
