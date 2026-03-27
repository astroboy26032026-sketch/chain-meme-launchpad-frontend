// Hook: manages token detail data (info, liquidity, holders)

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import {
  getTokenInfo,
  getTokenLiquidity,
  getTokenHolders,
} from '@/utils/api.index';
import type { Token, TokenHolder } from '@/interface/types';

export function useTokenDetail(initialTokenInfo: Token | null) {
  const router = useRouter();
  const { address } = router.query;

  const tokenAddr = useMemo(() => {
    const a = Array.isArray(address) ? address[0] : address;
    return (a || '').trim() || undefined;
  }, [address]);

  const [tokenInfo, setTokenInfo] = useState<Token | null>(initialTokenInfo);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [liquidityEvents, setLiquidityEvents] = useState<any[]>([]);

  // Holders state
  const [holdersAll, setHoldersAll] = useState<TokenHolder[]>([]);
  const [holdersNextCursor, setHoldersNextCursor] = useState<string | null>(null);
  const [holdersLoading, setHoldersLoading] = useState(false);
  const [holdersError, setHoldersError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [refreshCounter, setRefreshCounter] = useState(0);
  const refresh = useCallback(() => setRefreshCounter((c) => c + 1), []);

  // Separate race-condition guards per fetch to avoid cross-interference
  const infoReqRef = useRef(0);
  const liqReqRef = useRef(0);
  const holdersReqRef = useRef(0);

  const fetchTokenInfo = useCallback(async () => {
    if (!tokenAddr) return;
    const myReq = ++infoReqRef.current;
    setTokenError(null);
    try {
      const info = await getTokenInfo(tokenAddr);
      if (myReq !== infoReqRef.current) return;
      setTokenInfo(info as unknown as Token);
    } catch (e: any) {
      console.error('Error fetching /token/info:', e);
      if (myReq !== infoReqRef.current) return;
      setTokenError(e?.message || 'Failed to load token');
    }
  }, [tokenAddr]);

  const fetchLiquidity = useCallback(async () => {
    if (!tokenAddr) return;
    const myReq = ++liqReqRef.current;
    try {
      const lq = await getTokenLiquidity(tokenAddr);
      if (myReq !== liqReqRef.current) return;
      setLiquidityEvents(lq?.events ?? []);
    } catch (e) {
      console.error('Error fetching /token/liquidity:', e);
      if (myReq !== liqReqRef.current) return;
      setLiquidityEvents([]);
    }
  }, [tokenAddr]);

  const fetchHolders = useCallback(
    async (opts?: { reset?: boolean }) => {
      if (!tokenAddr) return;
      const reset = !!opts?.reset;
      const cursorVal = reset ? null : holdersNextCursor;
      if (!reset && cursorVal === null) return;

      setHoldersLoading(true);
      setHoldersError(null);

      const myReq = ++holdersReqRef.current;

      try {
        const res = await getTokenHolders(tokenAddr, { limit: 200, cursor: cursorVal });
        if (myReq !== holdersReqRef.current) return;
        const incoming = Array.isArray(res?.holders) ? res.holders : [];
        setHoldersNextCursor(res?.nextCursor ?? null);
        setHoldersAll((prev) => (reset ? incoming : [...prev, ...incoming]));
      } catch (e: any) {
        console.error('Error fetching /token/holders:', e);
        if (myReq !== holdersReqRef.current) return;
        setHoldersError(e?.message || 'Failed to load holders');
        if (reset) {
          setHoldersAll([]);
          setHoldersNextCursor(null);
        }
      } finally {
        if (myReq === holdersReqRef.current) {
          setHoldersLoading(false);
        }
      }
    },
    [tokenAddr, holdersNextCursor],
  );

  // Fetch when token changes
  useEffect(() => {
    if (!tokenAddr) return;
    setTokenInfo(null);
    setTokenError(null);
    setCurrentPage(1);
    setHoldersAll([]);
    setHoldersNextCursor(null);
    setHoldersError(null);
    fetchTokenInfo();
    fetchLiquidity();
    fetchHolders({ reset: true });
  }, [tokenAddr, fetchTokenInfo, fetchLiquidity, fetchHolders]);

  const tokenSymbol = String(tokenInfo?.symbol ?? '').trim();

  const decimals = useMemo(() => {
    const d = Number((tokenInfo as any)?.decimals ?? 9);
    return Math.min(Math.max(Math.trunc(Number.isFinite(d) ? d : 9), 0), 18);
  }, [tokenInfo]);

  return {
    tokenAddr,
    tokenInfo,
    tokenError,
    tokenSymbol,
    decimals,
    liquidityEvents,
    holdersAll,
    holdersNextCursor,
    holdersLoading,
    holdersError,
    currentPage,
    setCurrentPage,
    refreshCounter,
    refresh,
    fetchLiquidity,
    fetchHolders,
  };
}
