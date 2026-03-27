// src/components/TokenDetails/TransactionHistory.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getTokenTrades } from '@/utils/api.index';
import type { TokenTrade } from '@/interface/types';
import SpaceLoader from '@/components/ui/SpaceLoader';
import { COMMON } from '@/constants/ui-text';
import { RefreshCw } from 'lucide-react';

type Props = { tokenAddress: string };

const PAGE_LIMIT = 15;
const AUTO_REFRESH_MS = 20_000;

const fmtSol = (v: any) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  if (n >= 1) return n.toFixed(2);
  return n.toFixed(4);
};

const shortAddr = (addr: string) => {
  if (!addr || addr.length < 10) return addr || '—';
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
};

const fmtAge = (t: number) => {
  const ms = t > 1e12 ? t : t * 1000;
  const diff = Date.now() - ms;
  if (diff < 0 || !Number.isFinite(diff)) return 'just now';
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
};

const TransactionHistory: React.FC<Props> = ({ tokenAddress }) => {
  const [trades, setTrades] = useState<TokenTrade[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reqIdRef = useRef(0);

  const loadTrades = useCallback(
    async (isLoadMore = false) => {
      const addr = (tokenAddress || '').trim();
      if (!addr || loading) return;
      const myReqId = ++reqIdRef.current;

      try {
        setLoading(true);
        setError(null);

        const res = await getTokenTrades(addr, {
          limit: PAGE_LIMIT,
          cursor: isLoadMore ? cursor ?? undefined : undefined,
        });

        if (reqIdRef.current !== myReqId) return;

        const next = res?.nextCursor ?? null;
        const list = res?.trades ?? [];

        setTrades((prev) => (isLoadMore ? [...prev, ...list] : list));
        setCursor(next);
        setHasMore(Boolean(next));
      } catch (e: any) {
        if (reqIdRef.current !== myReqId) return;
        setError(e?.message || 'Failed to load trades');
      } finally {
        if (reqIdRef.current !== myReqId) return;
        setLoading(false);
        setInitialLoading(false);
      }
    },
    [tokenAddress, cursor, loading],
  );

  // Initial load + auto-refresh
  useEffect(() => {
    const addr = (tokenAddress || '').trim();
    if (!addr) return;

    setTrades([]);
    setCursor(null);
    setHasMore(true);
    setError(null);
    setInitialLoading(true);
    loadTrades(false);

    const interval = setInterval(() => {
      if (!document.hidden) loadTrades(false);
    }, AUTO_REFRESH_MS);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenAddress]);

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <SpaceLoader size="small" label="Loading trades..." />
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-500">
          {trades.length > 0 && `${trades.length} trades`}
        </span>
        <div className="flex items-center gap-2">
          {loading && !initialLoading && (
            <RefreshCw size={12} className="text-gray-500 animate-spin" />
          )}
        </div>
      </div>

      {error && (
        <div className="text-red-400 text-sm mb-3 px-2 py-2 bg-red-500/5 rounded-lg border border-red-500/10">
          {error}
        </div>
      )}

      {trades.length === 0 && !error && (
        <div className="text-center py-10 text-gray-500 text-sm">
          No trades yet
        </div>
      )}

      {trades.length > 0 && (
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-left min-w-[380px]">
            <thead>
              <tr className="border-b border-[var(--card-border)]">
                <th className="px-2 py-2.5 text-[11px] font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-2 py-2.5 text-[11px] font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-2 py-2.5 text-[11px] font-medium text-gray-500 uppercase tracking-wider text-right">SOL</th>
                <th className="px-2 py-2.5 text-[11px] font-medium text-gray-500 uppercase tracking-wider text-right">Wallet</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((t, idx) => {
                const key = t.signature ? `${t.signature}-${idx}` : `${t.publicKey}-${t.time}-${idx}`;
                return (
                  <tr
                    key={key}
                    className="border-b border-[var(--card-border)]/50 hover:bg-[var(--card-hover)]/50 transition-colors"
                  >
                    <td className="px-2 py-2 text-xs text-gray-500 tabular-nums">
                      {fmtAge(t.time)}
                    </td>
                    <td className="px-2 py-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.isBuy
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {t.isBuy ? 'BUY' : 'SELL'}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-300 text-right font-medium tabular-nums">
                      {fmtSol(t.solAmount)}
                    </td>
                    <td className="px-2 py-2 text-right">
                      <a
                        href={`https://solscan.io/account/${t.publicKey}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-gray-500 hover:text-[var(--primary)] transition-colors font-mono"
                        title={t.publicKey}
                      >
                        {shortAddr(t.publicKey)}
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {hasMore && trades.length > 0 && (
        <div className="flex justify-center mt-4">
          <button
            disabled={loading}
            onClick={() => loadTrades(true)}
            className="px-5 py-2.5 rounded-xl text-sm border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] transition-colors disabled:opacity-50"
          >
            {loading ? COMMON.LOADING : COMMON.LOAD_MORE}
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;
