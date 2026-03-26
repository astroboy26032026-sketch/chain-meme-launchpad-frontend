// src/utils/api/rewards.ts
// Reward API endpoints: info, claim, convert, marquee, spin

import { getViaProxy, postViaProxy, getAuthHeaders } from './core';

// =====================
// Types
// =====================
export type RewardSpinHistoryItem = {
  time: string;
  result: string[];
  payoutSol: number;
};

export type ConvertConfig = {
  options: number[];
  allowAll: boolean;
  maxTicketsConvertible: number;
  labelAll: string;
};

export type RewardInfoResponse = {
  walletAddress: string;
  tickets: number;
  points: number;
  claimableSol: number;
  unclaimedSol: number;
  cooldownUntil: string;
  recentSpins: RewardSpinHistoryItem[];
  convertConfig: ConvertConfig;
};

export type RewardClaimRequest = {
  walletAddress: string;
};

export type RewardClaimResponse = {
  claimedSol: number;
  claimableSol: number;
  transaction: string | null;
  pendingTierSol?: number;
  message?: string;
};

export type RewardConvertRequest = {
  walletAddress: string;
  tickets: number;
  mode: 'exact' | 'all';
};

export type RewardConvertResponse = {
  ticketsAdded: number;
  ticketsTotal: number;
  pointsLeft: number;
};

export type RewardMarqueeItem = {
  userId: string;
  payoutSol: number;
  timeAgo: string;
};

export type RewardMarqueeResponse = {
  items: RewardMarqueeItem[];
};

export type RewardSpinConfigResponse = {
  reels: number;
  symbols: string[];
  multiplier: Record<string, number>;
  rule: string;
};

export type RewardSpinRequest = {
  walletAddress: string;
};

export type RewardSpinResponse = {
  result: string[];
  payoutSol: number;
  ticketsLeft: number;
  claimableSol: number;
  cooldownUntil: string;
};

// =====================
// Normalizers
// =====================
function normalizeRewardSpinHistoryItem(input: any): RewardSpinHistoryItem {
  return {
    time: String(input?.time ?? ''),
    result: Array.isArray(input?.result) ? input.result.map(String) : [],
    payoutSol: Number(input?.payoutSol ?? 0),
  };
}

function normalizeConvertConfig(input: any): ConvertConfig {
  return {
    options: Array.isArray(input?.options) ? input.options.map(Number) : [],
    allowAll: Boolean(input?.allowAll ?? false),
    maxTicketsConvertible: Number(input?.maxTicketsConvertible ?? 0),
    labelAll: String(input?.labelAll ?? 'All'),
  };
}

function normalizeRewardInfo(input: any, walletAddress: string): RewardInfoResponse {
  return {
    walletAddress: String(input?.walletAddress ?? walletAddress ?? '').trim(),
    tickets: Number(input?.tickets ?? 0),
    points: Number(input?.points ?? 0),
    claimableSol: Number(input?.claimableSol ?? 0),
    unclaimedSol: Number(input?.unclaimedSol ?? 0),
    cooldownUntil: String(input?.cooldownUntil ?? ''),
    recentSpins: Array.isArray(input?.recentSpins)
      ? input.recentSpins.map(normalizeRewardSpinHistoryItem)
      : [],
    convertConfig: normalizeConvertConfig(input?.convertConfig),
  };
}

function normalizeRewardClaimResponse(input: any): RewardClaimResponse {
  return {
    claimedSol: Number(input?.claimedSol ?? 0),
    claimableSol: Number(input?.claimableSol ?? 0),
    transaction:
      input?.transaction == null || String(input?.transaction).trim() === ''
        ? null
        : String(input.transaction),
    pendingTierSol:
      input?.pendingTierSol == null ? undefined : Number(input.pendingTierSol ?? 0),
    message: input?.message == null ? undefined : String(input.message),
  };
}

function normalizeRewardConvertResponse(input: any): RewardConvertResponse {
  return {
    ticketsAdded: Number(input?.ticketsAdded ?? 0),
    ticketsTotal: Number(input?.ticketsTotal ?? 0),
    pointsLeft: Number(input?.pointsLeft ?? 0),
  };
}

function normalizeRewardMarqueeResponse(input: any): RewardMarqueeResponse {
  return {
    items: Array.isArray(input?.items)
      ? input.items.map((x: any) => ({
          userId: String(x?.userId ?? ''),
          payoutSol: Number(x?.payoutSol ?? 0),
          timeAgo: String(x?.timeAgo ?? ''),
        }))
      : [],
  };
}

function normalizeRewardSpinConfig(input: any): RewardSpinConfigResponse {
  const multiplierRaw = input?.multiplier ?? {};
  const multiplier: Record<string, number> = {};

  if (multiplierRaw && typeof multiplierRaw === 'object' && !Array.isArray(multiplierRaw)) {
    for (const [key, value] of Object.entries(multiplierRaw)) {
      multiplier[String(key)] = Number(value ?? 0);
    }
  }

  return {
    reels: Number(input?.reels ?? 0),
    symbols: Array.isArray(input?.symbols) ? input.symbols.map(String) : [],
    multiplier,
    rule: String(input?.rule ?? ''),
  };
}

function normalizeRewardSpinResponse(input: any): RewardSpinResponse {
  return {
    result: Array.isArray(input?.result) ? input.result.map(String) : [],
    payoutSol: Number(input?.payoutSol ?? 0),
    ticketsLeft: Number(input?.ticketsLeft ?? 0),
    claimableSol: Number(input?.claimableSol ?? 0),
    cooldownUntil: String(input?.cooldownUntil ?? ''),
  };
}

// =====================
// API functions
// =====================
export async function getRewardInfo(walletAddress: string): Promise<RewardInfoResponse> {
  const addr = String(walletAddress ?? '').trim();
  if (!addr) throw new Error('Missing walletAddress');

  const headers = getAuthHeaders();
  const { data } = await getViaProxy<RewardInfoResponse>('/reward/info', { walletAddress: addr }, headers);
  return normalizeRewardInfo(data, addr);
}

export async function claimReward(walletAddress: string): Promise<RewardClaimResponse> {
  const addr = String(walletAddress ?? '').trim();
  if (!addr) throw new Error('Missing walletAddress');

  const headers = getAuthHeaders();
  const { data } = await postViaProxy<RewardClaimResponse>('/reward/claim', { walletAddress: addr }, headers);
  return normalizeRewardClaimResponse(data);
}

export async function convertRewardPoints(
  walletAddress: string,
  tickets: number,
  mode: 'exact' | 'all'
): Promise<RewardConvertResponse> {
  const addr = String(walletAddress ?? '').trim();
  if (!addr) throw new Error('Missing walletAddress');

  const safeTickets = Number(tickets);
  if (!Number.isFinite(safeTickets) || safeTickets < 0) {
    throw new Error('tickets must be a number >= 0');
  }

  const headers = getAuthHeaders();
  const { data } = await postViaProxy<RewardConvertResponse>(
    '/reward/convert',
    { walletAddress: addr, tickets: safeTickets, mode },
    headers
  );
  return normalizeRewardConvertResponse(data);
}

export async function getRewardMarquee(): Promise<RewardMarqueeResponse> {
  const headers = getAuthHeaders();
  const { data } = await getViaProxy<RewardMarqueeResponse>('/reward/marquee', {}, headers);
  return normalizeRewardMarqueeResponse(data);
}

export async function getRewardSpinConfig(): Promise<RewardSpinConfigResponse> {
  const headers = getAuthHeaders();
  const { data } = await getViaProxy<RewardSpinConfigResponse>('/reward/spin-config', {}, headers);
  return normalizeRewardSpinConfig(data);
}

export async function spinReward(walletAddress: string): Promise<RewardSpinResponse> {
  const addr = String(walletAddress ?? '').trim();
  if (!addr) throw new Error('Missing walletAddress');

  const headers = getAuthHeaders();
  const { data } = await postViaProxy<RewardSpinResponse>('/reward/spin', { walletAddress: addr }, headers);
  return normalizeRewardSpinResponse(data);
}
