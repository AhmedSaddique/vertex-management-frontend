"use client";

import { percent as pct } from "@/lib/format";
import type { Partner } from "@/lib/types";
import { Input } from "@/components/ui/form";

export interface ShareValue {
  partnerId: string;
  percent: string;
}

interface Props {
  partners: Partner[];
  value: ShareValue[];
  onChange: (next: ShareValue[]) => void;
}

export function sharesTotal(value: ShareValue[]): number {
  return Math.round(value.reduce((s, v) => s + (Number(v.percent) || 0), 0) * 100) / 100;
}

/** One percentage per partner; whatever is left over is the company share. */
export function ShareSplitEditor({ partners, value, onChange }: Props) {
  const total = sharesTotal(value);
  const company = Math.round((100 - total) * 100) / 100;
  const over = total > 100;
  const visible = partners.filter((p) => p.isActive || value.some((v) => v.partnerId === p.id && Number(v.percent) > 0));

  const setPercent = (partnerId: string, next: string) => {
    const others = value.filter((v) => v.partnerId !== partnerId);
    onChange([...others, { partnerId, percent: next }]);
  };

  return (
    <div className="space-y-2">
      {visible.map((p) => {
        const current = value.find((v) => v.partnerId === p.id)?.percent ?? "";
        return (
          <div key={p.id} className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">{p.name}</p>
              <p className="text-xs text-slate-500">{p.kind === "TEACHER" ? "Teacher" : "Management"}{!p.isActive ? " · inactive" : ""}</p>
            </div>
            <div className="relative w-28">
              <Input type="number" min={0} max={100} step="0.5" value={current} onChange={(e) => setPercent(p.id, e.target.value)} placeholder="0" className="pr-7 text-right" />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">%</span>
            </div>
          </div>
        );
      })}
      {visible.length === 0 && <p className="text-sm text-slate-500">No partners yet. Add teachers first.</p>}
      <div className={`mt-2 flex items-center justify-between rounded-lg px-3 py-2 text-sm ${over ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-800"}`}>
        <span className="font-medium">Company share</span>
        <span className="font-semibold">{over ? `Partners exceed 100% (${pct(total)})` : pct(company)}</span>
      </div>
    </div>
  );
}
