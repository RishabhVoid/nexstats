"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { ArrowUpRight, BookOpen, ClipboardCheck, Users } from "lucide-react";
import { useRoster } from "@/hooks/useRoster";

const actions = [
    { href: "/admin/devfolio", label: "Team and member roster", icon: Users },
    { href: "/admin/register-team", label: "Register a team", icon: ClipboardCheck },
    { href: "/admin/preview-team", label: "Registration stats", icon: BookOpen },
];

export default function Dashboard() {
    const { teams, error } = useRoster();
    const statuses = new Map<string, number>();
    const sizes = new Map<number, number>();
    for (const team of teams || []) {
        statuses.set(team.status, (statuses.get(team.status) || 0) + 1);
        sizes.set(team.members.length, (sizes.get(team.members.length) || 0) + 1);
    }
    return <main className="event-workspace">
        <header className="ledger-banner"><div className="event-container">
            <div className="flex items-center justify-between gap-4"><p className="eyebrow">NexHack 2.0</p>
                <button className="mc-btn" onClick={() => signOut({ callbackUrl: "/" })}>Sign out</button></div>
            <h1>Organizer dashboard</h1>
        </div></header>
        <div className="event-container event-body">
            <nav aria-label="Event management" className="event-actions">
                {actions.map(({ href, label, icon: Icon }) => <Link href={href} key={href}>
                    <Icon size={22} aria-hidden="true"/><span>{label}</span><ArrowUpRight size={17} aria-hidden="true"/>
                </Link>)}
            </nav>
            <section aria-labelledby="overview"><h2 id="overview">Roster overview</h2>
                {error && <p className="sheet-error" role="alert">{error}</p>}
                {teams ? <>
                    <div className="roster-counts"><span><b>{teams.length}</b> teams</span>
                        <span><b>{teams.reduce((n, t) => n + t.members.length, 0)}</b> members</span></div>
                    {teams.length > 0 && <div className="event-breakdowns">
                        <section><h3>Team status</h3><dl>{Array.from(statuses).sort(([a],[b]) => a.localeCompare(b)).map(([label, n]) =>
                            <div key={label}><dt>{label}</dt><dd>{n}</dd></div>)}</dl></section>
                        <section><h3>Team size</h3><dl>{Array.from(sizes).sort(([a],[b]) => a-b).map(([size, n]) =>
                            <div key={size}><dt>{size} {size === 1 ? "member" : "members"}</dt><dd>{n}</dd></div>)}</dl></section>
                    </div>}
                </> : !error && <p role="status">Loading roster…</p>}
            </section>
            <footer className="flex flex-wrap gap-6"><Link href="/admin/workbook">Edit workbook</Link>
                <Link href="/admin/archive" prefetch={false}>First-edition archive</Link></footer>
        </div>
    </main>;
}
