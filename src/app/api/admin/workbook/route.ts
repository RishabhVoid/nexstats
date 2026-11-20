import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { AuthConfig } from "@/config/authConfig";
import { staffRole } from "@/lib/access";
import { listTabs, readGrid, saveCell, WorkbookError } from "@/lib/workbook";

export const dynamic = "force-dynamic";
function json(body: unknown, status = 200) {
    return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}
async function authorized() {
    const session = await getServerSession(AuthConfig);
    return session?.user.role === "organizer" && staffRole(session.user.email) === "admin";
}
function failure(e: unknown) {
    if (e instanceof WorkbookError) return json({ message: e.message }, e.status);
    return json({ message: "Google Sheets is unavailable. Check the server connection and workbook access, then refresh." }, 503);
}
export async function GET(req: Request) {
    if (!(await authorized())) return json({ message: "Administrator access required." }, 403);
    const id = new URL(req.url).searchParams.get("tab");
    try {
        if (id === null) return json({ tabs: await listTabs() });
        if (!/^\d+$/.test(id)) return json({ message: "Invalid worksheet." }, 400);
        return json(await readGrid(Number(id)));
    } catch (e) { return failure(e); }
}
export async function PATCH(req: Request) {
    if (!(await authorized())) return json({ message: "Administrator access required." }, 403);
    if (!req.headers.get("content-type")?.startsWith("application/json")) return json({ message: "JSON required." }, 415);
    let body;
    try { body = await req.json(); } catch { return json({ message: "Invalid JSON." }, 400); }
    if (!body || !Number.isSafeInteger(body.id) || body.id < 0 || !Number.isSafeInteger(body.row) || body.row < 1 ||
        !Number.isSafeInteger(body.col) || body.col < 0 || body.col >= 18278 || typeof body.value !== "string" ||
        body.value.length > 50000 || typeof body.version !== "string" || !/^[a-f0-9]{64}$/.test(body.version)) {
        return json({ message: "Invalid cell edit." }, 400);
    }
    try {
        await saveCell(body);
        return json({ saved: true });
    } catch (e) { return failure(e); }
}
