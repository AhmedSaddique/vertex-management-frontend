"use client";

import { Pencil, Trash2 } from "lucide-react";
import { date, money } from "@/lib/format";
import type { TradingListResponse, TradingPayout } from "@/lib/types";
import { Card, CardHeader, TBody, TD, TH, THead, TR, Table } from "@/components/ui/display";

export function TradingTable({
  rows,
  onEdit,
  onDelete,
}: {
  rows: TradingPayout[];
  onEdit: (t: TradingPayout) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Table>
      <THead>
        <TR>
          <TH>Date</TH>
          <TH>Title</TH>
          <TH className="text-right">Amount</TH>
          <TH>Member shares</TH>
          <TH className="text-right">Company</TH>
          <TH>Note</TH>
          <TH />
        </TR>
      </THead>
      <TBody>
        {rows.map((t) => (
          <TR key={t.id}>
            <TD className="whitespace-nowrap">{date(t.occurredAt)}</TD>
            <TD className="font-medium text-slate-900">{t.title || "Trading payout"}</TD>
            <TD className="text-right font-medium text-slate-900">{money(t.amount)}</TD>
            <TD>
              <div className="flex flex-wrap gap-1">
                {t.shares.map((s) => (
                  <span key={s.partnerId} className="rounded bg-amber-50 px-1.5 py-0.5 text-xs text-amber-800">
                    {s.partnerName} {money(s.amount)}
                  </span>
                ))}
              </div>
            </TD>
            <TD className="text-right text-emerald-700">{money(t.companyShare)}</TD>
            <TD className="max-w-[200px] truncate text-slate-500">{t.note || "-"}</TD>
            <TD className="text-right">
              <div className="flex justify-end gap-1">
                <button className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" onClick={() => onEdit(t)} title="Edit">
                  <Pencil className="h-4 w-4" />
                </button>
                <button className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600" onClick={() => onDelete(t.id)} title="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}

/** Totals per member for the period shown, with the company line at the bottom. */
export function TradingByMember({ summary }: { summary: TradingListResponse["summary"] }) {
  return (
    <Card className="mt-6">
      <CardHeader title="Trading earnings by member" description="Total of every trading share in the selected period." />
      <Table>
        <THead>
          <TR>
            <TH>Member</TH>
            <TH className="text-right">Trading earnings</TH>
          </TR>
        </THead>
        <TBody>
          {summary.byPartner.map((p) => (
            <TR key={p.partnerId}>
              <TD className="font-medium text-slate-900">{p.partnerName}</TD>
              <TD className="text-right font-medium text-amber-700">{money(p.amount)}</TD>
            </TR>
          ))}
          <TR>
            <TD className="font-medium text-emerald-800">Company</TD>
            <TD className="text-right font-medium text-emerald-700">{money(summary.companyShare)}</TD>
          </TR>
        </TBody>
      </Table>
    </Card>
  );
}
