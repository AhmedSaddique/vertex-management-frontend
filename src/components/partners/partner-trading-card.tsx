"use client";

import { date, money, percent } from "@/lib/format";
import type { PartnerTradingRow } from "@/lib/types";
import { Card, CardHeader, EmptyState, TBody, TD, TH, THead, TR, Table } from "@/components/ui/display";

/** Trading payouts this member has a share of. */
export function PartnerTradingCard({ rows }: { rows: PartnerTradingRow[] }) {
  return (
    <Card>
      <CardHeader title="Trading earnings" description="Share of the academy's trading income." />
      {rows.length === 0 ? (
        <EmptyState title="No trading payouts yet" />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Date</TH>
              <TH>Payout</TH>
              <TH className="text-right">Total</TH>
              <TH className="text-right">Your share</TH>
            </TR>
          </THead>
          <TBody>
            {rows.map((t) => (
              <TR key={t.id}>
                <TD className="whitespace-nowrap">{date(t.occurredAt)}</TD>
                <TD className="text-slate-900">{t.title || "Trading payout"}</TD>
                <TD className="text-right text-slate-600">{money(t.total)}</TD>
                <TD className="text-right font-medium text-amber-700">
                  {money(t.share)} <span className="text-xs font-normal text-slate-400">({percent(t.percent)})</span>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </Card>
  );
}
