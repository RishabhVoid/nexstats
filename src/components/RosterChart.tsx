import DonutCard from "@/components/DonutCard";

const colors = ["#d9b768", "#87c69b", "#7299ca", "#b08fc7", "#de9a75", "#a3b0a1"];

export default function RosterChart({ title, counts }: { title: string; counts: Map<string, number> }) {
    const entries = Array.from(counts).sort(([a], [b]) => a.localeCompare(b));
    const sum = entries.reduce((n, [, value]) => n + value, 0);
    let start = 0;
    const legend = entries.map(([label, value], i) => ({ label, value, color: colors[i % colors.length] }));
    const slices = legend.map(({ value, color }) => {
        const end = start + (sum ? value / sum * 100 : 0);
        const slice = color + " " + start + "% " + end + "%";
        start = end;
        return slice;
    });
    return <DonutCard title={title} sum={sum} legend={legend}
        gradient={sum ? "conic-gradient(" + slices.join(", ") + ")" : "var(--line-2)"}/>;
}
