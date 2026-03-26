// src/components/TokenDetails/TransactionHistory.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getTokenTrades } from '@/utils/api.index';
import type { TokenTrade } from '@/interface/types';
import SpaceLoader from '@/components/ui/SpaceLoader';
import { COMMON } from '@/constants/ui-text';

type Props = {
  tokenAddress: string;
};

const PAGE_LIMIT = 10;

const fmtSol = (v: any) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return '-';
  return n.toFixed(4);
};

const shortAddr = (addr: string) => {
  if (!addr || addr.length < 10) return addr || '-';
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
};

const fmtAge = (t: number) => {
  const ms = t > 1e12 ? t : t * 1000;
  const diff = Date.now() - ms;
  if (diff < 0 || !Number.isFinite(diff)) return 'just now';

  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const TransactionHistory: React.FC<Props> = ({ tokenAddress }) => {
  const [trades, setTrades] = useState<TokenTrade[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reqIdRef = useRef(0);
  const canLoadMore = useMemo(() => hasMore && !loading, [hasMore, loading]);

  const loadTrades = useCallback(
    async (isLoadMore = false) => {
      const addr = (tokenAddress || '').trim();
      if (!addr) return;
      if (loading) return;

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
    [tokenAddress, cursor, loading]
  );

  useEffect(() => {
    const addr = (tokenAddress || '').trim();
    if (!addr) return;

    setTrades([]);
    setCursor(null);
    setHasMore(true);
    setError(null);
    setInitialLoading(true);

    loadTrades(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenAddress]);

  if (initialLoading) return <SpaceLoader variant="overlay" />;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        {loading && <span className="text-xs text-gray-400">Loading…</span>}
      </div>

      {error && <div className="text-red-500 text-sm mb-3">{error}</div>}

      {trades.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[400px]">
            <thead>
              <tr className="bg-[var(--card2)] border-thin">
                <th className="px-2 sm:px-4 py-2 text-xs text-gray-400">Age</th>
                <th className="px-2 sm:px-4 py-2 text-xs text-gray-400">SOL Value</th>
                <th className="px-2 sm:px-4 py-2 text-xs text-gray-400">Wallet</th>
                <th className="px-2 sm:px-4 py-2 text-xs text-gray-400 text-right">Type</th>
              </tr>
            </thead>

            <tbody>
              {trades.map((t, idx) => {
                const key = t.signature ? `${t.signature}-${idx}` : `${t.publicKey}-${t.time}-${idx}`;

                return (
                  <tr
                    key={key}
                    className="border-b border-[var(--card-hover)] hover:bg-[var(--card-hover)] transition-colors"
                  >
                    <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-gray-400">
                      {fmtAge(t.time)}
                    </td>

                    <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-gray-300 font-medium">
                      {fmtSol(t.solAmount)} SOL
                    </td>

                    <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm">
                      <a
                        href={`https://solscan.io/account/${t.publicKey}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-[var(--primary)] transition-colors"
                        title={t.publicKey}
                      >
                        {shortAddr(t.publicKey)}
                      </a>
                    </td>

                    <td className="px-2 sm:px-4 py-2 text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.isBuy
                            ? 'bg-green-500/15 text-green-400'
                            : 'bg-red-500/15 text-red-400'
                        }`}
                      >
                        {t.isBuy ? 'BUY' : 'SELL'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center mt-4">
          <button
            disabled={!canLoadMore}
            onClick={() => loadTrades(true)}
            className="px-5 py-3 rounded-xl border border-[var(--card-border)] bg-[var(--card)] hover:shadow disabled:opacity-50"
          >
            {loading ? COMMON.LOADING : COMMON.LOAD_MORE}
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;
