import { createHash } from "node:crypto";
import type { sheets_v4 } from "googleapis/build/src/apis/sheets";
import { workbookClient } from "./googleSheets";
import type { Cell, Grid } from "@/types/Workbook";

export class WorkbookError extends Error {
    constructor(public status: number, message: string) { super(message); }
}

export async function listTabs() {
    const { api, spreadsheetId } = await workbookClient();
    const { data } = await api.get({ spreadsheetId, fields: "sheets(properties(sheetId,title,sheetType,hidden))" });
    return (data.sheets || []).flatMap(({ properties: p }) =>
        p && !p.hidden && p.sheetType === "GRID" && p.sheetId != null && p.title
            ? [{ id: p.sheetId, title: p.title }] : []);
}

function parseCell(c: sheets_v4.Schema$CellData = {}): Cell {
    const value = c.userEnteredValue;
    const raw = value?.numberValue ?? value?.boolValue ?? value?.stringValue ?? "";
    const rule = c.dataValidation?.condition;
    const options = rule?.type === "ONE_OF_LIST" ? rule.values?.flatMap(v => v.userEnteredValue ? [v.userEnteredValue] : []) : undefined;
    return { text: c.formattedValue ?? String(raw), raw, options,
        locked: !!value?.formulaValue || (!value && !!c.effectiveValue) || (!!rule && !options && rule.type !== "BOOLEAN") };
}

const fields = "sheets(properties(sheetId,title,hidden,sheetType,gridProperties),merges,protectedRanges(range,warningOnly),data(startRow,rowData(values(userEnteredValue,effectiveValue,formattedValue,dataValidation))))";

export async function readGrid(id: number, onlyRow?: number, requiredColumns = 1): Promise<Grid> {
    const { api, spreadsheetId } = await workbookClient();
    const rowFilter = onlyRow ? { startRowIndex: onlyRow - 1, endRowIndex: onlyRow } : {};
    const { data } = await api.getByDataFilter({ spreadsheetId, fields,
        requestBody: { dataFilters: [{ gridRange: { sheetId: id, ...rowFilter } }] } });
    const sheet = data.sheets?.[0];
    const p = sheet?.properties;
    if (!sheet || !p?.title || p.hidden || p.sheetType !== "GRID") throw new WorkbookError(404, "Worksheet unavailable.");
    const source = sheet.data?.[0]?.rowData || [];
    // Validation can extend thousands of rows below the actual records.
    let last = source.length - 1;
    while (last >= 0 && !source[last].values?.some(c => c.userEnteredValue || c.effectiveValue)) last--;
    const ranges = [...(sheet.merges || []), ...(sheet.protectedRanges || []).filter(r => !r.warningOnly).map(r => r.range || {})];
    const values = source.slice(0, onlyRow ? 1 : last + 1);
    if (!onlyRow && last + 1 < (p.gridProperties?.rowCount ?? 0)) values.push(source[last + 1] || {});
    if (!values.length && onlyRow) values.push({});
    const rows = values.map((row, i) => {
        const number = (onlyRow || 1) + i;
        const cells = (row.values || []).map(c => parseCell(c));
        const entered = (row.values || []).map(c => c.userEnteredValue || null);
        while (entered.length && entered[entered.length-1] === null) entered.pop();
        const version = createHash("sha256").update(JSON.stringify(entered)).digest("hex");
        return { number, cells, version };
    });
    const columns = Math.min(p.gridProperties?.columnCount || 1, Math.max(requiredColumns, last < 0 ? 8 : 1, ...rows.map(r => r.cells.reduce((n,c,i) => c.text || c.locked || c.options ? i+1 : n, 0))));
    for (const row of rows) {
        for (let c = 0; c < columns; c++) {
            const cell = row.cells[c] ?? (row.cells[c] = parseCell());
            if (ranges.some(r => row.number - 1 >= (r.startRowIndex || 0) && row.number - 1 < (r.endRowIndex ?? Infinity)
                && c >= (r.startColumnIndex || 0) && c < (r.endColumnIndex ?? Infinity))) cell.locked = true;
        }
    }
    return { tab: { id, title: p.title }, columns, rows };
}

export async function saveCell(input: { id: number; row: number; col: number; value: string; version: string }) {
    const grid = await readGrid(input.id, input.row, input.col + 1);
    const row = grid.rows[0];
    if (row.version !== input.version) throw new WorkbookError(409, "This row changed in Sheets. Refresh and review the latest value.");
    const cell = row.cells[input.col];
    if (!cell || cell.locked) throw new WorkbookError(422, "This cell is managed in Google Sheets.");
    const { api, spreadsheetId } = await workbookClient();
    const range = { sheetId: input.id, startRowIndex: input.row - 1, endRowIndex: input.row,
        startColumnIndex: input.col, endColumnIndex: input.col + 1 };
    const v = input.value;
    if (cell.options && v && !cell.options.includes(v)) throw new WorkbookError(422, "Choose an available dropdown value.");
    let entry: sheets_v4.Schema$ExtendedValue | undefined = v ? { stringValue: v } : undefined;
    if (typeof cell.raw === "number" && v) {
        if (!v.trim() || !Number.isFinite(Number(v))) throw new WorkbookError(422, "Enter a valid number.");
        entry = { numberValue: Number(v) };
    }
    if (typeof cell.raw === "boolean" && v) {
        if (!/^(true|false)$/i.test(v)) throw new WorkbookError(422, "Choose true or false.");
        entry = { boolValue: v.toLowerCase() === "true" };
    }
    await api.batchUpdate({ spreadsheetId, requestBody: { requests: [{ updateCells: { range,
        rows: [{ values: [entry ? { userEnteredValue: entry } : {}] }], fields: "userEnteredValue" } }] } });
}
