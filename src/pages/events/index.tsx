import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import SEO from '@/components/seo/SEO';
import { useWallet } from '@solana/wallet-adapter-react';
import { toastError } from '@/utils/customToast';
import { MOCK_EVENTS, EventItem } from '@/data/events';

/* =========================
   Category tabs
========================= */
type EventCategory = 'all' | 'live' | 'upcoming';

const TABS: { key: EventCategory; emoji: string; label: string }[] = [
  { key: 'all',      emoji: '🧭', label: 'DISCOVER' },
  { key: 'live',     emoji: '🔥', label: 'LIVE' },
  { key: 'upcoming', emoji: '✨', label: 'UPCOMING' },
];

function daysLeft(end: string) {
  const diff = new Date(end).getTime() - Date.now();
  if (diff <= 0) return 'Ended';
  const d = Math.ceil(diff / 86_400_000);
  return `${d}d left`;
}

export default function EventsListPage() {
  const router = useRouter();
  const { publicKey } = useWallet();
  const address = publicKey?.toBase58();
  const [category, setCategory] = useState<EventCategory>('all');

  const filtered = useMemo(() => {
    if (category === 'all') return MOCK_EVENTS;
    return MOCK_EVENTS.filter((e) => e.status === category);
  }, [category]);

  const handleJoin = (event: EventItem) => {
    if (!event.joinRoute) {
      router.push(`/events/${event.id}`);
      return;
    }
    const route = event.joinRoute;
    if (route === 'points' || route === 'points-trading') {
      if (!address) { toastError('Please connect your wallet first'); return; }
      router.push(`/point/${address}${route === 'points-trading' ? '?tab=trading' : ''}`);
    } else if (route === 'reward') {
      if (!address) { toastError('Please connect your wallet first'); return; }
      router.push(`/reward/${address}`);
    }
  };

  return (
    <Layout>
      <SEO title="Promote" description="Events, challenges & promotions on CosmoX" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-center mb-6">Promote</h1>

        {/* Category tabs */}
        <div className="flex items-end gap-0 border-b border-[var(--card-border)] mb-6">
          {TABS.map(({ key, emoji, label }) => {
            const isActive = key === category;
            return (
              <button
                key={key}
                onClick={() => setCategory(key)}
                className={`
                  relative flex items-center gap-1.5 px-4 py-2.5
                  text-sm font-extrabold tracking-wide
                  transition-colors duration-200 whitespace-nowrap
                  focus:outline-none
                  ${isActive
                    ? 'text-[var(--primary)]'
                    : 'text-[var(--foreground)]/50 hover:text-[var(--foreground)]/80'}
                `}
              >
                <span className="text-base leading-none">{emoji}</span>
                <span>{label}</span>
                {isActive && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t-full"
                    style={{ background: 'linear-gradient(90deg, var(--primary), var(--accent))' }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Events grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((event) => (
              <div
                key={event.id}
                onClick={() => router.push(`/events/${event.id}`)}
                className={`rounded-2xl border bg-[var(--card)] p-5 cursor-pointer hover:border-[var(--primary)]/40 transition-colors group ${
                  event.status === 'live'
                    ? 'border-green-500/40 border-l-4 border-l-green-500'
                    : 'border-yellow-500/30 border-l-4 border-l-yellow-500'
                }`}
              >
                {/* Badge */}
                {event.badge && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        event.status === 'live' ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'
                      }`}
                    />
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wider text-white ${event.badgeColor}`}
                    >
                      {event.badge}
                    </span>
                  </div>
                )}

                {/* Title row: icon + title */}
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(var(--primary-rgb,124,111,255),0.12)' }}>
                    {event.icon}
                  </div>
                  <h3 className="text-sm font-bold text-white truncate group-hover:text-[var(--primary)] transition-colors flex-1 min-w-0">
                    {event.title}
                  </h3>
                </div>
                <p className="text-xs text-gray-400 line-clamp-2 mb-2">{event.subtitle}</p>

                <div className="text-[10px] text-gray-500">
                  {event.status === 'live'
                    ? `${event.participants.toLocaleString()} joined · ${daysLeft(event.endDate)}`
                    : `Starts ${new Date(event.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
                  }
                </div>

                <div className="flex flex-wrap gap-1.5 mt-3">
                  {event.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] font-semibold border border-[var(--card-border)] text-gray-400">
                      {tag}
                    </span>
                  ))}
                </div>

                {event.status === 'live' && event.joinRoute && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleJoin(event); }}
                    className="btn btn-primary w-full mt-3 py-2 text-xs font-bold"
                  >
                    Join Now
                  </button>
                )}
              </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">No events in this category</div>
        )}
      </div>
    </Layout>
  );
}
