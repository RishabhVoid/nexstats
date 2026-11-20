"use client";

import Link from "next/link";
import { useState } from "react";
import { useRoster } from "@/hooks/useRoster";

export default function RosterPage() {
    const { teams, error } = useRoster();
    const [view, setView] = useState<"Teams" | "Members">("Teams");
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState("");
    const [size, setSize] = useState("");
    const [selected, setSelected] = useState(new Set<string>());
    const search = query.trim().toLowerCase();
    const rows = (teams || []).filter(team => (!status || status === team.status) &&
        (!size || Number(size) === team.members.length)).flatMap(team => {
        const names = team.members.map(m => m.first_name);
        return view === "Teams" ? [{ id: team.team_uuid, first: team.team_name, second: names.join(", "), status: team.status }]
            : names.map((name, i) => ({ id: team.team_uuid + "/" + i, first: name, second: team.team_name, status: team.status }));
    }).filter(row => [row.first, row.second].some(value => value.toLowerCase().includes(search)));
    function toggle(id: string) {
        setSelected(previous => {
            const next = new Set(previous);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    }
    return <main className="event-workspace"><header className="ledger-banner"><div className="event-container">
        <Link href="/admin">← Dashboard</Link><h1>Team and member roster</h1>
    </div></header>
        <div className="event-container event-body">
            <div className="flex flex-wrap items-center gap-3">{(["Teams", "Members"] as const).map(label =>
                <button key={label} aria-pressed={view === label} className={view === label ? "mc-btn mc-btn--primary" : "mc-btn"}
                    onClick={() => { setView(label); setSelected(new Set()); }}>{label}</button>)}
                <Link className="ml-auto underline" href="/admin/workbook">Edit workbook</Link></div>
            <div className="flex flex-wrap gap-3">
                <input className="mc-input flex-1" aria-label="Search roster" placeholder="Search teams or members" value={query} onChange={e => setQuery(e.target.value)}/>
                <select aria-label="Team status" className="mc-input" value={status} onChange={e => setStatus(e.target.value)}>
                    <option value="">All team statuses</option>{Array.from(new Set(teams?.map(t => t.status))).sort().map(s => <option key={s}>{s}</option>)}</select>
                <select aria-label="Team size" className="mc-input" value={size} onChange={e => setSize(e.target.value)}>
                    <option value="">All team sizes</option>{Array.from(new Set(teams?.map(t => t.members.length))).sort((a,b) => a-b).map(n =>
                        <option key={n} value={n}>{n} {n === 1 ? "member" : "members"}</option>)}</select>
            </div>
            {error && <p role="alert" className="sheet-error">{error}</p>}
            {teams ? <section><p aria-live="polite" className="mb-3 text-muted">{rows.length} {view.toLowerCase()} · {rows.filter(r => selected.has(r.id)).length} selected</p>
                {rows.length ? <div className="grid-scroll"><table><thead><tr><th>Select</th><th>{view === "Teams" ? "Team" : "Member"}</th>
                    <th>{view === "Teams" ? "Members" : "Team"}</th><th>Team status</th></tr></thead><tbody>
                    {rows.map(row => <tr key={row.id}><td className="px-3"><input type="checkbox" aria-label={"Select " + row.first}
                        checked={selected.has(row.id)} onChange={() => toggle(row.id)}/></td><td><span>{row.first}</span></td>
                        <td><span>{row.second || "—"}</span></td><td><span>{row.status}</span></td></tr>)}
                </tbody></table></div> : <p>No matching entries.</p>}</section> : !error && <p role="status">Loading roster…</p>}
        </div>
    </main>;
}
