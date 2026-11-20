import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { TeamType } from "@/types/TeamType";
import { editionTeamModel } from "@/models/TeamModel";
import { connectMongo } from "@/lib/mongo";
import { AuthConfig } from "@/config/authConfig";

export async function GET(req: Request) {
    const TeamModel = editionTeamModel(req);
    const session = await getServerSession(AuthConfig);
    const role = (session?.user as any)?.role as "organizer" | "participant" | undefined;
    const email = session?.user?.email?.toLowerCase().trim();

    if (!session || !email || role !== "participant") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const archive = new URL(req.url).pathname.startsWith("/api/archive-nexhack-one/");
    if (session.user.role !== "participant" || archive !== (session.user.edition === "one")) return NextResponse.json({ message: "Access denied" }, {status:403});
    await connectMongo();
    const team = await TeamModel.findOne({ emails: email }).lean();

    if (!team) {
        return NextResponse.json({ message: "Team not found" }, { status: 404 });
    }

    const data: TeamType = {
        id: String(team._id),
        emails: team.emails,
        name: team.name,
        members_count: team.members_count,
        members_data: (team.members_data || []).map((m: any) => ({
            email: m.email,
            name: m.name,
            phone: m.phone || "",
            is_leader: !!m.is_leader,
        })),
        assigned_block: team.assigned_block || "",
        assigned_floor: team.assigned_floor || "",
        assigned_room_no: team.assigned_room_no || "",
        assigned_desk: team.assigned_desk || "",
        notes: team.notes || "",
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
        status: {
            state: "",
            note: ""
        },
        college_id: team.college_id,
        aadhar_id: team.aadhar_id,
        kit_distribution: team.kit_distribution,
        emergency_contact: team.emergency_contact
    };

    return NextResponse.json({ team: data }, { status: 200, headers: { "Cache-Control": "no-store" } });
};