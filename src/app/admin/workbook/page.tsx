"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { BookOpen, Castle, ChevronLeft, ChevronRight, Feather, LogOut, RefreshCw, Search, X } from "lucide-react";
import { columnName, type Cell, type Grid, type Tab, type WorkbookRow } from "@/types/Workbook";

const endpoint = "/api/admin/workbook";
const empty: Cell = { raw: "", text: "" };
const pageSize = 30;
type Edit = { row: WorkbookRow; col: number; cell: Cell; value: string };

async function request<T>(url: string, init?: RequestInit): Promise<T> {
    const result = await fetch(url, { cache: "no-store", ...init });
    const data = await result.json();
    if (!result.ok) throw new Error(data.message || "Could not reach the workbook.");
    return data;
}

export default function Admin() {
    const [tabs, setTabs] = useState<Tab[]>([]);
    const [id, setId] = useState<number | null>(null);
    const [grid, setGrid] = useState<Grid>();
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(0);
    const [error, setError] = useState("");
    const [time, setTime] = useState<Date>();
    const [busy, setBusy] = useState(false);
    const [edit, setEdit] = useState<Edit>();
    const [saving, setSaving] = useState(false);
    const [editError, setEditError] = useState("");
    const [revision, setRevision] = useState(0);
    const dialog = useRef<HTMLDialogElement>(null);
    const refresh = useCallback(() => setRevision(v => v + 1), []);
    useEffect(() => {
        let active = true;
        setBusy(true);
        (async () => {
            const { tabs: available } = await request<{ tabs: Tab[] }>(endpoint);
            if (!active) return;
            setTabs(available);
            const tab = available.find(t => t.id === id) || available.find(t => t.title === "Teams Data") || available[0];
            if (!tab) throw new Error("This workbook has no visible worksheets.");
            if (tab.id !== id) { setId(tab.id); return; }
            const next = await request<Grid>(endpoint + "?tab=" + tab.id);
            if (active) { setGrid(next); setTime(new Date()); setError(""); }
        })().catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setBusy(false); });
        return () => { active = false; };
    }, [id, revision]);
    useEffect(() => {
        if (edit) return;
        const tick = () => { if (!document.hidden) refresh(); };
        const timer = setInterval(tick, 30000);
        window.addEventListener("focus", tick);
        return () => { clearInterval(timer); window.removeEventListener("focus", tick); };
    }, [edit, refresh]);
    useEffect(() => { if (edit && !dialog.current?.open) dialog.current?.showModal(); }, [edit]);
    const active = grid?.tab.id === id ? grid : undefined;
    const title = tabs.find(t => t.id === id)?.title || "Event workbook";
    const header = active?.rows.find(r => r.cells.some(c => c.text.trim() === "Team Name"));
    const teamCol = header?.cells.findIndex(c => c.text.trim() === "Team Name") ?? -1;
    const sizeCol = header?.cells.findIndex(c => c.text.trim() === "Total Members") ?? -1;
    const serialCol = header?.cells.findIndex(c => c.text.trim() === "S. No.") ?? -1;
    const teamRows = active?.rows.filter(r => header && r.number > header.number && r.cells[teamCol]?.text && /^\d+$/.test(r.cells[serialCol]?.text.trim())) || [];
    const rows = (active?.rows || []).filter(r => (!header || r.number > header.number) &&
        (!query || r.cells.some(c => c.text.toLowerCase().includes(query.trim().toLowerCase()))));
    const pages = Math.max(1, Math.ceil(rows.length / pageSize));
    const current = Math.min(page, pages - 1);
    const displayed = rows.slice(current * pageSize, (current + 1) * pageSize);
    const open = (row: WorkbookRow, col: number) => {
        const cell = row.cells[col] || empty;
        setEditError(""); setEdit({ row, col, cell, value: String(cell.raw) });
    };
    async function save() {
        if (!edit || !active || saving) return;
        setSaving(true); setEditError("");
        try {
            await request(endpoint, { method: "PATCH", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, row: edit.row.number, col: edit.col, value: edit.value, version: edit.row.version }) });
            setEdit(undefined); refresh();
        } catch (e) { setEditError(e instanceof Error ? e.message : "Save failed."); }
        finally { setSaving(false); }
    }
    return <main className="ledger">
        <aside className="ledger-side">
            <Link href="/admin" className="wordmark"><Castle aria-hidden="true" /> NexStats</Link>
            <label className="eyebrow" htmlFor="worksheet">Workbook</label>
            <select id="worksheet" value={id ?? ""} onChange={e => {setId(Number(e.target.value)); setQuery(""); setPage(0);}}>
                {tabs.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
            <nav aria-label="Worksheets">{tabs.map(t => <button key={t.id} aria-current={id === t.id ? "page" : undefined}
                onClick={() => { setId(t.id); setQuery(""); setPage(0); }}><BookOpen size={16} />{t.title}</button>)}</nav>
            <div className="ledger-links"><Link href="/admin">Back to dashboard</Link>
            <button onClick={() => signOut({ callbackUrl: "/" })}><LogOut size={15}/> Sign out</button></div>
        </aside>
        <section className="ledger-main">
            <header className="ledger-banner"><span className="eyebrow">NexHack 2.0 · Geeta University</span><h1>Event workbook</h1></header>
            <div className="ledger-panel">
                <div className="sheet-heading"><div><p className="eyebrow">All Data</p><h2>{title}</h2></div>
                <button className="mc-btn" onClick={refresh} disabled={busy}><RefreshCw size={16} /> Refresh</button></div>
                {header && <div className="roster-counts"><span><b>{teamRows.length}</b> teams</span><span><b>{teamRows.reduce((sum,r) => sum + (Number(r.cells[sizeCol]?.text) || 0),0)}</b> members</span></div>}
                <div className="sheet-tools"><label className="search-box"><Search size={17}/><input aria-label="Search this worksheet" placeholder="Search this worksheet" value={query} onChange={e => {setQuery(e.target.value);setPage(0);}} /></label>
                <span role="status">{busy ? "Refreshing…" : time && active ? "Updated " + time.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}) : ""}</span></div>
                {error && <p className="sheet-error" role="alert">{error}</p>}
                {active && <><div className="grid-scroll"><table><thead><tr><th scope="col">Row</th>
                    {Array.from({ length: active.columns }, (_,i) => <th scope="col" key={i}>{header?.cells[i]?.text || columnName(i)}</th>)}</tr></thead>
                    <tbody>{displayed.map(row => <tr key={row.number}><th scope="row">{row.number}</th>
                        {Array.from({ length: active.columns }, (_,i) => { const cell = row.cells[i] || empty;
                            return <td key={i}>{cell.locked ? <span title="Managed in Google Sheets">{cell.text}</span> :
                                <button onClick={() => open(row,i)} aria-label={'Edit '+columnName(i)+row.number+' '+cell.text}
                                className={cell.text === "Confirmed" ? "confirmed" : ""}>{cell.text || "·"}</button>}</td>; })}</tr>)}</tbody></table></div>
                    {!rows.length && <p className="empty-state">{query ? "No matching rows." : "This worksheet is empty."}</p>}
                    <footer className="sheet-footer"><span>{rows.length ? current * pageSize + 1 : 0}–{Math.min((current + 1) * pageSize,rows.length)} of {rows.length} rows</span>
                    <div><button className="mc-btn" disabled={!current} aria-label="Previous page" onClick={() => setPage(current-1)}><ChevronLeft size={16}/></button>
                    <button className="mc-btn" disabled={current+1 >= pages} aria-label="Next page" onClick={() => setPage(current+1)}><ChevronRight size={16}/></button></div></footer></>}
            </div>
        </section>
        {edit && <dialog ref={dialog} className="cell-dialog" onCancel={e => {e.preventDefault(); if (!saving) setEdit(undefined);}}>
            <form onSubmit={e => {e.preventDefault();void save();}}><div className="sheet-heading"><Feather size={23}/><button type="button" className="mc-btn" aria-label="Close editor" disabled={saving} onClick={() => setEdit(undefined)}><X size={16}/></button></div>
            <p className="eyebrow">{title} · {columnName(edit.col)}{edit.row.number}</p>
            <label htmlFor="cell-value">{header?.cells[edit.col]?.text || "Cell value"}</label>
            {edit.cell.options || typeof edit.cell.raw === "boolean" ? <select id="cell-value" autoFocus value={edit.value} onChange={e => setEdit({...edit,value:e.target.value})}>
                {["", ...(edit.cell.options || ["true","false"])].map(v => <option key={v} value={v}>{v || "Empty"}</option>)}</select> :
                <input className="mc-input" id="cell-value" type={typeof edit.cell.raw === "number" ? "number" : "text"} step="any" autoFocus value={edit.value} onChange={e => setEdit({...edit,value:e.target.value})}/>}
            {editError && <p role="alert" className="sheet-error">{editError}</p>}
            <button className="mc-btn mc-btn--primary" disabled={saving || edit.value === String(edit.cell.raw)}>{saving ? "Saving…" : "Save to Google Sheets"}</button></form>
        </dialog>}
    </main>;
}
