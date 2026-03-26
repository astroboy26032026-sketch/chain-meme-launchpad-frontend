import React from 'react';

export interface EventItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  status: 'live' | 'upcoming';
  startDate: string;
  endDate: string;
  participants: number;
  maxParticipants?: number;
  rewards: string[];
  rules: string[];
  tags: string[];
  joinRoute?: string | null;
}

export const MOCK_EVENTS: EventItem[] = [
  {
    id: 'evt_quest',
    title: 'Cosmic Quest',
    subtitle: 'Complete daily missions to earn Fuel points!',
    description: 'Log in daily, trade coins, and create new coins to earn Fuel points. Build streaks for bonus multipliers — 7-day streak gives 3x points! Fuel points can be converted to spin tickets for SOL rewards on the Lucky Wheel.',
    icon: <span className="text-2xl">🌠</span>,
    badge: 'LIVE',
    badgeColor: 'bg-green-500',
    status: 'live',
    startDate: '2026-03-01',
    endDate: '2026-06-30',
    participants: 12480,
    rewards: ['Login: 10 pts/day', 'Trade any coin: 20 pts', 'Create coin: 50 pts', '7-day streak: 3x multiplier', '30-day streak: 500 bonus pts'],
    rules: ['Connect wallet to participate', 'One claim per mission per day', 'Streak resets if you miss a day', 'Points convertible to spin tickets'],
    tags: ['Daily', 'Missions', 'Fuel'],
    joinRoute: 'points',
  },
  {
    id: 'evt_trading',
    title: 'Volume Showdown',
    subtitle: 'Top traders share a 500 SOL prize pool!',
    description: 'Compete on the weekly trading volume leaderboard. All buys and sells on CosmoX count toward your total. Top 100 traders share a 500 SOL prize pool. Track your rank in real-time on the leaderboard.',
    icon: <span className="text-2xl">🚀</span>,
    badge: 'HOT',
    badgeColor: 'bg-red-500',
    status: 'live',
    startDate: '2026-03-15',
    endDate: '2026-04-30',
    participants: 3210,
    rewards: ['1st Place: 100 SOL', '2nd Place: 50 SOL', '3rd Place: 25 SOL', 'Top 10: 15 SOL each', 'Top 100: 2 SOL each'],
    rules: ['Minimum 0.1 SOL per trade', 'Buy and sell both count', 'Wash trading = disqualification', 'Winners announced within 48h'],
    tags: ['Trading', 'Leaderboard', 'SOL Prizes'],
    joinRoute: 'points-trading',
  },
  {
    id: 'evt_meme',
    title: 'Coin Creator Contest',
    subtitle: 'Launch a coin and compete for prizes!',
    description: 'Create your own coin on CosmoX during the event period. The most popular coin by holder count and trading volume wins the grand prize. Bonus rewards for the most creative name and highest community votes.',
    icon: <span className="text-2xl">🪐</span>,
    badge: 'SOON',
    badgeColor: 'bg-yellow-500',
    status: 'upcoming',
    startDate: '2026-04-15',
    endDate: '2026-05-15',
    participants: 0,
    maxParticipants: 2000,
    rewards: ['Grand Prize: 200 SOL', 'Best Name: 50 SOL', 'Most Holders: 50 SOL', 'Community Vote: 30 SOL'],
    rules: ['Coin must be created during event', 'No NSFW content', 'Must have description and logo', 'Judging: holders + volume + votes'],
    tags: ['Creation', 'Contest', 'SOL Prizes'],
    joinRoute: null,
  },
  {
    id: 'evt_lucky_spin',
    title: 'Lucky Wheel Festival',
    subtitle: 'Spin for instant SOL prizes every day!',
    description: 'Use spin tickets earned from Fuel missions and trading to spin the Lucky Wheel. Win instant SOL prizes from 0.2 to 50 SOL! Daily bonus: your first spin each day has 2x chance for bigger prizes.',
    icon: <span className="text-2xl">🌌</span>,
    badge: 'SOON',
    badgeColor: 'bg-yellow-500',
    status: 'upcoming',
    startDate: '2026-04-20',
    endDate: '2026-06-20',
    participants: 0,
    rewards: ['Jackpot: 50 SOL', 'Grand: 10 SOL', 'Major: 5 SOL', 'Minor: 1 SOL', 'Base: 0.2 SOL'],
    rules: ['1 ticket per spin', 'Earn tickets from missions & trading', 'Prizes sent to wallet instantly', 'First spin daily: 2x big-prize chance'],
    tags: ['Spin', 'Instant Rewards', 'SOL'],
    joinRoute: 'reward',
  },
  {
    id: 'evt_referral',
    title: 'Referral Boost',
    subtitle: 'Invite friends, earn bonus Fuel for both!',
    description: 'Share your referral link with friends. When they connect their wallet and make their first trade, both of you earn 100 bonus Fuel points. Top referrers also earn exclusive multiplier badges for the season.',
    icon: <span className="text-2xl">⭐</span>,
    badge: 'SOON',
    badgeColor: 'bg-yellow-500',
    status: 'upcoming',
    startDate: '2026-05-01',
    endDate: '2026-06-30',
    participants: 0,
    rewards: ['Per referral: 100 pts each', 'Top 10 referrers: 2x season multiplier', 'Top 50: 1.5x season multiplier', 'All referrers: exclusive badge'],
    rules: ['Friend must connect wallet', 'Friend must complete 1 trade', 'Self-referral not allowed', 'Points credited within 24h'],
    tags: ['Referral', 'Bonus', 'Fuel'],
    joinRoute: null,
  },
];
