// src/components/TokenDetails/TokenInfo.tsx
import React, { useMemo, useState } from 'react';
import {
  ExternalLink,
  Copy,
  Globe,
  Twitter,
  Send as Telegram,
  Youtube,
  MessageCircle as Discord,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Image from 'next/image';
import { toastSuccess, toastError } from '@/utils/customToast';
import { formatTimestamp, shortenAddress, formatAddressV2 } from '@/utils/blockchainUtils';
import type { Token } from '@/interface/types';

/* ── Types ── */
interface TokenInfoProps {
  tokenInfo: Token & Record<string, any>;
  showHeader?: boolean;
  refreshTrigger?: number;
  liquidityEvents?: any;
}

/* ── Helpers ── */
const fmtNum = (n: number, digits = 4) => {
  const v = Number(n);
  if (!Number.isFinite(v)) return '0';
  return v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: digits });
};

const ensureHttp = (url?: string) => {
  const s = String(url ?? '').trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('//')) return `https:${s}`;
  return `https://${s}`;
};

const getAddr = (t: any): string =>
  String(t?.address ?? t?.tokenAddress ?? t?.mint ?? t?.token ?? '').trim();

const explorerUrl = (addr: string) => `https://solscan.io/account/${addr}`;

const copyToClipboard = async (text: string) => {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    toastSuccess('Copied!');
  } catch {
    toastError('Copy failed');
  }
};

/* ── Social icons config ── */
const SOCIALS = [
  { key: 'website', Icon: Globe },
  { key: 'twitter', Icon: Twitter },
  { key: 'telegram', Icon: Telegram },
  { key: 'discord', Icon: Discord },
  { key: 'youtube', Icon: Youtube },
] as const;

/* ══════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════ */
const TokenInfo: React.FC<TokenInfoProps> = ({ tokenInfo, showHeader = false }) => {
  const [showFullDesc, setShowFullDesc] = useState(false);

  const addr = useMemo(() => getAddr(tokenInfo), [tokenInfo]);
  const logo = tokenInfo?.logo || '/chats/noimg.svg';
  const name = tokenInfo?.name || tokenInfo?.symbol || 'Token';
  const description = tokenInfo?.description || '';
  const needsTruncation = description.length > 120;

  const progressPct = useMemo(() => {
    const v = Number(tokenInfo?.progressDex ?? 0);
    return Number.isFinite(v) && v > 0 ? Math.min(v, 100) : 0;
  }, [tokenInfo?.progressDex]);

  const marketCap =
    Number(tokenInfo?.marketCap ?? tokenInfo?.mcapUsd ?? tokenInfo?.marketcapUsd ?? tokenInfo?.marketCapUsd ?? 0) || 0;

  const socials = useMemo(
    () =>
      SOCIALS.map(({ key, Icon }) => ({
        key,
        Icon,
        href: ensureHttp((tokenInfo as any)?.[key]),
      })).filter((s) => s.href),
    [tokenInfo],
  );

  /* ── Stat grid ── */
  const StatGrid = () => (
    <div className="grid grid-cols-2 gap-3">
      <StatCard
        label="Contract"
        value={addr ? formatAddressV2(addr) : '—'}
        link={addr ? explorerUrl(addr) : undefined}
        copyValue={addr}
      />
      <StatCard
        label="Deployer"
        value={tokenInfo?.creatorAddress ? shortenAddress(tokenInfo.creatorAddress) : '—'}
        link={tokenInfo?.creatorAddress ? explorerUrl(tokenInfo.creatorAddress) : undefined}
        copyValue={tokenInfo?.creatorAddress}
      />
      <StatCard
        label="Created"
        value={tokenInfo?.createdAt ? formatTimestamp(tokenInfo.createdAt as any) : '—'}
      />
      <StatCard
        label="Market Cap"
        value={marketCap > 0 ? `$${fmtNum(marketCap, 2)}` : '—'}
      />
    </div>
  );

  if (!showHeader) return <StatGrid />;

  return (
    <div className="space-y-4">
      {/* ── Header: Logo + Name + Socials ── */}
      <div className="flex items-start gap-4">
        {/* Logo */}
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-xl overflow-hidden bg-[var(--card2)]">
          <Image src={logo} alt={name} fill className="object-cover" sizes="80px" />
        </div>

        {/* Name & meta */}
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-white truncate">{name}</h1>
          {tokenInfo?.symbol && (
            <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[var(--primary)]/15 text-[var(--primary)]">
              ${tokenInfo.symbol}
            </span>
          )}

          {/* Social links inline */}
          {socials.length > 0 && (
            <div className="flex gap-2.5 mt-2.5">
              {socials.map(({ key, Icon, href }) => (
                <a
                  key={key}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-[var(--primary)] transition-colors"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Description ── */}
      {description && (
        <div className="text-sm text-gray-400 leading-relaxed">
          <p>
            {showFullDesc || !needsTruncation
              ? description
              : `${description.slice(0, 120)}...`}
          </p>
          {needsTruncation && (
            <button
              type="button"
              onClick={() => setShowFullDesc((p) => !p)}
              className="mt-1 text-xs text-[var(--primary)] hover:underline flex items-center gap-0.5"
            >
              {showFullDesc ? (
                <>Show less <ChevronUp size={12} /></>
              ) : (
                <>Read more <ChevronDown size={12} /></>
              )}
            </button>
          )}
        </div>
      )}

      {/* ── Progress to DEX ── */}
      <div className="bg-[var(--card2)] p-3.5 rounded-xl border border-[var(--card-border)]">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400 font-medium">Progress to DEX</span>
          <span className="text-white font-semibold tabular-nums">
            {progressPct % 1 === 0 ? `${progressPct}%` : `${progressPct.toFixed(2)}%`}
          </span>
        </div>
        <div className="w-full bg-[var(--card-border)]/40 rounded-full h-2 overflow-hidden">
          <div
            className="h-2 rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${Math.max(progressPct, 1)}%`,
              backgroundImage: 'linear-gradient(90deg, var(--primary), var(--accent))',
            }}
          />
        </div>
      </div>

      {/* ── Stats ── */}
      <StatGrid />
    </div>
  );
};

/* ── Stat Card sub-component ── */
const StatCard: React.FC<{
  label: string;
  value?: string;
  link?: string;
  copyValue?: string;
}> = ({ label, value, link, copyValue }) => (
  <div className="bg-[var(--card2)] p-3 rounded-xl border border-[var(--card-border)]">
    <div className="text-[11px] text-gray-500 mb-1 uppercase tracking-wide">{label}</div>
    <div className="text-sm text-white flex items-center gap-1.5 min-w-0">
      {link ? (
        <>
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--primary)] transition-colors flex items-center gap-1 truncate"
          >
            <span className="truncate">{value}</span>
            <ExternalLink size={11} className="flex-shrink-0 opacity-50" />
          </a>
          {copyValue && (
            <button
              onClick={() => copyToClipboard(copyValue)}
              className="text-gray-500 hover:text-[var(--primary)] transition-colors flex-shrink-0"
              title="Copy"
              type="button"
            >
              <Copy size={11} />
            </button>
          )}
        </>
      ) : (
        <span className="truncate">{value}</span>
      )}
    </div>
  </div>
);

export default TokenInfo;
