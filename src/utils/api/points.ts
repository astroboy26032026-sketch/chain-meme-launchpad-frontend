// src/utils/api/points.ts
// Points API endpoints

import { getViaProxy, getAuthHeaders } from './core';

// =====================
// Types
// =====================
export type PointsOverviewResponse = {
  points: number;
  tickets: number;
};

export type PointsViewResponse = {
  rank: {
    current: string;
    next: string;
    currentVolume: number;
    nextRankVolume: number;
    remainingVolume: number;
    progressPercent: number;
  };
};

export type PointsHistoryResponse = {
  items: Array<{
    type: string;
    points: number;
    timestamp: string;
  }>;
};

// =====================
// Normalizers
// =====================
function normalizePointsOverview(input: any): PointsOverviewResponse {
  return {
    points: Number(input?.points ?? 0),
    tickets: Number(input?.tickets ?? 0),
  };
}

function normalizePointsView(input: any): PointsViewResponse {
  const r = input?.rank ?? {};
  return {
    rank: {
      current: String(r?.current ?? ''),
      next: String(r?.next ?? ''),
      currentVolume: Number(r?.currentVolume ?? 0),
      nextRankVolume: Number(r?.nextRankVolume ?? 0),
      remainingVolume: Number(r?.remainingVolume ?? 0),
      progressPercent: Number(r?.progressPercent ?? 0),
    },
  };
}

function normalizePointsHistory(input: any): PointsHistoryResponse {
  const items = Array.isArray(input?.items) ? input.items : [];
  return {
    items: items.map((x: any) => ({
      type: String(x?.type ?? ''),
      points: Number(x?.points ?? 0),
      timestamp: String(x?.timestamp ?? ''),
    })),
  };
}

// =====================
// API functions
// =====================
export async function getPointsOverview(walletAddress: string): Promise<PointsOverviewResponse> {
  const addr = String(walletAddress ?? '').trim();
  if (!addr) throw new Error('Missing walletAddress');

  const headers = getAuthHeaders();
  const { data } = await getViaProxy<PointsOverviewResponse>('/points/overview', { walletAddress: addr }, headers);
  return normalizePointsOverview(data);
}

export async function getPointsView(walletAddress: string): Promise<PointsViewResponse> {
  const addr = String(walletAddress ?? '').trim();
  if (!addr) throw new Error('Missing walletAddress');

  const headers = getAuthHeaders();
  const { data } = await getViaProxy<PointsViewResponse>('/points/view', { walletAddress: addr }, headers);
  return normalizePointsView(data);
}

export async function getPointsHistory(walletAddress: string): Promise<PointsHistoryResponse> {
  const addr = String(walletAddress ?? '').trim();
  if (!addr) throw new Error('Missing walletAddress');

  const headers = getAuthHeaders();
  const { data } = await getViaProxy<PointsHistoryResponse>('/points/history', { walletAddress: addr }, headers);
  return normalizePointsHistory(data);
}
