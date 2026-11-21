"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { AttendanceTeam } from "@/lib/roster";
import type { AttendanceMember } from "@/types/AttendanceProfile";

export default function MemberProfileEditor({ team, member, onSaved, onLatest, onCancel, onBusy }: {
    team: AttendanceTeam; member: AttendanceMember; onSaved: (team: AttendanceTeam) => void; onLatest: (team: AttendanceTeam) => void;
    onCancel: () => void; onBusy: (busy: boolean) => void;
}) {
    const [email, setEmail] = useState(member.email || "");
    const [phone, setPhone] = useState(member.phone_number || "");
    const [college, setCollege] = useState(member.college || "");
    // Keep the version associated with this draft, even when the roster polls in the background.
    const [version] = useState(member.profile_version);
    const [name] = useState(member.first_name);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    async function save(event: React.FormEvent) {
        event.preventDefault();
        if (busy) return;
        setBusy(true); onBusy(true); setError("");
        try {
            const response = await fetch("/api/admin/member-profiles", {
                method: "PATCH", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ team_uuid: team.team_uuid, slot: member.slot, member_name: name,
                    profile_version: version, email, phone_number: phone, college }),
            });
            const data = await response.json();
            if (!response.ok) {
                if (response.status === 409 && data.team) onLatest(data.team);
                throw new Error(data.message || "Could not save member details.");
            }
            onSaved(data.team);
        } catch (error) {
            setError(error instanceof Error ? error.message : "Could not save. Your draft is still here.");
        } finally { setBusy(false); onBusy(false); }
    }
    return <form className="member-profile-editor" onSubmit={save} aria-label={"Edit details for " + name} aria-busy={busy}>
        <fieldset disabled={busy}>
            <label>Email<input autoFocus className="mc-input" type="email" autoComplete="off" maxLength={254} value={email} onChange={event => setEmail(event.target.value)}/></label>
            <label>Phone<input className="mc-input" type="tel" inputMode="tel" autoComplete="off" maxLength={40} placeholder="10-digit number" value={phone} onChange={event => setPhone(event.target.value)}/></label>
            <label>College / organisation<input className="mc-input" autoComplete="off" maxLength={500} value={college} onChange={event => setCollege(event.target.value)}/></label>
        </fieldset>
        {error && <p role="alert" className="sheet-error">{error}</p>}
        <div className="member-profile-actions"><button className="mc-btn" type="submit" disabled={busy}>{busy && <Loader2 className="save-spinner" size={15} aria-hidden="true"/>}{busy ? "Saving…" : "Save details"}</button>
            <button className="table-action" type="button" disabled={busy} onClick={onCancel}>Cancel</button></div>
    </form>;
}
