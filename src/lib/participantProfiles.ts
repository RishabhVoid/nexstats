import type { AttendanceMember } from "@/types/AttendanceProfile";
import { localContactNumber } from "@/lib/contactNumber";

export type ImportedMember = { slot: number; roster_name: string; source_name: string; email: string; phone_number: string; college: string };
export type ImportedTeam = { team_uuid: string; members: ImportedMember[] };
const nonNameCharacters = new RegExp("[^\\p{L}\\p{N}]", "gu");
const normalize = (name: string) => name.normalize("NFKC").toLowerCase().replace(nonNameCharacters, "");

export function participantProfiles(teamId: string, slots: string[], teams: ImportedTeam[] = []) {
    const imported = teams.find(team => team.team_uuid === teamId)?.members || [];
    const members: AttendanceMember[] = slots.flatMap((name, slot) => {
        if (!name) return [];
        const key = normalize(name);
        const matches = imported.filter(member => normalize(member.roster_name) === key || normalize(member.source_name) === key);
        const duplicate = slots.filter(value => normalize(value) === key).length > 1;
        const profile = !duplicate && matches.length === 1 ? matches[0] : matches.find(member => member.slot === slot);
        return [{ first_name: name, slot, email: profile?.email, phone_number: profile ? localContactNumber(profile.phone_number) : undefined,
            college: profile?.college, profile_status: profile ? "matched" : "unmatched" }];
    });
    const colleges = Array.from(new Map(members.filter(member => member.college).map(member =>
        [member.college!.normalize("NFKC").trim().toLowerCase(), member.college!])).values());
    const leader = members[0];
    return { members, colleges, team_lead: leader?.profile_status === "matched" ? {
        name: leader.first_name, phone_number: leader.phone_number || "", email: leader.email, college: leader.college,
    } : undefined };
}
