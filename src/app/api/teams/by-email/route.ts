import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { AuthConfig } from "@/config/authConfig";
import { connectMongo } from "@/lib/mongo";
import { editionTeamModel } from "@/models/TeamModel";

export async function GET(req: Request) {
    const TeamModel = editionTeamModel(req);
    const session = await getServerSession(AuthConfig);
    const email = session?.user?.email?.toLowerCase();
    if (!session || !email) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const archive = new URL(req.url).pathname.startsWith("/api/archive-nexhack-one/");
    if (session.user.role !== "participant" || archive !== (session.user.edition === "one")) return NextResponse.json({ message: "Access denied" }, {status:403});
    await connectMongo();
    const team = await TeamModel.findOne({ emails: email }).lean();
    if (!team) return NextResponse.json({ message: "Team not found" }, { status: 404 });
    return NextResponse.json({ team }, { status: 200 });
};