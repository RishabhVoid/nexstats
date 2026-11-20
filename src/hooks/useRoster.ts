"use client";

import { useEffect, useState } from "react";
import type { Roster } from "@/lib/roster";

export function useRoster() {
    const [teams, setTeams] = useState<Roster>();
    const [error, setError] = useState("");
    useEffect(() => {
        const controller = new AbortController();
        let busy = false;
        async function load() {
            if (busy || document.hidden) return;
            busy = true;
            try {
                const response = await fetch("/api/admin/register-team/roster", { cache: "no-store", signal: controller.signal });
                if (!response.ok) throw new Error();
                const data = await response.json();
                if (!controller.signal.aborted) { setTeams(data.teams); setError(""); }
            } catch {
                if (!controller.signal.aborted) setError("Could not refresh the roster. Try again in a moment.");
            } finally { busy = false; }
        }
        void load();
        const timer = window.setInterval(load, 30000);
        document.addEventListener("visibilitychange", load);
        return () => {
            controller.abort();
            window.clearInterval(timer);
            document.removeEventListener("visibilitychange", load);
        };
    }, []);
    return { teams, error };
}
