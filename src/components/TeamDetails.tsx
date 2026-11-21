"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import type { AttendanceTeam } from "@/lib/roster";
import AttendanceBadge from "@/components/AttendanceBadge";
import MemberProfile from "@/components/MemberProfile";

import MemberProfileEditor from "@/components/MemberProfileEditor";
import { useRoster } from "@/hooks/useRoster";

export default function TeamDetails({ team: selected, onClose, initialEditSlot, onTeamUpdated }: {
    team?: AttendanceTeam; onClose: () => void; initialEditSlot?: number; onTeamUpdated?: (team: AttendanceTeam) => void;
}) {
    const { teams, updateTeam } = useRoster();
    const team = teams?.find(team => team.team_uuid === selected?.team_uuid) || selected;
    const [editing, setEditing] = useState<number>();
    const [busy, setBusy] = useState(false);
    const [saved, setSaved] = useState<number>();
    useEffect(() => { setEditing(initialEditSlot); setSaved(undefined); }, [selected?.team_uuid, initialEditSlot]);
    useEffect(() => {
        if (saved === undefined) return;
        const timer = window.setTimeout(() => setSaved(undefined), 2000);
        return () => window.clearTimeout(timer);
    }, [saved]);
    function close() { if (!busy) { setEditing(undefined); onClose(); } }
    const colleges = team?.colleges || [];
    const dialog = useRef<HTMLDialogElement>(null);
    useEffect(() => {
        const element = dialog.current;
        if (team && element && !element.open) element.showModal();
        else if (!team && element?.open) element.close();
    }, [team]);
    return <dialog ref={dialog} className="team-details-dialog" aria-labelledby="team-details-title"
        onCancel={event => { event.preventDefault(); close(); }} onClick={event => { if (event.target === event.currentTarget) close(); }}>
        {team && <>
            <header><div><span className="form-section-label">Team details</span><h2 id="team-details-title">{team.team_name}</h2></div>
                <button type="button" className="details-close" disabled={busy} onClick={close} aria-label="Close team details"><X size={20}/></button></header>
            <div className="team-details-summary"><AttendanceBadge value={team.attendance}/><span>Room <strong>{team.room || "Unassigned"}</strong></span>
                <span>{team.members.length} members</span><span>Team lead: <strong>{team.members[0]?.first_name || "—"}</strong></span></div>
            <div className="team-details-body" tabIndex={0}>
                <section className="team-colleges"><h3>Colleges / organisations</h3>{colleges.length ? <ul>{colleges.map(college => <li key={college}>{college}</li>)}</ul> : <p className="profile-unavailable">College information is not available for this team.</p>}</section>
                <div className="team-detail-members">{team.members.map((member, i) => <section key={member.slot ?? i} className="detail-member">
                    <div className="detail-member-title"><h3>{member.first_name}</h3>{i === 0 && <span>Team lead</span>}</div>
                    {editing === member.slot ? <MemberProfileEditor key={team.team_uuid + "/" + member.slot} team={team} member={member} onBusy={setBusy}
                        onCancel={() => setEditing(undefined)} onLatest={latest => { updateTeam(latest); onTeamUpdated?.(latest); }} onSaved={updated => {
                            updateTeam(updated); onTeamUpdated?.(updated); setEditing(undefined); setSaved(member.slot);
                        }}/> : <><MemberProfile member={member}/><button type="button" className="table-action member-edit-button" disabled={busy}
                            onClick={() => { setEditing(member.slot); setSaved(undefined); }}>
                            {saved === member.slot ? <Check size={14} aria-hidden="true"/> : <Pencil size={14} aria-hidden="true"/>}
                            {saved === member.slot ? "Saved" : member.profile_status === "unmatched" ? "Add details" : "Edit details"}</button></>}
                </section>)}</div>
            </div>
        </>}
    </dialog>;
}
