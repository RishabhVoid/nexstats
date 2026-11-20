export type Cell = {
    text: string;
    raw: string | number | boolean;
    locked?: boolean;
    options?: string[];
};
export type Tab = { id: number; title: string };
export type WorkbookRow = { number: number; version: string; cells: Cell[] };
export type Grid = {
    tab: Tab;
    rows: WorkbookRow[];
    columns: number;
};
export function columnName(index: number) {
    let name = "";
    for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) {
        name = String.fromCharCode(65 + (n - 1) % 26) + name;
    }
    return name;
}
