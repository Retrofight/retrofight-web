export type TelemetryEventType = "netplay_attempt" | "runtime_crash";

export interface TelemetryEvent {
    type: TelemetryEventType;
    userId: string;
    clientVersion: string;
    runtimeVersion?: string | null;
    game?: string | null;
    candidateType?: string | null;
    stunOutcome?: "success" | "failed" | "skipped" | null;
    punchOutcome?: "direct" | "timeout" | "failed" | null;
    punchReason?: string | null;
    probeLatencyMs?: number | null;
    exitCode?: number | null;
    occurredAt: number;
}

export interface TelemetryFileEntry {
    date: string;
    eventCount: number;
}

function serverUrl(): string {
    return (process.env.RETROFIGHT_SERVER_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export async function fetchTelemetryFiles(accessToken: string): Promise<TelemetryFileEntry[]> {
    const res = await fetch(`${serverUrl()}/api/admin/telemetry/files`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store"
    });

    if (!res.ok) {
        throw new Error(`Telemetry files request failed: HTTP ${res.status}`);
    }

    const json = await res.json() as { files: TelemetryFileEntry[] };
    return json.files;
}

export async function fetchTelemetryEvents(accessToken: string, date: string): Promise<TelemetryEvent[]> {
    const res = await fetch(
        `${serverUrl()}/api/admin/telemetry/events?date=${encodeURIComponent(date)}`,
        {
            headers: { Authorization: `Bearer ${accessToken}` },
            cache: "no-store"
        }
    );

    if (!res.ok) {
        throw new Error(`Telemetry events request failed: HTTP ${res.status}`);
    }

    const json = await res.json() as { date: string; events: TelemetryEvent[] };
    return json.events;
}
