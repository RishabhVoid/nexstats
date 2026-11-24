"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Check, DoorOpen, Loader2, Plus, Search, Wifi, X } from "lucide-react";
import TeamDetails from "@/components/TeamDetails";
import DeskToggle from "@/components/DeskToggle";
import AttendanceBadge from "@/components/AttendanceBadge";
import AdminHeader from "@/components/AdminHeader";
import { useRoster } from "@/hooks/useRoster";
import { localContactNumber } from "@/lib/contactNumber";
import type { Attendance, AttendanceTeam } from "@/lib/roster";

function defaultContact(team?: AttendanceTeam) {
    return localContactNumber(team?.emergency_contact || team?.team_lead?.phone_number || "");
}

export default function Register() {
    const { teams, error, refresh, updateTeam } = useRoster();
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [searchOpen, setSearchOpen] = useState(false);
    const [activeResult, setActiveResult] = useState(0);
    const searchBox = useRef<HTMLDivElement>(null);
    const searchInput = useRef<HTMLInputElement>(null);
    const saveButton = useRef<HTMLButtonElement>(null);
    const focusSave = useRef(false);
    const searchId = useId();
    const [newTeam, setNewTeam] = useState(false);
    const [teamName, setTeamName] = useState("");
    const [selected, setSelected] = useState<AttendanceTeam>();
    const [members, setMembers] = useState<string[]>(["", "", "", ""]);
    const [attendance, setAttendance] = useState<Attendance>("Present");
    const [collegeId, setCollegeId] = useState(true);
    const [kit, setKit] = useState(true);
    const [contact, setContact] = useState("");
    const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "added" | "error">("idle");
    const busy = saveState === "saving";
    const saved = saveState === "saved" || saveState === "added";
    const [saveError, setSaveError] = useState("");
    const q = query.trim().toLowerCase();
    const results = (teams || []).filter(team => q && [team.team_name, team.room, team.emergency_contact, ...(team.colleges || []), ...team.member_slots, ...team.members.flatMap(member => [member.email || "", member.phone_number || ""])].some(name => name.toLowerCase().includes(q)));
    const opened = useRef(false);
    const active = !!selected || newTeam;
    const internetAccess = (teams?.find(team => team.team_uuid === selected?.team_uuid) || selected)?.internet_access;
    const dirty = !!selected && (JSON.stringify(members) !== JSON.stringify(selected.member_slots) || attendance !== (selected.attendance || "Absent") ||
        collegeId !== selected.college_id || kit !== selected.kit_distribution || contact !== defaultContact(selected));

    const pick = useCallback((team: AttendanceTeam, forCheckIn = true) => {
        setNewTeam(false);
        setDetailsOpen(false);
        setQuery("");
        setSearchOpen(false);
        setSelected(team);
        setMembers([...team.member_slots]);
        setAttendance(forCheckIn ? "Present" : team.attendance || "Absent");
        setCollegeId(forCheckIn || team.college_id);
        setKit(forCheckIn || team.kit_distribution);
        focusSave.current = forCheckIn;
        setContact(defaultContact(team));
        setSaveState("idle");
        setSaveError("");
    }, []);

    const resetForm = useCallback((adding = false) => {
        setSelected(undefined); setDetailsOpen(false); setNewTeam(adding); setTeamName("");
        setMembers(["", "", "", ""]); setAttendance("Present"); setCollegeId(true); setKit(true); setContact("");
        setQuery(""); setSearchOpen(false); setActiveResult(0); setSaveState("idle"); setSaveError("");
    }, []);

    useEffect(() => {
        if (!teams || opened.current) return;
        opened.current = true;
        const id = new URLSearchParams(window.location.search).get("team");
        const team = id ? teams.find(item => item.team_uuid === id) : undefined;
        if (team) pick(team);
    }, [teams, pick]);

    useEffect(() => {
        if (!searchOpen) return;
        function outside(event: PointerEvent) {
            if (!searchBox.current?.contains(event.target as Node)) setSearchOpen(false);
        }
        document.addEventListener("pointerdown", outside);
        return () => document.removeEventListener("pointerdown", outside);
    }, [searchOpen]);
    useEffect(() => {
        if (searchOpen) document.getElementById(searchId + "-" + activeResult)?.scrollIntoView({ block: "nearest" });
    }, [activeResult, searchOpen, searchId]);

    useEffect(() => {
        if (!selected || !teams || busy || dirty || query || detailsOpen) return;
        const latest = teams.find(team => team.team_uuid === selected.team_uuid);
        if (latest && JSON.stringify(latest) !== JSON.stringify(selected)) pick(latest, false);
    }, [selected, teams, busy, dirty, query, detailsOpen, pick]);

    useEffect(() => {
        if (!focusSave.current || !saveButton.current || saveButton.current.disabled) return;
        focusSave.current = false;
        saveButton.current.focus({ preventScroll: true });
    });

    useEffect(() => {
        if (!saved) return;
        if (dirty) { setSaveState("idle"); return; }
        searchInput.current?.focus();
        const timer = window.setTimeout(() => setSaveState("idle"), 2000);
        return () => window.clearTimeout(timer);
    }, [saved, dirty]);

    async function save() {
        if ((!selected && !newTeam) || busy || saved) return;
        if (newTeam && !teamName.trim()) { setSaveState("error"); setSaveError("Enter a team name."); return; }
        if (members.filter(name => name.trim()).length < 2) {
            setSaveState("error");
            setSaveError("Enter at least two member names.");
            return;
        }
        const creating = newTeam;
        setSaveState("saving");
        setSaveError("");
        try {
            const response = await fetch("/api/admin/register-team/attendance", {
                method: newTeam ? "POST" : "PATCH", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ team_name: newTeam ? teamName.trim() : undefined, team_uuid: selected?.team_uuid, version: selected?.version, member_slots: members,
                    attendance, college_id: collegeId, kit_distribution: kit, emergency_contact: contact })
            });
            const data = await response.json();
            if (!response.ok) { if (response.status === 409) refresh(); throw new Error(data.message); }
            updateTeam(data.team);
            resetForm();
            setSaveState(creating ? "added" : "saved");
        } catch (error) {
            setSaveState("error");
            setSaveError(error instanceof Error ? error.message : "Could not save. Your edits are still here.");
        }
    }

    return <main className="admin-page"><AdminHeader title="Team check-in"/>
        {busy && <div className="checkin-save-backdrop" aria-hidden="true"/>}
        <div className="workspace-body workspace-checkin">
            <div className="checkin-toolbar">
                <div className="team-search" ref={searchBox} onBlur={event => {
                    if (!event.currentTarget.contains(event.relatedTarget)) setSearchOpen(false);
                }}>
                    <label className="search-field"><Search size={17} aria-hidden="true"/><input ref={searchInput} aria-label="Find a team"
                        role="combobox" aria-expanded={searchOpen && !!q} aria-controls={searchOpen && q ? searchId : undefined}
                        aria-autocomplete="list" aria-activedescendant={searchOpen && q && results.length ? searchId + "-" + activeResult : undefined}
                        placeholder="Search team, member or room…" disabled={busy || !teams} value={query} autoComplete="off"
                        onFocus={() => { if (q) setSearchOpen(true); }}
                        onChange={event => { setQuery(event.target.value); setActiveResult(0); setSearchOpen(true); }}
                        onKeyDown={event => {
                            if (event.key === "Escape") { setSearchOpen(false); return; }
                            if ((event.key === "ArrowDown" || event.key === "ArrowUp") && results.length) {
                                event.preventDefault(); setSearchOpen(true);
                                setActiveResult(index => !searchOpen ? 0 : (index + (event.key === "ArrowDown" ? 1 : -1) + results.length) % results.length);
                            }
                            if (event.key === "Enter" && searchOpen && results[activeResult]) { event.preventDefault(); pick(results[activeResult]); }
                        }}/>
                        {query && <button type="button" disabled={busy} aria-label="Clear team search" onClick={() => {setQuery("");setSearchOpen(false);searchInput.current?.focus();}}><X size={15}/></button>}
                    </label>
                    {searchOpen && q && <div className="team-search-menu" id={searchId} role="listbox" aria-label="Matching teams">
                        <p aria-live="polite">{results.length} matching {results.length === 1 ? "team" : "teams"}</p>
                        {results.map((team, index) => <div key={team.team_uuid} id={searchId + "-" + index} role="option"
                            aria-selected={activeResult === index} onPointerMove={() => setActiveResult(index)}
                            onMouseDown={event => event.preventDefault()} onClick={() => pick(team)}>
                            <div><strong>{team.team_name}</strong><span>{team.room || "Unassigned"}</span></div>
                            <small>{team.members.map(member => member.first_name).join(", ")}</small>
                            <span className="search-result-meta">{team.attendance === "Present" ? "Checked in" : team.attendance === "Absent" ? "Absent" : "Not checked in"}</span>
                        </div>)}
                        {!results.length && <p>No matching team. Try a member name or add a team.</p>}
                    </div>}
                </div>
                <span className="checkin-roster-count">{teams ? teams.length + " teams" : "Loading roster…"}</span>
                <div><button className="mc-btn mc-btn--primary" disabled={busy} onClick={() => resetForm(true)}><Plus size={16} aria-hidden="true"/>Add team</button></div>
            </div>
            {error && <p role="alert" className="sheet-error">{error}</p>}
            <div className="checkin-layout">
                <>
                    <form onSubmit={e => {e.preventDefault();void save();}} className="paper-panel checkin-editor" aria-busy={busy}>
                        <div className="editor-title"><div><span className="form-section-label">{newTeam ? "On-site registration" : "Team registration"}</span>
                            <h2>{newTeam ? "Add a team" : selected?.team_name || "No team selected"}</h2></div>
                            {selected && <div className="editor-title-actions"><button type="button" className="mc-btn" disabled={busy} onClick={() => setDetailsOpen(true)}>Details</button>
                                <AttendanceBadge value={selected.attendance}/></div>}</div>
                        <fieldset disabled={busy || !active}>
                            {newTeam && <label className="form-field"><span>Team name</span><input className="mc-input" aria-label="Team name"
                                value={teamName} maxLength={150} onChange={e => setTeamName(e.target.value)}/></label>}
                            <h3>Team members</h3>
                            <div className="member-editor">{members.map((name,i) => <label key={i} className="form-field">
                                <span>Member {i+1}</span><input className={"mc-input" + (selected && name.trim() !== selected.member_slots[i] ? " member-edited" : "")}
                                    aria-label={"Member " + (i+1)} value={name} maxLength={150}
                                    onChange={e => setMembers(previous => previous.map((value,j) => i === j ? e.target.value : value))}/>
                            </label>)}</div>
                            <div className="desk-toggle-grid">
                                <DeskToggle label="Attendance" checked={attendance === "Present"} onChange={value => setAttendance(value ? "Present" : "Absent")}
                                    disabled={busy || !active} onLabel="Checked in" offLabel="Not checked in"/>
                                <DeskToggle label="College ID" checked={collegeId} onChange={setCollegeId} disabled={busy || !active}
                                    onLabel="Verified" offLabel="Not verified"/>
                                <DeskToggle label="Kit distribution" checked={kit} onChange={setKit} disabled={busy || !active}
                                    onLabel="Distributed" offLabel="Not distributed"/>
                            </div>
                            <div className="contact-row">
                                <label className="form-field"><span>Emergency contact number</span><input className="mc-input" type="tel" inputMode="tel" maxLength={40}
                                    value={contact} onChange={e => setContact(e.target.value)} onBlur={() => setContact(localContactNumber(contact))} placeholder="Enter contact number"/></label>
                                <div className="contact-origin"><span>Team lead</span><strong>{selected?.team_lead?.name || selected?.members[0]?.first_name || "—"}</strong>
                                    {selected && !selected.team_lead?.phone_number && <small>Number not available. Enter it here.</small>}</div>
                            </div>
                        </fieldset>
                        <div className="editor-actions"><button ref={saveButton} type="submit" disabled={busy || saved || !active}
                            className="mc-btn mc-btn--primary checkin-submit" data-saving={busy} data-saved={saved} aria-live="polite" aria-atomic="true">
                            {busy ? <Loader2 size={16} className="checkin-save-spinner" aria-hidden="true"/> : saved ? <Check size={16} aria-hidden="true"/> : null}
                            {busy ? newTeam ? "Adding…" : "Saving…" : saved ? saveState === "added" ? "Added" : "Saved" : saveState === "error" ? newTeam ? "Retry Check In" : "Retry save" : newTeam ? "Add Check In" : "Save check-in"}
                        </button></div>
                        {saveError && <p role="alert" className="sheet-error">{saveError}</p>}
                    </form>
                    <aside className="checkin-context">
                        <section className="room-pass"><DoorOpen size={24} aria-hidden="true"/><h2>Room assignment</h2>
                            <strong>{active ? selected?.room || "Unassigned" : "—"}</strong>
                            {selected?.room_status === "ambiguous" && <p>Multiple assignments. Review Room Allocation.</p>}
                            <span>{active ? members.filter(name => name.trim()).length + " team members" : "Select a team"}</span>
                            <div className="checkin-wifi" aria-labelledby="checkin-wifi-title">
                                <h3 id="checkin-wifi-title"><Wifi size={16} aria-hidden="true"/>Wi-Fi access</h3>
                                <dl><div><dt>Wi-Fi ID</dt><dd>{internetAccess?.username || (active ? "Not assigned" : "—")}</dd></div>
                                    <div><dt>Password</dt><dd>{internetAccess?.password || (active ? "Not assigned" : "—")}</dd></div></dl>
                            </div>
                        </section>
                        <section className="paper-panel saved-record"><h2>Saved check-in</h2>
                            <dl><div><dt>Attendance</dt><dd>{selected ? selected.attendance === "Present" ? "Checked in" : selected.attendance === "Absent" ? "Absent" : "Not checked in" : "—"}</dd></div>
                                <div><dt>College ID</dt><dd>{selected ? selected.college_id ? "Verified" : "Pending" : "—"}</dd></div>
                                <div><dt>Kit</dt><dd>{selected ? selected.kit_distribution ? "Distributed" : "Pending" : "—"}</dd></div>
                                <div><dt>Contact</dt><dd>{selected ? selected.emergency_contact || "Not recorded" : "—"}</dd></div></dl>
                        </section>
                    </aside>
                </>
            </div>
        </div>
    <TeamDetails team={detailsOpen ? selected : undefined} onClose={() => setDetailsOpen(false)} onTeamUpdated={updated => {
        setSelected(previous => previous && { ...previous, members: updated.members, colleges: updated.colleges, team_lead: updated.team_lead });
    }}/></main>;
}
