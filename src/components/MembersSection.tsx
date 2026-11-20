"use client";

import { useArchiveData } from "@/components/ArchiveData";
import Input from "@/components/Input";
import Chip from "@/components/Chip";
import Toggle from "@/components/Toggle";
import type { DevfolioMemberType } from "@/types/DevfolioTypes";

export default function MembersSection({
    memberStatuses,
    memberGenders,
    mQuery,
    setMQuery,
    mStatus,
    setMStatus,
    mGender,
    setMGender,
    mCountable,
    setMCountable,
    filteredMembers,
    mChecked,
    setMChecked,
}: any) {
    const { members: rawMembers } = useArchiveData();
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

    const handleCardClick = (uuid: string) => {
        if (!mCountable) return;
        setMChecked((prev: Set<string>) => {
            const updated = new Set(prev);
            updated.has(uuid) ? updated.delete(uuid) : updated.add(uuid);
            return updated;
        });
    };

    return (
        <section className="mc-card p-4 sm:p-6 space-y-6">
            <div className="space-y-4">
                <Input 
                    placeholder="Search name, email, username" 
                    value={mQuery} 
                    onChange={(e) => setMQuery(e.target.value)} 
                />

                <div className="space-y-3">
                    <span className="text-xs font-semibold text-muted uppercase tracking-wide">Status</span>
                    <div className="flex gap-2 flex-wrap">
                        {memberStatuses.map((s: string) => {
                            const active = mStatus.includes(s);
                            return (
                                <Chip
                                    key={s}
                                    active={active}
                                    onClick={() =>
                                        setMStatus((prev: string[]) => active ? prev.filter(x => x !== s) : [...prev, s])
                                    }
                                >
                                    {getStatusLabel(s)}
                                </Chip>
                            );
                        })}
                    </div>
                </div>

                <div className="space-y-3">
                    <span className="text-xs font-semibold text-muted uppercase tracking-wide">Gender</span>
                    <div className="flex gap-2 flex-wrap">
                        {memberGenders.map((g: string) => {
                            const active = mGender.includes(g);
                            return (
                                <Chip
                                    key={g}
                                    active={active}
                                    onClick={() =>
                                        setMGender((prev: string[]) => active ? prev.filter(x => x !== g) : [...prev, g])
                                    }
                                >
                                    <p className="capitalize">{g || "Unknown"}</p>
                                </Chip>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between py-3 border-y border-[var(--line-2)]">
                <Toggle checked={mCountable} onChange={setMCountable} label="Countable Mode" />
                <span className="text-sm font-medium text-muted">{filteredMembers.length} results</span>
            </div>

            <div className="grid gap-3">
                {filteredMembers.map((m: DevfolioMemberType) => {
                    const checked = mChecked.has(m.uuid);
                    const name = [m.first_name, m.last_name].filter(Boolean).join(" ") || m.username || "—";

                    return (
                        <div
                            key={m.uuid}
                            onClick={() => handleCardClick(m.uuid)}
                            className={`p-4 sm:p-5 rounded-lg border pixel transition-all duration-200 ${
                                mCountable ? "cursor-pointer hover:border-[var(--brand-600)]" : ""
                            } ${
                                checked 
                                    ? "border-[var(--brand-700)] bg-[var(--brand-800)]/10 shadow-sm" 
                                    : "border-[var(--line-2)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)]"
                            }`}
                        >
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-lg font-semibold truncate">{name}</h2>
                                        {mCountable && (
                                            <div className="relative flex items-center justify-center w-5 h-5 flex-shrink-0">
                                                <input
                                                    checked={checked}
                                                    onChange={() => {}}
                                                    type="checkbox"
                                                    className="w-5 h-5 rounded border-2 border-[var(--line-2)] bg-[var(--bg)] appearance-none checked:bg-[var(--brand)] checked:border-[var(--brand)] cursor-pointer transition-all duration-200 flex items-center justify-center"
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
                                    <p className="text-sm text-muted mt-1 truncate">{m.email}</p>
                                </div>
                            </div>

                            <div className="flex gap-2 mt-4 flex-wrap">
                                <span className="px-2.5 py-1 bg-[var(--bg)] text-xs font-medium border rounded-md pixel">
                                    {getStatusLabel(m.status || "")}
                                </span>
                                {m.gender && (
                                    <span className="px-2.5 py-1 capitalize bg-[var(--bg)] text-xs font-medium border rounded-md pixel">
                                        {m.gender}
                                    </span>
                                )}
                                {(m as any).rsvp_time && (
                                    <span className="px-2.5 py-1 bg-green-900/30 text-green-400 text-xs font-medium border border-green-700/50 rounded-md pixel">
                                        RSVP'd
                                    </span>
                                )}
                            </div>

                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                                <div className="p-3 border rounded-md pixel bg-[var(--bg)]/50 hover:bg-[var(--bg)] transition-colors">
                                    <label className="text-muted text-[10px] uppercase tracking-wider font-semibold block mb-1">Username</label>
                                    <div className="text-sm truncate">{m.username || "—"}</div>
                                </div>
                                <div className="p-3 border rounded-md pixel bg-[var(--bg)]/50 hover:bg-[var(--bg)] transition-colors">
                                    <label className="text-muted text-[10px] uppercase tracking-wider font-semibold block mb-1">Phone</label>
                                    <div className="text-sm truncate">{(m as any).phone_number || "—"}</div>
                                </div>
                                <div className="p-3 border rounded-md pixel bg-[var(--bg)]/50 hover:bg-[var(--bg)] transition-colors">
                                    <label className="text-muted text-[10px] uppercase tracking-wider font-semibold block mb-1">Status</label>
                                    <div className="text-sm truncate">{getStatusLabel(
                                        rawMembers.find(mem => mem.uuid == m.uuid)?.status || ""
                                    ) || "—"}</div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};