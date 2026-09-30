"use client";

import { Pencil, Trash2, Undo2 } from "lucide-react";
import { LOAN_STATUS_LABEL, LOAN_STATUS_TONE, date, money } from "@/lib/format";
import type { CompanyLoan, LoanListResponse } from "@/lib/types";
import { Badge, Card, CardHeader, TBody, TD, TH, THead, TR, Table } from "@/components/ui/display";
import { Button } from "@/components/ui/form";

interface Props {
  rows: CompanyLoan[];
  onRepay: (loan: CompanyLoan) => void;
  onEdit: (loan: CompanyLoan) => void;
  onDelete: (id: string) => void;
}

export function LoansTable({ rows, onRepay, onEdit, onDelete }: Props) {
  return (
    <Table>
      <THead>
        <TR>
          <TH>Date taken</TH>
          <TH>Who</TH>
          <TH className="text-right">Taken</TH>
          <TH className="text-right">Paid back</TH>
          <TH className="text-right">Outstanding</TH>
          <TH>Status</TH>
          <TH>Reason</TH>
          <TH />
        </TR>
      </THead>
      <TBody>
        {rows.map((l) => (
          <TR key={l.id}>
            <TD className="whitespace-nowrap">{date(l.takenAt)}</TD>
            <TD>
              <p className="font-medium text-slate-900">{l.partner?.name ?? l.borrowerName}</p>
              {l.partner && <p className="text-xs text-slate-500">{l.partner.kind === "TEACHER" ? "Teacher" : "Management"}</p>}
            </TD>
            <TD className="text-right font-medium text-slate-900">{money(l.amount)}</TD>
            <TD className="text-right text-emerald-700">{money(l.repaid)}</TD>
            <TD className={`text-right font-semibold ${l.outstanding > 0 ? "text-rose-700" : "text-slate-400"}`}>{money(l.outstanding)}</TD>
            <TD><Badge tone={LOAN_STATUS_TONE[l.status]}>{LOAN_STATUS_LABEL[l.status]}</Badge></TD>
            <TD className="max-w-[180px] truncate text-slate-500">{l.reason || "-"}</TD>
            <TD className="text-right">
              <div className="flex items-center justify-end gap-1">
                {l.outstanding > 0 && (
                  <Button size="sm" variant="outline" onClick={() => onRepay(l)}>
                    <Undo2 className="h-3.5 w-3.5" /> Paid back
                  </Button>
                )}
                {l.outstanding <= 0 && l.repayments.length > 0 && (
                  <button className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" onClick={() => onRepay(l)} title="Repayment history">
                    <Undo2 className="h-4 w-4" />
                  </button>
                )}
                <button className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" onClick={() => onEdit(l)} title="Edit">
                  <Pencil className="h-4 w-4" />
                </button>
                <button className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600" onClick={() => onDelete(l.id)} title="Delete">
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

/** Who still owes the company, highest first. */
export function LoansByBorrower({ summary }: { summary: LoanListResponse["summary"] }) {
  return (
    <Card className="mt-6">
      <CardHeader title="Outstanding by person" description="Total taken, paid back and still owed." />
      <Table>
        <THead>
          <TR>
            <TH>Person</TH>
            <TH className="text-right">Taken</TH>
            <TH className="text-right">Paid back</TH>
            <TH className="text-right">Still owed</TH>
          </TR>
        </THead>
        <TBody>
          {summary.byBorrower.map((b) => (
            <TR key={b.key}>
              <TD className="font-medium text-slate-900">{b.name}</TD>
              <TD className="text-right">{money(b.taken)}</TD>
              <TD className="text-right text-emerald-700">{money(b.repaid)}</TD>
              <TD className={`text-right font-semibold ${b.outstanding > 0 ? "text-rose-700" : "text-slate-400"}`}>{money(b.outstanding)}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </Card>
  );
}
