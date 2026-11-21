import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { AuthConfig } from "@/config/authConfig";
import { staffRole } from "@/lib/access";
import { AttendanceError, saveAttendance, type AttendanceEdit } from "@/lib/roster";

import { applyProfileData, readProfileData } from "@/lib/memberProfileEdits";

async function save(req: Request) {
    const creating = req.method === "POST";
    const session = await getServerSession(AuthConfig);
    if (session?.user.role !== "organizer" || !staffRole(session.user.email)) {
        return NextResponse.json({ message: "Staff access required." }, { status: 403 });
    }
    let body: AttendanceEdit & { team_name?: string };
    try { body = await req.json(); } catch { return NextResponse.json({ message: "Invalid JSON." }, { status: 400 }); }
    if (!body || (!creating && (typeof body.team_uuid !== "string" || !/^[a-f0-9]{64}$/.test(body.team_uuid) ||
        typeof body.version !== "string" || !/^[a-f0-9]{64}$/.test(body.version))) ||
        (creating && (typeof body.team_name !== "string" || !body.team_name.trim() || body.team_name.trim().length > 150)) ||
        !Array.isArray(body.member_slots) || body.member_slots.length !== 4 ||
        body.member_slots.some(name => typeof name !== "string" || name.trim().length > 150) ||
        body.member_slots.filter(name => name.trim()).length < 2 ||
        !["", "Present", "Absent"].includes(body.attendance) ||
        typeof body.college_id !== "boolean" || typeof body.kit_distribution !== "boolean" ||
        typeof body.emergency_contact !== "string" || body.emergency_contact.length > 40 ||
        (body.emergency_contact.trim() && !/^[+\d\s()-]{6,40}$/.test(body.emergency_contact.trim()))) {
        return NextResponse.json({ message: "Provide 2–4 member names and a valid contact number." }, { status: 400 });
    }
    body.member_slots = body.member_slots.map(name => name.trim());
    body.emergency_contact = body.emergency_contact.trim();
    try {
        const profileData = await readProfileData(creating ? [] : [body.team_uuid]);
        const team = applyProfileData(await saveAttendance(body, creating ? body.team_name?.trim() : undefined), profileData);
        return NextResponse.json({ team }, { headers: { "Cache-Control": "private, no-store" } });
    } catch (error) {
        return NextResponse.json({ message: error instanceof AttendanceError ? error.message : "Could not save to Sheets. Your edits are still in the form. Try again." },
            { status: error instanceof AttendanceError ? error.status : 503, headers: { "Cache-Control": "private, no-store" } });
    }
}

export const PATCH = save;
export const POST = save;
