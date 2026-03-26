// HomeToolbar: Sort options, Filter button + dropdown, Search

import React, { useState, useRef, useEffect } from 'react';
import SortOptions, { SortOption } from '@/components/ui/SortOptions';
import FilterPanel, { PendingFilter, EMPTY_PENDING } from './FilterPanel';
import { ActiveFilter, parseAbbrev } from '@/utils/filterHelpers';
import SearchFilter from '@/components/ui/SearchFilter';

interface HomeToolbarProps {
  sort: SortOption;
  includeNsfw: boolean;
  activeFilter: ActiveFilter | null;
  onSort: (option: SortOption) => void;
  onToggleNsfw: (value: boolean) => void;
  onApplyFilter: (filter: ActiveFilter) => void;
  onClearFilter: () => void;
  onSearch: (query: string) => void;
}

function pendingToActive(p: PendingFilter): ActiveFilter {
  const num = (v: string, fallback: number) => {
    if (!v.trim()) return fallback;
    const parsed = parseAbbrev(v);
    return Number.isNaN(parsed) ? fallback : parsed;
  };
  return {
    mcapMin: num(p.mcapMin, 0),
    mcapMax: num(p.mcapMax, 50_000_000),
    volMin: 0,
    volMax: 500_000,
    bcurveMin: num(p.bcurveMin, 0),
    bcurveMax: num(p.bcurveMax, 100),
    holdersMin: num(p.holdersMin, 0),
    holdersMax: num(p.holdersMax, 100_000),
    coinAgeMin: num(p.coinAgeMin, 0),
    coinAgeMax: num(p.coinAgeMax, 525_600),
    onlyShow: p.onlyShow,
    doNotShow: p.doNotShow,
    includeNsfw: p.includeNsfw,
  };
}

const HomeToolbar: React.FC<HomeToolbarProps> = ({
  sort, includeNsfw, activeFilter,
  onSort, onToggleNsfw, onApplyFilter, onClearFilter, onSearch,
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [pending, setPending] = useState<PendingFilter>({ ...EMPTY_PENDING, includeNsfw });
  const filterRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isFilterOpen) return;
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isFilterOpen]);

  const handleApply = () => {
    const filter = pendingToActive(pending);
    onApplyFilter(filter);
    onToggleNsfw(filter.includeNsfw ?? false);
    setIsFilterOpen(false);
  };

  const handleReset = () => {
    setPending({ ...EMPTY_PENDING });
    onClearFilter();
    onToggleNsfw(false);
  };

  const hasActiveFilter = Boolean(activeFilter);

  return (
    <div className="mb-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <SortOptions onSort={onSort} currentSort={sort} />

        <div className="flex items-center gap-3 justify-center md:justify-end relative flex-wrap">
          <SearchFilter onSearch={onSearch} className="w-48 lg:w-56" />

          {/* Filter Button */}
          <div ref={filterRef} className="relative">
            <button
              onClick={() => setIsFilterOpen((v) => !v)}
              className={`px-3 py-2 rounded-md border border-[var(--card-border)] bg-[var(--card)] hover:shadow inline-flex items-center gap-2 text-sm ${
                hasActiveFilter ? 'ring-1 ring-[var(--primary)]' : ''
              }`}
              aria-expanded={isFilterOpen}
            >
              Filter
              <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-80">
                <path fill="currentColor" d="M3 5h18l-7 8v6l-4-2v-4z" />
              </svg>
              {hasActiveFilter && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[var(--primary)]" />
              )}
            </button>

            {isFilterOpen && (
              <FilterPanel
                pending={pending}
                setPending={setPending}
                onApply={handleApply}
                onReset={handleReset}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeToolbar;
