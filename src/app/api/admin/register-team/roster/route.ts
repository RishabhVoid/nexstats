import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { AuthConfig } from "@/config/authConfig";
import { staffRole } from "@/lib/access";
import { listTabs, readGrid } from "@/lib/workbook";

export const dynamic = "force-dynamic";
export async function GET() {
    const session = await getServerSession(AuthConfig);
    if (session?.user.role !== "organizer" || !staffRole(session.user.email)) {
        return NextResponse.json({ message: "Staff access required." }, { status: 403 });
    }
    try {
        const tab = (await listTabs()).find(t => t.title === "Teams Data");
        if (!tab) throw new Error("Missing roster");
        const { rows } = await readGrid(tab.id);
        const header = rows.find(r => r.cells.some(c => c.text.trim() === "Team Name"));
        if (!header) throw new Error("Missing roster header");
        const col = (name: string) => header.cells.findIndex(c => c.text.trim() === name);
        const teamCol = col("Team Name");
        const serialCol = col("S. No.");
        const members = ["Member 1", "Member 2", "Member 3", "Member 4"].map(col);
        const teams = rows.filter(r => r.number > header.number && r.cells[teamCol]?.text && /^\d+$/.test(r.cells[serialCol]?.text.trim())).map(r => ({
            team_uuid: String(r.number), team_name: r.cells[teamCol].text,
            members: members.flatMap(i => r.cells[i]?.text ? [{ first_name: r.cells[i].text }] : [])
        }));
        return NextResponse.json({ teams }, { headers: { "Cache-Control": "private, no-store" } });
    } catch {
        return NextResponse.json({ message: "Could not load the current team roster." }, { status: 503 });
    }
}
