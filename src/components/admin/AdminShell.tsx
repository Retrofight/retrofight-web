"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, ChevronRight, Newspaper, ShieldCheck, Users } from "lucide-react";

const NAV = [
    { href: "/admin/telemetry", label: "Telemetry", icon: Activity },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/news", label: "News", icon: Newspaper }
] as const;

export function AdminShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <main className="min-h-screen bg-dark-obsidian text-gray-100">
            <header className="border-b border-white/10 px-6 py-4">
                <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3">
                    <Link href="/admin" className="flex items-center gap-3">
                        <ShieldCheck className="h-5 w-5 text-brand-purple-400" />
                        <p className="font-pixel text-[10px] tracking-[0.24em] text-brand-purple-400">
                            RetroFight
                        </p>
                        <ChevronRight className="h-3 w-3 text-zinc-600" />
                        <h1 className="font-display text-lg font-black text-white">Admin</h1>
                    </Link>

                    <nav className="ml-auto flex items-center gap-1">
                        {NAV.map(({ href, label, icon: Icon }) => {
                            const active = pathname === href || pathname.startsWith(`${href}/`);
                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    className={`flex items-center gap-2 rounded-sm px-3 py-1.5 text-sm font-semibold transition ${
                                        active
                                            ? "bg-brand-purple-600/20 text-brand-purple-300"
                                            : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                                    }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    {label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </header>

            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</div>
        </main>
    );
}
