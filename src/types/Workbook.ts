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
