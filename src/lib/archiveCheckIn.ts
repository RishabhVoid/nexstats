import { workbookClient } from "./googleSheets";
import type { Team } from "@/models/TeamModel";

type CheckIn = Pick<Team, "name" | "college_id" | "aadhar_id" | "kit_distribution" | "emergency_contact">;
export async function syncArchiveCheckIn(team: CheckIn) {
    const spreadsheetId = process.env.NEXSTATS_ARCHIVE_SPREADSHEET_ID;
    if (!spreadsheetId) throw new Error("Archive workbook is not configured.");
    const { api } = await workbookClient();
    const { data } = await api.values.get({ spreadsheetId, range: "'Team Members'!A:L" });
    const [header, ...rows] = data.values || [];
    const norm = (v: unknown) => String(v ?? "").toLowerCase().trim();
    const expected = ["attendance","college id","adhaar id","kit distribution","emergency contact number"];
    if (norm(header?.[1]) !== "team name" || expected.some((h,i) => norm(header?.[i+7]) !== h)) {
        throw new Error("Archive columns changed.");
    }
    const matches = rows.flatMap((r,i) => norm(r[1]) === norm(team.name) ? [i+2] : []);
    if (matches.length !== 1) throw new Error("Archive team name is missing or ambiguous.");
    const row = matches[0];
    await api.values.update({ spreadsheetId, range: "'Team Members'!H" + row + ":L" + row,
        valueInputOption: "RAW", requestBody:{ values:[["Present", team.college_id ? "Yes" : "No",
        team.aadhar_id ? "Yes" : "No", team.kit_distribution ? "Yes" : "No", team.emergency_contact]] } });
}
