import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { AuthConfig } from "@/config/authConfig";
import { staffRole } from "@/lib/access";
import { AttendanceError, readRoster, type AttendanceTeam } from "@/lib/roster";
import { ProfileError, saveProfileEdit, validateProfileInput, withProfileEdits } from "@/lib/memberProfileEdits";

export async function PATCH(req: Request) {
    const session = await getServerSession(AuthConfig);
    if (session?.user.role !== "organizer" || !staffRole(session.user.email)) {
        return NextResponse.json({ message: "Staff access required." }, { status: 403 });
    }
    let body: unknown;
    try { body = await req.json(); } catch { return NextResponse.json({ message: "Invalid JSON." }, { status: 400 }); }
    let currentTeam: AttendanceTeam | undefined;
    try {
        const input = validateProfileInput(body);
        const team = (await readRoster()).find(team => team.team_uuid === input.team_uuid);
        if (!team) throw new ProfileError(404, "This team is no longer in the roster.");
        currentTeam = team;
        const updated = await saveProfileEdit(team, input, session.user.email!);
        return NextResponse.json({ team: updated }, { headers: { "Cache-Control": "private, no-store" } });
    } catch (error) {
        let latest: AttendanceTeam | undefined;
        if (error instanceof ProfileError && error.status === 409 && currentTeam) {
            try { latest = (await withProfileEdits([currentTeam]))[0]; } catch { /* Keep the conflict and draft if storage is unavailable. */ }
        }
        return NextResponse.json({ team: latest, message: error instanceof ProfileError || error instanceof AttendanceError ? error.message :
            "Could not save member details. Your draft is still here. Try again." }, {
            status: error instanceof ProfileError || error instanceof AttendanceError ? error.status : 503,
            headers: { "Cache-Control": "private, no-store" },
        });
    }
}
