"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useEdition } from "@/hooks/useEdition";
import AdminHeader from "@/components/AdminHeader";
import Button from "@/components/Button";

export default function DevfolioHeader() {
    const { base, archive } = useEdition();
    if (!archive) return <AdminHeader title=""/>;
    return <header className="flex sm:items-center justify-between gap-3 p-2 sm:p-0">
        <div className="mc-font relative top-2 text-xl sm:text-2xl lg:text-3xl">NexStats</div>
        <div className="flex gap-2">
            <Link className="mc-btn mc-btn--ghost text-xs" href={base + "/admin"}>Back to Admin</Link>
            <Button size="sm" variant="ghost" onClick={() => signOut({callbackUrl: "/"})}>Logout</Button>
        </div>
    </header>;
}
