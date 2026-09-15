import type { Weekday } from "./types";

const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY ?? "Rs";

export function money(value: number | null | undefined, opts: { compact?: boolean } = {}): string {
  const n = Number(value ?? 0);
  if (opts.compact && Math.abs(n) >= 100000) {
    return `${CURRENCY} ${(n / 1000).toLocaleString("en-US", { maximumFractionDigits: 1 })}k`;
  }
  const hasFraction = Math.abs(n % 1) > 0.001;
  return `${CURRENCY} ${n.toLocaleString("en-US", {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

export function percent(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  return `${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}%`;
}

export function date(value: string | Date | null | undefined): string {
  if (!value) return "-";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function dateInput(value?: string | Date | null): string {
  const d = value ? new Date(value) : new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Active",
  COMPLETED: "Completed",
  DROPPED: "Dropped",
};

export const METHOD_LABEL: Record<string, string> = {
  CASH: "Cash",
  BANK_TRANSFER: "Bank transfer",
  ONLINE: "Online",
  OTHER: "Other",
};

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export const WEEKDAYS: Weekday[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export const WEEKDAY_LABEL: Record<Weekday, string> = {
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
  SAT: "Saturday",
  SUN: "Sunday",
};

export const WEEKDAY_SHORT: Record<Weekday, string> = {
  MON: "Mon",
  TUE: "Tue",
  WED: "Wed",
  THU: "Thu",
  FRI: "Fri",
  SAT: "Sat",
  SUN: "Sun",
};

/** "19:30" -> "7:30 PM" */
export function time12(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function timeRange(start: string, end: string): string {
  return `${time12(start)} - ${time12(end)}`;
}

export function daysLabel(days: Weekday[]): string {
  const sorted = [...days].sort((a, b) => WEEKDAYS.indexOf(a) - WEEKDAYS.indexOf(b));
  if (sorted.length === 7) return "Every day";
  return sorted.map((d) => WEEKDAY_SHORT[d]).join(", ");
}

/** Today as a Weekday code (JS getDay: 0 = Sunday). */
export function todayWeekday(): Weekday {
  return WEEKDAYS[(new Date().getDay() + 6) % 7];
}

/** Availability key for a time slot, e.g. "15:00-16:30". */
export const slotKey = (start: string, end: string) => `${start}-${end}`;

/** "15:00-16:30" -> "3:00 PM - 4:30 PM" */
export function slotKeyLabel(key: string): string {
  const [start, end] = key.split("-");
  return start && end ? timeRange(start, end) : key;
}
