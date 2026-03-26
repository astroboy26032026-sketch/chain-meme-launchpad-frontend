// src/utils/api/create.ts
// Token creation flow API endpoints

import {
  postViaProxy,
  getAuthHeaders,
  newIdempotencyKey,
  withIdempotencyHeader,
  assertNonEmpty,
  assertSymbol,
  toNonNegInt,
  toNumericString,
  UPLOAD_TIMEOUT,
  type IdempotencyOptions,
} from './core';

// =====================
// Types
// =====================
export type PrepareMintRequest = {
  seed: string;
  decimals: number;
  initialAmount: string;
  symbol: string;
  name: string;
};

export type PrepareMintResponse = {
  mint: string;
  ata: string;
  txBase64: string;
  symbol: string;
  name: string;
  note?: string;
};

export type UploadTokenImageRequest = { image: string };

export type UploadTokenImageResponse = {
  imageUrl: string;
  ipfsUri: string;
  note?: string;
};

export type CreateTokenDraftRequest = {
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  isNSFW: boolean;
  socials?: {
    twitter?: string;
    telegram?: string;
    website?: string;
    discord?: string;
    youtube?: string;
  };
};

export type CreateTokenDraftResponse = {
  draftId: string;
  status: string;
  expiresAt: string;
  note?: string;
};

export type PreviewInitialBuyRequest = { draftId: string; amountSol: number };

export type PreviewInitialBuyResponse = {
  amountSol: number;
  estimatedTokens: number;
  price: number;
  note?: string;
};

export type FinalizeTokenRequest = {
  draftId: string;
  initialBuySol: number;
  decimals: number;
  curveType: number;
  basePriceLamports: number;
  slopeLamports: number;
  bondingCurveSupply: string;
  graduateTargetLamports: string;
};

export type FinalizeTokenResponse = {
  tokenAddress: string;
  marketAddress: string;
  txId: string;
  createdAt: string;
  initialBuyNote?: string;
};

export type ConfirmMintRequest = { mint: string; symbol: string; name: string };

export type ConfirmMintResponse = {
  ok: true;
  token: {
    mint: string;
    symbol: string;
    name: string;
    creator: string;
    status: 'pending' | 'active' | string;
    createdAt: string;
  };
};

// =====================
// API functions
// =====================
export async function prepareMint(payload: PrepareMintRequest): Promise<PrepareMintResponse> {
  const headers = getAuthHeaders();
  const { data } = await postViaProxy<PrepareMintResponse>('/api/v1/tokens/prepare-mint', payload, headers);
  return data;
}

export async function confirmMint(payload: ConfirmMintRequest): Promise<ConfirmMintResponse> {
  const headers = getAuthHeaders();
  const { data } = await postViaProxy<ConfirmMintResponse>('/api/v1/tokens/confirm', payload, headers);
  return data;
}

export async function uploadTokenImage(
  payload: UploadTokenImageRequest,
  opts?: IdempotencyOptions
): Promise<UploadTokenImageResponse> {
  assertNonEmpty(payload?.image, 'image is required');
  const idk = opts?.idempotencyKey ?? newIdempotencyKey('upload-image');
  const headers = withIdempotencyHeader(getAuthHeaders(), idk);

  const { data } = await postViaProxy<UploadTokenImageResponse>(
    '/token/upload-image',
    { image: String(payload.image).trim() },
    headers,
    UPLOAD_TIMEOUT
  );
  return data;
}

export async function createTokenDraft(
  payload: CreateTokenDraftRequest,
  opts?: IdempotencyOptions
): Promise<CreateTokenDraftResponse> {
  assertNonEmpty(payload?.name, 'name is required');
  assertNonEmpty(payload?.symbol, 'symbol is required');
  assertNonEmpty(payload?.imageUrl, 'imageUrl is required');

  const idk = opts?.idempotencyKey ?? newIdempotencyKey('create-draft');
  const headers = withIdempotencyHeader(getAuthHeaders(), idk);

  const { data } = await postViaProxy<CreateTokenDraftResponse>(
    '/token/create/draft',
    {
      ...payload,
      name: String(payload.name).trim(),
      symbol: assertSymbol(payload.symbol),
      description: String(payload.description ?? ''),
      imageUrl: String(payload.imageUrl).trim(),
      isNSFW: Boolean(payload.isNSFW),
    },
    headers
  );
  return data;
}

export async function previewInitialBuy(payload: PreviewInitialBuyRequest): Promise<PreviewInitialBuyResponse> {
  assertNonEmpty(payload?.draftId, 'draftId is required');
  const amountSol = Number(payload?.amountSol ?? 0);
  if (!Number.isFinite(amountSol) || amountSol <= 0) throw new Error('amountSol must be a number > 0');

  const headers = getAuthHeaders();
  const { data } = await postViaProxy<PreviewInitialBuyResponse>(
    '/token/create/preview-buy',
    { draftId: String(payload.draftId).trim(), amountSol },
    headers
  );
  return data;
}

export async function finalizeTokenCreation(
  payload: FinalizeTokenRequest,
  opts?: IdempotencyOptions
): Promise<FinalizeTokenResponse> {
  assertNonEmpty(payload?.draftId, 'draftId is required');

  const decimals = toNonNegInt(payload.decimals, 'decimals');
  if (decimals > 18) throw new Error('decimals must be <= 18');

  const curveType = toNonNegInt(payload.curveType, 'curveType');
  const initialBuySol = Number(payload.initialBuySol ?? 0);
  if (!Number.isFinite(initialBuySol) || initialBuySol < 0) throw new Error('initialBuySol must be a number >= 0');

  const basePriceLamports = toNonNegInt(payload.basePriceLamports, 'basePriceLamports');
  const slopeLamports = toNonNegInt(payload.slopeLamports, 'slopeLamports');

  const bondingCurveSupply = toNumericString(payload.bondingCurveSupply, 'bondingCurveSupply');
  const graduateTargetLamports = toNumericString(payload.graduateTargetLamports, 'graduateTargetLamports');

  const body: FinalizeTokenRequest = {
    draftId: String(payload.draftId).trim(),
    initialBuySol,
    decimals,
    curveType,
    basePriceLamports,
    slopeLamports,
    bondingCurveSupply,
    graduateTargetLamports,
  };

  const idk = opts?.idempotencyKey ?? newIdempotencyKey(`finalize-${body.draftId}`);
  const headers = withIdempotencyHeader(getAuthHeaders(), idk);

  const { data } = await postViaProxy<FinalizeTokenResponse>('/token/create/finalize', body, headers);
  return data;
}
