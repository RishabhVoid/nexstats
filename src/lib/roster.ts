import { createHash } from "node:crypto";
import type { sheets_v4 } from "googleapis/build/src/apis/sheets";
import { localContactNumber } from "@/lib/contactNumber";
import { participantProfiles } from "@/lib/participantProfiles";
import type { AttendanceMember } from "@/types/AttendanceProfile";
import { workbookClient } from "@/lib/googleSheets";

export type Attendance = "" | "Present" | "Absent";
export type AttendanceTeam = {
    team_uuid: string;
    team_name: string;
    member_slots: string[];
    members: AttendanceMember[];
    colleges: string[];
    team_lead?: { name: string; phone_number: string; email?: string; college?: string };
    attendance: Attendance;
    college_id: boolean;
    kit_distribution: boolean;
    emergency_contact: string;
    room: string;
    room_status: "assigned" | "unassigned" | "ambiguous";
    version: string;
};
export type Roster = AttendanceTeam[];
export type AttendanceEdit = Pick<AttendanceTeam, "team_uuid" | "member_slots" | "attendance" | "college_id" | "kit_distribution" | "emergency_contact" | "version">;

export class AttendanceError extends Error {
    constructor(public status: number, message: string) { super(message); }
}

const rosterFormatVersion = 4;
const rosterTab = "RSVP Teams";
const rosterRange = "'RSVP Teams'!A:J";
const roomsRange = "'Room Allocation'!A:I";
const header = ["Sr. No.", "Team Name", "Member 1", "Member 2", "Member 3", "Member 4", "Attendance", "College ID", "Kit", "Emergency Contact"];
type RoomAssignment = { serial: string; room: string };
type RoomMap = Map<string, RoomAssignment[]>;
type RosterStore = {
    cached?: { teams: Roster; expires: number; syncedAt?: string; formatVersion?: number };
    loading?: Promise<Roster>;
    writes: Promise<void>;
};
const shared = globalThis as typeof globalThis & { nexstatsRsvpRoster?: RosterStore };
const store = shared.nexstatsRsvpRoster || (shared.nexstatsRsvpRoster = { writes: Promise.resolve() });

function normalizeName(value: string) {
    return value.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
}
function teamId(row: string[]) {
    return createHash("sha256").update(JSON.stringify(row.slice(0, 2))).digest("hex");
}
function version(row: string[]) {
    return createHash("sha256").update(JSON.stringify(row.slice(2, 10))).digest("hex");
}
function normalizeRows(values: unknown[][]): string[][] {
    return values.map(row => Array.from({ length: 10 }, (_, col) => String(row[col] ?? "").trim()));
}
function parseRooms(values: unknown[][]): RoomMap {
    const headerIndex = values.findIndex(row => row.some(cell => normalizeName(String(cell)) === "team name"));
    const columns = values[headerIndex]?.map(cell => normalizeName(String(cell))) || [];
    const nameCol = columns.indexOf("team name");
    const roomCol = columns.indexOf("class allotment");
    const serialCol = columns.findIndex(name => ["s. no.", "sr. no.", "sr.no"].includes(name));
    if (nameCol < 0 || roomCol < 0) throw new AttendanceError(503, "Room Allocation columns have changed. Team Name and Class Allotment are required.");
    const rooms: RoomMap = new Map();
    for (const row of values.slice(headerIndex + 1)) {
        const name = normalizeName(String(row[nameCol] ?? ""));
        const serial = String(row[serialCol] ?? "").trim();
        if (!name || (serialCol >= 0 && !/^\d+$/.test(serial))) continue;
        rooms.set(name, [...(rooms.get(name) || []), { serial, room: String(row[roomCol] ?? "").trim() }]);
    }
    return rooms;
}
function rosterHeaderIndex(rows: string[][]) {
    const index = rows.findIndex(row => normalizeName(row[1]) === "team name");
    if (index < 0 || header.some((name, i) => rows[index][i] !== name)) {
        throw new AttendanceError(503, "RSVP Teams columns have changed. Check the header before saving.");
    }
    return index;
}
function parseRoster(values: unknown[][], rooms: RoomMap): Roster {
    const rows = normalizeRows(values);
    const headerIndex = rosterHeaderIndex(rows);
    const ids = new Set<string>();
    return rows.slice(headerIndex + 1).filter(row => /^\d+$/.test(row[0]) && row[1]).map(row => {
        const id = teamId(row);
        if (ids.has(id)) throw new AttendanceError(503, "Duplicate teams in RSVP Teams.");
        ids.add(id);
        if (!["", "Present", "Absent"].includes(row[6])) throw new AttendanceError(503, "An attendance value is invalid.");
        const member_slots = row.slice(2, 6);
        const profiles = participantProfiles(id, member_slots);
        const matchingNames = rooms.get(normalizeName(row[1])) || [];
        const matchingSerials = matchingNames.filter(assignment => assignment.serial === row[0]);
        const candidates = matchingSerials.length ? matchingSerials : matchingNames;
        const assignments = new Set(candidates.map(assignment => assignment.room));
        const room = assignments.size === 1 ? candidates[0].room : "";
        return {
            team_uuid: id, team_name: row[1],
            member_slots, ...profiles,
            attendance: row[6] === "Present" ? "Present" as const : "Absent" as const, college_id: row[7] === "Yes", kit_distribution: row[8] === "Yes",
            emergency_contact: localContactNumber(row[9]), room,
            room_status: assignments.size > 1 ? "ambiguous" : room ? "assigned" : "unassigned",
            version: version(row)
        };
    });
}
async function readSnapshot() {
    const { api, spreadsheetId } = await workbookClient();
    const { data } = await api.values.batchGet({ spreadsheetId, ranges: [rosterRange, roomsRange] });
    const values = normalizeRows(data.valueRanges?.[0]?.values || []);
    const rooms = parseRooms(data.valueRanges?.[1]?.values || []);
    return { api, spreadsheetId, values, rooms, headerIndex: rosterHeaderIndex(values), teams: parseRoster(values, rooms) };
}
async function loadRoster() {
    const { teams } = await readSnapshot();
    store.cached = { teams, expires: Date.now() + 5 * 60_000, syncedAt: new Date().toISOString(), formatVersion: rosterFormatVersion };
    return teams;
}
export async function readRoster(refresh = false): Promise<Roster> {
    if (!refresh && store.cached?.syncedAt && store.cached.formatVersion === rosterFormatVersion && store.cached.expires > Date.now()) return store.cached.teams;
    if (!store.loading) store.loading = loadRoster().finally(() => { store.loading = undefined; });
    return store.loading;
}

export function rosterSyncedAt() { return store.cached?.syncedAt || null; }

export async function saveAttendance(edit: AttendanceEdit, newTeamName?: string): Promise<AttendanceTeam> {
    edit = { ...edit, attendance: edit.attendance === "Present" ? "Present" : "Absent", emergency_contact: localContactNumber(edit.emergency_contact) };
    // Serialize saves within this app instance, then check the latest RSVP row version.
    const previous = store.writes;
    let release!: () => void;
    store.writes = new Promise(resolve => { release = resolve; });
    await previous;
    try {
        const { api, spreadsheetId, values, rooms, teams, headerIndex } = await readSnapshot();
        const { data: workbook } = await api.get({ spreadsheetId, ranges: [rosterRange],
            fields: "sheets(properties(sheetId,title,gridProperties))" });
        const tab = workbook.sheets?.find(sheet => sheet.properties?.title === rosterTab)?.properties;
        if (tab?.sheetId == null) throw new AttendanceError(503, "RSVP Teams is unavailable.");
        const sheetId = tab.sheetId;
        const requests: sheets_v4.Schema$Request[] = [];
        let updatedRow: string[];
        if (newTeamName) {
            const name = newTeamName.trim();
            const existing = teams.find(team => normalizeName(team.team_name) === normalizeName(name));
            if (existing) {
                if (existing.team_name === name && JSON.stringify(existing.member_slots) === JSON.stringify(edit.member_slots) &&
                    existing.attendance === edit.attendance && existing.college_id === edit.college_id &&
                    existing.kit_distribution === edit.kit_distribution && existing.emergency_contact === edit.emergency_contact) return existing;
                throw new AttendanceError(409, "A team with this name already exists. Find that team to edit it.");
            }
            const serial = Math.max(0, ...values.slice(headerIndex + 1).map(row => Number(row[0]) || 0)) + 1;
            updatedRow = [String(serial), name, ...edit.member_slots, edit.attendance,
                edit.college_id ? "Yes" : "No", edit.kit_distribution ? "Yes" : "No", edit.emergency_contact];
            const rowIndex = values.length;
            if (rowIndex >= (tab.gridProperties?.rowCount || 0)) {
                requests.push({ appendDimension: { sheetId, dimension: "ROWS", length: rowIndex - (tab.gridProperties?.rowCount || 0) + 1 } });
            }
            const destination = { sheetId, startRowIndex: rowIndex, endRowIndex: rowIndex + 1, startColumnIndex: 0, endColumnIndex: 10 };
            // Copy native dropdown chips and colors without introducing validation rules via the API.
            for (const pasteType of ["PASTE_FORMAT", "PASTE_DATA_VALIDATION"]) {
                requests.push({ copyPaste: { source: { ...destination, startRowIndex: headerIndex + 1, endRowIndex: headerIndex + 2 }, destination, pasteType } });
            }
            requests.push({ repeatCell: { range: destination,
                cell: { userEnteredFormat: { backgroundColor: { red: 1, green: 1, blue: 1 } } }, fields: "userEnteredFormat.backgroundColor" } });
            requests.push({ updateCells: { start: { sheetId, rowIndex, columnIndex: 0 },
                rows: [{ values: updatedRow.map(value => ({ userEnteredValue: { stringValue: value } })) }], fields: "userEnteredValue" } });
            requests.push({ setBasicFilter: { filter: { range: { sheetId, startRowIndex: headerIndex, endRowIndex: rowIndex + 1, startColumnIndex: 0, endColumnIndex: 10 } } } });
            values.push(updatedRow);
        } else {
            const team = teams.find(item => item.team_uuid === edit.team_uuid);
            if (!team) throw new AttendanceError(404, "This team is no longer in RSVP Teams.");
            const rowIndex = values.findIndex((row, i) => i > headerIndex && teamId(row) === edit.team_uuid);
            const row = values[rowIndex];
            updatedRow = [...row.slice(0, 2), ...edit.member_slots, edit.attendance,
                edit.college_id ? "Yes" : "No",
                edit.kit_distribution ? "Yes" : "No", edit.emergency_contact];
            if (edit.version !== team.version) {
                if (version(updatedRow) === team.version) return team;
                throw new AttendanceError(409, "This team changed in RSVP Teams or at another desk. Search for the team again to review its latest record before saving.");
            }
            for (let col = 2; col < 10; col++) {
                if (updatedRow[col] === row[col]) continue;
                const yellow = col <= 5;
                const cell: sheets_v4.Schema$CellData = { userEnteredValue: { stringValue: updatedRow[col] } };
                if (yellow) cell.userEnteredFormat = { backgroundColor: { red: 1, green: 0.95, blue: 0.6 } };
                requests.push({ updateCells: {
                    start: { sheetId, rowIndex, columnIndex: col }, rows: [{ values: [cell] }],
                    fields: yellow ? "userEnteredValue,userEnteredFormat.backgroundColor" : "userEnteredValue"
                } });
            }
            values[rowIndex] = updatedRow;
        }
        if (requests.length) await api.batchUpdate({ spreadsheetId, requestBody: { requests } });
        if (store.loading) { try { await store.loading; } catch {} }
        const updated = parseRoster(values, rooms);
        store.cached = { teams: updated, expires: Date.now() + 5 * 60_000, syncedAt: new Date().toISOString(), formatVersion: rosterFormatVersion };
        return updated.find(team => team.team_uuid === teamId(updatedRow))!;
    } finally { release(); }
}
