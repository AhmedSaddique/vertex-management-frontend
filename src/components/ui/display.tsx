"use client";

import Link from "next/link";
import { AlertCircle, ArrowLeft, Inbox, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_LABEL } from "@/lib/format";
import { Button } from "./form";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white shadow-sm", className)}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4", className)}>
      <div>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "brand";

const tones: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-700 ring-slate-200",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-200",
  danger: "bg-rose-50 text-rose-700 ring-rose-200",
  info: "bg-sky-50 text-sky-700 ring-sky-200",
  brand: "bg-brand-50 text-brand-700 ring-brand-200",
};

export function Badge({ tone = "neutral", className, children }: { tone?: Tone; className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", tones[tone], className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone: Tone = status === "ACTIVE" ? "success" : status === "COMPLETED" ? "info" : "neutral";
  return <Badge tone={tone}>{STATUS_LABEL[status] ?? status}</Badge>;
}

export function Stat({
  label,
  value,
  hint,
  icon,
  tone = "neutral",
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  const iconTone: Record<Tone, string> = {
    neutral: "bg-slate-100 text-slate-600",
    success: "bg-emerald-50 text-emerald-600",
    warning: "bg-amber-50 text-amber-600",
    danger: "bg-rose-50 text-rose-600",
    info: "bg-sky-50 text-sky-600",
    brand: "bg-brand-50 text-brand-600",
  };
  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 truncate text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
        </div>
        {icon && <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", iconTone[tone])}>{icon}</div>}
      </div>
    </Card>
  );
}

export function Table({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full min-w-[640px] text-left text-sm">{children}</table>
    </div>
  );
}
export function THead({ children }: { children: React.ReactNode }) {
  return <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">{children}</thead>;
}
export function TBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-slate-100">{children}</tbody>;
}
export function TR({ className, children, onClick }: { className?: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <tr onClick={onClick} className={cn(onClick && "cursor-pointer hover:bg-slate-50", className)}>
      {children}
    </tr>
  );
}
export function TH({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <th className={cn("px-4 py-3", className)}>{children}</th>;
}
export function TD({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <td className={cn("px-4 py-3 text-slate-700", className)}>{children}</td>;
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-6 w-6 animate-spin text-brand-600", className)} />;
}

export function LoadingBlock({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-slate-500">
      <Spinner className="h-5 w-5" /> {label}
    </div>
  );
}

export function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <AlertCircle className="h-8 w-8 text-rose-500" />
      <p className="text-sm text-slate-700">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Inbox className="h-6 w-6" />
      </div>
      <p className="text-sm font-medium text-slate-900">{title}</p>
      {description && <p className="max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function Alert({ tone = "info", className, children }: { tone?: "info" | "error" | "success" | "warning"; className?: string; children: React.ReactNode }) {
  const styles = {
    info: "border-sky-200 bg-sky-50 text-sky-800",
    error: "border-rose-200 bg-rose-50 text-rose-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
  } as const;
  return <div className={cn("rounded-lg border px-4 py-3 text-sm", styles[tone], className)}>{children}</div>;
}

export function PageHeader({ title, description, actions, backHref }: { title: string; description?: string; actions?: React.ReactNode; backHref?: string }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        {backHref && (
          <Link href={backHref} className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900">
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Link>
        )}
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
