"use client";

import Link from "next/link";
import { api } from "@/lib/api";
import { useFetch } from "@/lib/use-fetch";
import { WEEKDAY_LABEL, todayWeekday } from "@/lib/format";
import type { ClassSlot } from "@/lib/types";
import { Card, CardHeader, EmptyState, ErrorBlock, LoadingBlock } from "@/components/ui/display";
import { SlotCard } from "./slot-card";

/** Classes happening today for the signed-in user (teachers only see their own). */
export function TodayClasses() {
  const day = todayWeekday();
  const q = useFetch(() => api<ClassSlot[]>("/schedule", { query: { day, active: true } }), [day]);

  return (
    <Card>
      <CardHeader
        title={`Today's classes · ${WEEKDAY_LABEL[day]}`}
        description="Who is teaching whom, and when."
        action={<Link href="/schedule" className="text-xs font-medium text-brand-700 hover:underline">Full schedule</Link>}
      />
      {q.loading && !q.data ? (
        <LoadingBlock />
      ) : q.error ? (
        <ErrorBlock message={q.error} onRetry={q.reload} />
      ) : !q.data?.length ? (
        <EmptyState title="No classes scheduled today" />
      ) : (
        <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
          {q.data.map((s) => <SlotCard key={s.id} slot={s} />)}
        </div>
      )}
    </Card>
  );
}
