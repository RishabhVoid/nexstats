"use client";

export default function DeskToggle({ label, checked, onChange, disabled, onLabel, offLabel }: {
    label: string;
    checked: boolean;
    onChange: (value: boolean) => void;
    disabled?: boolean;
    onLabel: string;
    offLabel: string;
}) {
    return <button type="button" className="desk-toggle" role="switch" aria-label={label} aria-checked={checked}
        disabled={disabled} onClick={() => onChange(!checked)}>
        <span><strong>{label}</strong><small>{checked ? onLabel : offLabel}</small></span>
        <span className="desk-toggle-rail" aria-hidden="true"><span/></span>
    </button>;
}
