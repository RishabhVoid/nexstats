"use client";

import { useArchiveData } from "@/components/ArchiveData";
import { useEdition } from "@/hooks/useEdition";

import { useEffect, useMemo, useState } from "react";
import StatCard from "@/components/StatCard";
import DevfolioHeader from "@/components/DevfolioHeader";

type DevfolioMember = {
    email?: string;
    gender?: string | null;
    username?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    phone_number?: string | null;
};

type TeamMember = { email: string; name: string; phone?: string; is_leader: boolean };
type TeamStatus = { state: "active" | "eliminated" | "disqualified"; note?: string };
type Team = {
    id: string;
    name: string;
    emails: string[];
    members_count: number;
    members_data: TeamMember[];
    assigned_block?: string;
    assigned_floor?: string;
    assigned_room_no?: string;
    assigned_desk?: string;
    notes?: string;
    status?: TeamStatus;
    createdAt?: string;
    updatedAt?: string;
};

export default function Preview() {
    const { members: membersJson } = useArchiveData();
    const { api, archive } = useEdition();
    const [loadError, setLoadError] = useState("");
    const [loading, setLoading] = useState(true);
    const [teams, setTeams] = useState<Team[]>([]);
    const [query, setQuery] = useState("");
    const [genderFilter, setGenderFilter] = useState<"all" | "female" | "male" | "other" | "unknown">("all");
    const [dlg, setDlg] = useState<{ open: boolean; team?: Team; state?: "disqualified" | "eliminated" | "active"; note: string; saving: boolean }>({ open: false, note: "", saving: false });

    const genderByEmail = useMemo(() => {
        const map = new Map<string, string>();
        const list = archive && (membersJson as DevfolioMember[]) || [];
        for (const m of list) {
            const e = (m.email || "").toLowerCase().trim();
            if (!e) continue;
            const g = (m.gender || "").toLowerCase().trim();
            if (g) map.set(e, g);
        }
        return map;
    }, [archive, membersJson]);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const collected: Team[] = [];
                let page = 1;
                let totalPages = 1;
                do {
                    const response = await fetch(api + "/teams?limit=200&page=" + page, { cache: "no-store" });
                    if (!response.ok) throw new Error();
                    const data = await response.json();
                    collected.push(...data.teams);
                    totalPages = data.total_pages;
                    page++;
                } while (alive && page <= totalPages);
                if (alive) { setTeams(collected); setLoadError(""); }
            } catch {
                if (alive) setLoadError("Registrations could not be loaded. Refresh this page to retry.");
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, [api]);

    const derived = useMemo(() => {
        const totalTeams = teams.length;
        const totalMembers = teams.reduce((a, t) => a + (t.members_count || (t.members_data?.length || 0)), 0);
        let female = 0;
        let male = 0;
        let other = 0;
        let unknown = 0;
        for (const t of teams) {
            for (const m of t.members_data || []) {
                const g = genderByEmail.get(m.email.toLowerCase()) || "";
                if (g === "female" || g === "f") female++;
                else if (g === "male" || g === "m") male++;
                else if (g && g !== "prefer_not_to_say" && g !== "na" && g !== "null") other++;
                else unknown++;
            }
        }
        const bySize: Record<number, number> = { 2: 0, 3: 0, 4: 0 };
        for (const t of teams) {
            const c = t.members_data?.length || t.members_count || 0;
            if (c === 2 || c === 3 || c === 4) bySize[c] = (bySize[c] || 0) + 1;
        }
        return { totalTeams, totalMembers, female, male, other, unknown, bySize };
    }, [teams, genderByEmail]);

    const filteredTeams = useMemo(() => {
        const q = query.toLowerCase().trim();
        const gf = genderFilter;
        return teams.filter(t => {
            const matchesQ =
                !q ||
                t.name.toLowerCase().includes(q) ||
                (t.notes || "").toLowerCase().includes(q) ||
                (t.assigned_block || "").toLowerCase().includes(q) ||
                (t.assigned_room_no || "").toLowerCase().includes(q) ||
                (t.members_data || []).some(m => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || (m.phone || "").toLowerCase().includes(q));
            if (!matchesQ) return false;
            if (gf === "all") return true;
            const hasGender = (t.members_data || []).some(m => {
                const g = (genderByEmail.get(m.email.toLowerCase()) || "").toLowerCase();
                if (gf === "female") return g === "female" || g === "f";
                if (gf === "male") return g === "male" || g === "m";
                if (gf === "other") return g && g !== "male" && g !== "m" && g !== "female" && g !== "f" && g !== "prefer_not_to_say" && g !== "na" && g !== "null";
                if (gf === "unknown") return !g || g === "prefer_not_to_say" || g === "na" || g === "null";
                return true;
            });
            return hasGender;
        });
    }, [teams, query, genderFilter, genderByEmail]);

    async function submitStatus() {
        if (!dlg.team || !dlg.state) return;
        setDlg(s => ({ ...s, saving: true }));
        try {
            const r = await fetch(api + "/teams/change-status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ teamId: dlg.team.id, state: dlg.state, note: dlg.note })
            });
            const j = await r.json();
            if (!r.ok) throw new Error();
            setTeams(ts => ts.map(t => (t.id === j.team.id ? { ...t, status: j.team.status } : t)));
            setDlg({ open: false, team: undefined, state: undefined, note: "", saving: false });
        } catch {
            setDlg(s => ({ ...s, saving: false }));
        }
    }

    function openDlg(team: Team, state: "disqualified" | "eliminated") {
        const def =
            state === "disqualified"
                ? `We’re sorry to let you know that your team won’t be able to continue due to a rules issue. We deeply appreciate the effort you put in—please keep building, and we hope to see you at the next edition.`
                : `Thank you for the wonderful effort. After careful evaluation, your team didn’t advance to the next round. We loved your work—please stay in touch and keep iterating. Hope to see you next time!`;
        const prior = team.status?.state === state && team.status?.note ? team.status.note : "";
        setDlg({ open: true, team, state, note: prior || def, saving: false });
    }

    function openReinstate(team: Team) {
        const def = `Your team has been reinstated. Welcome back and best of luck in the next steps—cheering for you!`;
        setDlg({ open: true, team, state: "active", note: def, saving: false });
    }

    return (
        <main className="min-h-dvh bg-[var(--bg)] p-4 sm:p-6">
            <div className="max-w-[1680px] mx-auto flex flex-col gap-4 min-h-[calc(100dvh-2rem)]">
                <DevfolioHeader></DevfolioHeader>
                {!archive && <h1 className="admin-page-title">Registration stats</h1>}
                {loadError && <p role="alert" className="sheet-error">{loadError}</p>}

                <section className="grid [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))] gap-2 sm:gap-3">
                    <StatCard label="Teams" value={derived.totalTeams} />
                    <StatCard label="Members" value={derived.totalMembers} />
                    {archive && <><StatCard label="Female" value={derived.female} />
                    <StatCard label="Male" value={derived.male} />
                    <StatCard label="Other" value={derived.other} />
                    <StatCard label="Unknown" value={derived.unknown} /></>}
                    <StatCard label="Avg Team Size" value={derived.totalTeams ? Math.round((derived.totalMembers / derived.totalTeams) * 10) / 10 : 0} />
                    <StatCard label="With Notes" value={teams.filter(t => (t.notes || "").trim().length > 0).length} />
                    <StatCard label="Teams with 2" value={derived.bySize[2] || 0} />
                    <StatCard label="Teams with 3" value={derived.bySize[3] || 0} />
                    <StatCard label="Teams with 4" value={derived.bySize[4] || 0} />
                </section>

                <section className="mc-card p-4 sm:p-5 pixel">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                        <div className="flex gap-2 items-stretch">
                            <div className="mc-font relative top-1 text-sm self-center">Search</div>
                            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Team, member, email, phone, room, note" className="mc-input w-full pixel" />
                            <button onClick={() => setQuery("")} className="mc-btn mc-btn--ghost">Clear</button>
                        </div>
                        <div className="flex gap-2 items-stretch relative">
                            {archive && <><div className="mc-font relative top-1 text-sm self-center">Gender</div>
                            <div className="relative w-full">
                                <select value={genderFilter} onChange={e => setGenderFilter(e.target.value as any)} className="mc-input pixel w-full appearance-none pr-10">
                                    <option value="all">All</option>
                                    <option value="female">Female</option>
                                    <option value="male">Male</option>
                                    <option value="other">Other</option>
                                    <option value="unknown">Unknown</option>
                                </select>
                                <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.17l3.71-2.94a.75.75 0 1 1 .94 1.16l-4.18 3.31a.75.75 0 0 1-.94 0L5.21 8.39a.75.75 0 0 1 .02-1.18z" />
                                </svg>
                            </div></>}
                            <div className="mc-input pixel w-full flex items-center justify-between">
                                <span className="text-xs text-muted">Teams</span>
                                <span className="text-base">{filteredTeams.length}</span>
                            </div>
                        </div>
                        <div className="flex gap-2 items-stretch">
                            <div className="mc-input pixel w-full flex items-center justify-between">
                                <span className="text-xs text-muted">Members (filtered)</span>
                                <span className="text-base">{filteredTeams.reduce((a, t) => a + (t.members_data?.length || 0), 0)}</span>
                            </div>
                            <div className="mc-input pixel w-full flex items-center justify-between">
                                <span className="text-xs text-muted">Teams With Notes</span>
                                <span className="text-base">{filteredTeams.filter(t => (t.notes || "").trim().length > 0).length}</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mc-card p-3 sm:p-4 pixel flex-1 min-h-0">
                    <div className="mc-font relative top-1 text-xs text-muted mb-2 px-1">Teams</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[calc(100dvh-360px)] overflow-auto pr-1">
                        {loading && <div className="col-span-full p-6 text-center text-muted">Loading…</div>}
                        {!loading && filteredTeams.length === 0 && <div className="col-span-full p-6 text-center text-muted">No teams found</div>}
                        {filteredTeams.map(t => (
                            <div key={t.id} className="surface-alt border border-2 rounded-lg p-4 pixel min-w-0">
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="min-w-0">
                                        <div className="mc-font relative top-1 text-base break-words">{t.name}</div>
                                        <div className="text-xs text-muted">{t.members_data.length} members</div>
                                    </div>
                                    <div className="text-right text-xs text-muted leading-5 min-w-[160px]">
                                        <div>Block: <span className="text-2 break-words">{t.assigned_block || "—"}</span></div>
                                        <div>Floor: <span className="text-2 break-words">{t.assigned_floor || "—"}</span></div>
                                        <div>Room: <span className="text-2 break-words">{t.assigned_room_no || "—"}</span></div>
                                        <div>Desk: <span className="text-2 break-words">{t.assigned_desk || "—"}</span></div>
                                    </div>
                                </div>

                                {t.status?.state && t.status.state !== "active" && (
                                    <div className="mb-3 text-xs">
                                        <span className={`role capitalize ${t.status.state === "disqualified" ? "role--danger" : "role--warning"}`}>{t.status.state}</span>
                                        {t.status.note && <div className="surface border border-2 rounded pixel p-2 mt-2 whitespace-pre-wrap break-words">{t.status.note}</div>}
                                    </div>
                                )}

                                {t.notes && t.notes.trim().length > 0 && (
                                    <div className="mb-3 text-xs">
                                        <div className="text-muted mb-1">Notes</div>
                                        <div className="surface border border-2 rounded pixel p-2 whitespace-pre-wrap break-words">{t.notes}</div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    {t.members_data.map((m, i) => {
                                        const g = (genderByEmail.get(m.email.toLowerCase()) || "unknown").replace(/_/g, " ");
                                        return (
                                            <div key={i} className="surface border border-2 rounded pixel p-2">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <div className="w-full flex items-center justify-between">
                                                        <div className="font-medium break-words">{m.name || "—"}</div>
                                                        <span className="text-xs text-muted break-all">{m.email}</span>
                                                    </div>
                                                    <span className="text-xs text-muted break-words -mt-1">{m.phone || "—"}</span>
                                                    <div className="w-full flex items-center justify-between mt-2 text-sm">
                                                        {m.is_leader ? <span className="role role--organizer">Leader</span> : <span className="role">Member</span>}
                                                        <span className="role capitalize">{g || "unknown"}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="mt-3 flex gap-2">
                                    {(t.status?.state ?? "active") === "active" ? (
                                        <>
                                            <button className="mc-btn mc-btn--danger" onClick={() => openDlg(t, "disqualified")}>Disqualify</button>
                                            <button className="mc-btn" onClick={() => openDlg(t, "eliminated")}>Eliminate</button>
                                        </>
                                    ) : (
                                        <button className="mc-btn mc-btn--success" onClick={() => openReinstate(t)}>Reinstate</button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {dlg.open && dlg.team && dlg.state && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
                    <div className="surface border border-2 rounded-lg p-4 w-full max-w-lg pixel">
                        <div className="mc-font text-base mb-2">
                            {dlg.state === "active" ? "Confirm reinstatement" : `Set status: ${dlg.state}`}
                        </div>
                        <textarea
                            className="mc-input pixel w-full h-32"
                            value={dlg.note}
                            onChange={e => setDlg(s => ({ ...s, note: e.target.value }))}
                            placeholder="Message to the team"
                        />
                        <div className="mt-3 flex justify-end gap-2">
                            <button className="mc-btn mc-btn--ghost" onClick={() => setDlg({ open: false, note: "", saving: false })} disabled={dlg.saving}>Cancel</button>
                            <button className="mc-btn" onClick={submitStatus} disabled={dlg.saving}>{dlg.saving ? "Saving…" : dlg.state === "active" ? "Reinstate" : "Confirm"}</button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};