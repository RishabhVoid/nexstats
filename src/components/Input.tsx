import { InputHTMLAttributes, ReactNode, useId, useState } from "react";
import clsx from "clsx";

type Size = "sm" | "md" | "lg";
type Tone = "default" | "success" | "error";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
    size?: Size;
    tone?: Tone;
    leadingIcon?: ReactNode;
    trailingIcon?: ReactNode;
    hint?: string;
    error?: string;
    loading?: boolean;
    block?: boolean;
    allowPasswordToggle?: boolean;
    className?: string;
    containerClassName?: string;
}

export default function Input({
    size = "md",
    tone = "default",
    leadingIcon,
    trailingIcon,
    hint,
    error,
    loading = false,
    block = true,
    allowPasswordToggle = true,
    className,
    containerClassName,
    type = "text",
    id,
    ...props
}: InputProps) {
    const autoId = useId();
    const inputId = id || autoId;
    const [show, setShow] = useState(false);
    const isPassword = type === "password";
    const sizes: Record<Size, { padY: string; padX: string; text: string; icon: string }> = {
        sm: { padY: "py-2", padX: "px-3", text: "text-sm", icon: "h-4 w-4" },
        md: { padY: "py-2.5", padX: "px-3.5", text: "text-sm", icon: "h-4.5 w-4.5" },
        lg: { padY: "py-3", padX: "px-4", text: "text-base", icon: "h-5 w-5" },
    };
    const toneClasses =
        tone === "success"
            ? "border-[var(--success)] focus-visible:ring-0"
            : tone === "error"
                ? "border-[var(--error)] focus-visible:ring-0"
                : "border-[var(--line-2)]";
    const leftPad = leadingIcon ? "pl-10" : "";
    const rightPad = trailingIcon || loading || (isPassword && allowPasswordToggle) ? "pr-10" : "";
    return (
        <div className={clsx("w-full", containerClassName)}>
            <div className="relative">
                {leadingIcon && (
                    <span className={clsx("absolute left-3 top-1/2 -translate-y-1/2 text-2", sizes[size].icon, "inline-flex items-center justify-center")}>
                        {leadingIcon}
                    </span>
                )}
                <input
                    id={inputId}
                    {...props}
                    type={isPassword && allowPasswordToggle ? (show ? "text" : "password") : type}
                    aria-invalid={tone === "error" ? true : undefined}
                    className={clsx(
                        "mc-input w-full outline-none transition-all",
                        sizes[size].padY,
                        sizes[size].padX,
                        sizes[size].text,
                        toneClasses,
                        leftPad,
                        rightPad,
                        loading && "cursor-wait opacity-95",
                        className
                    )}
                />
                {loading && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-2 bg-mc-bar animate-mc-bar pixel" />
                )}
                {!loading && trailingIcon && (
                    <span className={clsx("absolute right-3 top-1/2 -translate-y-1/2 text-2", sizes[size].icon, "inline-flex items-center justify-center")}>
                        {trailingIcon}
                    </span>
                )}
                {isPassword && allowPasswordToggle && !loading && !trailingIcon && (
                    <button
                        type="button"
                        tabIndex={-1}
                        aria-label={show ? "Hide password" : "Show password"}
                        onClick={() => setShow((s) => !s)}
                        className={clsx(
                            "absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs text-2 hover:bg-[var(--bg-3)] border border-transparent hover:border-[var(--line-2)]"
                        )}
                    >
                        {show ? "Hide" : "Show"}
                    </button>
                )}
            </div>
            {error ? (
                <p className="mt-2 text-xs text-[var(--error)]">{error}</p>
            ) : hint ? (
                <p className="mt-2 text-xs text-muted">{hint}</p>
            ) : null}
        </div>
    );
};