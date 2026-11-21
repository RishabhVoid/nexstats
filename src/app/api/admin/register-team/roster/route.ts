import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { AuthConfig } from "@/config/authConfig";
import { staffRole } from "@/lib/access";
import { AttendanceError, readRoster, rosterSyncedAt } from "@/lib/roster";

import { withProfileEdits } from "@/lib/memberProfileEdits";

export const dynamic = "force-dynamic";
export async function GET(req: Request) {
    const session = await getServerSession(AuthConfig);
    if (session?.user.role !== "organizer" || !staffRole(session.user.email)) {
        return NextResponse.json({ message: "Staff access required." }, { status: 403 });
    }
    try {
        const teams = await withProfileEdits(await readRoster(new URL(req.url).searchParams.get("refresh") === "1"));
        return NextResponse.json({ teams, syncedAt: rosterSyncedAt() }, { headers: { "Cache-Control": "private, no-store" } });
    } catch (error) {
        return NextResponse.json({ message: error instanceof AttendanceError ? error.message : "Could not load the roster and saved member details. Try refreshing." }, { status: 503 });
    }
}
