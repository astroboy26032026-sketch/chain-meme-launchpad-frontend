// src/components/TokenDetails/TokenHolders.tsx
import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TokenHolder } from '@/interface/types';
import { shortenAddress, formatCompactNumber } from '@/utils/blockchainUtils';
import { formatUSD } from '@/utils/formatters';
import { TOKEN } from '@/constants/ui-text';

interface TokenHoldersProps {
  tokenHolders: TokenHolder[];
  currentPage: number;
  totalPages: number;
  creatorAddress: string;
  tokenAddress: string;
  onPageChange: (page: number) => void;
  allHolders: TokenHolder[];
}

const ITEMS_PER_PAGE = 10;

const TokenHolders: React.FC<TokenHoldersProps> = ({
  tokenHolders,
  currentPage,
  creatorAddress,
  tokenAddress,
  onPageChange,
  allHolders,
}) => {
  const solscanBase = process.env.NEXT_PUBLIC_SOLSCAN_URL || 'https://solscan.io';
  const tokenAddrLower = (tokenAddress || '').toLowerCase();
  const creatorAddrLower = (creatorAddress || '').toLowerCase();

  const sortedHolders = useMemo(() => {
    const src = Array.isArray(allHolders) && allHolders.length
      ? allHolders
      : Array.isArray(tokenHolders)
        ? tokenHolders
        : [];

    return src
      .filter((h) => {
        const addr = (h?.walletAddress || h?.address || '').trim();
        if (!addr || addr.toLowerCase() === tokenAddrLower) return false;
        return typeof (h as any).balance !== 'undefined';
      })
      .sort((a, b) => Number((b as any).balance ?? 0) - Number((a as any).balance ?? 0));
  }, [allHolders, tokenHolders, tokenAddrLower]);

  const totalPages = Math.max(1, Math.ceil(sortedHolders.length / ITEMS_PER_PAGE));
  const safePage = Math.min(Math.max(currentPage || 1, 1), totalPages);
  const startIdx = (safePage - 1) * ITEMS_PER_PAGE;
  const pageHolders = sortedHolders.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  if (sortedHolders.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500 text-sm">
        {TOKEN.NO_HOLDER_DATA}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Table */}
      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-left min-w-[340px] text-sm">
          <thead>
            <tr className="border-b border-[var(--card-border)]">
              <th className="px-2 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-widest w-8">#</th>
              <th className="px-2 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Wallet</th>
              <th className="px-2 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-widest text-right">Amount</th>
              <th className="px-2 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-widest text-right">USD</th>
            </tr>
          </thead>
          <tbody>
            {pageHolders.map((holder, index) => {
              const addr = (holder.walletAddress || holder.address || '').trim();
              const balance = Number((holder as any).balance ?? 0);
              const usdValue = Number((holder as any).usdValue ?? (holder as any).balanceUsd ?? 0);
              const isCreator = addr.toLowerCase() === creatorAddrLower;
              const rank = startIdx + index + 1;

              return (
                <tr
                  key={`${addr}-${index}`}
                  className="border-b border-[var(--card-border)]/50 hover:bg-[var(--card-hover)]/50 transition-colors"
                >
                  <td className="px-2 py-2 text-xs text-gray-600 tabular-nums">
                    {rank}
                  </td>
                  <td className="px-2 py-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`${solscanBase}/account/${addr}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-[var(--primary)] transition-colors font-mono no-underline"
                        style={{ textDecoration: 'none' }}
                        title={addr}
                      >
                        {shortenAddress(addr)}
                      </a>
                      {isCreator && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[var(--primary)]/10 text-[var(--primary)]">
                          DEV
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-2 text-xs text-gray-300 text-right font-medium tabular-nums">
                    {formatCompactNumber(balance)}
                  </td>
                  <td className="px-2 py-2 text-xs text-gray-400 text-right tabular-nums">
                    {usdValue > 0 ? formatUSD(usdValue) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-4">
          <button
            onClick={() => onPageChange(safePage - 1)}
            disabled={safePage === 1}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[var(--card-hover)] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <ChevronLeft size={16} />
          </button>

          {generatePageNumbers(safePage, totalPages).map((page, i) =>
            page === '...' ? (
              <span key={`dots-${i}`} className="px-1 text-xs text-gray-600">...</span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page as number)}
                className={`min-w-[28px] h-7 rounded-lg text-xs font-medium transition-colors ${
                  safePage === page
                    ? 'bg-[var(--primary)] text-white'
                    : 'text-gray-400 hover:text-white hover:bg-[var(--card-hover)]'
                }`}
              >
                {page}
              </button>
            ),
          )}

          <button
            onClick={() => onPageChange(safePage + 1)}
            disabled={safePage === totalPages}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[var(--card-hover)] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

/** Generate smart page numbers with ellipsis */
function generatePageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | string)[] = [1];
  if (current > 3) pages.push('...');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push('...');
  pages.push(total);

  return pages;
}

export default TokenHolders;
