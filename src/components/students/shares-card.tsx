"use client";

import Link from "next/link";
import { money, percent } from "@/lib/format";
import type { StudentDetail } from "@/lib/types";
import { Card, CardHeader } from "@/components/ui/display";

/** How this student's fee is split and what each partner has earned from it so far. */
export function StudentSharesCard({ student: s, isAdmin }: { student: StudentDetail; isAdmin: boolean }) {
  const partnerEarned = s.shares.reduce((a, sh) => a + (sh.earned ?? 0), 0);
  const companyEarned = Math.round((s.paid - partnerEarned) * 100) / 100;
  const companyProjected = Math.round(((s.finalPrice * s.companyPercent) / 100) * 100) / 100;

  return (
    <Card>
      <CardHeader
        title="Fee share split"
        description="Earned = from payments received so far. Full = once the whole fee is paid."
        action={isAdmin ? <Link href={`/students/${s.id}/edit`} className="text-xs font-medium text-brand-700 hover:underline">Change split</Link> : undefined}
      />
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-5 py-2 text-left">Partner</th>
            <th className="px-3 py-2 text-right">Share</th>
            <th className="px-3 py-2 text-right">Earned</th>
            <th className="px-5 py-2 text-right">Full</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {s.shares.map((sh) => (
            <tr key={sh.partnerId}>
              <td className="px-5 py-2.5">
                {isAdmin ? (
                  <Link href={`/partners/${sh.partnerId}`} className="font-medium text-slate-900 hover:text-brand-700">{sh.partner.name}</Link>
                ) : (
                  <span className="font-medium text-slate-900">{sh.partner.name}</span>
                )}
                <span className="ml-1.5 text-xs text-slate-400">{sh.partner.kind === "TEACHER" ? "teacher" : "management"}</span>
              </td>
              <td className="px-3 py-2.5 text-right">{percent(sh.percent)}</td>
              <td className="px-3 py-2.5 text-right font-medium text-amber-700">{money(sh.earned ?? 0)}</td>
              <td className="px-5 py-2.5 text-right text-slate-500">{money(sh.projected ?? 0)}</td>
            </tr>
          ))}
          <tr className="bg-emerald-50/50">
            <td className="px-5 py-2.5 font-medium text-emerald-800">Company</td>
            <td className="px-3 py-2.5 text-right text-emerald-800">{percent(s.companyPercent)}</td>
            <td className="px-3 py-2.5 text-right font-medium text-emerald-700">{money(companyEarned)}</td>
            <td className="px-5 py-2.5 text-right text-emerald-700/70">{money(companyProjected)}</td>
          </tr>
        </tbody>
      </table>
    </Card>
  );
}
