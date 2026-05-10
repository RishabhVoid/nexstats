import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { AuthConfig } from "@/config/authConfig";
import { connectMongo } from "@/lib/mongo";
import { TeamModel } from "@/models/TeamModel";
import type { TeamType } from "@/types/TeamType";
import { updateTeamFlagsByName } from "@/lib/googleSheets";

type MemberData = {
    email: string;
    name: string;
    phone: string;
    is_leader: boolean;
};

function normalizeEmails(input: string[] = []): string[] {
    const cleaned: string[] = [];
    const seen: Record<string, true> = {};
    for (let i = 0; i < input.length; i++) {
        const raw = input[i];
        if (!raw) continue;
        const e = raw.toLowerCase().trim();
        if (!e) continue;
        if (!seen[e]) {
            seen[e] = true;
            cleaned.push(e);
        }
    }
    return cleaned;
}

export async function GET(req: Request) {
    const session = await getServerSession(AuthConfig);
    const role = (session?.user as any)?.role as "organizer" | "participant" | undefined;
    if (!session || role !== "organizer") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const url = new URL(req.url);
    const pageParam = url.searchParams.get("page");
    const limitParam = url.searchParams.get("limit");
    const page = Math.max(1, Number(pageParam ?? 1));
    const limit = Math.min(200, Math.max(1, Number(limitParam ?? 50)));
    const skip = (page - 1) * limit;
    try {
        await connectMongo();
        const [total, teamsRaw] = await Promise.all([
            TeamModel.countDocuments({}),
            TeamModel.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean()
        ]);
        const teams: TeamType[] = (teamsRaw as any[]).map((team: any) => ({
            id: String(team._id),
            emails: team.emails as string[],
            name: String(team.name ?? ""),
            members_count: Number(team.members_count ?? 0),
            members_data: ((team.members_data as any[]) || []).map((m: any) => ({
                email: String(m.email ?? ""),
                name: String(m.name ?? ""),
                phone: String(m.phone ?? ""),
                is_leader: Boolean(m.is_leader)
            })),
            assigned_block: String(team.assigned_block ?? ""),
            assigned_floor: String(team.assigned_floor ?? ""),
            assigned_room_no: String(team.assigned_room_no ?? ""),
            assigned_desk: String(team.assigned_desk ?? ""),
            aadhar_id: Boolean(team.aadhar_id ?? false),
            college_id: Boolean(team.college_id ?? false),
            kit_distribution: Boolean(team.kit_distribution ?? false),
            emergency_contact: String(team.emergency_contact ?? ""),
            notes: String(team.notes ?? ""),
            status: team.status || { state: "active", note: "" },
            createdAt: team.createdAt,
            updatedAt: team.updatedAt
        }));
        return NextResponse.json(
            { page, limit, total, total_pages: Math.max(1, Math.ceil(total / limit)), teams },
            { status: 200, headers: { "Cache-Control": "no-store" } }
        );
    } catch {
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(AuthConfig);
    const role = (session?.user as any)?.role as "organizer" | "participant" | undefined;
    if (!session || role !== "organizer") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    let payload: any;
    try {
        payload = await req.json();
    } catch {
        return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
    }
    const name = String(payload?.name ?? "").trim();
    if (!name) {
        return NextResponse.json({ message: "Team name is required" }, { status: 400 });
    }
    const baseEmails = Array.isArray(payload?.emails) ? (payload.emails as string[]) : [];
    const emails = normalizeEmails(baseEmails);
    if (emails.length === 0) {
        return NextResponse.json({ message: "At least one email is required" }, { status: 400 });
    }
    const rawMembers: any[] = Array.isArray(payload?.members_data) ? payload.members_data : [];
    const membersSeen: Record<string, true> = {};
    const members_data: MemberData[] = [];
    for (let i = 0; i < rawMembers.length; i++) {
        const m = rawMembers[i] as any;
        const email = String(m?.email ?? "").toLowerCase().trim();
        if (!email || membersSeen[email]) continue;
        membersSeen[email] = true;
        members_data.push({
            email,
            name: String(m?.name ?? "").trim(),
            phone: String(m?.phone ?? "").trim(),
            is_leader: Boolean(m?.is_leader)
        });
    }
    if (members_data.length < 2 || members_data.length > 4) {
        return NextResponse.json({ message: "Provide 2 to 4 members" }, { status: 400 });
    }
    const leaders = members_data.filter(m => m.is_leader === true).length;
    if (leaders !== 1) {
        return NextResponse.json({ message: "Exactly one team member must be marked as leader" }, { status: 400 });
    }
    const college_id = Boolean(payload?.college_id);
    const aadhar_id = Boolean(payload?.aadhar_id);
    const kit_distribution = Boolean(payload?.kit_distribution);
    const emergency_contact = String(payload?.emergency_contact ?? "").trim();
    if (!college_id || !aadhar_id || !kit_distribution) {
        return NextResponse.json({ message: "College ID, Aadhar ID, and Kit distribution must all be checked" }, { status: 400 });
    }
    if (!emergency_contact) {
        return NextResponse.json({ message: "Emergency contact is required" }, { status: 400 });
    }
    const allEmails = normalizeEmails(emails.concat(members_data.map(m => m.email)));
    const members_count = allEmails.length;
    try {
        await connectMongo();
        const nameClash = await TeamModel.findOne({ name })
            .collation({ locale: "en", strength: 2 })
            .lean();
        if (nameClash) {
            return NextResponse.json({ message: "Team name already exists" }, { status: 409 });
        }
        const overlap = await TeamModel.findOne({
            $or: [{ emails: { $in: allEmails } }, { "members_data.email": { $in: allEmails } }]
        }).lean();
        if (overlap) {
            return NextResponse.json({ message: "One or more members/emails are already registered on another team" }, { status: 409 });
        }
        const exactSet = await TeamModel.findOne({
            $expr: {
                $and: [
                    { $eq: [{ $size: "$emails" }, allEmails.length] },
                    { $eq: [{ $size: { $setDifference: ["$emails", allEmails] } }, 0] },
                    { $eq: [{ $size: { $setDifference: [allEmails, "$emails"] } }, 0] }
                ]
            }
        }).lean();
        if (exactSet) {
            return NextResponse.json({ message: "This team already exists" }, { status: 409 });
        }
        const doc = await TeamModel.create({
            name,
            emails: allEmails,
            members_count,
            members_data,
            notes: String(payload?.notes ?? "").trim(),
            assigned_block: String(payload?.assigned_block ?? "").trim(),
            assigned_floor: String(payload?.assigned_floor ?? "").trim(),
            assigned_room_no: String(payload?.assigned_room_no ?? "").trim(),
            assigned_desk: String(payload?.assigned_desk ?? "").trim(),
            college_id,
            aadhar_id,
            kit_distribution,
            emergency_contact,
            status: { state: "active", note: "" }
        });
        try {
            const resUpdate = await updateTeamFlagsByName({
                name: doc.name,
                college_id: !!doc.college_id,
                aadhar_id: !!doc.aadhar_id,
                kit_distribution: !!doc.kit_distribution,
                emergency_number: emergency_contact
            });
        } catch(error: any) {
        }
        const team: TeamType = {
            id: String(doc._id),
            emails: doc.emails as string[],
            name: String(doc.name ?? ""),
            members_count: Number(doc.members_count ?? 0),
            members_data: ((doc.members_data as any[]) || []).map((m: any) => ({
                email: String(m.email ?? ""),
                name: String(m.name ?? ""),
                phone: String(m.phone ?? ""),
                is_leader: Boolean(m.is_leader)
            })),
            assigned_block: String(doc.assigned_block ?? ""),
            assigned_floor: String(doc.assigned_floor ?? ""),
            assigned_room_no: String(doc.assigned_room_no ?? ""),
            assigned_desk: String(doc.assigned_desk ?? ""),
            college_id: Boolean(doc.college_id),
            aadhar_id: Boolean(doc.aadhar_id),
            kit_distribution: Boolean(doc.kit_distribution),
            emergency_contact: String(doc.emergency_contact ?? ""),
            notes: String(doc.notes ?? ""),
            status: doc.status,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt
        };
        return NextResponse.json({ team }, { status: 201, headers: { "Cache-Control": "no-store" } });
    } catch {
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}