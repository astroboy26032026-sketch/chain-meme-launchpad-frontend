# CosmoX — Solana Token Launchpad & Trading Platform

> A full-featured decentralized token launchpad built on **Solana**, enabling users to create, trade, and track tokens with real-time pricing, on-chain transactions, and community features.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Core Modules Deep Dive](#core-modules-deep-dive)
- [Real-Time System](#real-time-system)
- [Security](#security)
- [API Design](#api-design)
- [State Management](#state-management)
- [Performance Optimizations](#performance-optimizations)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Technical Highlights](#technical-highlights)

---

## Overview

CosmoX is a **Solana-based token launchpad** (similar to Pump.fun), designed as a complete production-ready web application. The platform enables users to:

- **Create custom SPL tokens** with metadata, logos, and social links
- **Trade tokens** via bonding curve mechanics with real-time price charts
- **Track portfolios** with transaction history, holder analytics, and market data
- **Earn rewards** through a gamified points system with Lucky Wheel spins
- **Engage communities** with per-token chat rooms and live activity feeds

The project demonstrates full-stack development including: **blockchain wallet integration**, **real-time WebSocket systems**, **responsive UI/UX**, and **scalable API architecture**.

---

## Key Features

### Token Creation & Management
- 3-step token creation flow: **Prepare Mint → On-chain Confirm → Finalize**
- IPFS image upload for token logos
- Editable token metadata (name, symbol, description, social links)
- Progress tracking to DEX graduation

### Trading Engine
- **Buy/Sell interface** with real-time price estimation (debounced)
- Configurable slippage tolerance
- Idempotency keys to prevent duplicate transactions
- Transaction signing via Phantom / Solflare wallets
- Polling-based transaction status tracking with timeout

### Real-Time Data (WebSocket)
- **Live price streaming** with automatic reconnection & exponential backoff
- Live trade notifications (buys/sells across all tokens)
- New token creation alerts
- Message queue buffering for offline periods (100-item max)

### Interactive Charts
- **TradingView-style OHLCV charts** powered by Lightweight Charts
- 6 timeframes: 1m, 5m, 15m, 1h, 4h, 1d
- 3 chart types: Candlestick, Line, Area
- Volume histogram overlay
- Auto-refresh every 15s + fullscreen mode

### Gamification & Rewards
- **Points system** with daily quests, trading missions, streak multipliers
- Tier progression (cosmic tiers)
- **Lucky Wheel** — HTML5 Canvas spin wheel with weighted prize distribution
- Claimable SOL rewards with on-chain settlement
- Real-time winner marquee

### Community
- Per-token **chat rooms** with cursor-based pagination
- Live activity feed with real-time transaction notifications
- Token holder leaderboards
- Social sharing (Twitter, Telegram, Discord)

### Events & Promotions
- Event management (live / upcoming status)
- Category filtering with animated tab navigation
- Event detail pages with rules, rewards, and participation

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **Next.js 14** | React framework — SSR, API routes, file-based routing |
| **TypeScript** | Type safety across the entire codebase |
| **Tailwind CSS** | Utility-first styling + CSS custom properties for theming |
| **Framer Motion** | Page transitions and micro-interactions |
| **Headless UI** | Accessible tab components |
| **Lightweight Charts** | High-performance financial charting (TradingView engine) |
| **React Query** | Server state management, caching, auto-refetch |
| **Axios** | HTTP client with interceptors, retry logic, auth headers |

### Blockchain
| Technology | Purpose |
|---|---|
| **@solana/web3.js** | Solana blockchain interaction |
| **@solana/wallet-adapter** | Multi-wallet support (Phantom, Solflare) |
| **VersionedTransaction** | Modern Solana transaction format |
| **SPL Token** | Solana Program Library token standard |

### Backend (Mock API)
| Technology | Purpose |
|---|---|
| **Express.js** | REST API server |
| **UUID** | Idempotency key generation |
| **CORS** | Cross-origin request handling |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (Browser)                      │
│                                                              │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌────────────┐│
│  │  Wallet   │  │  React    │  │  Charts  │  │   Toast    ││
│  │  Adapter  │  │  Query    │  │  Engine  │  │   System   ││
│  └─────┬─────┘  └─────┬─────┘  └────┬─────┘  └────────────┘│
│        │              │              │                        │
│  ┌─────┴──────────────┴──────────────┴──────────────────────┐│
│  │                  Custom Hooks Layer                        ││
│  │  useSwapTrading  · useTokenDetail  · useTokenPriceStream  ││
│  │  useTokenList    · useMarqueeTokens · useNewTokensStream  ││
│  └───────────────────────┬──────────────────────────────────┘│
└──────────────────────────┼───────────────────────────────────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
      ┌─────▼─────┐  ┌────▼────┐  ┌─────▼─────┐
      │  REST API  │  │  WSS    │  │  Solana   │
      │  (Axios)   │  │  Stream │  │  RPC      │
      │            │  │         │  │           │
      │ /api/proxy │  │ Price   │  │ Sign TX   │
      │  → Backend │  │ Trades  │  │ Send TX   │
      │            │  │ NewToken│  │ Confirm   │
      └────────────┘  └─────────┘  └───────────┘
```


```
┌────────────────────────────────────────────┐
│             React Query Cache              │
│  Token list · Trades · Holders · Points    │
│  • Stale-while-revalidate                  │
│  • Auto-refetch on window focus            │
│  • Invalidate on trade success             │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│           Component Local State            │
│  Form inputs · UI state · Filters · Tabs   │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│            Context Providers               │
│  WebSocketProvider · AuthProvider · Wallet  │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│             Ref-Based State                │
│  Chart series · WS connection · Request ID │
│  (Bypasses React render cycle)             │
└────────────────────────────────────────────┘
```

### Prerequisites

- **Node.js** >= 20
- **Phantom** or **Solflare** wallet extension

### Installation

```bash
# Install frontend
npm install

# Install mock API
cd mock-api-server && npm install && cd ..
```

### Development

```bash
# Terminal 1 — Mock API (http://localhost:4000)
cd mock-api-server && npm run dev

# Terminal 2 — Frontend (http://localhost:3000)
npm run dev
```

### Production

```bash
npm run build
npm start
```

---

## Environment Variables

Create `.env.local` in the root:

```env
# Solana
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com

# Backend API
NEXT_PUBLIC_API_BASE_URL=https://dev.cosmox.app

# WebSocket
NEXT_PUBLIC_WS_BASE_URL=wss://dev.cosmox.app/ws

# Frontend URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Explorer
NEXT_PUBLIC_SOLSCAN_URL=https://solscan.io

# DEX
NEXT_PUBLIC_DEX_SWAP_URL=https://raydium.io/swap
NEXT_PUBLIC_DEX_TARGET=100

# Domain
NEXT_PUBLIC_DOMAIN=cosmox.app
```

