import type { Roster } from "@/lib/roster";

export function eventStats(teams: Roster) {
    const present = teams.filter(team => team.attendance === "Present");
    const sizes = new Map<number, number>();
    const rooms = new Map<string, { name: string; teams: number; members: number; present: number }>();
    for (const team of teams) {
        sizes.set(team.members.length, (sizes.get(team.members.length) || 0) + 1);
        if (team.room_status !== "assigned") continue;
        const key = team.room.normalize("NFKC").trim().toLowerCase();
        const room = rooms.get(key) || { name: team.room, teams: 0, members: 0, present: 0 };
        room.teams++; room.members += team.members.length;
        if (team.attendance === "Present") room.present++;
        rooms.set(key, room);
    }
    const participants = teams.reduce((sum, team) => sum + team.members.length, 0);
    const absent = teams.filter(team => team.attendance === "Absent").length;
    const leadContacts = teams.filter(team => team.team_lead?.phone_number).length;
    const ready = present.filter(team => team.college_id && team.kit_distribution && team.emergency_contact.trim()).length;
    return {
        total: teams.length, participants, present: present.length, absent, unmarked: teams.length - present.length - absent,
        checkedInMembers: present.reduce((sum, team) => sum + team.members.length, 0), ready,
        verified: teams.filter(team => team.college_id).length,
        kits: teams.filter(team => team.kit_distribution).length,
        contactsSaved: teams.filter(team => team.emergency_contact.trim()).length,
        leadContacts, missingLeadContacts: teams.length - leadContacts,
        pendingId: present.filter(team => !team.college_id).length,
        pendingKit: present.filter(team => !team.kit_distribution).length,
        pendingContact: present.filter(team => !team.emergency_contact.trim()).length,
        roomAssigned: teams.filter(team => team.room_status === "assigned").length,
        roomUnassigned: teams.filter(team => team.room_status === "unassigned").length,
        roomAmbiguous: teams.filter(team => team.room_status === "ambiguous").length,
        averageSize: teams.length ? participants / teams.length : null,
        sizes: Array.from(sizes, ([size, count]) => ({ size, count })).sort((a,b) => a.size - b.size),
        rooms: Array.from(rooms.values()).sort((a,b) => a.name.localeCompare(b.name, undefined, { numeric: true })),
    };
}

export function percentage(count: number, total: number) {
    return total ? Math.round(count / total * 100) + "%" : "—";
}
