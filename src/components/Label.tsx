import { LabelHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

type Tone = "default" | "muted" | "danger" | "success";
type Weight = "normal" | "semibold" | "bold";
type Size = "sm" | "md" | "lg";

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
    children: ReactNode;
    hint?: string;
    requiredMark?: boolean;
    tone?: Tone;
    weight?: Weight;
    size?: Size;
    blockyTitle?: boolean;
    className?: string;
}

export default function Label({
    children,
    hint,
    requiredMark,
    tone = "default",
    weight = "semibold",
    size = "md",
    blockyTitle = false,
    className,
    ...props
}: LabelProps) {
    const toneClass =
        tone === "muted"
            ? "text-muted"
            : tone === "danger"
                ? "text-[var(--error)]"
                : tone === "success"
                    ? "text-[var(--success)]"
                    : "text-2";

    const sizes: Record<Size, string> = {
        sm: "text-xs",
        md: "text-sm",
        lg: "text-base",
    };

    const weights: Record<Weight, string> = {
        normal: "font-normal",
        semibold: "font-semibold",
        bold: "font-bold",
    };

    return (
        <label
            {...props}
            className={clsx(
                "inline-flex items-center gap-2 select-none group",
                sizes[size],
                weights[weight],
                toneClass,
                blockyTitle && "mc-font tracking-[0.4px]",
                className
            )}
        >
            <span className="relative">
                {children}
                {requiredMark && <span aria-hidden className="text-[var(--gold)] ml-1">*</span>}
                <span className="absolute -bottom-1 left-0 w-0 group-hover:w-full transition-all h-0.5 bg-[var(--brand)]"></span>
            </span>
            {hint && <span className="text-xs text-muted">{hint}</span>}
        </label>
    );
};