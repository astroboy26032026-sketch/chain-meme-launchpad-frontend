// src/hooks/useCreateTokenFlow.ts
// Business logic for token creation flow: upload, draft, finalize, initial buy

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { VersionedTransaction } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { toastSuccess, toastError } from '@/utils/customToast';
import {
  uploadTokenImage,
  createTokenDraft,
  finalizeTokenCreation,
  buyToken,
  submitSignature,
  getTradingStatus,
  newIdempotencyKey,
  type CreateTokenDraftResponse,
} from '@/utils/api';
import { normalizeTrackingEndpoint, estimateTokensFromSol } from '@/utils/tradingHelpers';

// =====================
// Constants
// =====================
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const COMPRESSED_TARGET = 800 * 1024;
const SYMBOL_MIN = 2;
const SYMBOL_MAX = 10;
const SYMBOL_RE = /^[A-Z0-9]{2,10}$/;

// =====================
// Helpers
// =====================
export function normalizeSymbol(input: string) {
  return (input || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, SYMBOL_MAX);
}

function validateSymbolOrThrow(symbol: string) {
  const s = normalizeSymbol(symbol);
  if (!SYMBOL_RE.test(s)) {
    throw new Error(`Symbol must be uppercase alphanumeric, ${SYMBOL_MIN}-${SYMBOL_MAX} characters`);
  }
  return s;
}

export const makeSymbol = (name: string) => {
  const s = normalizeSymbol(name);
  if (s.length >= SYMBOL_MIN) return s;
  return (s + 'TK').slice(0, SYMBOL_MIN);
};

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('Failed to read file'));
    r.readAsDataURL(file);
  });
}

async function compressImage(file: File, targetSize = COMPRESSED_TARGET): Promise<File> {
  if (file.size <= targetSize) return file;

  const bmp = await createImageBitmap(file);
  let { width, height } = bmp;

  const MAX_DIM = 1500;
  if (width > MAX_DIM || height > MAX_DIM) {
    const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(bmp, 0, 0, width, height);

  const toBlob = (q: number): Promise<Blob | null> =>
    new Promise((res) => canvas.toBlob(res, 'image/jpeg', q));

  for (const q of [0.85, 0.7, 0.55, 0.4]) {
    const blob = await toBlob(q);
    if (blob && (blob.size <= targetSize || q === 0.4)) {
      return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' });
    }
  }

  return file;
}

function safeErrMsg(e: any, fallback: string) {
  return e?.response?.data?.message || e?.response?.data?.error || e?.message || fallback;
}

export type Step = 1 | 2 | 3;

export type CreationStep = 'idle' | 'uploading' | 'drafting' | 'previewing' | 'finalizing' | 'completed' | 'error';

export function useCreateTokenFlow() {
  const router = useRouter();
  const wallet = useWallet();
  const { connected } = wallet;
  const { connection } = useConnection();

  // Step control
  const [step, setStep] = useState<Step>(1);

  // Step 1: Basic info
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [tokenDescription, setTokenDescription] = useState('');
  const [isNSFW, setIsNSFW] = useState(false);
  const [tokenImageUrl, setTokenImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Socials
  const [website, setWebsite] = useState('');
  const [telegram, setTelegram] = useState('');
  const [discord, setDiscord] = useState('');
  const [twitter, setTwitter] = useState('');
  const [youtube, setYoutube] = useState('');
  const [isSocialExpanded, setIsSocialExpanded] = useState(false);

  // Draft
  const [draft, setDraft] = useState<CreateTokenDraftResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Curve params (BE auto-configures)
  const [decimals] = useState<number>(6);
  const curveType = 0;
  const [basePriceLamports] = useState<number>(1000);
  const [slopeLamports] = useState<number>(1);
  const [bondingCurveSupply] = useState<string>('1000000000000000');
  const [graduateTargetLamports] = useState<string>('69000000000');

  // Step 3: Buy
  const [creationStep, setCreationStep] = useState<CreationStep>('idle');
  const [buyAmount, setBuyAmount] = useState<number>(0);
  const [showPreventNavigationModal, setShowPreventNavigationModal] = useState(false);
  const [showConnectWalletModal, setShowConnectWalletModal] = useState(false);

  // Idempotency keys
  const uploadKeyRef = useRef<string | null>(null);
  const draftKeyRef = useRef<string | null>(null);
  const finalizeKeyRef = useRef<string | null>(null);

  const resetCreateFlowIdempotency = useCallback(() => {
    uploadKeyRef.current = null;
    draftKeyRef.current = null;
    finalizeKeyRef.current = null;
  }, []);

  const resetIdempotencyKeys = useCallback(() => {
    draftKeyRef.current = null;
    finalizeKeyRef.current = null;
  }, []);

  // Connect wallet
  const openConnectWalletModal = useCallback(() => setShowConnectWalletModal(true), []);
  const closeConnectWalletModal = useCallback(() => setShowConnectWalletModal(false), []);

  const requireWalletOrShowModal = useCallback(() => {
    if (connected) return true;
    setShowConnectWalletModal(true);
    return false;
  }, [connected]);

  // Derived
  const symbolAuto = useMemo(() => makeSymbol(tokenName), [tokenName]);
  const symbolFinal = useMemo(() => normalizeSymbol(tokenSymbol || symbolAuto), [tokenSymbol, symbolAuto]);

  const canGoNextStep1 = useMemo(() => {
    return Boolean(tokenName.trim()) && SYMBOL_RE.test(symbolFinal) && Boolean(tokenImageUrl);
  }, [tokenName, symbolFinal, tokenImageUrl]);

  const isBusy = useMemo(() => creationStep !== 'idle', [creationStep]);

  const resetDraftAndGoStep1 = useCallback(
    (msg?: string) => {
      setDraft(null);
      setStep(1);
      resetCreateFlowIdempotency();
      if (msg) toastError(msg);
    },
    [resetCreateFlowIdempotency]
  );

  // File picker
  const openFilePicker = useCallback(() => {
    if (!requireWalletOrShowModal()) return;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  }, [requireWalletOrShowModal]);

  // Upload image
  const uploadImageToBE = useCallback(
    async (file: File) => {
      if (!requireWalletOrShowModal()) return null;
      if (file.size > MAX_FILE_SIZE) {
        toastError('File size exceeds 5MB limit. Please choose a smaller file.');
        return null;
      }

      setIsUploading(true);
      setCreationStep('uploading');

      try {
        const compressed = await compressImage(file);
        let imageUrl: string | null = null;
        const dataUrl = await readFileAsDataURL(compressed);
        const base64Only = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;

        // Attempt 1: BE with full data URL
        try {
          if (!uploadKeyRef.current) uploadKeyRef.current = newIdempotencyKey('upload-image');
          const res = await uploadTokenImage({ image: dataUrl }, { idempotencyKey: uploadKeyRef.current ?? undefined });
          if (res?.imageUrl) imageUrl = res.imageUrl;
        } catch { uploadKeyRef.current = null; }

        // Attempt 2: BE with raw base64
        if (!imageUrl) {
          try {
            uploadKeyRef.current = newIdempotencyKey('upload-image');
            const res = await uploadTokenImage({ image: base64Only }, { idempotencyKey: uploadKeyRef.current ?? undefined });
            if (res?.imageUrl) imageUrl = res.imageUrl;
          } catch { uploadKeyRef.current = null; }
        }

        // Attempt 3: local /api/upload-to-ipfs
        if (!imageUrl) {
          try {
            const formData = new FormData();
            formData.append('file', compressed);
            const localRes = await fetch('/api/upload-to-ipfs', { method: 'POST', body: formData });
            if (localRes.ok) {
              const localData = await localRes.json();
              imageUrl = localData?.url || null;
            }
          } catch { /* ignore */ }
        }

        if (imageUrl) {
          setTokenImageUrl(imageUrl);
          return imageUrl;
        }

        throw new Error('No image URL returned');
      } catch (e: any) {
        uploadKeyRef.current = null;
        const status = e?.response?.status;
        const beMsg = e?.response?.data?.message || e?.response?.data?.error || '';

        let msg = 'Failed to upload image.';
        if (e?.code === 'ECONNABORTED' || e?.message?.includes('timeout')) msg = 'Upload timed out. Please try a smaller image.';
        else if (status === 400) msg = beMsg || 'Invalid image. Please use PNG, JPG, GIF or WebP under 1MB.';
        else if (status === 401) { msg = 'Wallet authentication required.'; openConnectWalletModal(); }
        else if (status === 500) msg = beMsg || 'Upload failed on server.';
        else if (beMsg) msg = beMsg;
        else if (e?.message) msg = e.message;

        toastError(msg);
        return null;
      } finally {
        setIsUploading(false);
        setCreationStep('idle');
      }
    },
    [requireWalletOrShowModal, openConnectWalletModal]
  );

  const onImagePicked = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      uploadKeyRef.current = newIdempotencyKey('upload-image');
      draftKeyRef.current = null;
      finalizeKeyRef.current = null;
      await uploadImageToBE(f);
    },
    [uploadImageToBE]
  );

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const onDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!requireWalletOrShowModal()) return;
      const f = e.dataTransfer.files?.[0];
      if (!f) return;
      uploadKeyRef.current = newIdempotencyKey('upload-image');
      draftKeyRef.current = null;
      finalizeKeyRef.current = null;
      await uploadImageToBE(f);
    },
    [uploadImageToBE, requireWalletOrShowModal]
  );

  // Create draft
  const handleCreateDraftAndNext = useCallback(async () => {
    if (!requireWalletOrShowModal()) return;
    if (!tokenImageUrl) { toastError('Please upload token image.'); return; }

    let symbolSafe = '';
    try { symbolSafe = validateSymbolOrThrow(symbolFinal); }
    catch (err: any) { toastError(err?.message || 'Invalid symbol'); return; }

    setCreationStep('drafting');
    try {
      if (!draftKeyRef.current) draftKeyRef.current = newIdempotencyKey('create-draft');
      const res = await createTokenDraft(
        {
          name: tokenName.trim(),
          symbol: symbolSafe,
          description: tokenDescription || '',
          imageUrl: tokenImageUrl,
          isNSFW: Boolean(isNSFW),
          socials: {
            ...(twitter ? { twitter } : {}),
            ...(telegram ? { telegram } : {}),
            ...(website ? { website } : {}),
            ...(discord ? { discord } : {}),
            ...(youtube ? { youtube } : {}),
          },
        },
        { idempotencyKey: draftKeyRef.current ?? undefined }
      );
      setDraft(res);
      setStep(3);
    } catch (e: any) {
      draftKeyRef.current = null;
      finalizeKeyRef.current = null;
      if (e?.response?.status === 401) openConnectWalletModal();
      else toastError(safeErrMsg(e, 'Create draft failed.'));
    } finally {
      setCreationStep('idle');
    }
  }, [requireWalletOrShowModal, tokenImageUrl, symbolFinal, tokenName, tokenDescription, isNSFW, twitter, telegram, website, discord, youtube, openConnectWalletModal]);

  // Finalize
  const runFinalize = useCallback(
    async (initialBuySol: number) => {
      if (!requireWalletOrShowModal()) return;

      if (!draft?.draftId) { toastError('Missing draft. Please go back.'); return; }
      if (initialBuySol > 0 && (!wallet.publicKey || !wallet.sendTransaction)) {
        toastError('Wallet does not support signing.');
        return;
      }

      setCreationStep('finalizing');
      try {
        if (!finalizeKeyRef.current) {
          finalizeKeyRef.current = newIdempotencyKey(draft?.draftId ? `finalize-${draft.draftId}` : 'finalize');
        }

        const res = await finalizeTokenCreation(
          {
            draftId: draft!.draftId,
            initialBuySol: 0,
            decimals: Math.trunc(decimals),
            curveType,
            basePriceLamports: Math.trunc(Math.max(0, Number(basePriceLamports) || 0)),
            slopeLamports: Math.trunc(Math.max(0, Number(slopeLamports) || 0)),
            bondingCurveSupply: String(bondingCurveSupply).trim(),
            graduateTargetLamports: String(graduateTargetLamports).trim(),
          },
          { idempotencyKey: finalizeKeyRef.current ?? undefined }
        );

        // Initial buy if needed
        if (initialBuySol > 0 && res.tokenAddress) {
          const pv = await estimateTokensFromSol({ tokenAddr: res.tokenAddress, solIn: initialBuySol });
          const amountInToken = Math.floor(pv.tokenOutHuman).toFixed(0);
          if (!amountInToken || amountInToken === '0') throw new Error('Amount too small');

          const buyRes = await buyToken(
            { tokenAddress: res.tokenAddress, amountInToken, slippageBps: 500 },
            { idempotencyKey: newIdempotencyKey('initial-buy') }
          );

          if (!buyRes?.txBase64) throw new Error('No transaction returned from buy API');

          const rawTx = Buffer.from(String(buyRes.txBase64), 'base64');
          const tx = VersionedTransaction.deserialize(rawTx);
          const txSignature = await wallet.sendTransaction!(tx, connection, { preflightCommitment: 'processed' });

          const tracking: any = buyRes.tracking || {};
          const submitEp = normalizeTrackingEndpoint(tracking.submitSignatureEndpoint || tracking.submitSignatureBySignatureEndpoint || '');
          const statusEp = normalizeTrackingEndpoint(tracking.statusEndpoint || tracking.statusBySignatureEndpoint || '');

          const txId = String(buyRes.transactionId ?? '').trim();
          if (submitEp && txId) await submitSignature(submitEp, { id: txId, txSignature });

          connection.confirmTransaction(txSignature, 'processed').catch(() => {});

          if (statusEp) {
            let finalStatus = '';
            for (let i = 0; i < 12; i++) {
              await new Promise((r) => setTimeout(r, 1000));
              try {
                const st = await getTradingStatus(statusEp);
                finalStatus = String((st as any)?.status ?? '').toUpperCase();
                if (finalStatus === 'CONFIRMED' || finalStatus === 'FAILED') break;
              } catch { /* retry */ }
            }
            if (finalStatus === 'FAILED') toastError('Initial buy failed. Token was created but buy did not complete.');
            else toastSuccess('Coin created successfully!');
          } else {
            toastSuccess('Coin created successfully!');
          }
        } else {
          toastSuccess('Coin created successfully!');
        }

        setCreationStep('completed');
        resetCreateFlowIdempotency();
        await new Promise((r) => setTimeout(r, 2000));
        router.push(`/token/${res.tokenAddress}`);
      } catch (e: any) {
        finalizeKeyRef.current = null;
        const status = e?.response?.status;
        const msg = e?.message || '';

        if (status === 401) openConnectWalletModal();
        else if (status === 403) toastError('Forbidden: you can only finalize your own draft.');
        else if (status === 404) toastError('Draft not found.');
        else if (status === 410) resetDraftAndGoStep1('Draft expired. Please create again.');
        else if (/User rejected/i.test(msg)) toastError('Transaction was cancelled.');
        else toastError(safeErrMsg(e, 'Finalize failed.'));

        setCreationStep('idle');
      }
    },
    [requireWalletOrShowModal, draft, wallet, connection, decimals, curveType, basePriceLamports, slopeLamports, bondingCurveSupply, graduateTargetLamports, router, resetDraftAndGoStep1, openConnectWalletModal, resetCreateFlowIdempotency]
  );

  const handleBuy = useCallback(async () => {
    if (buyAmount <= 0) return;
    if (!requireWalletOrShowModal()) return;
    await runFinalize(buyAmount);
  }, [buyAmount, requireWalletOrShowModal, runFinalize]);

  const handleCreateWithoutBuy = useCallback(async () => {
    await runFinalize(0);
  }, [runFinalize]);

  // Effects
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (creationStep === 'finalizing') { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [creationStep]);

  useEffect(() => { setShowPreventNavigationModal(creationStep === 'finalizing'); }, [creationStep]);
  useEffect(() => { if (step === 3 && !draft?.draftId) setStep(1); }, [step, draft?.draftId]);
  useEffect(() => { if (connected && showConnectWalletModal) setShowConnectWalletModal(false); }, [connected, showConnectWalletModal]);
  useEffect(() => { if (step === 1) { draftKeyRef.current = null; finalizeKeyRef.current = null; } }, [step]);

  return {
    // Step
    step, setStep,
    // Step 1
    tokenName, setTokenName,
    tokenSymbol, setTokenSymbol,
    tokenDescription, setTokenDescription,
    isNSFW, setIsNSFW,
    tokenImageUrl,
    isUploading,
    website, setWebsite,
    telegram, setTelegram,
    discord, setDiscord,
    twitter, setTwitter,
    youtube, setYoutube,
    isSocialExpanded, setIsSocialExpanded,
    fileInputRef,
    symbolFinal,
    canGoNextStep1,
    // Step 3
    draft,
    creationStep,
    buyAmount, setBuyAmount,
    isBusy,
    // Modals
    showConnectWalletModal, closeConnectWalletModal,
    showPreventNavigationModal,
    // Actions
    openFilePicker,
    onImagePicked,
    onDragOver,
    onDrop,
    handleCreateDraftAndNext,
    handleBuy,
    handleCreateWithoutBuy,
    resetIdempotencyKeys,
    // Constants
    SYMBOL_RE, SYMBOL_MIN, SYMBOL_MAX,
  };
}
