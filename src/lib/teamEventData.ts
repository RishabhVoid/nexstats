import TeamEventData from "@/models/TeamEventData";
import { connectMongo } from "@/lib/mongo";
import type { AttendanceTeam } from "@/lib/roster";
import type { InternetAccess } from "@/types/TeamType";

export type TeamEventRecord = { _id: string; member_names: string[]; college?: string; internet_access?: InternetAccess };
export class EventImportError extends Error {
    constructor(public status: number, message: string) { super(message); }
}
const key = (value: string) => value.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();

export function validateEventImport(input: unknown, teams: AttendanceTeam[]): TeamEventRecord[] {
    if (!Array.isArray(input) || !input.length || input.length > 500) throw new EventImportError(400, "Provide 1–500 team records.");
    const roster = new Map(teams.map(team => [team.team_uuid, team]));
    const ids = new Set<string>();
    return input.map(record => {
        if (!record || typeof record !== "object" || typeof record._id !== "string" || !/^[a-f0-9]{64}$/.test(record._id) ||
            ids.has(record._id) || !Array.isArray(record.member_names) || record.member_names.length !== 4 ||
            record.member_names.some((name: unknown) => typeof name !== "string" || name.length > 150) ||
            (record.college !== undefined && record.college !== "Geeta University") ||
            (record.internet_access !== undefined && (!record.internet_access || typeof record.internet_access.username !== "string" ||
                !record.internet_access.username || record.internet_access.username.length > 500 || typeof record.internet_access.password !== "string" ||
                !record.internet_access.password || record.internet_access.password.length > 500))) {
            throw new EventImportError(400, "Invalid or repeated team record.");
        }
        const team = roster.get(record._id);
        if (!team || team.member_slots.some((name, slot) => key(name) !== key(record.member_names[slot]))) {
            throw new EventImportError(409, "The roster changed. Reconcile the source with the current RSVP roster before importing.");
        }
        ids.add(record._id);
        return { _id: record._id, member_names: team.member_slots,
            ...(record.college ? { college: record.college } : {}),
            ...(record.internet_access ? { internet_access: { username: record.internet_access.username, password: record.internet_access.password } } : {}) };
    });
}

export function applyEventData(team: AttendanceTeam, records: TeamEventRecord[]): AttendanceTeam {
    const record = records.find(record => record._id === team.team_uuid);
    if (!record) return team;
    const knownNames = new Set(record.member_names.filter(Boolean).map(key));
    return { ...team, internet_access: record.internet_access,
        members: team.members.map(member => record.college && !member.college && knownNames.has(key(member.first_name)) ? {
            ...member, college: record.college, profile_status: member.profile_status === "unmatched" ? "matched" as const : member.profile_status,
        } : member) };
}

export async function saveEventImport(records: TeamEventRecord[]) {
    await connectMongo();
    await TeamEventData.bulkWrite(records.map(({ _id, ...record }) => ({ updateOne: {
        filter: { _id }, update: { $set: { ...record, updated_at: new Date() } }, upsert: true,
    } })));
}
