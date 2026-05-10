"use client";

import Button from "@/components/Button";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function DevfolioHeader() {
    
    const router = useRouter();

    const signOutHandle = () => {
        signOut().then(() => {
            router.push("/");
        });
    };
    
    return (
        <header className="flex sm:items-center justify-between gap-3 p-2 sm:p-0">
            <div>
                <div className="mc-font relative top-2 text-xl sm:text-2xl lg:text-3xl">NexStats</div>
            </div>
            <div className="flex gap-2">
                <Button size="sm" variant="ghost">
                    <a href="/admin" className="text-xs">Back to Admin</a>
                </Button>
                <Button size="sm" variant="ghost" onClick={signOutHandle}>
                    <a href="/admin" className="text-xs">Logout</a>
                </Button>
            </div>
        </header>
    );
};