import type { Roster } from "@/lib/roster";
import { CheckCheck, Contact, DoorOpen, PackageCheck, UserCheck, Users } from "lucide-react";

export default function EventMetrics({ teams }: { teams: Roster }) {
    const metrics = [
        { label: "RSVP teams", value: teams.length, icon: Users },
        { label: "Participants", value: teams.reduce((n, team) => n + team.members.length, 0), icon: Contact },
        { label: "Teams checked in", value: teams.filter(team => team.attendance === "Present").length, icon: UserCheck },
        { label: "College ID verified", value: teams.filter(team => team.college_id).length, icon: CheckCheck },
        { label: "Teams with kits", value: teams.filter(team => team.kit_distribution).length, icon: PackageCheck },
        { label: "Teams with rooms", value: teams.filter(team => team.room_status === "assigned").length, icon: DoorOpen },
    ];
    return <section className="event-metrics" aria-label="Event totals">{metrics.map(({ label, value, icon: Icon }) =>
        <div key={label}><Icon size={18} aria-hidden="true"/><span>{label}</span><strong>{value}</strong></div>)}</section>;
}
