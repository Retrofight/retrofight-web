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
    finalPath?: "direct" | "relay" | "none" | null;
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

export interface TelemetryEventsQuery {
    page?: number;
    pageSize?: number;
    type?: string;
    user?: string;
}

export interface TelemetryEventsPage {
    events: TelemetryEvent[];
    page: number;
    pageSize: number;
    total: number;
}

export async function fetchTelemetryEvents(
    accessToken: string,
    date: string,
    query: TelemetryEventsQuery = {}
): Promise<TelemetryEventsPage> {
    const params = new URLSearchParams({ date });
    if (query.page) params.set("page", String(query.page));
    if (query.pageSize) params.set("pageSize", String(query.pageSize));
    if (query.type) params.set("type", query.type);
    if (query.user) params.set("user", query.user);

    const res = await fetch(
        `${serverUrl()}/api/admin/telemetry/events?${params.toString()}`,
        {
            headers: { Authorization: `Bearer ${accessToken}` },
            cache: "no-store"
        }
    );

    if (!res.ok) {
        throw new Error(`Telemetry events request failed: HTTP ${res.status}`);
    }

    const json = await res.json() as {
        date: string;
        events: TelemetryEvent[];
        page?: number;
        pageSize?: number;
        total?: number;
    };

    return {
        events: json.events,
        page: json.page ?? query.page ?? 1,
        pageSize: json.pageSize ?? query.pageSize ?? DEFAULT_TELEMETRY_PAGE_SIZE,
        total: json.total ?? json.events.length
    };
}

export const DEFAULT_TELEMETRY_PAGE_SIZE = 50;
