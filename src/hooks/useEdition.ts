"use client";
import { usePathname } from "next/navigation";
export function useEdition() {
    const archive = usePathname().startsWith("/archive-nexhack-one");
    return { archive, base: archive ? "/archive-nexhack-one" : "", api: archive ? "/api/archive-nexhack-one" : "/api" };
}
