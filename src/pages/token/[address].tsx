// src/pages/token/[address].tsx — Token detail page (client-side rendered)
import React, { useState } from 'react';

import Layout from '@/components/layout/Layout';
import SEO from '@/components/seo/SEO';
import SpaceLoader from '@/components/ui/SpaceLoader';
import ShareButton from '@/components/ui/ShareButton';

import TradingViewChart from '@/components/charts/TradingViewChart';
import TransactionHistory from '@/components/TokenDetails/TransactionHistory';
import TokenHolders from '@/components/TokenDetails/TokenHolders';
import TokenInfo from '@/components/TokenDetails/TokenInfo';
import Chats from '@/components/TokenDetails/Chats';

import SwapPanel from '@/components/token/SwapPanel';

import { useTokenDetail } from '@/hooks/useTokenDetail';
import { COMMON } from '@/constants/ui-text';
import { useSwapTrading } from '@/hooks/useSwapTrading';

type TabKey = 'trades' | 'chat' | 'holders';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'trades', label: 'Trades' },
  { key: 'chat', label: 'Chat' },
  { key: 'holders', label: 'Holders' },
];

const TokenDetail: React.FC = () => {
  const {
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
  } = useTokenDetail(null);

  const swap = useSwapTrading({
    tokenAddr,
    tokenInfo,
    decimals,
    fetchLiquidity,
    onTradeSuccess: refresh,
  });

  const [activeTab, setActiveTab] = useState<TabKey>('trades');

  /* ── Loading skeleton or error ── */
  if (!tokenInfo) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {tokenError ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <p className="text-red-400 text-sm">{tokenError}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-lg text-sm border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 animate-pulse">
                <div className="space-y-4">
                  <div className="h-6 w-48 bg-[var(--card)] rounded-lg" />
                  <div className="h-[420px] bg-[var(--card)] rounded-2xl border border-[var(--card-border)]" />
                  <div className="h-[300px] bg-[var(--card)] rounded-2xl border border-[var(--card-border)]" />
                </div>
                <div className="space-y-4">
                  <div className="h-[220px] bg-[var(--card)] rounded-2xl border border-[var(--card-border)]" />
                  <div className="h-[280px] bg-[var(--card)] rounded-2xl border border-[var(--card-border)]" />
                </div>
              </div>
              <div className="flex justify-center mt-8">
                <SpaceLoader size="medium" label="Loading token data..." />
              </div>
            </>
          )}
        </div>
      </Layout>
    );
  }

  const swapPanelProps = {
    fromToken: swap.fromToken,
    toToken: swap.toToken,
    isSwapped: swap.isSwapped,
    isCalculating: swap.isCalculating,
    isTransacting: swap.isTransacting,
    solBalance: swap.solBalance,
    tokenBalance: swap.tokenBalance,
    tokenSymbol,
    actionButtonText: swap.actionButtonText,
    slippagePct: swap.slippagePct,
    onSwap: swap.handleSwap,
    onFromAmountChange: swap.handleFromAmountChange,
    onMaxClick: swap.handleMaxClick,
    onAction: swap.handleAction,
    onSetSwapped: swap.setIsSwapped,
  };

  return (
    <Layout>
      <SEO token={tokenInfo} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">

        {/* ══ MOBILE: Token Info + Swap above chart ══ */}
        <div className="lg:hidden space-y-4 mb-4">
          <TokenInfo
            tokenInfo={tokenInfo}
            showHeader
            refreshTrigger={refreshCounter}
            liquidityEvents={liquidityEvents}
          />
          <SwapPanel {...swapPanelProps} />
        </div>

        {/* ══ MAIN GRID ══ */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">

          {/* ── Left column: Chart + Tabs ── */}
          <div className="flex flex-col gap-5 min-w-0">

            {/* Chart header */}
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--foreground)] opacity-70 truncate">
                {tokenInfo.name || tokenInfo.symbol}
              </h2>
            </div>

            {/* Chart */}
            <TradingViewChart liquidityEvents={liquidityEvents} tokenInfo={tokenInfo} />

            {/* ── Tab Section ── */}
            <div className="card gradient-border p-4 flex-1">
              {/* Tab bar */}
              <div className="flex bg-[var(--card2)] rounded-xl p-1 mb-4">
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      activeTab === tab.key
                        ? 'text-white shadow-sm'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                    style={
                      activeTab === tab.key
                        ? { backgroundImage: 'linear-gradient(135deg, var(--primary), var(--accent))' }
                        : undefined
                    }
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="min-h-[300px]">
                {activeTab === 'trades' && (
                  <TransactionHistory tokenAddress={tokenAddr!} />
                )}

                {activeTab === 'chat' && (
                  <Chats tokenAddress={tokenAddr!} tokenInfo={tokenInfo as any} />
                )}

                {activeTab === 'holders' && (
                  <>
                    {holdersError && (
                      <div className="mb-3 px-1 text-sm text-red-400">
                        Failed to load holders: {holdersError}
                      </div>
                    )}

                    <TokenHolders
                      tokenHolders={[]}
                      currentPage={currentPage}
                      totalPages={1}
                      creatorAddress={tokenInfo.creatorAddress ?? ''}
                      tokenAddress={tokenAddr!}
                      onPageChange={setCurrentPage}
                      allHolders={holdersAll}
                    />

                    <div className="mt-4 flex items-center justify-center gap-3">
                      {holdersNextCursor && (
                        <button
                          type="button"
                          onClick={() => fetchHolders({ reset: false })}
                          disabled={holdersLoading}
                          className="px-5 py-2.5 rounded-xl text-sm border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] transition-colors disabled:opacity-50"
                        >
                          {holdersLoading ? COMMON.LOADING : COMMON.LOAD_MORE}
                        </button>
                      )}
                      {!holdersNextCursor && holdersAll.length > 0 && (
                        <p className="text-xs text-gray-500">All holders loaded</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ── Right column (desktop): Info + Swap ── */}
          <div className="hidden lg:flex lg:flex-col gap-5">
            <div className="card gradient-border p-5 space-y-5 sticky top-4">
              <TokenInfo
                tokenInfo={tokenInfo}
                showHeader
                refreshTrigger={refreshCounter}
                liquidityEvents={liquidityEvents}
              />
              <div className="border-t border-[var(--card-border)]" />
              <SwapPanel {...swapPanelProps} />
            </div>
          </div>
        </div>

        <ShareButton tokenInfo={tokenInfo} />
      </div>
    </Layout>
  );
};

export default TokenDetail;
