// src/components/charts/TradingViewChart.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  createChart,
  CrosshairMode,
  IChartApi,
  ISeriesApi,
  Time,
  MouseEventParams,
  LineStyle,
} from 'lightweight-charts';
import SpaceLoader from '@/components/ui/SpaceLoader';
import { getTokenPrice } from '@/utils/api.index';
import { useTokenPriceStream } from '@/hooks/useTokenPriceStream';

/* ═══════════════════ TYPES ═══════════════════ */

type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
type ChartType = 'candle' | 'line' | 'area';

interface OhlcvPoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TradingViewChartProps {
  liquidityEvents?: any;
  tokenInfo: any;
}

/* ═══════════════════ CONSTANTS ═══════════════════ */

const TIMEFRAMES: Timeframe[] = ['1m', '5m', '15m', '1h', '4h', '1d'];
const DEFAULT_TF: Timeframe = '5m';
const CHART_H = 520;
const CHART_H_SM = 380;
const AUTO_REFRESH_MS = 15_000;

const TF_MIN: Record<Timeframe, number> = {
  '1m': 1, '5m': 5, '15m': 15, '1h': 60, '4h': 240, '1d': 1440,
};

const UP = '#26a69a';
const DN = '#ef5350';

/** Read a CSS custom property from :root (returns hex string for lightweight-charts) */
function cssVar(name: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

/** Lazily resolved theme colours — call inside useEffect / render so DOM is ready */
function getThemeColors() {
  return {
    bg:         cssVar('--card', '#222521'),
    bgAlt:      cssVar('--card2', '#2A2E29'),
    border:     cssVar('--card-border', '#3C322C'),
    text:       cssVar('--foreground', '#F3EFEA'),
    textMuted:  cssVar('--foreground', '#F3EFEA') + '99', // 60 % alpha fallback
    gridLine:   cssVar('--card2', '#2A2E29'),
    crosshair:  cssVar('--card-border', '#3C322C'),
  };
}

/* ═══════════════════ MATH HELPERS ═══════════════════ */

function fmtPrice(p: number): string {
  const a = Math.abs(p);
  if (a >= 1) return p.toFixed(4);
  if (a >= 0.1) return p.toFixed(5);
  if (a >= 0.01) return p.toFixed(6);
  if (a >= 0.001) return p.toFixed(7);
  return p.toFixed(8);
}


function enhanceSmall(data: OhlcvPoint[]): OhlcvPoint[] {
  const min = 1e-9;
  return data.map((d) => {
    if (Math.abs(d.open - d.close) < min) {
      const mid = (d.open + d.close) / 2, adj = min / 2;
      return { ...d, open: mid - adj, close: mid + adj, high: Math.max(d.high, mid + adj), low: Math.min(d.low, mid - adj) };
    }
    return d;
  });
}

function buildOhlcv(points: Array<{ timestamp: string; price: number }>, tfMin: number): OhlcvPoint[] {
  if (!points?.length) return [];
  const sorted = [...points].sort((a, b) => +new Date(a.timestamp) - +new Date(b.timestamp));
  const bucket = tfMin * 60;
  const map = new Map<number, number[]>();
  for (const pt of sorted) {
    const ts = Math.floor(+new Date(pt.timestamp) / 1000);
    const key = Math.floor(ts / bucket) * bucket;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(Number(pt.price));
  }
  const out: OhlcvPoint[] = [];
  let prevClose: number | null = null;
  for (const key of [...map.keys()].sort((a, b) => a - b)) {
    const pr = map.get(key)!;
    // Use previous candle's close as this candle's open (creates visible body even with 1 price per bucket)
    const o = prevClose ?? pr[0];
    const c = pr[pr.length - 1];
    const h = Math.max(o, ...pr);
    const l = Math.min(o, ...pr);
    out.push({ time: key, open: o, high: h, low: l, close: c, volume: pr.length * Math.abs(h - l || c * 0.001) });
    prevClose = c;
  }
  if (out.length === 1) out.push({ ...out[0], time: out[0].time + bucket });
  return enhanceSmall(out);
}


/* ═══════════════════ COMPONENT ═══════════════════ */

const TradingViewChart: React.FC<TradingViewChartProps> = ({ tokenInfo }) => {
  const tokenAddress = tokenInfo?.address as string | undefined;
  const tokenName = tokenInfo?.name || '';
  const tokenSymbol = tokenInfo?.symbol || '';

  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const lineRef = useRef<ISeriesApi<'Line'> | null>(null);
  const areaRef = useRef<ISeriesApi<'Area'> | null>(null);
  const volumeRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const ma7Ref = useRef<ISeriesApi<'Line'> | null>(null);
  const ma25Ref = useRef<ISeriesApi<'Line'> | null>(null);
  const ema9Ref = useRef<ISeriesApi<'Line'> | null>(null);
  const bollUpRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bollMidRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bollLoRef = useRef<ISeriesApi<'Line'> | null>(null);

  const [tf, setTf] = useState<Timeframe>(DEFAULT_TF);
  const [chartType, setChartType] = useState<ChartType>('candle');
  const [data, setData] = useState<OhlcvPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [legend, setLegend] = useState<OhlcvPoint | null>(null);
  const [isFS, setIsFS] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [chartH, setChartH] = useState(CHART_H);
  const reqIdRef = useRef(0);

  // responsive
  useEffect(() => {
    const u = () => setChartH(window.innerWidth < 640 ? CHART_H_SM : CHART_H);
    u(); window.addEventListener('resize', u); return () => window.removeEventListener('resize', u);
  }, []);

  /* ─── fetch with timeout ─── */
  const fetchChart = useCallback(async (silent = false) => {
    if (!tokenAddress) return;
    const myReq = ++reqIdRef.current;
    if (!silent) { setLoading(true); setErr(null); }
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);
      const res = await getTokenPrice(tokenAddress, tf);
      clearTimeout(timeout);
      if (myReq !== reqIdRef.current) return;
      setData(buildOhlcv(res?.chart ?? [], TF_MIN[tf]));
    } catch (e: any) {
      console.error('getTokenPrice failed:', e);
      if (myReq !== reqIdRef.current) return;
      if (!silent) { setErr(e?.name === 'AbortError' ? 'Timeout - retrying...' : 'Failed to load chart'); }
    } finally {
      if (myReq !== reqIdRef.current) return;
      if (!silent) setLoading(false);
    }
  }, [tokenAddress, tf]);

  useEffect(() => { fetchChart(); }, [fetchChart]);
  useEffect(() => {
    if (!autoRefresh || !tokenAddress) return;
    const id = setInterval(() => {
      if (!document.hidden) fetchChart(true);
    }, AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [autoRefresh, fetchChart, tokenAddress]);

  /* ─── WebSocket real-time price stream ─── */
  useTokenPriceStream(tokenAddress, (tick) => {
    const candle = candleRef.current;
    const vol = volumeRef.current;
    if (!candle || !vol) return;

    const ts = Math.floor(new Date(tick.timestamp).getTime() / 1000) as Time;
    const p = tick.price;

    // Update last candle in real-time (lightweight-charts merges by time)
    candle.update({ time: ts, open: p, high: p, low: p, close: p });

    if (tick.volume != null) {
      vol.update({ time: ts, value: tick.volume, color: 'rgba(38,166,154,0.25)' });
    }
  });

  /* ─── create main chart ─── */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const raf = requestAnimationFrame(() => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth || 600;
      const tc = getThemeColors();
      const chart = createChart(containerRef.current, {
        width: w, height: chartH,
        layout: { background: { color: tc.bg }, textColor: tc.textMuted },
        grid: { vertLines: { color: tc.gridLine }, horzLines: { color: tc.gridLine } },
        rightPriceScale: { borderColor: tc.border, visible: true, borderVisible: true, alignLabels: true, entireTextOnly: true, scaleMargins: { top: 0.08, bottom: 0.2 } },
        timeScale: { borderColor: tc.border, timeVisible: true, secondsVisible: false },
        crosshair: { mode: CrosshairMode.Normal, vertLine: { labelVisible: true, style: LineStyle.Solid, width: 1, color: tc.crosshair }, horzLine: { labelVisible: true, style: LineStyle.Solid, width: 1, color: tc.crosshair } },
      });

      const pf = { type: 'custom' as const, formatter: fmtPrice, minMove: 1e-9 };

      const candle = chart.addCandlestickSeries({ upColor: UP, downColor: DN, borderVisible: false, wickUpColor: UP, wickDownColor: DN });
      candle.applyOptions({ priceFormat: pf });
      const line = chart.addLineSeries({ color: UP, lineWidth: 2, priceLineVisible: false, lastValueVisible: false, visible: false });
      line.applyOptions({ priceFormat: pf });
      const area = chart.addAreaSeries({ topColor: 'rgba(38,166,154,0.3)', bottomColor: 'rgba(38,166,154,0.01)', lineColor: UP, lineWidth: 2, priceLineVisible: false, lastValueVisible: false, visible: false });
      area.applyOptions({ priceFormat: pf });
      const vol = chart.addHistogramSeries({ priceFormat: { type: 'volume' }, priceScaleId: '' });
      vol.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });

      const ma7 = chart.addLineSeries({ color: '#f59e0b', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
      const ma25 = chart.addLineSeries({ color: '#8b5cf6', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
      const ema9 = chart.addLineSeries({ color: '#3b82f6', lineWidth: 1, lineStyle: LineStyle.Dashed, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
      const bUp = chart.addLineSeries({ color: '#e879f9', lineWidth: 1, lineStyle: LineStyle.Dotted, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
      const bMid = chart.addLineSeries({ color: '#e879f9', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
      const bLo = chart.addLineSeries({ color: '#e879f9', lineWidth: 1, lineStyle: LineStyle.Dotted, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });

      chartRef.current = chart; candleRef.current = candle; lineRef.current = line; areaRef.current = area;
      volumeRef.current = vol; ma7Ref.current = ma7; ma25Ref.current = ma25; ema9Ref.current = ema9;
      bollUpRef.current = bUp; bollMidRef.current = bMid; bollLoRef.current = bLo;

      chart.subscribeCrosshairMove((param: MouseEventParams) => {
        if (!param.time || !param.seriesData) { setLegend(null); return; }
        const cd = param.seriesData.get(candle) as any;
        if (cd?.open != null) {
          const vd = param.seriesData.get(vol) as any;
          setLegend({ time: param.time as number, open: cd.open, high: cd.high, low: cd.low, close: cd.close, volume: vd?.value ?? 0 });
        } else {
          const ld = (param.seriesData.get(line) ?? param.seriesData.get(area)) as any;
          if (ld?.value != null) setLegend({ time: param.time as number, open: ld.value, high: ld.value, low: ld.value, close: ld.value, volume: 0 });
        }
      });

    });

    return () => {
      cancelAnimationFrame(raf);
      chartRef.current?.remove(); chartRef.current = null;
      candleRef.current = null; lineRef.current = null; areaRef.current = null; volumeRef.current = null;
      ma7Ref.current = null; ma25Ref.current = null; ema9Ref.current = null;
      bollUpRef.current = null; bollMidRef.current = null; bollLoRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { chartRef.current?.applyOptions({ height: chartH }); }, [chartH]);

  /* ─── update data ─── */
  useEffect(() => {
    const chart = chartRef.current, candle = candleRef.current, line = lineRef.current, area = areaRef.current, vol = volumeRef.current;
    if (!chart || !candle || !line || !area || !vol) return;
    if (data.length < 2) return;
    const sorted = [...data].sort((a, b) => a.time - b.time);
    const td = sorted.map((d) => ({ time: d.time as Time, open: d.open, high: d.high, low: d.low, close: d.close }));
    const ld = sorted.map((d) => ({ time: d.time as Time, value: d.close }));
    candle.applyOptions({ visible: chartType === 'candle' }); line.applyOptions({ visible: chartType === 'line' }); area.applyOptions({ visible: chartType === 'area' });
    candle.setData(td); line.setData(ld); area.setData(ld);
    vol.setData(sorted.map((d) => ({ time: d.time as Time, value: d.volume, color: d.close >= d.open ? 'rgba(38,166,154,0.25)' : 'rgba(239,83,80,0.25)' })));
    ma7Ref.current?.setData([]); ma25Ref.current?.setData([]); ema9Ref.current?.setData([]);
    bollUpRef.current?.setData([]); bollMidRef.current?.setData([]); bollLoRef.current?.setData([]);
    chart.timeScale().fitContent();
  }, [data, chartType]);

  /* ─── resize ─── */
  useEffect(() => {
    const el = containerRef.current; if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = containerRef.current?.clientWidth; if (!w || w <= 0) return;
      chartRef.current?.applyOptions({ width: w });
    });
    ro.observe(el); return () => ro.disconnect();
  }, []);

  /* ─── fullscreen ─── */
  const toggleFS = useCallback(() => {
    const el = wrapperRef.current; if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen?.().then(() => setIsFS(true)).catch(() => {});
    else document.exitFullscreen?.().then(() => setIsFS(false)).catch(() => {});
  }, []);
  useEffect(() => { const h = () => setIsFS(!!document.fullscreenElement); document.addEventListener('fullscreenchange', h); return () => document.removeEventListener('fullscreenchange', h); }, []);

  const last = data.length >= 2 ? data[data.length - 1] : null;
  const prev = data.length >= 2 ? data[data.length - 2] : null;
  const pct = last && prev && prev.close > 0 ? ((last.close - prev.close) / prev.close) * 100 : null;
  const dl = legend || last;

  /* ═════ RENDER ═════ */
  return (
    <div ref={wrapperRef} className={`w-full rounded-lg overflow-hidden ${isFS ? 'fixed inset-0 z-50 bg-[var(--card)]' : ''}`}>

      {/* ══ TOP HEADER BAR ══ */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--card2)] border-b border-[var(--card-border)] text-xs">
        <div className="flex items-center gap-2">
          {/* Timeframe selector */}
          {TIMEFRAMES.map((t) => (
            <button key={t} type="button" onClick={() => setTf(t)}
              className={`px-2 py-0.5 rounded transition-colors ${t === tf ? 'text-white bg-[var(--card-hover)]' : 'text-gray-500 hover:text-gray-300'}`}>
              {t}
            </button>
          ))}

          <span className="text-[var(--card-border)]">|</span>

          {/* Chart type icons */}
          <button type="button" onClick={() => setChartType('candle')} title="Candlestick"
            className={`p-1 rounded ${chartType === 'candle' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="7" y="1" width="2" height="14" rx="0.5"/><rect x="5" y="4" width="6" height="8" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2"/></svg>
          </button>
          <button type="button" onClick={() => setChartType('line')} title="Line"
            className={`p-1 rounded ${chartType === 'line' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="1,12 5,6 9,9 15,3"/></svg>
          </button>
          <button type="button" onClick={() => setChartType('area')} title="Area"
            className={`p-1 rounded ${chartType === 'area' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" opacity="0.3"><polygon points="1,12 5,6 9,9 15,3 15,14 1,14"/><polyline points="1,12 5,6 9,9 15,3" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="1"/></svg>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Auto refresh */}
          <button type="button" onClick={() => setAutoRefresh(!autoRefresh)} title={autoRefresh ? 'Live (15s)' : 'Paused'}
            className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-[#26a69a] animate-pulse' : 'bg-gray-600'}`} />

          {/* Fullscreen */}
          <button type="button" onClick={toggleFS} title="Fullscreen" className="text-gray-500 hover:text-gray-300 p-1">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="1,5 1,1 5,1"/><polyline points="9,1 13,1 13,5"/><polyline points="13,9 13,13 9,13"/><polyline points="5,13 1,13 1,9"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ══ OHLCV LEGEND (overlay on chart) ══ */}
      <div className="relative">
        {dl && data.length >= 2 && (
          <div className="absolute top-2 left-12 z-10 flex items-center gap-2 text-[11px] font-mono pointer-events-none">
            <span className="text-gray-300 font-semibold">{tokenName || tokenSymbol} · {tf}</span>
            <span className="text-gray-500">O</span><span className="text-white">{fmtPrice(dl.open)}</span>
            <span className="text-gray-500">H</span><span className="text-white">{fmtPrice(dl.high)}</span>
            <span className="text-gray-500">L</span><span className="text-white">{fmtPrice(dl.low)}</span>
            <span className="text-gray-500">C</span>
            <span className={dl.close >= dl.open ? 'text-[#26a69a]' : 'text-[#ef5350]'}>{fmtPrice(dl.close)}</span>
            {pct !== null && (
              <span className={pct >= 0 ? 'text-[#26a69a]' : 'text-[#ef5350]'}>
                ({pct >= 0 ? '+' : ''}{pct.toFixed(2)}%)
              </span>
            )}
          </div>
        )}

        {/* ══ CHART CONTAINER ══ */}
        <div className="relative" style={{ height: chartH }}>
          <div ref={containerRef} className="w-full h-full" />
          {(loading || data.length < 2) && (
            <div className="absolute inset-0 flex items-center justify-center bg-[var(--card)]/80">
              {loading ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-gray-500">Loading chart...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <p className="text-gray-400 text-sm">Not enough data to display chart</p>
                  {err && <p className="text-xs text-red-400 mt-2">{err}</p>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {err && !loading && <div className="text-xs text-red-400 mt-2 px-3">{err}</div>}
    </div>
  );
};

export default TradingViewChart;
