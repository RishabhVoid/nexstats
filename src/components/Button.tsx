import { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

type Variant = "primary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?: Variant;
    size?: Size;
    leadingIcon?: ReactNode;
    trailingIcon?: ReactNode;
    loading?: boolean;
    block?: boolean;
    className?: string;
}

export default function Button({
    children,
    variant = "primary",
    size = "md",
    leadingIcon,
    trailingIcon,
    loading = false,
    block = false,
    className,
    disabled,
    ...props
}: ButtonProps) {
    const sizes: Record<Size, string> = {
        sm: "text-sm px-3 py-2",
        md: "text-sm px-3.5 py-2.5",
        lg: "text-base px-4.5 py-3",
    };

    return (
        <button
            {...props}
            aria-busy={loading}
            disabled={disabled || loading}
            className={clsx(
                "mc-btn pixel relative overflow-hidden select-none group",
                sizes[size],
                variant === "primary" && "mc-btn--primary",
                variant === "ghost" && "mc-btn--ghost",
                variant === "danger" && "mc-btn--danger",
                block && "w-full",
                loading && "cursor-wait opacity-95",
                className
            )}
        >
            {loading && (
                <span className="absolute inset-x-0 top-0 h-0.5 overflow-hidden">
                    <span className="block h-full w-1/3 mx-auto bg-[linear-gradient(90deg,transparent,rgba(255,255,255,.22),transparent)] animate-mc-shine" />
                </span>
            )}

            <span className={clsx("inline-flex items-center gap-2 transition-transform duration-150", loading ? "translate-y-0" : "group-active:translate-y-[1px]")}>
                <span className="inline-flex items-center min-w-[14px] justify-center">
                    {loading ? (
                        <span className="w-12 h-2 bg-mc-bar animate-mc-bar pixel" />
                    ) : (
                        leadingIcon
                    )}
                </span>

                <span className="relative z-[1]">{children}</span>

                <span className="inline-flex items-center min-w-[14px] justify-center">
                    {loading ? <span className="w-8 h-2 bg-mc-bar animate-mc-bar pixel" /> : trailingIcon}
                </span>
            </span>

            <span className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-200 bg-[radial-gradient(120px_40px_at_50%_-20px,white,transparent_60%)]" />
        </button>
    );
};