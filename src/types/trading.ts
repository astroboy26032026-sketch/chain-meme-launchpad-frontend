// src/types/trading.ts
// Trading-related type definitions

export type UUIDv4 = string;

export type TradingBuyRequest = {
  tokenAddress: string;
  amountInSol?: string;
  amountInToken?: string;
  slippageBps?: number;
  referrer?: string;
};

export type TradingSellRequest = {
  tokenAddress: string;
  amountInToken: string;
  slippageBps?: number;
  referrer?: string;
};

export type TradingTracking = {
  submitSignatureEndpoint: string;
  statusEndpoint: string;
  statusBySignatureEndpoint: string;
};

export type TradingBuyResponse = {
  tokenAddress: string;
  txBase64: string;
  transactionId: string;
  amountInSol: number;
  amountOutToken: number;
  executionPrice: number;
  slippageBps: number;
  feePlatform: number;
  feeReferral: number;
  tracking: TradingTracking;
};

export type TradingSellResponse = {
  tokenAddress: string;
  txBase64: string;
  transactionId: string;
  amountInToken: number;
  amountOutSol: number;
  executionPrice: number;
  slippageBps: number;
  feePlatform: number;
  feeReferral: number;
  tracking: TradingTracking;
};

export type TradingPreviewBuyRequest = {
  tokenAddress: string;
  amountSol: number;
};

export type TradingPreviewBuyResponse = {
  tokenAddress: string;
  amountSol: number;
  estimatedTokens: number;
  price: number;
  quoteLamports: string;
  feeLamports: string;
  totalSol: number;
  firstBuyFeeSol: number;
  isFirstBuy: boolean;
  note?: string;
};

export type TradingPreviewSellRequest = {
  tokenAddress: string;
  amountInToken: number;
};

export type TradingPreviewSellResponse = {
  tokenAddress: string;
  amountInToken: number;
  estimatedSol: number;
  lamportsOut: string;
  price: number;
  note?: string;
};

export type SubmitSignatureRequest = {
  signature?: string;
  txSignature?: string;
  transactionId?: string;
  id?: string;
};

export type SubmitSignatureResponse = {
  transactionId: string;
  signature: string;
  status: 'SUBMITTED' | 'CONFIRMED' | 'FAILED' | string;
  message?: string;
};

export type TradingTxStatusResponse = {
  transactionId: string;
  status: 'PENDING' | 'SUBMITTED' | 'CONFIRMED' | 'FAILED' | string;
  signature?: string;
  error?: string | null;
  updatedAt?: string;
};
