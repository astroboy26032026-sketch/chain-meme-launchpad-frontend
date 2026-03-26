import React from 'react';
import Layout from '@/components/layout/Layout';

const STEPS = [
  {
    num: '01',
    title: 'Create Your Token',
    desc: 'Pick a name, symbol, and upload a logo. Your token launches on-chain in seconds — no coding required.',
    icon: '🚀',
  },
  {
    num: '02',
    title: 'Bonding Curve Pricing',
    desc: 'Every token gets its own bonding curve. Price rises as people buy and falls when they sell — fully automatic.',
    icon: '📈',
  },
  {
    num: '03',
    title: 'Trade Instantly',
    desc: 'Buy and sell any token directly through the platform. Liquidity is always available — no order books needed.',
    icon: '⚡',
  },
  {
    num: '04',
    title: 'Graduate to DEX',
    desc: 'When a token hits its market-cap target, liquidity migrates to a Solana DEX for open trading.',
    icon: '🎓',
  },
];

const FEATURES = [
  {
    title: 'Fair Launch',
    desc: 'No presales, no insider allocations. Everyone buys on the same curve from the start.',
    icon: '⚖️',
  },
  {
    title: 'Instant Liquidity',
    desc: 'The bonding curve acts as an automated market maker — tokens can always be bought or sold.',
    icon: '💧',
  },
  {
    title: 'On-Chain & Transparent',
    desc: 'All trades, balances, and token creation happen on Solana. Every action is verifiable.',
    icon: '🔗',
  },
  {
    title: 'Low Fees',
    desc: "Solana's speed and low transaction costs mean you keep more of your gains.",
    icon: '💰',
  },
  {
    title: 'Community Driven',
    desc: 'Chat, promote, and earn points. The platform rewards active participation.',
    icon: '🤝',
  },
  {
    title: 'Earn Rewards',
    desc: 'Spin the wheel, collect points, and climb the leaderboard for bonus SOL rewards.',
    icon: '🎁',
  },
];

const AboutPage: React.FC = () => {
  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">

        {/* ── Hero ── */}
        <div className="text-center mb-14">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 tracking-tight">
            How CosmoX Works
          </h1>
          <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
            CosmoX lets anyone launch a token on Solana using a bonding-curve model.
            Fair pricing, instant liquidity, zero gatekeepers.
          </p>
        </div>

        {/* ── Steps ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {STEPS.map((s) => (
            <div
              key={s.num}
              className="relative rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-5 hover:border-[var(--primary)]/50 transition-colors group"
            >
              <span className="absolute top-3 right-4 text-[var(--primary)] text-xs font-bold opacity-40 group-hover:opacity-80 transition-opacity">
                {s.num}
              </span>
              <div className="text-2xl mb-3">{s.icon}</div>
              <h3 className="text-sm font-bold text-white mb-1.5">{s.title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* ── What is a Bonding Curve? ── */}
        <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6 sm:p-8 mb-16">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4">What is a Bonding Curve?</h2>
          <div className="text-sm text-gray-400 leading-relaxed space-y-3">
            <p>
              A bonding curve is a math formula that links a token&apos;s price to its circulating supply.
              When someone buys, the price goes up; when someone sells, the price goes down — all handled automatically by a smart contract.
            </p>
            <p>
              This means <span className="text-white font-medium">no order books</span>, <span className="text-white font-medium">no matching engines</span>, and <span className="text-white font-medium">no waiting for a counter-party</span>.
              Liquidity is baked into the curve itself, so you can always trade.
            </p>
            <p>
              Early buyers benefit from a lower entry price, while the curve protects the market from being drained in a single transaction.
              Once the token graduates (hits its cap), liquidity is seeded on a Solana DEX for broader access.
            </p>
          </div>
        </div>

        {/* ── Features Grid ── */}
        <div className="mb-14">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-6 text-center">Platform Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-5 hover:bg-[var(--card-hover)] transition-colors"
              >
                <div className="text-xl mb-2">{f.icon}</div>
                <h3 className="text-sm font-bold text-white mb-1">{f.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Quick FAQ inline ── */}
        <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6 sm:p-8">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-5">Common Questions</h2>
          <div className="space-y-4 text-sm">
            {[
              { q: 'Do I need coding skills?', a: 'No. Token creation is fully UI-driven — just fill in details and confirm.' },
              { q: 'What fees are there?', a: 'A small 1% fee on buys and sells helps sustain the platform and prevent spam.' },
              { q: 'Can I sell at any time?', a: 'Yes. The bonding curve guarantees liquidity, so you can exit your position whenever you want.' },
              { q: 'What happens after graduation?', a: 'Liquidity moves to a Solana DEX (e.g. Raydium) and the token trades freely on the open market.' },
            ].map((item, i) => (
              <div key={i}>
                <p className="text-white font-semibold mb-0.5">{item.q}</p>
                <p className="text-gray-400 text-xs leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-10">
          &copy; {new Date().getFullYear()} CosmoX &mdash; Built on Solana
        </p>
      </div>
    </Layout>
  );
};

export default AboutPage;
