// SwapPanel: Buy/Sell swap UI used on token detail page (both mobile & desktop)

import React, { useState } from 'react';
import { ArrowDownUp, Wallet, Zap } from 'lucide-react';

interface SwapPanelProps {
  fromToken: { symbol: string; amount: string };
  toToken: { symbol: string; amount: string };
  isSwapped: boolean;
  isCalculating: boolean;
  isTransacting: boolean;
  solBalance: string;
  tokenBalance: string;
  tokenSymbol: string;
  actionButtonText: string;
  slippagePct: number;
  onSwap: () => void;
  onFromAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onMaxClick: () => void;
  onAction: () => void;
  onSetSwapped: (v: boolean) => void;
}

const BUY_PRESETS = ['0.1', '0.5', '1'];
const SELL_PRESETS = ['25%', '50%', '100%'];

const SwapPanel: React.FC<SwapPanelProps> = ({
  fromToken,
  toToken,
  isSwapped,
  isCalculating,
  isTransacting,
  solBalance,
  tokenBalance,
  tokenSymbol,
  actionButtonText,
  slippagePct,
  onFromAmountChange,
  onMaxClick,
  onAction,
  onSetSwapped,
}) => {
  const isBuy = !isSwapped;
  const balance = isSwapped ? tokenBalance : solBalance;
  const fromSymbol = fromToken.symbol || (isBuy ? 'SOL' : tokenSymbol);
  const toSymbol = toToken.symbol || (isBuy ? tokenSymbol : 'SOL');
  const presets = isBuy ? BUY_PRESETS : SELL_PRESETS;

  const handlePreset = (val: string) => {
    if (val.endsWith('%')) {
      const pct = parseFloat(val) / 100;
      const bal = parseFloat(balance) || 0;
      const amount = (bal * pct).toString();
      onFromAmountChange({ target: { value: amount } } as React.ChangeEvent<HTMLInputElement>);
    } else {
      onFromAmountChange({ target: { value: val } } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  return (
    <div className="flex flex-col gap-3">

      {/* ── BUY / SELL toggle ── */}
      <div className="flex gap-1.5 bg-[var(--card2)] p-1 rounded-xl">
        <button
          onClick={() => onSetSwapped(false)}
          type="button"
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
            isBuy
              ? 'text-white shadow-md'
              : 'text-gray-500 hover:text-gray-300'
          }`}
          style={
            isBuy
              ? { backgroundImage: 'linear-gradient(135deg, var(--primary), var(--accent))' }
              : undefined
          }
        >
          BUY
        </button>
        <button
          onClick={() => onSetSwapped(true)}
          type="button"
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
            !isBuy
              ? 'text-white shadow-md'
              : 'text-gray-500 hover:text-gray-300'
          }`}
          style={
            !isBuy
              ? { backgroundImage: 'linear-gradient(135deg, #ef5350, #f87171)' }
              : undefined
          }
        >
          SELL
        </button>
      </div>

      {/* ── Input Card ── */}
      <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card2)] p-4">

        {/* Token label + Balance */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[var(--card)] flex items-center justify-center text-sm">
              {isBuy ? '◎' : '🪙'}
            </div>
            <span className="text-sm font-bold text-white">{fromSymbol}</span>
          </div>
          <button
            type="button"
            onClick={onMaxClick}
            disabled={isTransacting}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-[var(--primary)] transition-colors disabled:opacity-40"
          >
            <Wallet size={12} />
            <span className="tabular-nums">{balance}</span>
          </button>
        </div>

        {/* Amount input */}
        <input
          type="number"
          value={fromToken.amount}
          onChange={onFromAmountChange}
          disabled={isTransacting}
          placeholder="0.00"
          className="w-full bg-transparent text-center outline-none font-extrabold placeholder-gray-600 tabular-nums"
          style={{ fontSize: '2rem', lineHeight: 1.2, color: fromToken.amount ? 'var(--foreground)' : undefined }}
        />

        {/* Output preview */}
        <div className="flex items-center justify-center gap-1.5 mt-2 mb-3 min-h-[22px]">
          {isCalculating ? (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-[var(--primary)]/40 border-t-[var(--primary)] rounded-full animate-spin" />
              <span className="text-xs text-gray-500">Calculating...</span>
            </div>
          ) : toToken.amount ? (
            <>
              <ArrowDownUp size={12} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-300 tabular-nums">{toToken.amount}</span>
              <span className="text-sm text-gray-500">{toSymbol}</span>
            </>
          ) : (
            <span className="text-sm text-gray-600">Enter amount above</span>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-[var(--card-border)] mb-3" />

        {/* Preset buttons */}
        <div className="flex items-center gap-1.5">
          {presets.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => handlePreset(v)}
              disabled={isTransacting}
              className="flex-1 py-1.5 rounded-lg text-xs font-semibold border border-[var(--card-border)] bg-[var(--card)] hover:border-[var(--primary)]/40 hover:text-[var(--primary)] transition-all disabled:opacity-40"
            >
              {isBuy ? `${v} SOL` : v}
            </button>
          ))}
          {isBuy && (
            <button
              type="button"
              onClick={onMaxClick}
              disabled={isTransacting}
              className="flex-1 py-1.5 rounded-lg text-xs font-bold border border-[var(--card-border)] bg-[var(--card)] hover:border-[var(--primary)]/40 hover:text-[var(--primary)] transition-all disabled:opacity-40"
            >
              MAX
            </button>
          )}
        </div>
      </div>

      {/* ── Slippage info ── */}
      <div className="flex items-center justify-between px-1 text-[11px] text-gray-500">
        <div className="flex items-center gap-1">
          <Zap size={10} />
          <span>Slippage: {slippagePct}%</span>
        </div>
      </div>

      {/* ── Action Button ── */}
      <button
        onClick={onAction}
        disabled={!fromToken.amount || isCalculating || isTransacting}
        type="button"
        className="w-full py-3.5 rounded-xl text-sm font-extrabold tracking-wide disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
        style={{
          backgroundImage: isBuy
            ? 'linear-gradient(135deg, var(--primary), var(--accent))'
            : 'linear-gradient(135deg, #ef5350, #f87171)',
          color: '#fff',
          boxShadow: isBuy ? 'var(--shadow-soft)' : undefined,
        }}
      >
        {isTransacting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Processing...
          </span>
        ) : (
          actionButtonText
        )}
      </button>
    </div>
  );
};

export default SwapPanel;
