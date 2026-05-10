"use client";

export default function Toggle({
    checked,
    onChange,
    label,
}: {
    checked: boolean;
    onChange: (v: boolean) => void;
    label: string;
}) {
    return (
        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <span className="relative inline-flex h-5 w-9 items-center rounded-full border border-[var(--line-2)] bg-[var(--bg-2)]">
                <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                />
                <span className="pointer-events-none absolute left-0.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded bg-[var(--line-2)] transition-all peer-checked:left-4 peer-checked:bg-[var(--brand)]" />
            </span>
            <span className="text-sm text-2">{label}</span>
        </label>
    );
};