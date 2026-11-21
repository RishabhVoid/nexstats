import { createHash } from "node:crypto";
import MemberProfileEdit from "@/models/MemberProfileEdit";
import ParticipantImport from "@/models/ParticipantImport";
import { participantProfiles, type ImportedTeam } from "@/lib/participantProfiles";
import { connectMongo } from "@/lib/mongo";
import { localContactNumber } from "@/lib/contactNumber";
import type { AttendanceTeam } from "@/lib/roster";
import type { AttendanceMember } from "@/types/AttendanceProfile";

export type ProfileFields = { email: string; phone_number: string; college: string };
export type ProfileEdit = ProfileFields & { _id: string; team_uuid: string; slot: number; member_key: string; revision: number };
export type ProfileInput = ProfileFields & { team_uuid: string; slot: number; member_name: string; profile_version: string };
export class ProfileError extends Error {
    constructor(public status: number, message: string) { super(message); }
}
const digest = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const nameKey = (name: string) => name.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
const identity = (teamId: string, member: AttendanceMember) => digest([teamId, member.slot, nameKey(member.first_name)]);
const fields = (member: Partial<ProfileFields>): ProfileFields => ({ email: member.email ?? "", phone_number: member.phone_number ?? "", college: member.college ?? "" });

export function applyProfileEdits(team: AttendanceTeam, edits: ProfileEdit[]): AttendanceTeam {
    const records = new Map(edits.filter(edit => edit.team_uuid === team.team_uuid).map(edit => [edit._id, edit]));
    const members = team.members.map(member => {
        const id = identity(team.team_uuid, member);
        const edit = records.get(id);
        const profile = edit ? fields(edit) : fields(member);
        return { ...member, ...profile, profile_status: edit ? "edited" as const : member.profile_status,
            profile_version: digest([id, profile, edit?.revision || 0]) };
    });
    const colleges = Array.from(new Map(members.filter(member => member.college).map(member =>
        [member.college.normalize("NFKC").trim().toLowerCase(), member.college])).values());
    const lead = members[0];
    return { ...team, members, colleges, team_lead: lead && lead.profile_status !== "unmatched" ? {
        name: lead.first_name, email: lead.email, phone_number: lead.phone_number, college: lead.college,
    } : undefined };
}

export async function readProfileEdits(teamIds: string[]): Promise<ProfileEdit[]> {
    if (!teamIds.length) return [];
    await connectMongo();
    return await MemberProfileEdit.find({ team_uuid: { $in: teamIds } }).lean().exec() as unknown as ProfileEdit[];
}
type ProfileData = { edits: ProfileEdit[]; imports: ImportedTeam[] };
export async function readProfileData(teamIds: string[]): Promise<ProfileData> {
    await connectMongo();
    const [edits, imported] = await Promise.all([
        readProfileEdits(teamIds), ParticipantImport.findById("unstop-v1").lean().exec(),
    ]);
    return { edits, imports: (imported as { teams?: ImportedTeam[] } | null)?.teams || [] };
}
export function applyProfileData(team: AttendanceTeam, data: ProfileData) {
    const imported = { ...team, ...participantProfiles(team.team_uuid, team.member_slots, data.imports) };
    return applyProfileEdits(imported, data.edits);
}
export async function withProfileEdits(teams: AttendanceTeam[]) {
    const data = await readProfileData(teams.map(team => team.team_uuid));
    return teams.map(team => applyProfileData(team, data));
}

export function validateProfileInput(value: unknown): ProfileInput {
    if (!value || typeof value !== "object") throw new ProfileError(400, "Invalid member details.");
    const input = value as ProfileInput;
    if (typeof input.team_uuid !== "string" || !/^[a-f0-9]{64}$/.test(input.team_uuid) ||
        !Number.isInteger(input.slot) || input.slot < 0 || input.slot > 3 ||
        typeof input.member_name !== "string" || !input.member_name.trim() || input.member_name.length > 150 ||
        typeof input.profile_version !== "string" || !/^[a-f0-9]{64}$/.test(input.profile_version) ||
        typeof input.email !== "string" || input.email.length > 254 ||
        (input.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) ||
        typeof input.phone_number !== "string" || input.phone_number.length > 40 ||
        typeof input.college !== "string" || input.college.length > 500) {
        throw new ProfileError(400, "Enter a valid email, a 10-digit phone number, and a college of up to 500 characters. Fields can be left empty.");
    }
    const phone = localContactNumber(input.phone_number);
    if (phone && !/^\d{10}$/.test(phone)) throw new ProfileError(400, "Enter a 10-digit Indian phone number or leave it empty.");
    return { ...input, email: input.email.trim(), phone_number: phone, college: input.college.trim() };
}

export async function saveProfileEdit(team: AttendanceTeam, input: ProfileInput, organizer: string): Promise<AttendanceTeam> {
    const member = team.members.find(member => member.slot === input.slot);
    if (!member || nameKey(member.first_name) !== nameKey(input.member_name)) {
        throw new ProfileError(409, "This team member has changed. Cancel and reopen their details before editing.");
    }
    const data = await readProfileData([team.team_uuid]);
    const edits = data.edits;
    const base = { ...team, ...participantProfiles(team.team_uuid, team.member_slots, data.imports) };
    const current = applyProfileEdits(base, edits).members.find(member => member.slot === input.slot)!;
    if (current.profile_version !== input.profile_version) {
        throw new ProfileError(409, "Someone updated these details. Cancel and reopen the member to see the latest version; your draft is still here.");
    }
    if (JSON.stringify(fields(current)) === JSON.stringify(fields(input))) return applyProfileEdits(base, edits);
    const id = identity(team.team_uuid, member);
    const previous = edits.find(edit => edit._id === id);
    const record = { ...fields(input), team_uuid: team.team_uuid, slot: member.slot, member_key: nameKey(member.first_name), updated_by: organizer };
    try {
        if (previous) {
            const updated = await MemberProfileEdit.findOneAndUpdate({ _id: id, revision: previous.revision },
                { $set: record, $inc: { revision: 1 } }, { new: true, runValidators: true }).lean().exec();
            if (!updated) throw new ProfileError(409, "Someone updated these details. Cancel and reopen the member before saving again.");
        } else {
            await MemberProfileEdit.create({ _id: id, ...record, revision: 1 });
        }
    } catch (error) {
        if ((error as { code?: number }).code === 11000) throw new ProfileError(409, "Someone updated these details. Cancel and reopen the member before saving again.");
        throw error;
    }
    // Use exactly the saved revision, without a second database read after committing.
    const saved = { _id: id, ...record, revision: (previous?.revision || 0) + 1 };
    return applyProfileEdits(base, [...edits.filter(edit => edit._id !== id), saved]);
}
