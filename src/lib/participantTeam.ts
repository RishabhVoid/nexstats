import { readRoster, rosterSyncedAt } from "@/lib/roster";
import { withProfileEdits } from "@/lib/memberProfileEdits";
import type { TeamType } from "@/types/TeamType";

export async function participantTeamForEmail(email: string): Promise<TeamType | null> {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return null;
    const teams = await withProfileEdits(await readRoster());
    const matching = teams.filter(team => team.members.some(member => member.email?.trim().toLowerCase() === normalized));
    // A duplicated email across teams needs an organizer correction rather than exposing either record.
    if (matching.length !== 1) return null;
    const team = matching[0];
    const syncedAt = rosterSyncedAt() || new Date().toISOString();
    return {
        id: team.team_uuid, name: team.team_name, emails: team.members.flatMap(member => member.email ? [member.email] : []),
        members_count: team.members.length,
        members_data: team.members.map((member, index) => ({
            name: member.first_name, email: member.email || "", phone: member.phone_number || "", is_leader: index === 0,
        })),
        assigned_room_no: team.room, assigned_block: "", assigned_floor: "", assigned_desk: "",
        college_id: team.college_id, aadhar_id: false, kit_distribution: team.kit_distribution,
        emergency_contact: team.emergency_contact, status: { state: "active", note: "" },
        createdAt: syncedAt, updatedAt: syncedAt,
    };
}
