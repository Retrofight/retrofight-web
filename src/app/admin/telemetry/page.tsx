import { requireAdmin } from "@/lib/admin/auth";
import {
    DEFAULT_TELEMETRY_PAGE_SIZE,
    fetchTelemetryEvents,
    fetchTelemetryFiles,
    type TelemetryEventType
} from "@/lib/admin/telemetryApi";
import { TelemetryDashboard } from "@/components/admin/TelemetryDashboard";

const VALID_TYPES: TelemetryEventType[] = ["netplay_attempt", "runtime_crash"];

export default async function TelemetryPage({
    searchParams
}: {
    searchParams: Promise<{ date?: string; page?: string; type?: string; user?: string }>;
}) {
    const { accessToken } = await requireAdmin();
    const { date: rawDate, page: rawPage, type: rawType, user: rawUser } = await searchParams;

    const files = await fetchTelemetryFiles(accessToken);

    const selectedDate = /^\d{4}-\d{2}-\d{2}$/.test(rawDate ?? "")
        ? rawDate!
        : (files[0]?.date ?? new Date().toISOString().slice(0, 10));

    const page = Math.max(1, Number.parseInt(rawPage ?? "1", 10) || 1);
    const type = VALID_TYPES.includes(rawType as TelemetryEventType) ? rawType : undefined;
    const user = rawUser?.trim() || undefined;

    const result = await fetchTelemetryEvents(accessToken, selectedDate, {
        page,
        pageSize: DEFAULT_TELEMETRY_PAGE_SIZE,
        type,
        user
    });

    return (
        <TelemetryDashboard
            files={files}
            events={result.events}
            selectedDate={selectedDate}
            page={result.page}
            pageSize={result.pageSize}
            total={result.total}
            typeFilter={(type as TelemetryEventType) ?? "all"}
            userFilter={user ?? ""}
        />
    );
}
