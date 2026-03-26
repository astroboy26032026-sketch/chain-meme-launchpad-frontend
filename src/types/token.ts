// src/types/token.ts
// Token-related type definitions

export interface LiquidityEvent {
  id: string;
  /** legacy naming (EVM) */
  ethAmount: string;
  tokenAmount: string;
  timestamp: string;
}

export interface Token {
  id: string;
  chainId: number;

  address: string;
  creatorAddress: string;

  name: string;
  symbol: string;

  logo: string;
  description: string;

  createdAt: string;
  updatedAt: string;

  website: string;
  telegram: string;
  discord: string;
  twitter: string;
  youtube: string;

  latestTransactionTimestamp: string;

  // ===== metrics =====
  marketCap: number;

  priceUsd?: number | string;

  volume24h?: number;
  status?: string;
  isNSFW?: boolean;

  _count?: {
    liquidityEvents: number;
  };

  // extra BE fields (multiple naming for same data)
  mcapUsd?: number;
  marketcapUsd?: number;
  marketCapUsd?: number;
  marketcap?: number;
  mcap?: number;
  mc?: number;
  vol24hUsd?: number;
  volume24hUsd?: number;
  vol24h?: number;
  vol?: number;
  mint?: string;
  tokenAddress?: string;
  ca?: string;
  external_url?: string;

  /** Progress to DEX (0-100) from API. Fallback 50% if absent. */
  progressDex?: number;
  maxCap?: number;
}

export interface TokenWithLiquidityEvents extends Token {
  liquidityEvents: LiquidityEvent[];
}

export type BondingCurveStatus = 'ACTIVE' | 'FINISHED' | 'GRADUATED' | string;

export interface TokenInfoResponse {
  address: string;
  name: string;
  symbol: string;
  logo: string;
  description: string;
  creatorAddress: string;
  marketCap: number;
  supply: number;
  liquidity: number;
  volume24h: number;
  holders: number;
  createdAt: string;
  bondingCurveStatus: BondingCurveStatus;
  progressDex?: number;
}

export type TokenPriceTimeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

export interface TokenPricePoint {
  timestamp: string;
  price: number;
}

export interface TokenPriceResponse {
  tokenAddress: string;
  price: number;
  priceSource: 'CURVE' | 'DEX' | string;
  curvePrice?: number;
  dexPrice?: number;
  timeframe: TokenPriceTimeframe | string;
  chart: TokenPricePoint[];
}

export interface TokenLiquidityEvent {
  type: 'BUY' | 'SELL' | string;
  from: string;
  solAmount: number;
  tokenAmount: number;
  price: number;
  timestamp: string;
}

export interface TokenLiquidityResponse {
  tokenAddress: string;
  isCurveFinished: boolean;
  reserveBalance: number;
  totalVolume: number;
  lpMigration?: {
    migrated: boolean;
    destinationDex?: string;
    lpLockedUntil?: string;
  };
  events: TokenLiquidityEvent[];
}

export interface TokenHolder {
  walletAddress: string;
  address?: string;
  balance: number;
  percentShare: number;
  lastTransaction: string | null;
}

export interface TokenHoldersResponse {
  tokenAddress: string;
  totalHolders: number;
  nextCursor?: string | null;
  holders: TokenHolder[];
}

export interface TokenTrade {
  publicKey: string;
  isBuy: boolean;
  time: number;
  price: string;
  amount: number;
  totalUsd: string;
  signature: string;
  solAmount: number;
}

export interface TokenTradesResponse {
  tokenAddress: string;
  nextCursor?: string | null;
  trades: TokenTrade[];
}
