"use client";

import { useArchiveData } from "@/components/ArchiveData";
import { useEdition } from "@/hooks/useEdition";

import { useSession, signOut } from "next-auth/react";
import { useTeamCache } from "@/hooks/useTeamCache";
import Button from "@/components/Button";
import { useMemo } from "react";
import { User } from "lucide-react";

type RawMember = {
    email?: string;
    profile_image?: string;
    profile?: string;
    avatar?: string;
};

function norm(s?: string) {
    return (s || "").toLowerCase().trim();
}

export default function Participants() {
    const { members: rawMembersData } = useArchiveData();
    const { base, archive } = useEdition();
    const { data } = useSession();
    const email = data?.user?.email || null;
    const { team, loading, error, clearAll, refresh } = useTeamCache(email);

    const profileByEmail = useMemo(() => {
        const map = new Map<string, string>();
        if (!archive) return map;
        (rawMembersData as RawMember[]).forEach(m => {
            const e = norm(m.email);
            if (!e) return;
            const url = m.profile_image || m.profile || m.avatar || "";
            if (url) map.set(e, url);
        });
        return map;
    }, [archive, rawMembersData]);

    const getProfileImage = (e: string) => {
        const url = profileByEmail.get(norm(e));
        return url && url.length > 4 ? url : null;
    };

    const me = team?.members_data.find(m => norm(m.email) === norm(email || ""));
    const status = team?.status?.state || "active";
    const note = team?.status?.note || "";

    async function handleHardRefresh() {
        await clearAll();
        await refresh();
    }

    return (
        <main className={"min-h-dvh bg-[var(--bg)] flex flex-col" + (archive ? "" : " wizard-candidate")}>
            <header className="px-6 lg:px-10 py-6 border-b border-2">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div>
                        <div className="mc-font relative top-1 text-3xl">NexStats</div>
                        <div className="text-muted text-sm">Participant Dashboard</div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => signOut({ callbackUrl: "/" })}>Logout</Button>
                    </div>
                </div>
            </header>

            {status !== "active" && !loading && !error && team && (
                <section className="px-6 lg:px-10 pt-6">
                    <div className="max-w-6xl mx-auto">
                        <div className={`mc-card p-4 pixel ${status === "disqualified" ? "border border-[var(--red)]" : "border border-[var(--gold)]"}`}>
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className={`mc-font relative top-1 text-lg capitalize ${status === "disqualified" ? "text-[var(--red)]" : "text-[var(--gold)]"}`}>{status}</div>
                                    {note && <div className="text-sm mt-1 whitespace-pre-wrap text-2">{note}</div>}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            <section className="flex-1 px-6 lg:px-10 py-6">
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {loading && (
                            <div className="mc-card p-8 pixel flex items-center justify-center">
                                <span className="w-28 h-3 bg-mc-bar animate-mc-bar pixel" />
                            </div>
                        )}

                        {!loading && error && (
                            <div className="mc-card p-6 pixel text-[var(--error)]">{error}</div>
                        )}

                        {!loading && team && (
                            <>
                                <div className="mc-card p-6 pixel">
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <div className="mc-font relative top-1 text-2xl">{team.name}</div>
                                                <div className="text-muted text-sm">{team.members_count} members</div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            <div className="surface border border-2 rounded-lg p-3 pixel"><div className="text-xs text-muted">Block</div><div className="text-base">{team.assigned_block || "-"}</div></div>
                                            <div className="surface border border-2 rounded-lg p-3 pixel"><div className="text-xs text-muted">Floor</div><div className="text-base">{team.assigned_floor || "-"}</div></div>
                                            <div className="surface border border-2 rounded-lg p-3 pixel"><div className="text-xs text-muted">Room</div><div className="text-base">{team.assigned_room_no || "-"}</div></div>
                                            <div className="surface border border-2 rounded-lg p-3 pixel"><div className="text-xs text-muted">Desk</div><div className="text-base">{team.assigned_desk || "-"}</div></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mc-card p-6 pixel">
                                    <div className="mb-4 flex items-center gap-4">
                                        {getProfileImage(me?.email || "") ? (
                                            <img
                                                src={getProfileImage(me?.email || "") as string}
                                                alt="Profile"
                                                className="w-16 h-16 rounded-full border border-2 object-cover"
                                                referrerPolicy="no-referrer"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="w-16 h-16 rounded-full border border-2 flex items-center justify-center bg-[var(--bg-3)]">
                                                <User className="w-8 h-8 text-2" />
                                            </div>
                                        )}
                                        <div>
                                            <div className="mc-font relative top-1 text-xl">Your Info</div>
                                            <div className="text-muted text-sm">{email}</div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="surface border border-2 rounded-lg p-3 pixel"><div className="text-xs text-muted">Name</div><div className="text-base">{me?.name || "-"}</div></div>
                                        <div className="surface border border-2 rounded-lg p-3 pixel"><div className="text-xs text-muted">Phone</div><div className="text-base">{me?.phone || "-"}</div></div>
                                        <div className="surface border border-2 rounded-lg p-3 pixel"><div className="text-xs text-muted">Role</div><div className="text-base">{me?.is_leader ? "Leader" : "Member"}</div></div>
                                    </div>
                                </div>

                                <div className="mc-card p-6 pixel">
                                    <div className="mb-4">
                                        <div className="mc-font relative top-1 text-xl">Team Members</div>
                                        <div className="text-muted text-sm">Includes leader</div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {team.members_data.map(m => (
                                            <div key={m.email} className="surface border border-2 rounded-lg p-3 pixel">
                                                <div className="flex items-start gap-3">
                                                    {getProfileImage(m.email) ? (
                                                        <img
                                                            src={getProfileImage(m.email) as string}
                                                            alt=""
                                                            className="w-12 h-12 rounded-full border border-2 object-cover"
                                                            referrerPolicy="no-referrer"
                                                            loading="lazy"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-full border border-2 flex items-center justify-center bg-[var(--bg-3)]">
                                                            <User className="w-6 h-6 text-2" />
                                                        </div>
                                                    )}
                                                    <div className="flex-1">
                                                        <div className="font-semibold">{m.name}</div>
                                                        <div className="text-2 text-sm break-all">{m.email}</div>
                                                        <div className="mt-1 text-sm">{m.phone || "-"}</div>
                                                    </div>
                                                </div>
                                                <div className="mt-3">
                                                    {m.is_leader ? <span className="role role--participant">Leader</span> : <span className="role">Member</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <aside className="space-y-6">
                        {!loading && team && (
                            <div className="mc-card p-6 pixel">
                                <div className="mc-font relative top-1 text-xl mb-3">Status</div>
                                <div className="flex items-center gap-2">
                                    <span className={`role ${status === "active" ? "role--organizer" : status === "disqualified" ? "role--participant" : "role"}`}>
                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                    </span>
                                </div>
                                {note && <div className="text-sm text-2 mt-3 whitespace-pre-wrap">{note}</div>}
                            </div>
                        )}
                        {!loading && team?.notes && team.notes.trim().length > 0 && (
                            <div className="mc-card p-6 pixel">
                                <div className="mc-font relative top-1 text-xl mb-2">Organizer Notes</div>
                                <div className="text-sm text-2 whitespace-pre-wrap">{team.notes}</div>
                            </div>
                        )}
                    </aside>
                </div>
            </section>

            <footer className="py-6 text-center">
                <Button variant="ghost" onClick={handleHardRefresh}>Refresh</Button>
            </footer>
        </main>
    );
};