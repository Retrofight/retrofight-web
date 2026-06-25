"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { Activity, ChevronRight, Clock, Cpu, GamepadIcon, ShieldCheck, User, Zap } from "lucide-react";
import type { TelemetryEvent, TelemetryEventType, TelemetryFileEntry } from "@/lib/admin/telemetryApi";

interface TelemetryDashboardProps {
    files: TelemetryFileEntry[];
    events: TelemetryEvent[];
    selectedDate: string;
}

const TYPE_LABELS: Record<TelemetryEventType, string> = {
    netplay_attempt: "Netplay",
    runtime_crash: "Crash"
};

const TYPE_COLORS: Record<TelemetryEventType, string> = {
    netplay_attempt: "bg-brand-purple-600/30 text-brand-purple-300 border-brand-purple-500/30",
    runtime_crash: "bg-red-900/30 text-red-300 border-red-500/30"
};

const PUNCH_COLORS: Record<string, string> = {
    direct: "text-green-400",
    timeout: "text-yellow-400",
    failed: "text-red-400"
};

function formatTime(ts: number): string {
    return new Date(ts).toISOString().replace("T", " ").slice(0, 19);
}

function shortId(userId: string): string {
    return userId.slice(0, 8);
}

export function TelemetryDashboard({ files, events, selectedDate }: TelemetryDashboardProps) {
    const router = useRouter();
    const [typeFilter, setTypeFilter] = useState<TelemetryEventType | "all">("all");
    const [userSearch, setUserSearch] = useState("");

    const filtered = useMemo(() => {
        let result = events;
        if (typeFilter !== "all") {
            result = result.filter(e => e.type === typeFilter);
        }
        if (userSearch.trim()) {
            const q = userSearch.trim().toLowerCase();
            result = result.filter(e => e.userId.toLowerCase().includes(q));
        }
        return result;
    }, [events, typeFilter, userSearch]);

    function selectDate(date: string) {
        router.push(`/admin/telemetry?date=${date}`);
    }

    return (
        <main className="min-h-screen bg-dark-obsidian text-gray-100">
            <header className="border-b border-white/10 px-6 py-4">
                <div className="mx-auto flex max-w-7xl items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-brand-purple-400" />
                    <p className="font-pixel text-[10px] tracking-[0.24em] text-brand-purple-400">
                        RetroFight
                    </p>
                    <ChevronRight className="h-3 w-3 text-zinc-600" />
                    <h1 className="font-display text-lg font-black text-white">
                        Telemetry Dashboard
                    </h1>
                </div>
            </header>

            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
                <div className="grid gap-4 lg:grid-cols-[220px_1fr]">

                    {/* Date sidebar */}
                    <aside className="rounded-sm border border-white/10 bg-dark-card p-4 shadow-2xl shadow-black/30 lg:self-start">
                        <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                            Log files
                        </p>
                        {files.length === 0 ? (
                            <p className="text-sm text-zinc-500">No telemetry files yet.</p>
                        ) : (
                            <ul className="space-y-1">
                                {files.map(({ date, eventCount }) => (
                                    <li key={date}>
                                        <button
                                            onClick={() => selectDate(date)}
                                            className={`w-full rounded-sm px-3 py-2 text-left transition ${
                                                date === selectedDate
                                                    ? "bg-brand-purple-600/20 text-brand-purple-300"
                                                    : "text-zinc-300 hover:bg-white/5"
                                            }`}
                                        >
                                            <span className="block text-sm font-semibold">{date}</span>
                                            <span className="text-xs text-zinc-500">
                                                {eventCount} event{eventCount !== 1 ? "s" : ""}
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </aside>

                    {/* Events panel */}
                    <section className="min-w-0 rounded-sm border border-white/10 bg-dark-card p-4 shadow-2xl shadow-black/30">
                        {/* Toolbar */}
                        <div className="mb-4 flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2">
                                <Activity className="h-4 w-4 text-brand-purple-400" />
                                <span className="font-display text-sm font-black text-white">
                                    {selectedDate}
                                </span>
                                <span className="text-xs text-zinc-500">
                                    ({filtered.length} / {events.length})
                                </span>
                            </div>

                            <div className="ml-auto flex flex-wrap items-center gap-2">
                                <select
                                    value={typeFilter}
                                    onChange={e => setTypeFilter(e.target.value as TelemetryEventType | "all")}
                                    className="h-8 rounded-sm border border-white/10 bg-black/40 px-2 text-xs text-white outline-none focus:border-brand-purple-500"
                                >
                                    <option value="all">All types</option>
                                    <option value="netplay_attempt">Netplay</option>
                                    <option value="runtime_crash">Crash</option>
                                </select>

                                <input
                                    type="text"
                                    placeholder="Filter by user ID…"
                                    value={userSearch}
                                    onChange={e => setUserSearch(e.target.value)}
                                    className="h-8 w-40 rounded-sm border border-white/10 bg-black/40 px-2 text-xs text-white placeholder-zinc-600 outline-none focus:border-brand-purple-500"
                                />
                            </div>
                        </div>

                        {/* Table */}
                        {filtered.length === 0 ? (
                            <p className="py-12 text-center text-sm text-zinc-500">
                                No events match the current filters.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-white/10 text-zinc-500">
                                            <th className="pb-2 pr-4 font-semibold uppercase tracking-wider">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" /> Time
                                                </span>
                                            </th>
                                            <th className="pb-2 pr-4 font-semibold uppercase tracking-wider">Type</th>
                                            <th className="pb-2 pr-4 font-semibold uppercase tracking-wider">
                                                <span className="flex items-center gap-1">
                                                    <User className="h-3 w-3" /> User
                                                </span>
                                            </th>
                                            <th className="pb-2 pr-4 font-semibold uppercase tracking-wider">
                                                <span className="flex items-center gap-1">
                                                    <GamepadIcon className="h-3 w-3" /> Game
                                                </span>
                                            </th>
                                            <th className="pb-2 pr-4 font-semibold uppercase tracking-wider">
                                                <span className="flex items-center gap-1">
                                                    <Cpu className="h-3 w-3" /> Client
                                                </span>
                                            </th>
                                            <th className="pb-2 pr-4 font-semibold uppercase tracking-wider">Candidate</th>
                                            <th className="pb-2 pr-4 font-semibold uppercase tracking-wider">
                                                <span className="flex items-center gap-1">
                                                    <Zap className="h-3 w-3" /> Outcome
                                                </span>
                                            </th>
                                            <th className="pb-2 font-semibold uppercase tracking-wider">Latency</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filtered.map((event, i) => (
                                            <EventRow key={i} event={event} />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </main>
    );
}

function EventRow({ event }: { event: TelemetryEvent }) {
    const isNetplay = event.type === "netplay_attempt";
    const isCrash = event.type === "runtime_crash";

    const outcomeText = isNetplay
        ? (event.punchOutcome ?? "—")
        : isCrash
        ? (event.exitCode != null ? `exit ${event.exitCode}` : "—")
        : "—";

    const outcomeColor = isNetplay && event.punchOutcome
        ? PUNCH_COLORS[event.punchOutcome] ?? "text-zinc-400"
        : isCrash
        ? "text-red-400"
        : "text-zinc-500";

    return (
        <tr className="group hover:bg-white/[0.03]">
            <td className="py-2 pr-4 font-mono text-zinc-400 tabular-nums">
                {formatTime(event.occurredAt)}
            </td>
            <td className="py-2 pr-4">
                <span className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-semibold ${TYPE_COLORS[event.type]}`}>
                    {TYPE_LABELS[event.type]}
                </span>
            </td>
            <td className="py-2 pr-4 font-mono text-zinc-300" title={event.userId}>
                {shortId(event.userId)}…
            </td>
            <td className="py-2 pr-4 text-zinc-300">
                {event.game ?? <span className="text-zinc-600">—</span>}
            </td>
            <td className="py-2 pr-4 text-zinc-400">
                {event.clientVersion}
                {event.runtimeVersion ? (
                    <span className="ml-1 text-zinc-600">/ {event.runtimeVersion}</span>
                ) : null}
            </td>
            <td className="py-2 pr-4 text-zinc-400">
                {event.candidateType ?? <span className="text-zinc-600">—</span>}
            </td>
            <td className={`py-2 pr-4 font-semibold ${outcomeColor}`}>
                {outcomeText}
                {event.punchReason ? (
                    <span className="ml-1 text-[10px] text-zinc-600">({event.punchReason})</span>
                ) : null}
            </td>
            <td className="py-2 tabular-nums text-zinc-400">
                {event.probeLatencyMs != null
                    ? <span>{event.probeLatencyMs} ms</span>
                    : <span className="text-zinc-600">—</span>}
            </td>
        </tr>
    );
}
