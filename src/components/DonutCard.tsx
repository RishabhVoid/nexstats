export default function DonutCard({
    title,
    sum,
    gradient,
    legend,
}: {
    title: string;
    sum: number;
    gradient: string;
    legend: { label: string; value: number; color: string; title?: string }[];
}) {
    const total = legend.reduce((acc, item) => acc + item.value, 0);
    return (
        <div className="mc-card p-4 sm:p-6 pixel">
            <div className="mc-font text-base sm:text-lg mb-4 tracking-wide">{title}</div>
            <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
                <div
                    className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full pixel"
                    style={{ background: gradient }}
                >
                    <div className="absolute inset-3 sm:inset-4 rounded-full bg-[var(--bg-2)] border border-[var(--line-2)] flex items-center justify-center">
                        <div className="text-center">
                            <div className="mc-font text-xl sm:text-2xl">{sum}</div>
                            <div className="text-xs text-muted">Total</div>
                        </div>
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2/3 h-2 rounded-full bg-black/30 blur-sm" />
                </div>
                <div className="flex-1 w-full">
                    <div className="grid gap-2 sm:gap-3 text-xs sm:text-sm">
                        {legend.map((s) => {
                            const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
                            return (
                                <div
                                    key={s.label}
                                    className="flex items-center gap-3 rounded border border-[var(--line-1)] bg-[#0b1218] px-2 py-2 hover:border-[var(--brand-700)] transition-colors"
                                    title={s.title || s.label}
                                >
                                    <span
                                        className="inline-block w-3.5 h-3.5 rounded-sm pixel"
                                        style={{ background: s.color }}
                                    />
                                    <span className="min-w-[90px]">{s.label}</span>
                                    <span className="text-muted tabular-nums w-10 text-right">{s.value}</span>
                                    <span className="text-brand text-xs font-bold tabular-nums w-10 text-right">{pct}%</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};