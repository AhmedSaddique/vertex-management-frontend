"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "success" | "error" | "info";

interface ToastItem {
  id: number;
  tone: Tone;
  title: string;
  description?: string;
}

export interface ToastApi {
  show: (tone: Tone, title: string, description?: string) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const styles: Record<Tone, { box: string; icon: React.ReactNode }> = {
  success: { box: "border-emerald-200 bg-white", icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" /> },
  error: { box: "border-rose-200 bg-white", icon: <AlertCircle className="h-5 w-5 text-rose-600" /> },
  info: { box: "border-sky-200 bg-white", icon: <Info className="h-5 w-5 text-sky-600" /> },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (tone: Tone, title: string, description?: string) => {
      const id = ++nextId.current;
      setToasts((list) => [...list.slice(-3), { id, tone, title, description }]);
      window.setTimeout(() => dismiss(id), tone === "error" ? 6500 : 4000);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (title, description) => show("success", title, description),
      error: (title, description) => show("error", title, description),
      info: (title, description) => show("info", title, description),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 px-4 pb-4 sm:items-end sm:pr-6"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              "toast-enter pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border p-4 shadow-lg",
              styles[t.tone].box,
            )}
          >
            <div className="mt-0.5 shrink-0">{styles[t.tone].icon}</div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">{t.title}</p>
              {t.description && <p className="mt-0.5 break-words text-sm text-slate-600">{t.description}</p>}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
