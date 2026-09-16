"use client";

import { useState } from "react";
import { money } from "@/lib/format";
import type { MonthlyPoint } from "@/lib/types";

export type SeriesKey = "collected" | "partnerShare" | "companyShare" | "payouts" | "expenses";
export interface Series {
  key: SeriesKey;
  label: string;
  color: string;
}

// Validated categorical pair (CVD-safe): indigo for company, amber for teachers.
export const CHART_COLORS = { company: "#4f46e5", partner: "#d97706" };

function niceCeil(v: number): number {
  if (v <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / exp;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return step * exp;
}

function compact(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(v % 1_000_000 ? 1 : 0)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(v % 1000 ? 1 : 0)}k`;
  return String(Math.round(v));
}

/** Rectangle with only the top corners rounded, anchored to the baseline. */
function topRounded(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.min(r, h / 2, w / 2);
  return `M${x},${y + h} V${y + rr} Q${x},${y} ${x + rr},${y} H${x + w - rr} Q${x + w},${y} ${x + w},${y + rr} V${y + h} Z`;
}

interface Props {
  data: MonthlyPoint[];
  series: Series[];
  height?: number;
}

export function MonthlyBars({ data, series, height = 220 }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 640;
  const H = height;
  const padL = 48;
  const padR = 12;
  const padT = 12;
  const padB = 26;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const totals = data.map((d) => series.reduce((s, sr) => s + d[sr.key], 0));
  const top = niceCeil(Math.max(1, ...totals));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * top);
  const slot = plotW / Math.max(1, data.length);
  const barW = Math.min(44, slot * 0.5);
  const y = (v: number) => padT + plotH - (v / top) * plotH;
  const GAP = 2;
  const active = hover !== null ? data[hover] : null;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Monthly breakdown chart">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke="#e2e8f0" strokeWidth={1} />
            <text x={padL - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill="#64748b">{compact(t)}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const x0 = padL + slot * i;
          const cx = x0 + slot / 2;
          const dim = hover !== null && hover !== i;
          let acc = 0;
          const segs = series.map((sr) => {
            const v = d[sr.key];
            const from = acc;
            acc += v;
            return { sr, v, from };
          });
          const visible = segs.filter((s) => s.v > 0);
          return (
            <g key={d.month} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={x0} y={padT} width={slot} height={plotH} fill="transparent" />
              {visible.map((s, idx) => {
                const isTop = idx === visible.length - 1;
                const yTop = y(s.from + s.v);
                const yBottom = y(s.from) - (idx > 0 ? GAP : 0);
                const h = Math.max(1, yBottom - yTop);
                const x = cx - barW / 2;
                return isTop ? (
                  <path key={s.sr.key} d={topRounded(x, yTop, barW, h, 4)} fill={s.sr.color} opacity={dim ? 0.45 : 1} />
                ) : (
                  <rect key={s.sr.key} x={x} y={yTop} width={barW} height={h} fill={s.sr.color} opacity={dim ? 0.45 : 1} />
                );
              })}
              <text x={cx} y={H - 8} textAnchor="middle" fontSize={11} fill={dim ? "#94a3b8" : "#475569"}>{d.label.split(" ")[0]}</text>
            </g>
          );
        })}
      </svg>

      {active && hover !== null && (
        <div
          className="pointer-events-none absolute top-2 z-10 min-w-[170px] rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-lg"
          style={{ left: `${Math.min(75, ((padL + slot * hover + slot / 2) / W) * 100)}%` }}
        >
          <p className="mb-1.5 font-semibold text-slate-900">{active.label}</p>
          {series.map((sr) => (
            <div key={sr.key} className="flex items-center justify-between gap-4 py-0.5">
              <span className="flex items-center gap-1.5 text-slate-500"><span className="h-2 w-2 rounded-sm" style={{ background: sr.color }} />{sr.label}</span>
              <span className="font-medium text-slate-900">{money(active[sr.key])}</span>
            </div>
          ))}
          {series.length > 1 && (
            <div className="mt-1 flex justify-between border-t border-slate-100 pt-1 font-medium text-slate-900">
              <span>Total</span><span>{money(totals[hover])}</span>
            </div>
          )}
        </div>
      )}

      {series.length > 1 && (
        <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-600">
          {series.map((sr) => (
            <span key={sr.key} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: sr.color }} />{sr.label}</span>
          ))}
        </div>
      )}
    </div>
  );
}
