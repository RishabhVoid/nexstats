import clsx from "clsx";

export default function StatCard({
    label,
    value,
    sub,
    percentage,
}: {
    label: string;
    value: string | number;
    sub?: string;
    percentage?: number;
}) {
    return (
        <div className={clsx(
            "mc-card p-4 sm:p-6 sm:pb-4 pixel relative overflow-hidden group flex flex-col",
            percentage ? "cursor-pointer h-[150px]" : "h-fit sm:h-[150px]"
        )}>
            <div className="absolute inset-x-0 top-0 h-1 bg-[repeating-linear-gradient(90deg,var(--brand-700)_0_10px,var(--brand)_10px_20px)]" />
            {percentage !== undefined && (
                <div className="absolute top-2 right-2 text-[10px] font-bold text-brand opacity-0 group-hover:opacity-100 transition-opacity">
                    {percentage}%
                </div>
            )}
            <div className="mc-font text-xs sm:text-sm text-2 tracking-wide">{label}</div>
            <div className="text-2xl sm:text-3xl font-extrabold mt-1">{value}</div>
            {sub && <div className="text-xs text-muted mt-auto">{sub}</div>}
        </div>
    );
};