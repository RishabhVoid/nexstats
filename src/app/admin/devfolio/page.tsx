"use client";

import Link from "next/link";
import { useState } from "react";
import { GraduationCap, Search } from "lucide-react";
import AdminHeader from "@/components/AdminHeader";
import EventMetrics from "@/components/EventMetrics";
import AdminSelect, { attendanceOptions } from "@/components/AdminSelect";
import AttendanceBadge from "@/components/AttendanceBadge";
import MemberProfile from "@/components/MemberProfile";
import TeamDetails from "@/components/TeamDetails";
import Toggle from "@/components/Toggle";
import { useRoster } from "@/hooks/useRoster";

export default function RosterPage() {
    const { teams, error } = useRoster();
    const [details, setDetails] = useState<{ teamId: string; slot?: number }>();
    const [view, setView] = useState<"Members" | "Teams">("Teams");
    const [query, setQuery] = useState("");
    const [size, setSize] = useState("");
    const [attendance, setAttendance] = useState("");
    const [countable, setCountable] = useState(false);
    const [selected, setSelected] = useState(new Set<string>());
    const search = query.trim().toLowerCase();
    const matchingTeams = (teams || []).filter(team => (!size || Number(size) === team.members.length) &&
        (!attendance || (attendance === "unmarked" ? !team.attendance : attendance === team.attendance)));
    const rows = matchingTeams.flatMap(team => {
        const names = team.members.map(member => member.first_name);
        return view === "Teams" ? [{ id: team.team_uuid, name: team.team_name, team, names, member: undefined as typeof team.members[number] | undefined }]
            : team.members.map((member, i) => ({ id: team.team_uuid + "/" + i, name: member.first_name, team, names: [] as string[], member }));
    }).filter(row => [row.name, row.team.team_name, row.team.room, ...row.names,
        ...(row.member ? [row.member.email || "", row.member.phone_number || "", row.member.college || ""]
            : [row.team.emergency_contact, ...(row.team.colleges || []), ...row.team.members.flatMap(member => [member.email || "", member.phone_number || ""])])
    ].some(value => value.toLowerCase().includes(search)));
    function toggle(id: string) {
        setSelected(previous => {
            const next = new Set(previous);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    }
    return <main className="admin-page"><AdminHeader title="Manage roster"/><div className="workspace-body workspace-roster">
        {teams && <EventMetrics teams={teams}/>}
        <section className="paper-panel roster-controls" aria-label="Roster filters">
            <div className="section-heading"><div className="roster-tabs" aria-label="Roster view">{(["Teams", "Members"] as const).map(label =>
                <button key={label} aria-pressed={view === label} onClick={() => {setView(label);setSelected(new Set());}}>{label}</button>)}</div>
</div>
            <div className="roster-filters"><label className="search-field"><Search size={17} aria-hidden="true"/>
                <input aria-label="Search roster" placeholder="Team, member, email, phone or college" value={query} onChange={e => setQuery(e.target.value)}/></label>
                <AdminSelect label="Team size" value={size} onChange={setSize} options={[{value: "", label: "All team sizes"},
                    ...Array.from(new Set(teams?.map(team => team.members.length))).sort((a,b) => a-b).map(n => ({value: String(n), label: n + " members"}))]}/>
                <AdminSelect label="Attendance" value={attendance} onChange={setAttendance} options={[{value: "", label: "All attendance"},
                    ...attendanceOptions.map(option => ({...option, value: option.value || "unmarked"}))]}/>
                <button className="mc-btn" onClick={() => {setQuery("");setSize("");setAttendance("");setSelected(new Set());}}>Clear filters</button>
            </div>
            <div className="selection-summary"><Toggle label="Countable Mode" checked={countable} onChange={setCountable}/>
                <p aria-live="polite">{teams ? rows.length + " " + (rows.length === 1 ? view.slice(0, -1).toLowerCase() : view.toLowerCase()) : "Loading…"}{teams && countable && " · " + rows.filter(row => selected.has(row.id)).length + " selected"}</p></div>
        </section>
        {error && <p role="alert" className="sheet-error">{error}</p>}
        {teams ? <section className="roster-cards" data-view={view} tabIndex={0} aria-label={view}>{rows.map(row => <article key={row.id} className={"roster-card paper-panel" + (countable && selected.has(row.id) ? " selected" : "")}>
            <div className="roster-card-heading">{countable && <input type="checkbox" aria-label={"Select " + row.name} checked={selected.has(row.id)} onChange={() => toggle(row.id)}/>}
                <div><h2>{row.name}</h2><p>{view === "Members" ? row.team.team_name : row.team.members.length + " members"}</p></div>
                <div className="room-label"><span>Room</span><strong>{row.team.room || (row.team.room_status === "ambiguous" ? "Review" : "Unassigned")}</strong></div>
            </div>
            {view === "Teams" && <p className="roster-college" title={(row.team.colleges || []).join(" · ")}><GraduationCap size={14} aria-hidden="true"/>
                <span>{(row.team.colleges || []).length > 1 ? "College / organisation details" : row.team.colleges?.[0] || "College / organisation not available"}</span></p>}
            {row.member && <div className="roster-profile"><MemberProfile member={row.member}/></div>}
            {view === "Teams" && <ul className="roster-member-list">{row.names.map((name,i) => <li key={i}>{name}</li>)}</ul>}
            <div className="team-record"><AttendanceBadge value={row.team.attendance}/><span>College ID <b>{row.team.college_id ? "Verified" : "Pending"}</b></span>
                <span>Kit <b>{row.team.kit_distribution ? "Distributed" : "Pending"}</b></span></div>
            <div className="roster-card-footer"><span>{row.team.emergency_contact ? "Emergency: " + row.team.emergency_contact : row.team.team_lead?.phone_number ? "Lead: " + row.team.team_lead.phone_number : "Contact not available"}</span>
                <button type="button" className="table-action" onClick={() => setDetails({ teamId: row.team.team_uuid, slot: row.member?.slot })}>{row.member ? "Edit details" : "Details"}</button>
                <Link className="table-action" href={"/admin/register-team?team=" + row.team.team_uuid}>Open check-in</Link></div>
        </article>)}
            {!rows.length && <p className="empty-state">No matching entries.</p>}
        </section> : !error && <p role="status">Loading roster…</p>}
    </div><TeamDetails team={teams?.find(team => team.team_uuid === details?.teamId)} initialEditSlot={details?.slot} onClose={() => setDetails(undefined)}/></main>;
}
