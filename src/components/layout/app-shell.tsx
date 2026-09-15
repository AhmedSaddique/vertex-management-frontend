"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarClock,
  Building2,
  GraduationCap,
  HandCoins,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  Settings,
  TrendingUp,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/students", label: "Students", icon: GraduationCap },
  { href: "/schedule", label: "Class schedule", icon: CalendarClock },
  { href: "/teachers", label: "Teachers", icon: Users, adminOnly: true },
  { href: "/payments", label: "Fee payments", icon: Receipt },
  { href: "/payouts", label: "Teacher payouts", icon: HandCoins },
  { href: "/subjects", label: "Subjects", icon: BookOpen, adminOnly: true },
  { href: "/finance", label: "Company account", icon: Building2, adminOnly: true },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const items = NAV.filter((n) => !n.adminOnly || isAdmin).map((n) =>
    !isAdmin && n.href === "/dashboard" ? { ...n, label: "My account", icon: Wallet } : n,
  );

  const sidebar = (
    <div className="flex h-full flex-col bg-slate-900 text-slate-200">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
          <TrendingUp className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Vertex</p>
          <p className="text-[11px] uppercase tracking-wider text-slate-400">Management</p>
        </div>
        <button className="ml-auto rounded-md p-1 text-slate-400 hover:text-white lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-brand-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white",
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-white">
            {user ? initials(user.name) : "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{user?.name}</p>
            <p className="truncate text-xs text-slate-400">{isAdmin ? "Administrator" : "Teacher"}</p>
          </div>
          <button onClick={logout} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white" title="Sign out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden w-64 shrink-0 lg:fixed lg:inset-y-0 lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/60" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 shadow-2xl">{sidebar}</div>
        </div>
      )}

      <div className="flex min-h-screen flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(true)} className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-slate-900">Vertex Management</span>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
