// pages/index.tsx — Home page (refactored: hooks + components extracted)
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import TokenList from '@/components/tokens/TokenList';
import HowItWorksPopup from '@/components/notifications/HowItWorksPopup';
import SpaceLoader from '@/components/ui/SpaceLoader';
import SEO from '@/components/seo/SEO';

import HomeToolbar from '@/components/home/HomeToolbar';

import { useTokenList } from '@/hooks/useTokenList';
import { useNewTokensStream } from '@/hooks/useNewTokensStream';

import { ActiveFilter, getMcap } from '@/utils/filterHelpers';
import type { SortOption } from '@/components/ui/SortOptions';

const TOKENS_PER_PAGE = 19;

const Home: React.FC = () => {
  const router = useRouter();

  // UI states
  const [sort, setSort] = useState<SortOption>('trending');
  const [searchQuery, setSearchQuery] = useState('');
  const [includeNsfw, setIncludeNsfw] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter | null>(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  // Hooks
  const {
    tokens, setTokens, hasMore, isLoading, isLoadingMore, error, fetchMore, resetCursor,
  } = useTokenList({ sort, searchQuery, includeNsfw, activeFilter });

  const { showNewTokens, setShowNewTokens, newTokensBuffer } = useNewTokensStream(setTokens);

  // Handlers
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    resetCursor();
  }, [resetCursor]);

  const handleSort = useCallback((option: SortOption) => {
    setSort(option);
    resetCursor();
    setSearchQuery('');
  }, [resetCursor]);

  const handleToggleNsfw = useCallback((value: boolean) => {
    setIncludeNsfw(value);
    resetCursor();
  }, [resetCursor]);

  const handleApplyFilter = useCallback((filter: ActiveFilter) => {
    setActiveFilter(filter);
    resetCursor();
  }, [resetCursor]);

  const handleClearFilter = useCallback(() => {
    setActiveFilter(null);
    resetCursor();
  }, [resetCursor]);

  // Derived filtered list
  const filteredTokens = useMemo(() => {
    let list = tokens?.data ?? [];
    if (!list.length) return [];

    if (activeFilter) {
      const { mcapMin, mcapMax } = activeFilter;
      list = list.filter((t: any) => {
        const mcap = getMcap(t);
        if (mcap < mcapMin || mcap > mcapMax) return false;

        // B. Curve % filter
        if (activeFilter.bcurveMin !== undefined || activeFilter.bcurveMax !== undefined) {
          const bcurve = Number(t?.bondingCurveProgress ?? t?.bcurve ?? 0);
          if (activeFilter.bcurveMin !== undefined && bcurve < activeFilter.bcurveMin) return false;
          if (activeFilter.bcurveMax !== undefined && bcurve > activeFilter.bcurveMax) return false;
        }

        // Holders filter
        if (activeFilter.holdersMin !== undefined || activeFilter.holdersMax !== undefined) {
          const holders = Number(t?.holdersCount ?? t?.holders ?? 0);
          if (activeFilter.holdersMin !== undefined && holders < activeFilter.holdersMin) return false;
          if (activeFilter.holdersMax !== undefined && holders > activeFilter.holdersMax) return false;
        }

        // Coin Age filter (minutes)
        if (activeFilter.coinAgeMin !== undefined || activeFilter.coinAgeMax !== undefined) {
          const createdAt = t?.createdAt ?? t?.created_at;
          if (createdAt) {
            const ageMinutes = (Date.now() - new Date(createdAt).getTime()) / 60_000;
            if (activeFilter.coinAgeMin !== undefined && ageMinutes < activeFilter.coinAgeMin) return false;
            if (activeFilter.coinAgeMax !== undefined && activeFilter.coinAgeMax > 0 && ageMinutes > activeFilter.coinAgeMax) return false;
          }
        }

        return true;
      });
    }

    return list;
  }, [tokens, activeFilter]);

  return (
    <Layout>
      <SEO
        title="Create and Trade Memecoins Easily"
        description="The best platform for launching and trading memecoins. Fair launch, anti-bot, community-driven."
        image="seo/home.jpg"
      />

      <HowItWorksPopup isVisible={showHowItWorks} onClose={() => setShowHowItWorks(false)} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-16">
        <div className="text-center mb-4">
          <HomeToolbar
            sort={sort}
            includeNsfw={includeNsfw}
            activeFilter={activeFilter}
            onSort={handleSort}
            onToggleNsfw={handleToggleNsfw}
            onApplyFilter={handleApplyFilter}
            onClearFilter={handleClearFilter}
            onSearch={handleSearch}
          />

          {/* Token List */}
          {isLoading ? (
            <div className="flex justify-center items-center mt-10">
              <SpaceLoader size="medium" />
            </div>
          ) : error ? (
            <div className="text-center text-[var(--primary)] text-xl mt-10">{error}</div>
          ) : (tokens?.data?.length ?? 0) > 0 ? (
            <TokenList
              tokens={filteredTokens}
              isEnded={sort === 'finalized'}
              sortType={sort}
              itemsPerPage={TOKENS_PER_PAGE}
              isFullList={false}
              pagination={{
                mode: 'cursor',
                hasMore,
                isLoadingMore,
                onLoadMore: fetchMore,
                autoLoad: false,
              }}
            />
          ) : (
            <div className="text-center text-[var(--primary)] text-xs mt-10">No tokens found matching your criteria.</div>
          )}
        </div>
      </div>

    </Layout>
  );
};

export default Home;
