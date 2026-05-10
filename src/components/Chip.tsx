"use client";

import React from "react";

export default function Chip({
    active,
    children,
    onClick,
}: {
    active?: boolean;
    children: React.ReactNode;
    onClick?: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`px-3 py-1.5 rounded pixel border text-sm whitespace-nowrap transition-colors ${active
                    ? "bg-[var(--brand-800)] border-[var(--brand-700)]"
                    : "bg-[var(--bg-2)] border-[var(--line-2)] hover:border-[var(--brand-700)]"
                }`}
        >
            {children}
        </button>
    );
};