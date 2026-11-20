"use client";

import { useMemo, useState } from "react";
import teamsJson from "@/data/teams.json";
import membersJson from "@/data/members.json";
import DevfolioHeader from "@/components/DevfolioHeader";
import Toggle from "@/components/Toggle";
import clsx from "clsx";

type MemberForm = { name: string; email: string; phone?: string; is_leader: boolean };
type RawMember = {
    uuid?: string;
    email?: string;
    username?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    phone_number?: string | null;
    team_uuid?: string | null;
    team_name?: string | null;
    team?: { uuid?: string | null; name?: string | null; status?: string | null } | null;
};
type RawTeam = { team_uuid: string; team_name: string; team_status?: string | null; members: RawMember[]; room?: string; floor?: string; };

function toName(m: RawMember) {
    const full = [m.first_name, m.last_name].filter(Boolean).join(" ").trim();
    return full || (m.username || "");
}

function normalizeTeamsFromMembers(list: RawMember[]): RawTeam[] {
    const map = new Map<string, RawTeam>();
    for (const m of list || []) {
        const tu = String(m.team_uuid || m.team?.uuid || "").trim();
        const tn = String(m.team_name || m.team?.name || "").trim() || "Unnamed Team";
        const key = tu || tn.toLowerCase();
        if (!map.has(key)) map.set(key, { team_uuid: tu || key, team_name: tn, team_status: m.team?.status || null, members: [] });
        map.get(key)!.members.push(m);
    }
    return Array.from(map.values());
}

export default function Register() {
    const source: RawTeam[] = useMemo(() => {
        const t = (teamsJson as any[])?.map?.((x: any) => ({ ...x, members: x.members || [] })) || [];
        if (t.length > 0) return t as RawTeam[];
        return normalizeTeamsFromMembers((membersJson as any[]) as RawMember[]);
    }, []);

    const [query, setQuery] = useState("");
    const [teamName, setTeamName] = useState("");
    const [assignedBlock, setAssignedBlock] = useState("F");
    const [assignedFloor, setAssignedFloor] = useState("");
    const [assignedRoom, setAssignedRoom] = useState("");
    const [assignedDesk, setAssignedDesk] = useState("");
    const [notes, setNotes] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);

    const [hasCollegeId, setHasCollegeId] = useState(false);
    const [hasAdharId, setHasAdharId] = useState(false);
    const [hasKit, setHasKit] = useState(false);
    const [emergencyContact, setEmergencyContact] = useState("");

    const [members, setMembers] = useState<MemberForm[]>([
        { name: "", email: "", phone: "", is_leader: true },
        { name: "", email: "", phone: "", is_leader: false },
        { name: "", email: "", phone: "", is_leader: false },
        { name: "", email: "", phone: "", is_leader: false }
    ]);
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState<{ ok?: string; err?: string }>({});

    const suggestions = useMemo(() => {
        const q = query.toLowerCase().trim();
        if (!q) return [];
        const byTeam = source.filter(t => (t.team_name || "").toLowerCase().includes(q));
        const byMember = source.filter(t =>
            (t.members || []).some(m => {
                const n = toName(m).toLowerCase();
                const e = (m.email || "").toLowerCase();
                const p = (m.phone_number || "").toLowerCase();
                return n.includes(q) || e.includes(q) || p.includes(q);
            })
        );
        const all = [...byTeam, ...byMember];
        const uniq = new Map<string, RawTeam>();
        for (const t of all) if (!uniq.has(t.team_uuid)) uniq.set(t.team_uuid, t);
        return Array.from(uniq.values()).slice(0, 50);
    }, [query, source]);

    const pick = (t: RawTeam) => {
        setShowDropdown(false);
        setTeamName(t.team_name || "");
        const mapped = (t.members || []).slice(0, 4).map((m, i) => ({
            name: toName(m),
            email: m.email || "",
            phone: m.phone_number || "",
            is_leader: i === 0
        }));
        while (mapped.length < 4) mapped.push({ name: "", email: "", phone: "", is_leader: false });
        setMembers(mapped.slice(0, 4));
        setQuery(t.team_name || "");
        setMsg({});
        setEmergencyContact((t.members || []).slice(0, 4)?.at(0)?.phone_number ?? "");
        setAssignedFloor(t.floor ?? "");
        setAssignedRoom(t.room ?? "");
    };

    const tryAutoPick = () => {
        const q = query.toLowerCase().trim();
        if (!q) {
            setShowDropdown(false);
            return;
        }
        const exactTeam = source.find(t => (t.team_name || "").toLowerCase() === q);
        if (exactTeam) {
            pick(exactTeam);
            return;
        }
        const byEmail: RawTeam[] = [];
        for (const t of source) {
            if ((t.members || []).some(m => (m.email || "").toLowerCase() === q)) byEmail.push(t);
        }
        if (byEmail.length === 1) pick(byEmail[0]);
        else setShowDropdown(false);
    };

    const setMember = (i: number, patch: Partial<MemberForm>) =>
        setMembers(prev => prev.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));

    const markLeader = (i: number) =>
        setMembers(prev => prev.map((m, idx) => ({ ...m, is_leader: idx === i })));

    const cleaned = useMemo(
        () =>
            members.map(m => ({
                ...m,
                name: m.name.trim(),
                email: m.email.trim(),
                phone: (m.phone || "").trim()
            })),
        [members]
    );

    const requiredFilled = Boolean(
        cleaned[0]?.name && cleaned[0]?.email && cleaned[1]?.name && cleaned[1]?.email
    );

    const payloadMembers = cleaned.filter(m => m.name && m.email);
    const leaderIdx = (members.findIndex(m => m.is_leader) + 1) || 0;

    const resetForm = () => {
        setTeamName("");
        setAssignedBlock("F");
        setAssignedFloor("");
        setAssignedRoom("");
        setAssignedDesk("");
        setNotes("");
        setHasCollegeId(false);
        setHasAdharId(false);
        setHasKit(false);
        setEmergencyContact("");
        setMembers([
            { name: "", email: "", phone: "", is_leader: true },
            { name: "", email: "", phone: "", is_leader: false },
            { name: "", email: "", phone: "", is_leader: false },
            { name: "", email: "", phone: "", is_leader: false }
        ]);
        setQuery("");
        setShowDropdown(false);
        setMsg({});
    };

    const submit = async () => {
        setBusy(true);
        setMsg({});
        const name = teamName.trim();
        if (!name) {
            setBusy(false);
            setMsg({ err: "Team name is required" });
            return;
        }
        if (!requiredFilled) {
            setBusy(false);
            setMsg({ err: "First two members must have name and email" });
            return;
        }
        if (payloadMembers.length < 2 || payloadMembers.length > 4) {
            setBusy(false);
            setMsg({ err: "Provide 2 to 4 members" });
            return;
        }
        if (!cleaned.some(m => m.is_leader)) {
            setBusy(false);
            setMsg({ err: "Select a team leader" });
            return;
        }
        if (!emergencyContact.trim()) {
            setBusy(false);
            setMsg({ err: "Emergency contact is required" });
            return;
        }
        const emails = payloadMembers.map(m => m.email.toLowerCase());
        if (new Set(emails).size !== emails.length) {
            setBusy(false);
            setMsg({ err: "Duplicate member emails" });
            return;
        }
        try {
            const r = await fetch("/api/archive-nexhack-one/teams", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    emails,
                    members_data: payloadMembers.map(m => ({
                        email: m.email.toLowerCase(),
                        name: m.name,
                        phone: m.phone,
                        is_leader: m.is_leader
                    })),
                    assigned_block: assignedBlock.trim(),
                    assigned_floor: assignedFloor.trim(),
                    assigned_room_no: assignedRoom.trim(),
                    assigned_desk: assignedDesk.trim(),
                    college_id: hasCollegeId,
                    aadhar_id: hasAdharId,
                    kit_distribution: hasKit,
                    emergency_contact: emergencyContact.trim(),
                    notes: notes.trim()
                })
            });
            const j = await r.json();
            if (!r.ok) setMsg({ err: j?.message || "Failed to save" });
            else {
                resetForm();
                setMsg({ ok: "Team registered" });
            }
        } catch {
            setMsg({ err: "Failed to save" });
        } finally {
            setBusy(false);
        }
    };

    return (
        <main className="min-h-dvh bg-[var(--bg)] relative" aria-busy={busy}>
            {busy && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                    <div className="mc-card p-6 pixel flex items-center gap-3">
                        <span className="w-24 h-3 bg-mc-bar animate-mc-bar pixel" />
                        <div className="mc-font text-lg">Saving…</div>
                    </div>
                </div>
            )}

            <div className={`w-full px-4 sm:px-6 py-8 sm:py-12 sm:pt-6 ${busy ? "pointer-events-none select-none opacity-70" : ""}`}>
                <DevfolioHeader></DevfolioHeader>
                <div className="mb-8 flex flex-wrap items-end gap-4"></div>

                <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-6">
                    <section className="mc-card p-6 sm:p-8 pixel">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="surface-alt border border-2 rounded-lg p-4 pixel relative">
                                <div className="mc-font text-sm mb-2">Search Existing</div>
                                <input
                                    value={query}
                                    onChange={e => {
                                        setQuery(e.target.value);
                                        setShowDropdown(true);
                                    }}
                                    onFocus={() => setShowDropdown(true)}
                                    onBlur={() => setTimeout(() => setShowDropdown(false), 120)}
                                    onKeyDown={e => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            tryAutoPick();
                                        }
                                    }}
                                    placeholder="Team name, leader name, email, or phone"
                                    className="mc-input w-full pixel"
                                    disabled={busy}
                                    autoComplete="off"
                                />
                                {showDropdown && suggestions.length > 0 && (
                                    <div className="absolute left-4 right-4 mt-2 max-h-64 overflow-auto border border-2 rounded-lg surface divide-y divide-[var(--line-2)] pixel z-20">
                                        {suggestions.map(t => (
                                            <button
                                                key={t.team_uuid}
                                                onMouseDown={e => e.preventDefault()}
                                                onClick={() => pick(t)}
                                                className="w-full text-left p-3 hover:bg-[var(--bg-3)]"
                                            >
                                                <div className="font-semibold">{t.team_name}</div>
                                                <div className="text-xs text-muted">
                                                    {(t.members || []).map(m => m.email).filter(Boolean).join(" • ")}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="surface-alt border border-2 rounded-lg p-4 pixel">
                                <div className="mc-font text-sm mb-2">Team Name</div>
                                <input
                                    value={teamName}
                                    onChange={e => setTeamName(e.target.value)}
                                    placeholder="Enter team name"
                                    className="mc-input w-full pixel"
                                    disabled={busy}
                                />
                                <div className="text-xs text-muted mt-2">Four slots are open by default. First two are required; the last two are optional.</div>
                            </div>
                        </div>

                        <div className="mt-8 mc-font text-base">Members</div>
                        <div className="text-xs text-muted mb-4">Min 2, Max 4 • Leader: {leaderIdx}</div>

                        <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
                            {members.map((m, i) => (
                                <div key={i} className="surface-alt border border-2 rounded-lg p-4 pixel">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="font-semibold text-sm">
                                            Member {i + 1} {i < 2 && <span className="text-muted">(required)</span>}
                                        </div>
                                        <label className={`role ${m.is_leader ? "role--organizer" : ""}`}>
                                            <input
                                                type="radio"
                                                name="leader"
                                                className="mr-2"
                                                checked={m.is_leader}
                                                onChange={() => markLeader(i)}
                                                disabled={busy}
                                            />
                                            Leader
                                        </label>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                        <input
                                            value={m.name}
                                            onChange={e => setMember(i, { name: e.target.value })}
                                            placeholder="Full name"
                                            className={`mc-input w-full pixel ${i < 2 ? "border-[var(--brand-700)]" : ""}`}
                                            disabled={busy}
                                        />
                                        <input
                                            value={m.email}
                                            onChange={e => setMember(i, { email: e.target.value })}
                                            placeholder="Email"
                                            className={`mc-input w-full pixel ${i < 2 ? "border-[var(--brand-700)]" : ""}`}
                                            disabled={busy}
                                        />
                                        <input
                                            value={m.phone || ""}
                                            onChange={e => setMember(i, { phone: e.target.value })}
                                            placeholder="Phone (optional)"
                                            className="mc-input w-full pixel"
                                            disabled={busy}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="surface-alt border border-2 rounded-lg p-4 pixel">
                                <div className="mc-font text-sm mb-2">Venue Assignment</div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <input value={assignedBlock} onChange={e => setAssignedBlock(e.target.value)} placeholder="Block" className="mc-input w-full pixel" disabled={busy} />
                                    <input value={assignedFloor} onChange={e => setAssignedFloor(e.target.value)} placeholder="Floor" className="mc-input w-full pixel" disabled={busy} />
                                    <input value={assignedRoom} onChange={e => setAssignedRoom(e.target.value)} placeholder="Room No." className="mc-input w-full pixel" disabled={busy} />
                                </div>
                            </div>
                            <div className="surface-alt border border-2 rounded-lg p-4 pixel">
                                <div className="mc-font text-sm mb-2">Notes</div>
                                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anything important for the organizers" rows={5} className="mc-input w-full pixel" disabled={busy} />
                            </div>
                        </div>

                        <div className={clsx(
                            "mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4",
                            busy ? "pointer-events-none" : ""
                        )}>
                            <div className="surface-alt border border-2 rounded-lg p-4 pixel">
                                <div className="mc-font text-sm mb-2">Verification & Kit</div>
                                <div className="flex flex-col gap-2 text-sm">
                                    <Toggle label="Aadhar ID verified" checked={hasAdharId} onChange={e => setHasAdharId(e)} />
                                    <Toggle label="College ID verified" checked={hasCollegeId} onChange={e => setHasCollegeId(e)} />
                                    <Toggle label="Kit distributed" checked={hasKit} onChange={e => setHasKit(e)} />
                                </div>
                            </div>
                            <div className="surface-alt border border-2 rounded-lg p-4 pixel">
                                <div className="mc-font text-sm mb-2">Emergency Contact</div>
                                <input
                                    value={emergencyContact}
                                    onChange={e => setEmergencyContact(e.target.value)}
                                    placeholder="Name and phone or guardian contact"
                                    className="mc-input w-full pixel"
                                    disabled={busy}
                                />
                                <div className="text-xs text-muted mt-2">Required for safety and emergencies.</div>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-2">
                            <button
                                disabled={busy || members.length >= 4}
                                onClick={() => setMembers(prev => (prev.length < 4 ? [...prev, { name: "", email: "", phone: "", is_leader: false }] : prev))}
                                className="mc-btn mc-btn--ghost"
                            >
                                Add Member
                            </button>
                            <button
                                disabled={busy || members.length <= 2}
                                onClick={() => setMembers(prev => (prev.length > 2 ? prev.slice(0, prev.length - 1) : prev))}
                                className="mc-btn mc-btn--ghost"
                            >
                                Remove Member
                            </button>
                            <button onClick={resetForm} disabled={busy} className="mc-btn mc-btn--danger">
                                Clear Form
                            </button>
                            <button onClick={submit} disabled={busy} className="mc-btn mc-btn--primary ml-auto">
                                {busy ? "Saving…" : "Register Team"}
                            </button>
                        </div>

                        {msg.err && <div className="mt-4 text-[var(--red)] text-sm">{msg.err}</div>}
                        {msg.ok && <div className="mt-4 text-[var(--brand)] text-sm">{msg.ok}</div>}
                    </section>

                    <section className="mc-card p-6 sm:p-8 pixel">
                        <div className="mc-font text-lg mb-4">Live Preview</div>
                        <div className="surface border border-2 rounded-lg p-3 pixel mb-3">
                            <div className="text-xs text-muted mb-1">Team Name</div>
                            <div className="font-semibold">{teamName || "—"}</div>
                        </div>
                        <div className="surface border border-2 rounded-lg p-3 pixel">
                            <div className="text-xs text-muted mb-2">Members</div>
                            <ul className="text-sm space-y-2">
                                {cleaned.map((m, i) => (
                                    <li key={i} className="flex items-center justify-between">
                                        <div>
                                            <div className="font-medium">{m.name || "—"}</div>
                                            <div className="text-xs text-muted">{m.email || "—"}</div>
                                        </div>
                                        {m.is_leader && <span className="role role--organizer">Leader</span>}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="mt-3 surface border border-2 rounded-lg p-3 pixel">
                            <div className="text-xs text-muted mb-2">Venue</div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>Block: <span className="text-2">{assignedBlock || "—"}</span></div>
                                <div>Floor: <span className="text-2">{assignedFloor || "—"}</span></div>
                                <div>Room: <span className="text-2">{assignedRoom || "—"}</span></div>
                            </div>
                        </div>
                        <div className="mt-3 surface border border-2 rounded-lg p-3 pixel">
                            <div className="text-xs text-muted mb-1">Notes</div>
                            <div className="text-sm whitespace-pre-wrap">{notes || "—"}</div>
                        </div>
                        <div className="mt-3 surface border border-2 rounded-lg p-3 pixel">
                            <div className="text-xs text-muted mb-2">Verification & Emergency</div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>Aadhar ID: <span className="text-2">{hasAdharId ? "Yes" : "No"}</span></div>
                                <div>College ID: <span className="text-2">{hasCollegeId ? "Yes" : "No"}</span></div>
                                <div>Kit: <span className="text-2">{hasKit ? "Given" : "Pending"}</span></div>
                                <div>Emergency: <span className="text-2">{emergencyContact || "—"}</span></div>
                            </div>
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                            <div className={`surface-alt border border-2 rounded-lg p-3 pixel ${teamName ? "text-2" : "text-[var(--red)]"}`}>Team</div>
                            <div className={`surface-alt border border-2 rounded-lg p-3 pixel ${requiredFilled ? "text-2" : "text-[var(--red)]"}`}>First Two Filled</div>
                            <div className={`surface-alt border border-2 rounded-lg p-3 pixel ${cleaned.some(m => m.is_leader) ? "text-2" : "text-[var(--red)]"}`}>Leader Picked</div>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
};