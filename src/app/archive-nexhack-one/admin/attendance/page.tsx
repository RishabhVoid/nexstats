import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthConfig } from "@/config/authConfig";
import { staffRole } from "@/lib/access";
import { workbookClient } from "@/lib/googleSheets";

export const dynamic = "force-dynamic";
export default async function ArchiveAttendance() {
    const session = await getServerSession(AuthConfig);
    if (session?.user.role !== "organizer" || staffRole(session.user.email) !== "admin") redirect("/archive-nexhack-one");
    const spreadsheetId = process.env.NEXSTATS_ARCHIVE_SPREADSHEET_ID;
    let rows: string[][] = [];
    let failed = false;
    try {
        if (!spreadsheetId) throw new Error();
        const { api } = await workbookClient();
        const { data } = await api.values.get({ spreadsheetId, range: "'Team Members'!A:K" });
        rows = (data.values || []).slice(1).filter(r => String(r[7]).trim().toLowerCase() === "present");
    } catch { failed = true; }
    return <main className="p-6 space-y-4"><Link href="/archive-nexhack-one/admin" className="mc-btn">Back to Admin</Link>
        <h1 className="mc-font text-2xl">First-edition attendance</h1>
        {failed ? <p role="alert">The original workbook could not be loaded.</p> : <>
            <p>{rows.length} teams marked present in the original workbook.</p>
            <div className="grid-scroll"><table><thead><tr><th>Team</th><th>Members</th><th>College ID</th><th>Aadhaar ID</th><th>Kit</th></tr></thead>
                <tbody>{rows.map((r,i) => <tr key={i}><td><span>{r[1]}</span></td><td><span>{r.slice(2,6).filter(Boolean).join(", ")}</span></td>
                    {[8,9,10].map(c => <td key={c}><span>{r[c] || "—"}</span></td>)}</tr>)}</tbody></table></div></>}
    </main>;
}
