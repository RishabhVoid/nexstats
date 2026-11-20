import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { AuthConfig } from "@/config/authConfig";
import { connectMongo } from "@/lib/mongo";
import { editionTeamModel } from "@/models/TeamModel";
import mongoose from "mongoose";

export async function POST(req: Request) {
    const TeamModel = editionTeamModel(req);
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
    const teamId = String(payload?.teamId || "").trim();
    const state = String(payload?.state || "").trim() as "disqualified" | "eliminated" | "active";
    const note = String(payload?.note || "").trim();
    if (!teamId || !mongoose.isValidObjectId(teamId)) {
        return NextResponse.json({ message: "Invalid teamId" }, { status: 400 });
    }
    if (!["disqualified", "eliminated", "active"].includes(state)) {
        return NextResponse.json({ message: "Invalid state" }, { status: 400 });
    }
    if (note.length > 1000) {
        return NextResponse.json({ message: "Note too long" }, { status: 400 });
    }
    try {
        await connectMongo();
        const doc = await TeamModel.findByIdAndUpdate(
            teamId,
            { $set: { status: { state, note } } },
            { new: true }
        ).lean();
        if (!doc) return NextResponse.json({ message: "Not found" }, { status: 404 });
        const team = {
            id: String(doc._id),
            status: { state: doc.status?.state || "active", note: doc.status?.note || "" }
        };
        return NextResponse.json({ team }, { status: 200, headers: { "Cache-Control": "no-store" } });
    } catch {
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
};