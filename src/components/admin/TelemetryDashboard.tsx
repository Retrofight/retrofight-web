"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Activity, ChevronLeft, ChevronRight, Clock, Cpu, GamepadIcon, User, Zap } from "lucide-react";
import type { TelemetryEvent, TelemetryEventType, TelemetryFileEntry } from "@/lib/admin/telemetryApi";

interface TelemetryDashboardProps {
    files: TelemetryFileEntry[];
    events: TelemetryEvent[];
    selectedDate: string;
    page: number;
    pageSize: number;
    total: number;
    typeFilter: TelemetryEventType | "all";
    userFilter: string;
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

const PATH_COLORS: Record<string, string> = {
    direct: "text-green-400",
    relay: "text-orange-400",
    none: "text-zinc-500"
};

function formatTime(ts: number): string {
    return new Date(ts).toISOString().replace("T", " ").slice(0, 19);
}

function shortId(userId: string): string {
    return userId.slice(0, 8);
}

export function TelemetryDashboard({
    files,
    events,
    selectedDate,
    page,
    pageSize,
    total,
    typeFilter,
    userFilter
}: TelemetryDashboardProps) {
    const router = useRouter();
    const [userInput, setUserInput] = useState(userFilter);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const rangeEnd = Math.min(page * pageSize, total);

    // Rebuild the URL preserving the current filters, overriding the given keys.
    function navigate(overrides: Record<string, string | number | undefined>) {
        const params = new URLSearchParams();
        params.set("date", selectedDate);
        if (typeFilter !== "all") params.set("type", typeFilter);
        if (userFilter) params.set("user", userFilter);
        if (page > 1) params.set("page", String(page));

        for (const [key, value] of Object.entries(overrides)) {
            if (value === undefined || value === "" || value === "all") {
                params.delete(key);
            } else {
                params.set(key, String(value));
            }
        }
        router.push(`/admin/telemetry?${params.toString()}`);
    }

    return (
        <section className="min-w-0 rounded-sm border border-white/10 bg-dark-card p-4 shadow-2xl shadow-black/30">
            {/* Toolbar */}
            <div className="mb-4 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-brand-purple-400" />
                    <span className="font-display text-sm font-black text-white">Diagnostics</span>
                    <span className="text-xs text-zinc-500">
                        {total > 0 ? `${rangeStart}–${rangeEnd} of ${total}` : "no events"}
                    </span>
                </div>

                <div className="ml-auto flex flex-wrap items-center gap-2">
                    {/* Date select */}
                    <select
                        value={selectedDate}
                        onChange={e => navigate({ date: e.target.value, page: undefined })}
                        className="h-8 rounded-sm border border-white/10 bg-black/40 px-2 text-xs text-white outline-none focus:border-brand-purple-500"
                    >
                        {files.length === 0 && <option value={selectedDate}>{selectedDate}</option>}
                        {files.map(({ date, eventCount }) => (
                            <option key={date} value={date}>
                                {date} · {eventCount} event{eventCount !== 1 ? "s" : ""}
                            </option>
                        ))}
                    </select>

                    {/* Type filter */}
                    <select
                        value={typeFilter}
                        onChange={e => navigate({ type: e.target.value, page: undefined })}
                        className="h-8 rounded-sm border border-white/10 bg-black/40 px-2 text-xs text-white outline-none focus:border-brand-purple-500"
                    >
                        <option value="all">All types</option>
                        <option value="netplay_attempt">Netplay</option>
                        <option value="runtime_crash">Crash</option>
                    </select>

                    {/* User filter */}
                    <form
                        onSubmit={e => {
                            e.preventDefault();
                            navigate({ user: userInput.trim() || undefined, page: undefined });
                        }}
                    >
                        <input
                            type="text"
                            placeholder="Filter by user ID…"
                            value={userInput}
                            onChange={e => setUserInput(e.target.value)}
                            className="h-8 w-44 rounded-sm border border-white/10 bg-black/40 px-2 text-xs text-white placeholder-zinc-600 outline-none focus:border-brand-purple-500"
                        />
                    </form>
                </div>
            </div>

            {/* Table */}
            {events.length === 0 ? (
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
                                <th className="pb-2 pr-4 font-semibold uppercase tracking-wider">Path</th>
                                <th className="pb-2 font-semibold uppercase tracking-wider">Latency</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {events.map((event, i) => (
                                <EventRow key={`${event.occurredAt}-${i}`} event={event} />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {total > 0 && (
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-zinc-400">
                    <span>
                        Page {page} of {totalPages}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={page <= 1}
                            onClick={() => navigate({ page: page - 1 })}
                            className="flex items-center gap-1 rounded-sm border border-white/10 px-2 py-1 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <ChevronLeft className="h-3 w-3" /> Prev
                        </button>
                        <button
                            type="button"
                            disabled={page >= totalPages}
                            onClick={() => navigate({ page: page + 1 })}
                            className="flex items-center gap-1 rounded-sm border border-white/10 px-2 py-1 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Next <ChevronRight className="h-3 w-3" />
                        </button>
                    </div>
                </div>
            )}
        </section>
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
            <td className={`py-2 pr-4 font-semibold ${isNetplay && event.finalPath ? (PATH_COLORS[event.finalPath] ?? "text-zinc-400") : "text-zinc-600"}`}>
                {isNetplay ? (event.finalPath ?? <span className="font-normal text-zinc-600">—</span>) : <span className="text-zinc-600">—</span>}
            </td>
            <td className="py-2 tabular-nums text-zinc-400">
                {event.probeLatencyMs != null
                    ? <span>{event.probeLatencyMs} ms</span>
                    : <span className="text-zinc-600">—</span>}
            </td>
        </tr>
    );
}
