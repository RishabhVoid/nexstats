"use client";

import Link from "next/link";
import { RefreshCw } from "lucide-react";
import AdminHeader from "@/components/AdminHeader";
import EventMetrics from "@/components/EventMetrics";
import StatBars from "@/components/StatBars";
import { useRoster } from "@/hooks/useRoster";
import { eventStats } from "@/lib/eventStats";

export default function Dashboard() {
    const { teams, error, refresh, loading, syncedAt } = useRoster();
    const stats = eventStats(teams || []);
    return <main className="admin-page"><AdminHeader title="Dashboard"/>
        <div className="workspace-body workspace-dashboard">
            <div className="section-heading dashboard-sync"><div className="sync-status" role="status" data-state={error ? "error" : loading ? "loading" : "ready"}>
                <i aria-hidden="true"/><span>{loading ? "Updating roster…" : error ? "Automatic update failed" : "Automatic updates"}</span>
                {syncedAt && <small>Sheets synced <time dateTime={syncedAt}>{new Date(syncedAt).toLocaleTimeString([], {hour: "2-digit", minute: "2-digit", second: "2-digit"})}</time></small>}
            </div><button className="mc-btn" disabled={loading} onClick={refresh}><RefreshCw size={15} aria-hidden="true"/>{loading ? "Reloading…" : "Reload data"}</button></div>
            {error && <p role="alert" className="sheet-error">{error} The last loaded roster is still available.</p>}
            {teams ? <>
                <EventMetrics teams={teams}/>
                <div className="dashboard-grid dashboard-operations">
                    <section className="paper-panel arrivals-panel">
                        <h2>Arrivals</h2>
                        <div className="arrival-total"><strong>{stats.present}<span> / {stats.total}</span></strong><span>teams checked in</span></div>
                        <dl className="arrival-counts"><div><dt>Checked in</dt><dd>{stats.present}</dd></div><div><dt>Not marked</dt><dd>{stats.unmarked}</dd></div><div><dt>Absent</dt><dd>{stats.absent}</dd></div></dl>
                        <Link className="mc-btn mc-btn--primary" href="/admin/register-team">Open team check-in</Link>
                    </section>
                    <section className="paper-panel"><h2>Registration progress</h2>
                        <StatBars total={stats.total} rows={[
                            {label: "Attendance marked", value: stats.present + stats.absent},
                            {label: "College ID verified", value: stats.verified, tone: "green"},
                            {label: "Teams with kits", value: stats.kits, tone: "gold"},
                            {label: "Emergency contact saved", value: stats.contactsSaved, tone: "blue"},
                        ]}/>
                    </section>
                    <section className="paper-panel dashboard-rooms"><div className="section-heading"><h2>Room allocations</h2><span>{stats.rooms.length} rooms</span></div>
                        <div className="room-overview" tabIndex={0} aria-label="Room allocations table"><table><thead><tr><th>Room</th><th>Teams</th><th>Members</th><th>In</th></tr></thead>
                            <tbody>{stats.rooms.map(room => <tr key={room.name}><th scope="row">{room.name}</th><td>{room.teams}</td><td>{room.members}</td><td>{room.present}</td></tr>)}</tbody></table></div>
                        <p className="field-note">{stats.roomUnassigned} unassigned · {stats.roomAmbiguous} need review</p>
                    </section>
                    <section className="paper-panel dashboard-followup"><h2>Checked-in follow-up</h2>
                        <dl className="followup-counts"><div><dt>Need ID</dt><dd>{stats.pendingId}</dd></div><div><dt>Need kit</dt><dd>{stats.pendingKit}</dd></div><div><dt>Need contact</dt><dd>{stats.pendingContact}</dd></div></dl>
                        <p className="field-note">{stats.ready} fully processed teams · {stats.checkedInMembers} members in checked-in teams</p>
                    </section>
                    <section className="paper-panel dashboard-health"><h2>Roster coverage</h2>
                        <dl className="coverage-counts"><div><dt>Team-lead numbers</dt><dd>{stats.leadContacts} / {stats.total}</dd></div>
                            <div><dt>Missing lead numbers</dt><dd>{stats.missingLeadContacts}</dd></div>
                            <div><dt>Average team size</dt><dd>{stats.averageSize?.toFixed(1) || "—"}</dd></div>
                            <div><dt>Room issues</dt><dd>{stats.roomUnassigned + stats.roomAmbiguous}</dd></div></dl>
                    </section>
                </div>
            </> : !error && <p role="status">Loading roster…</p>}
            <footer className="admin-footer"><Link href="/admin/archive" prefetch={false}>First-edition archive</Link><span>Automatic checks every minute · Sheets cache up to 5 minutes</span></footer>
        </div>
    </main>;
}
