import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { AuthConfig } from "@/config/authConfig";
import { staffRole } from "@/lib/access";
import { readRoster } from "@/lib/roster";

export const dynamic = "force-dynamic";
export async function GET() {
    const session = await getServerSession(AuthConfig);
    if (session?.user.role !== "organizer" || !staffRole(session.user.email)) {
        return NextResponse.json({ message: "Staff access required." }, { status: 403 });
    }
    try {
        const teams = await readRoster();
        return NextResponse.json({ teams }, { headers: { "Cache-Control": "private, no-store" } });
    } catch {
        return NextResponse.json({ message: "Could not load the current team roster." }, { status: 503 });
    }
}
