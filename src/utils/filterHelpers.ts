// Filter/sort helpers for home page token filtering

import type { SortOption } from '@/components/ui/SortOptions';
import type { TokenCategory } from '@/utils/api';

export const FILTER_DEFAULTS = {
  mcapMin: 0,
  mcapMax: 50_000_000,
  volMin: 0,
  volMax: 500_000,
  bcurveMin: 0,
  bcurveMax: 100,
  holdersMin: 0,
  holdersMax: 100_000,
  coinAgeMin: 0,
  coinAgeMax: 525_600, // 1 year in minutes
};

export const ONLY_SHOW_OPTIONS = [
  { value: 'graduated', label: 'Graduated' },
  { value: 'with_socials', label: 'With Socials' },
  { value: 'verified', label: 'Verified' },
] as const;

export const DO_NOT_SHOW_OPTIONS = [
  { value: 'rugged', label: 'Rugged' },
  { value: 'nsfw', label: 'NSFW' },
  { value: 'no_socials', label: 'No Socials' },
] as const;

export type ActiveFilter = {
  mcapMin: number;
  mcapMax: number;
  volMin: number;
  volMax: number;
  // New filter fields
  bcurveMin?: number;
  bcurveMax?: number;
  holdersMin?: number;
  holdersMax?: number;
  coinAgeMin?: number;
  coinAgeMax?: number;
  onlyShow?: string[];
  doNotShow?: string[];
  includeNsfw?: boolean;
};

export const parseAbbrev = (s: string | number | null | undefined): number => {
  if (s === null || s === undefined) return NaN;
  if (typeof s === 'number') return s;

  const raw = String(s).trim().toLowerCase().replace(/[\$,]/g, '');
  if (!raw) return NaN;

  const multiplier = raw.endsWith('k') ? 1e3 : raw.endsWith('m') ? 1e6 : raw.endsWith('b') ? 1e9 : 1;
  const num = parseFloat(raw.replace(/[kmb]$/i, ''));
  return Number.isNaN(num) ? NaN : num * multiplier;
};

export const fmtAbbrev = (n: number): string =>
  n >= 1e9
    ? `$${(n / 1e9).toFixed(1)}B`
    : n >= 1e6
      ? `$${(n / 1e6).toFixed(1)}M`
      : n >= 1e3
        ? `$${(n / 1e3).toFixed(1)}K`
        : `$${Math.max(0, Math.floor(n))}`;

export const getMcap = (t: any): number =>
  Number(
    t?.mcapUsd ??
      t?.marketcapUsd ??
      t?.marketCapUsd ??
      t?.marketcap ??
      t?.marketCap ??
      t?.mcap ??
      t?.mc ??
      0
  );

export const getVol24h = (t: any): number =>
  Number(t?.vol24hUsd ?? t?.volume24hUsd ?? t?.volume24h ?? t?.vol24h ?? t?.vol ?? 0);

export const mapSortToCategory = (sort: SortOption): TokenCategory => {
  switch (sort) {
    case 'trending':
      return 'trending';
    case 'marketcap':
      return 'marketcap';
    case 'new':
      return 'new';
    case 'finalized':
      return 'finalized';
    default:
      return 'trending';
  }
};
