import { listTabs, readGrid } from "@/lib/workbook";

export async function readRoster() {
    const tab = (await listTabs()).find(t => t.title === "Teams Data");
    if (!tab) throw new Error("Missing roster");
    const { rows } = await readGrid(tab.id);
    const header = rows.find(r => r.cells.some(c => c.text.trim() === "Team Name"));
    if (!header) throw new Error("Missing roster header");
    const col = (name: string) => header.cells.findIndex(c => c.text.trim() === name);
    const teamCol = col("Team Name");
    const serialCol = col("S. No.");
    const statusCol = col("Status");
    const memberCols = ["Member 1", "Member 2", "Member 3", "Member 4"].map(col);
    return rows.filter(r => r.number > header.number && r.cells[teamCol]?.text && /^\d+$/.test(r.cells[serialCol]?.text.trim())).map(r => ({
        team_uuid: String(r.number),
        team_name: r.cells[teamCol].text,
        status: r.cells[statusCol]?.text.trim() || "Unspecified",
        members: memberCols.flatMap(i => r.cells[i]?.text.trim() ? [{ first_name: r.cells[i].text.trim() }] : [])
    }));
}

export type Roster = Awaited<ReturnType<typeof readRoster>>;
