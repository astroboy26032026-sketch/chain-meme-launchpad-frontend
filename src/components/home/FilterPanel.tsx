// FilterPanel: Advanced filter dropdown for home page
// Fields: B. Curve %, Market Cap $, Holders, Coin Age (mins), Only Show, Do not show, NSFW toggle

import React from 'react';
import { FILTER_DEFAULTS, ONLY_SHOW_OPTIONS, DO_NOT_SHOW_OPTIONS } from '@/utils/filterHelpers';

export interface PendingFilter {
  mcapMin: string;
  mcapMax: string;
  bcurveMin: string;
  bcurveMax: string;
  holdersMin: string;
  holdersMax: string;
  coinAgeMin: string;
  coinAgeMax: string;
  onlyShow: string[];
  doNotShow: string[];
  includeNsfw: boolean;
}

export const EMPTY_PENDING: PendingFilter = {
  mcapMin: '',
  mcapMax: '',
  bcurveMin: '',
  bcurveMax: '',
  holdersMin: '',
  holdersMax: '',
  coinAgeMin: '',
  coinAgeMax: '',
  onlyShow: [],
  doNotShow: [],
  includeNsfw: false,
};

interface FilterPanelProps {
  pending: PendingFilter;
  setPending: React.Dispatch<React.SetStateAction<PendingFilter>>;
  onApply: () => void;
  onReset: () => void;
}

const inputClass =
  'w-full px-3 py-2 rounded-lg bg-[var(--card2)] border border-[var(--card-border)] text-sm text-[var(--foreground)] placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50 transition-colors';

const labelClass = 'text-xs font-semibold text-gray-400 uppercase tracking-wide';

interface RangeRowProps {
  label: string;
  suffix?: string;
  minValue: string;
  maxValue: string;
  minPlaceholder?: string;
  maxPlaceholder?: string;
  onMinChange: (v: string) => void;
  onMaxChange: (v: string) => void;
}

const RangeRow: React.FC<RangeRowProps> = ({
  label, suffix, minValue, maxValue, minPlaceholder = 'Min', maxPlaceholder = 'Max',
  onMinChange, onMaxChange,
}) => (
  <div>
    <div className="flex items-center gap-1.5 mb-2">
      <span className={labelClass}>{label}</span>
      {suffix && <span className="text-[10px] text-gray-500">{suffix}</span>}
    </div>
    <div className="grid grid-cols-2 gap-2">
      <input
        type="text"
        inputMode="numeric"
        value={minValue}
        onChange={(e) => onMinChange(e.target.value)}
        placeholder={minPlaceholder}
        className={inputClass}
        aria-label={`${label} minimum`}
      />
      <input
        type="text"
        inputMode="numeric"
        value={maxValue}
        onChange={(e) => onMaxChange(e.target.value)}
        placeholder={maxPlaceholder}
        className={inputClass}
        aria-label={`${label} maximum`}
      />
    </div>
  </div>
);

interface CheckboxGroupProps {
  label: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  selected: string[];
  onChange: (selected: string[]) => void;
}

const CheckboxGroup: React.FC<CheckboxGroupProps> = ({ label, options, selected, onChange }) => (
  <div>
    <div className={`${labelClass} mb-2`}>{label}</div>
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isActive = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() =>
              onChange(
                isActive
                  ? selected.filter((v) => v !== opt.value)
                  : [...selected, opt.value]
              )
            }
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              isActive
                ? 'bg-[var(--primary)] text-black border-[var(--primary)]'
                : 'bg-[var(--card2)] text-gray-400 border-[var(--card-border)] hover:border-gray-500'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  </div>
);

const FilterPanel: React.FC<FilterPanelProps> = ({ pending, setPending, onApply, onReset }) => {
  return (
    <div className="absolute top-10 right-0 z-40 w-[calc(100vw-2rem)] sm:w-[420px] rounded-2xl border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-[var(--card-border)] flex items-center justify-between">
        <span className="font-semibold text-sm">Filters</span>
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-gray-500 hover:text-[var(--primary)] transition-colors uppercase tracking-wider font-semibold"
        >
          RESET
        </button>
      </div>

      <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
        {/* B. Curve % */}
        <RangeRow
          label="B. Curve"
          suffix="%"
          minValue={pending.bcurveMin}
          maxValue={pending.bcurveMax}
          minPlaceholder="0"
          maxPlaceholder="100"
          onMinChange={(v) => setPending((p) => ({ ...p, bcurveMin: v }))}
          onMaxChange={(v) => setPending((p) => ({ ...p, bcurveMax: v }))}
        />

        {/* Market Cap $ */}
        <RangeRow
          label="Market Cap"
          suffix="$"
          minValue={pending.mcapMin}
          maxValue={pending.mcapMax}
          minPlaceholder="e.g. 1000"
          maxPlaceholder="e.g. 50000000"
          onMinChange={(v) => setPending((p) => ({ ...p, mcapMin: v }))}
          onMaxChange={(v) => setPending((p) => ({ ...p, mcapMax: v }))}
        />

        {/* Holders */}
        <RangeRow
          label="Holders"
          minValue={pending.holdersMin}
          maxValue={pending.holdersMax}
          minPlaceholder="0"
          maxPlaceholder="100000"
          onMinChange={(v) => setPending((p) => ({ ...p, holdersMin: v }))}
          onMaxChange={(v) => setPending((p) => ({ ...p, holdersMax: v }))}
        />

        {/* Coin Age (mins) */}
        <RangeRow
          label="Coin Age"
          suffix="mins"
          minValue={pending.coinAgeMin}
          maxValue={pending.coinAgeMax}
          minPlaceholder="0"
          maxPlaceholder="e.g. 1440"
          onMinChange={(v) => setPending((p) => ({ ...p, coinAgeMin: v }))}
          onMaxChange={(v) => setPending((p) => ({ ...p, coinAgeMax: v }))}
        />

        {/* Divider */}
        <div className="border-t border-[var(--card-border)]" />

        {/* Only Show */}
        <CheckboxGroup
          label="Only Show"
          options={ONLY_SHOW_OPTIONS}
          selected={pending.onlyShow}
          onChange={(v) => setPending((p) => ({ ...p, onlyShow: v }))}
        />

        {/* Do not show */}
        <CheckboxGroup
          label="Do not show"
          options={DO_NOT_SHOW_OPTIONS}
          selected={pending.doNotShow}
          onChange={(v) => setPending((p) => ({ ...p, doNotShow: v }))}
        />

        {/* Divider */}
        <div className="border-t border-[var(--card-border)]" />

        {/* NSFW Toggle */}
        <div className="flex items-center justify-between">
          <span className={labelClass}>NSFW</span>
          <button
            type="button"
            onClick={() => setPending((p) => ({ ...p, includeNsfw: !p.includeNsfw }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              pending.includeNsfw ? 'bg-[var(--primary)]' : 'bg-[var(--card-border)]'
            }`}
            role="switch"
            aria-checked={pending.includeNsfw}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                pending.includeNsfw ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Apply All Button */}
      <div className="px-5 py-4 border-t border-[var(--card-border)]">
        <button
          type="button"
          onClick={onApply}
          className="w-full py-2.5 rounded-xl bg-[var(--primary)] text-black font-bold text-sm uppercase tracking-wider hover:opacity-90 transition-opacity"
        >
          APPLY ALL
        </button>
      </div>
    </div>
  );
};

export default FilterPanel;
