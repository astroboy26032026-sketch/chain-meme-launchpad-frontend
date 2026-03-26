// src/types/rewards.ts
// Reward-related type definitions

export type RewardSpinHistoryItem = {
  time: string;
  result: string[];
  payoutSol: number;
};

export type RewardInfoResponse = {
  walletAddress: string;
  tickets: number;
  points: number;
  claimableSol: number;
  unclaimedSol: number;
  cooldownUntil: string;
  recentSpins: RewardSpinHistoryItem[];
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
  points: number;
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
