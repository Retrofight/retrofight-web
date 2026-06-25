import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { fetchTelemetryEvents, fetchTelemetryFiles } from "@/lib/admin/telemetryApi";
import { TelemetryDashboard } from "@/components/admin/TelemetryDashboard";

export default async function TelemetryPage({
    searchParams
}: {
    searchParams: Promise<{ date?: string }>;
}) {
    const { accessToken } = await requireAdmin();
    const { date: rawDate } = await searchParams;

    const files = await fetchTelemetryFiles(accessToken);

    const selectedDate = /^\d{4}-\d{2}-\d{2}$/.test(rawDate ?? "")
        ? rawDate!
        : (files[0]?.date ?? new Date().toISOString().slice(0, 10));

    if (!rawDate && files.length > 0) {
        redirect(`/admin/telemetry?date=${files[0].date}`);
    }

    const events = await fetchTelemetryEvents(accessToken, selectedDate);

    return (
        <TelemetryDashboard
            files={files}
            events={events}
            selectedDate={selectedDate}
        />
    );
}
