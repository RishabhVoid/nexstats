export default function StatBars({ rows, total }: { rows: { label: string; value: number; tone?: string; detail?: string }[]; total: number }) {
    return <div className="stat-bars">{rows.map(row => <div key={row.label}>
        <div><span>{row.label}</span><strong>{row.value}<small>{row.detail || (total ? " / " + total : "")}</small></strong></div>
        <progress className={row.tone || "burgundy"} max={Math.max(1, total)} value={row.value}>{row.value}</progress>
    </div>)}</div>;
}
