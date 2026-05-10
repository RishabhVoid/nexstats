"use client";

import Input from "@/components/Input";
import Chip from "@/components/Chip";
import Toggle from "@/components/Toggle";
import rawMembers from "@/data/members.json";
import type { DevfolioTeamType, DevfolioMemberType } from "@/types/DevfolioTypes";
import { Dispatch, SetStateAction } from "react";

interface TeamsSectionProps {
    teamStatuses: string[];
    teamSizes: number[];
    tQuery: string;
    setTQuery: (v: string) => void;
    tStatus: string[];
    setTStatus: Dispatch<SetStateAction<string[]>>;
    tSize: number[];
    setTSize: Dispatch<SetStateAction<number[]>>;
    tCountable: boolean;
    setTCountable: (v: boolean) => void;
    filteredTeams: DevfolioTeamType[];
    tChecked: Set<string>;
    setTChecked: Dispatch<SetStateAction<Set<string>>>;
}

const statusLabelMap: Record<string, string> = {
    accept: "Accepted",
    accept_sent: "Approved",
    reject: "Rejected",
    reject_sent: "Reject Pending",
    rsvp: "RSVP",
    submit: "Submitted",
    waitlist: "Waitlist",
    withdraw: "Withdraw",
};

const getStatusLabel = (key: string) => statusLabelMap[key] || key || "Unknown";
const formatGender = (g?: string) => {
    if (!g) return "Unknown";
    return g.length === 1 ? g.toUpperCase() : g[0].toUpperCase() + g.slice(1);
};

export default function TeamsSection({
    teamStatuses,
    teamSizes,
    tQuery,
    setTQuery,
    tStatus,
    setTStatus,
    tSize,
    setTSize,
    tCountable,
    setTCountable,
    filteredTeams,
    tChecked,
    setTChecked,
}: TeamsSectionProps) {
    const handleCardClick = (id: string) => {
        if (!tCountable) return;
        setTChecked((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    return (
        <section className="mc-card p-4 sm:p-6 space-y-6">
            <div className="space-y-4">
                <Input
                    placeholder="Search team name, code, member"
                    value={tQuery}
                    onChange={(e) => setTQuery(e.target.value)}
                />

                <div className="space-y-3">
                    <span className="text-xs font-semibold text-muted uppercase tracking-wide">Status</span>
                    <div className="flex gap-2 flex-wrap">
                        {teamStatuses.map((s) => {
                            const active = tStatus.includes(s);
                            return (
                                <Chip
                                    key={s || "unknown"}
                                    active={active}
                                    onClick={() => setTStatus((prev) => (active ? prev.filter((x) => x !== s) : [...prev, s]))}
                                >
                                    {getStatusLabel(s)}
                                </Chip>
                            );
                        })}
                    </div>
                </div>

                <div className="space-y-3">
                    <span className="text-xs font-semibold text-muted uppercase tracking-wide">Size</span>
                    <div className="flex gap-2 flex-wrap">
                        {teamSizes.map((n) => {
                            const active = tSize.includes(n);
                            return (
                                <Chip
                                    key={n}
                                    active={active}
                                    onClick={() => setTSize((prev) => (active ? prev.filter((x) => x !== n) : [...prev, n]))}
                                >
                                    {n} {n === 1 ? "Member" : "Members"}
                                </Chip>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between py-3 border-y border-[var(--line-2)]">
                <Toggle checked={tCountable} onChange={setTCountable} label="Countable Mode" />
                <span className="text-sm font-medium text-muted">{filteredTeams.length} results</span>
            </div>

            <div className="grid gap-3">
                {filteredTeams.map((t) => {
                    const id = t.team_uuid;
                    const checked = tChecked.has(id);

                    return (
                        <div
                            key={id}
                            onClick={() => handleCardClick(id)}
                            className={`p-4 sm:p-5 rounded-lg border pixel transition-all duration-200 ${tCountable ? "cursor-pointer hover:border-[var(--brand-600)]" : ""
                                } ${checked
                                    ? "border-[var(--brand-700)] bg-[var(--brand-800)]/10 shadow-sm"
                                    : "border-[var(--line-2)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)]"
                                }`}
                        >
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-lg font-semibold truncate">{t.team_name}</h2>
                                        {tCountable && (
                                            <div className="relative flex items-center justify-center w-5 h-5 flex-shrink-0">
                                                <input
                                                    checked={checked}
                                                    onChange={() => { }}
                                                    type="checkbox"
                                                    className="w-5 h-5 rounded border-2 border-[var(--line-2)] bg-[var(--bg)] appearance-none checked:bg-[var(--brand)] checked:border-[var(--brand)] cursor-pointer transition-all duration-200"
                                                    style={{
                                                        backgroundImage: checked ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='white'%3E%3Cpath d='M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z'/%3E%3C/svg%3E")` : 'none',
                                                        backgroundSize: '80%',
                                                        backgroundPosition: 'center',
                                                        backgroundRepeat: 'no-repeat'
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                    {t.team_code && <p className="text-sm text-muted mt-1">Code: {t.team_code}</p>}
                                </div>
                            </div>

                            <div className="flex gap-2 mt-4 flex-wrap">
                                <span className="px-2.5 py-1 bg-[var(--bg)] text-xs font-medium border rounded-md pixel">
                                    {getStatusLabel(t.team_status || "")}
                                </span>
                                <span className="px-2.5 py-1 bg-[var(--bg)] text-xs font-medium border rounded-md pixel">
                                    {t.members.length} {t.members.length === 1 ? "Member" : "Members"}
                                </span>
                                <span className="px-2.5 py-1 bg-[var(--bg)] text-xs font-medium border rounded-md pixel font-mono hidden sm:inline">
                                    {t.team_uuid}
                                </span>
                            </div>

                            <div className="rounded-lg border border-[var(--line-2)] bg-[var(--bg)]/50 mt-4 overflow-hidden">
                                <div className="px-4 py-2.5 text-[10px] font-semibold text-muted uppercase tracking-wider border-b border-[var(--line-2)] bg-[var(--bg-2)]/50">
                                    Team Members
                                </div>
                                <ul className="divide-y divide-[var(--line-2)]">
                                    {t.members.map((m: DevfolioMemberType) => {
                                        const name = [m.first_name, m.last_name].filter(Boolean).join(" ") || m.username || m.email;
                                        const rsvpYes = (m as any).rsvp_time;
                                        return (
                                            <li key={m.email} className="px-4 py-3 hover:bg-[var(--bg-2)]/50 transition-colors">
                                                <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="truncate font-medium text-sm">{name}</div>
                                                        <div className="text-xs text-muted truncate mt-0.5">{m.email}</div>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        {m.status && (
                                                            <span className="px-2 py-0.5 rounded-md pixel border border-[var(--line-2)] bg-[var(--bg)] text-xs font-medium">
                                                                {getStatusLabel(m.status)}
                                                            </span>
                                                        )}
                                                        {m.gender && (
                                                            <span className="px-2 py-0.5 rounded-md pixel border border-[var(--line-2)] bg-[var(--bg)] text-xs font-medium">
                                                                {formatGender(m.gender)}
                                                            </span>
                                                        )}
                                                        {rsvpYes && (
                                                            <span className="px-2 py-0.5 rounded-md pixel bg-green-900/30 text-green-400 border border-green-700/50 text-xs font-medium">
                                                                RSVP'd
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                                                    <div className="p-2.5 border rounded-md pixel">
                                                        <div className="text-muted text-[10px] uppercase tracking-wider font-semibold mb-1">Username</div>
                                                        <div className="truncate">{m.username || "—"}</div>
                                                    </div>
                                                    <div className="p-2.5 border rounded-md pixel">
                                                        <div className="text-muted text-[10px] uppercase tracking-wider font-semibold mb-1">Phone</div>
                                                        <div className="truncate">{(m as any).phone_number || "—"}</div>
                                                    </div>
                                                    <div className="p-3 border rounded-md pixel bg-[var(--bg)]/50 hover:bg-[var(--bg)] transition-colors">
                                                        <label className="text-muted text-[10px] uppercase tracking-wider font-semibold block mb-1">Status</label>
                                                        <div className="text-sm truncate">{getStatusLabel(
                                                            rawMembers.find(mem => mem.uuid == m.uuid)?.status || ""
                                                        ) || "—"}</div>
                                                    </div>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        </div>
                    );
                })}
                {!filteredTeams.length && (
                    <div className="p-8 text-center text-muted border border-[var(--line-2)] rounded-lg pixel bg-[var(--bg-2)]">
                        No teams match your filters
                    </div>
                )}
            </div>
        </section>
    );
};