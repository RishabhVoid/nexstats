import { google } from "googleapis";

const SHEET_ID = "1FWjZDcYJj2cmUesIZJgE_h7IWXd0pOp1H8kaZeC1WTA";
const SHEET_TAB = "Team Members";

const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL as string,
        private_key: (process.env.GOOGLE_PRIVATE_KEY as string)?.replace(/\\n/g, "\n"),
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID as string,
        project_id: process.env.GOOGLE_PROJECT_ID as string
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
});

async function getSheets() {
    return google.sheets({ version: "v4", auth });
}

async function readRange(range: string) {
    const sheets = await getSheets();
    const { data } = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range
    });
    return data.values ?? [];
}

async function findRowByTeamName(teamName: string): Promise<number | null> {
    const rows = await readRange(`${SHEET_TAB}!B:B`);
    for (let i = 0; i < rows.length; i++) {
        const v = String(rows[i]?.[0] ?? "").trim();
        if (v && v.toLowerCase() === teamName.toLowerCase()) return i + 1;
    }
    return null;
}

export async function updateTeamFlagsByName(input: {
    name: string;
    college_id: boolean;
    aadhar_id: boolean;
    kit_distribution: boolean;
    emergency_number: string;
}) {
    const row = await findRowByTeamName(input.name);
    if (!row) throw new Error(`Team '${input.name}' not found`);
    const sheets = await getSheets();
    const values = [[
        "Present",
        input.college_id ? "Yes" : "No",
        input.aadhar_id ? "Yes" : "No",
        input.kit_distribution ? "Yes" : "No",
        input.emergency_number
    ]];
    await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_TAB}!H${row}:L${row}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values }
    });
}