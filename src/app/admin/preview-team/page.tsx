"use client";

import AdminHeader from "@/components/AdminHeader";
import StatBars from "@/components/StatBars";
import { useRoster } from "@/hooks/useRoster";
import { eventStats, percentage } from "@/lib/eventStats";

export default function AttendanceStats() {
    const { teams, error } = useRoster();
    const stats = eventStats(teams || []);
    const attendance = [
        {label: "Checked in", value: stats.present, color: "#517a5d"},
        {label: "Absent", value: stats.absent, color: "#a55b50"},
        {label: "Not marked", value: stats.unmarked, color: "#d9c7a1"},
    ];
    const presentEnd = stats.total ? stats.present / stats.total * 100 : 0;
    const absentEnd = presentEnd + (stats.total ? stats.absent / stats.total * 100 : 0);
    const metrics = [
        {label: "Team check-in rate", value: percentage(stats.present, stats.total), detail: stats.present + " of " + stats.total + " teams"},
        {label: "Members in checked-in teams", value: stats.checkedInMembers, detail: "of " + stats.participants + " participants"},
        {label: "Fully processed teams", value: stats.ready, detail: "Checked in, ID, kit & contact"},
        {label: "Average team size", value: stats.averageSize?.toFixed(1) || "—", detail: stats.participants + " people / " + stats.total + " teams"},
        {label: "Team-lead numbers", value: stats.leadContacts, detail: stats.missingLeadContacts + (stats.missingLeadContacts === 1 ? " team without a number" : " teams without a number")},
        {label: "Room issues", value: stats.roomUnassigned + stats.roomAmbiguous, detail: stats.rooms.length + " rooms allocated"},
    ];
    const busiest = [...stats.rooms].sort((a,b) => b.teams - a.teams || a.name.localeCompare(b.name)).slice(0, 4);
    return <main className="admin-page"><AdminHeader title="Registration stats"/><div className="workspace-body workspace-analytics">
        {error && <p className="sheet-error" role="alert">{error}</p>}
        {teams ? <>
            <section className="event-metrics analytics-metrics" aria-label="Registration statistics">{metrics.map(metric => <div key={metric.label}>
                <span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.detail}</small></div>)}</section>
            <div className="analytics-grid" tabIndex={0} role="region" aria-label="Registration charts">
                <section className="paper-panel"><div className="section-heading"><h2>Attendance breakdown</h2><span>{stats.total} RSVP teams</span></div>
                    <div className="attendance-analysis"><div className="attendance-ring" role="img" aria-label={attendance.map(item => item.label + ": " + item.value).join(", ")}
                        style={{background: `conic-gradient(#517a5d 0% ${presentEnd}%, #a55b50 ${presentEnd}% ${absentEnd}%, #d9c7a1 ${absentEnd}% 100%)`}}>
                        <div><strong>{percentage(stats.present, stats.total)}</strong><span>checked in</span></div></div>
                        <dl className="attendance-legend">{attendance.map(item => <div key={item.label}><dt><i style={{background: item.color}}/>{item.label}</dt><dd>{item.value}<small>{percentage(item.value, stats.total)}</small></dd></div>)}</dl>
                    </div>
                </section>
                <section className="paper-panel"><div className="section-heading"><h2>Team sizes</h2><span>{stats.participants} participants</span></div>
                    <StatBars total={stats.total} rows={stats.sizes.map(item => ({label: item.size + "-member teams", value: item.count, tone: "gold", detail: " teams · " + item.size * item.count + " people"}))}/>
                    <p className="analysis-note">{stats.sizes.find(item => item.size === 4)?.count || 0} full teams of four · Average {stats.averageSize?.toFixed(1) || "—"} members per team</p>
                </section>
                <section className="paper-panel"><div className="section-heading"><h2>Desk completion</h2><span>Across all teams</span></div>
                    <StatBars total={stats.total} rows={[
                        {label: "College ID verified", value: stats.verified, tone: "green"},
                        {label: "Kit distributed", value: stats.kits, tone: "gold"},
                        {label: "Emergency contact saved", value: stats.contactsSaved, tone: "blue"},
                        {label: "Fully processed", value: stats.ready},
                    ]}/>
                    <p className="analysis-note">Among checked-in teams: {stats.pendingId} need ID, {stats.pendingKit} need kit, {stats.pendingContact} need contact.</p>
                </section>
                <section className="paper-panel"><div className="section-heading"><h2>Rooms with the most teams</h2><span>{stats.roomAssigned} teams assigned</span></div>
                    <StatBars total={Math.max(1, ...stats.rooms.map(room => room.teams))} rows={busiest.map(room => ({label: room.name, value: room.teams, tone: "blue", detail: " teams · " + room.members + " people"}))}/>
                    <p className="analysis-note">{stats.roomUnassigned} unassigned teams · {stats.roomAmbiguous} assignments need review</p>
                </section>
            </div>
        </> : !error && <p role="status">Loading registration statistics…</p>}
    </div></main>;
}
