// src/utils/api/trading.ts
// Trading API endpoints: buy, sell, preview, submit signature, status

import type {
  TradingBuyRequest,
  TradingBuyResponse,
  TradingSellRequest,
  TradingSellResponse,
  TradingPreviewBuyRequest,
  TradingPreviewBuyResponse,
  TradingPreviewSellRequest,
  TradingPreviewSellResponse,
  SubmitSignatureResponse,
  TradingTxStatusResponse,
} from '@/interface/types';
import {
  getViaProxy,
  postViaProxy,
  getAuthHeaders,
  normalizeTrackingPath,
  newIdempotencyKey,
  withIdempotencyHeader,
  toNonNegInt,
  toNumericString,
  type IdempotencyOptions,
} from './core';

export async function buyToken(payload: TradingBuyRequest, opts?: IdempotencyOptions): Promise<TradingBuyResponse> {
  const tokenAddress = String(payload?.tokenAddress ?? '').trim();
  if (!tokenAddress) throw new Error('tokenAddress is required');

  const amountInSol = payload?.amountInSol != null ? String(payload.amountInSol).trim() : '';
  const amountInToken = payload?.amountInToken != null ? String(payload.amountInToken).trim() : '';

  const hasSol = !!amountInSol;
  const hasToken = !!amountInToken;

  if (!hasSol && !hasToken) throw new Error('Provide amountInToken (smallest units) or amountInSol (lamports)');
  if (hasSol && hasToken) throw new Error('Provide only one: amountInToken OR amountInSol');

  if (hasToken) toNumericString(amountInToken, 'amountInToken');
  if (hasSol) toNumericString(amountInSol, 'amountInSol');

  const slippageBps = payload?.slippageBps == null ? undefined : toNonNegInt(payload.slippageBps, 'slippageBps');
  if (slippageBps != null && slippageBps > 10_000) throw new Error('slippageBps must be <= 10000');

  const referrer = payload?.referrer != null ? String(payload.referrer).trim() : undefined;

  const idk = opts?.idempotencyKey ?? newIdempotencyKey('buy');
  const headers = withIdempotencyHeader(getAuthHeaders(), idk);

  const { data } = await postViaProxy<TradingBuyResponse>(
    '/trading/buy',
    {
      tokenAddress,
      amountInToken: hasToken ? amountInToken : undefined,
      amountInSol: hasSol ? amountInSol : undefined,
      slippageBps,
      referrer: referrer || undefined,
    },
    headers
  );

  return data;
}

export async function sellToken(payload: TradingSellRequest, opts?: IdempotencyOptions): Promise<TradingSellResponse> {
  const tokenAddress = String(payload?.tokenAddress ?? '').trim();
  if (!tokenAddress) throw new Error('tokenAddress is required');

  const amountInToken = String(payload?.amountInToken ?? '').trim();
  if (!amountInToken) throw new Error('amountInToken is required');
  toNumericString(amountInToken, 'amountInToken');

  const slippageBps = payload?.slippageBps == null ? undefined : toNonNegInt(payload.slippageBps, 'slippageBps');
  if (slippageBps != null && slippageBps > 10_000) throw new Error('slippageBps must be <= 10000');

  const referrer = payload?.referrer != null ? String(payload.referrer).trim() : undefined;

  const idk = opts?.idempotencyKey ?? newIdempotencyKey('sell');
  const headers = withIdempotencyHeader(getAuthHeaders(), idk);

  const { data } = await postViaProxy<TradingSellResponse>(
    '/trading/sell',
    {
      tokenAddress,
      amountInToken,
      slippageBps,
      referrer: referrer || undefined,
    },
    headers
  );

  return data;
}

// =====================
// Trading Preview (bonding curve)
// =====================
export async function previewBuy(payload: TradingPreviewBuyRequest): Promise<TradingPreviewBuyResponse> {
  const tokenAddress = String(payload?.tokenAddress ?? '').trim();
  if (!tokenAddress) throw new Error('tokenAddress is required');

  const amountSol = Number(payload?.amountSol ?? 0);
  if (!Number.isFinite(amountSol) || amountSol <= 0) throw new Error('amountSol must be a number > 0');

  const headers = getAuthHeaders();

  const { data } = await postViaProxy<TradingPreviewBuyResponse>(
    '/trading/preview-buy',
    { tokenAddress, amountSol },
    headers
  );

  return data;
}

export async function previewSell(payload: TradingPreviewSellRequest): Promise<TradingPreviewSellResponse> {
  const tokenAddress = String(payload?.tokenAddress ?? '').trim();
  if (!tokenAddress) throw new Error('tokenAddress is required');

  const amountInToken = Number(payload?.amountInToken ?? 0);
  if (!Number.isFinite(amountInToken) || amountInToken <= 0) throw new Error('amountInToken must be a number > 0');

  const headers = getAuthHeaders();

  const { data } = await postViaProxy<TradingPreviewSellResponse>(
    '/trading/preview-sell',
    { tokenAddress, amountInToken },
    headers
  );

  return data;
}

export async function submitSignature(
  endpointOrPath: string,
  payload: { id: string; txSignature: string },
  opts?: IdempotencyOptions
): Promise<SubmitSignatureResponse> {
  const epRaw = String(endpointOrPath ?? '').trim();
  if (!epRaw) throw new Error('submitSignature endpoint is required');

  const id = String(payload?.id ?? '').trim();
  const txSignature = String(payload?.txSignature ?? '').trim();

  if (!id) throw new Error('id is required');
  if (!txSignature) throw new Error('txSignature is required');

  const idk = opts?.idempotencyKey ?? newIdempotencyKey('submit-sig');
  const headers = withIdempotencyHeader(getAuthHeaders(), idk);

  const path = normalizeTrackingPath(epRaw);

  const { data } = await postViaProxy<SubmitSignatureResponse>(path, { id, txSignature }, headers);
  return data;
}

export async function getTradingStatus(endpointOrPath: string): Promise<TradingTxStatusResponse> {
  const epRaw = String(endpointOrPath ?? '').trim();
  if (!epRaw) throw new Error('status endpoint is required');

  const headers = getAuthHeaders();
  const path = normalizeTrackingPath(epRaw);

  const { data } = await getViaProxy<TradingTxStatusResponse>(path, {}, headers);
  return data;
}
