import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { AuthConfig } from "@/config/authConfig";
import { staffRole } from "@/lib/access";
import { readRoster } from "@/lib/roster";
import { EventImportError, saveEventImport, validateEventImport } from "@/lib/teamEventData";

export async function POST(req: Request) {
    const session = await getServerSession(AuthConfig);
    if (session?.user.role !== "organizer" || staffRole(session.user.email) !== "admin") {
        return NextResponse.json({ message: "Staff access required." }, { status: 403 });
    }
    if (req.headers.get("origin") && req.headers.get("origin") !== new URL(req.url).origin) {
        return NextResponse.json({ message: "Access denied." }, { status: 403 });
    }
    try {
        const records = validateEventImport(await req.json(), await readRoster(true));
        await saveEventImport(records);
        return NextResponse.json({ imported: records.length }, { headers: { "Cache-Control": "private, no-store" } });
    } catch (error) {
        return NextResponse.json({ message: error instanceof EventImportError ? error.message : "Could not import team data." }, {
            status: error instanceof EventImportError ? error.status : 503, headers: { "Cache-Control": "private, no-store" },
        });
    }
}
