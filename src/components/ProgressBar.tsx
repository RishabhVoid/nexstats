export default function ProgressBar({
    label,
    value,
    max,
    color,
}: {
    label: string;
    value: number;
    max: number;
    color: string;
}) {
    const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm">
                <span>{label}</span>
                <div className="flex items-center gap-3">
                    <span className="text-muted">
                        {value} / {max}
                    </span>
                    <span className="text-brand font-bold tabular-nums w-10 text-right">{pct}%</span>
                </div>
            </div>
            <div className="h-3 bg-[var(--line-2)] rounded pixel overflow-hidden">
                <div
                    className="h-full pixel transition-all duration-500 ease-out"
                    style={{
                        width: `${pct}%`,
                        background: `repeating-linear-gradient(90deg, ${color} 0 12px, #1a2d1f 12px 24px)`,
                    }}
                />
            </div>
        </div>
    );
};