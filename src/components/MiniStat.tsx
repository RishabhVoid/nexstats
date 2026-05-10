export default function MiniStat({ label, value, color }: { label: string; value: string | number; color: string }) {
    return (
        <div className="bg-[#0b1218] p-2 rounded border border-[var(--line-2)] pixel hover:border-[var(--brand-700)] transition-colors">
            <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full pixel" style={{ background: color }} />
                <div className="text-xs text-muted">{label}</div>
            </div>
            <div className="mc-font text-lg sm:text-xl">{value}</div>
        </div>
    );
};