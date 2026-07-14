import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { deleteNewsImage, listNewsImages, uploadNewsImage } from "@/lib/admin/media";

// Admin-only media library for news cover images. Called from the NewsEditor's
// gallery modal via fetch so uploads/deletes don't navigate away from the editor.

export async function GET() {
    await requireAdmin();
    const images = await listNewsImages();
    return NextResponse.json({ images });
}

export async function POST(request: Request) {
    await requireAdmin();
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
        return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const image = await uploadNewsImage(file);
    if (!image) {
        return NextResponse.json({ error: "Invalid or oversized image." }, { status: 400 });
    }

    return NextResponse.json({ image });
}

export async function DELETE(request: Request) {
    await requireAdmin();
    const name = new URL(request.url).searchParams.get("name") ?? "";

    const ok = await deleteNewsImage(name);
    if (!ok) {
        return NextResponse.json({ error: "Could not delete image." }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
}
