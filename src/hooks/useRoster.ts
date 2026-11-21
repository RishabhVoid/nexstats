"use client";

import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { AttendanceTeam, Roster } from "@/lib/roster";

type RosterState = {
    teams?: Roster;
    error: string;
    loading: boolean;
    syncedAt: string | null;
    refresh: () => void;
    updateTeam: (team: AttendanceTeam) => void;
};
const RosterContext = createContext<RosterState | null>(null);

export function RosterProvider({ children }: { children: ReactNode }) {
    const [teams, setTeams] = useState<Roster>();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [syncedAt, setSyncedAt] = useState<string | null>(null);
    const request = useRef<AbortController>();
    const lastAttempt = useRef(0);
    const load = useCallback(async (force = false, replace = false) => {
        if (request.current && !request.current.signal.aborted && !force && !replace) return;
        request.current?.abort();
        const controller = new AbortController();
        request.current = controller;
        lastAttempt.current = Date.now();
        setLoading(true);
        try {
            const response = await fetch("/api/admin/register-team/roster" + (force ? "?refresh=1" : ""), {
                cache: "no-store", signal: controller.signal,
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Could not update the roster.");
            if (!controller.signal.aborted) {
                setTeams(data.teams);
                setSyncedAt(data.syncedAt || null);
                setError("");
            }
        } catch (error) {
            if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Could not update the roster.");
        } finally {
            if (request.current === controller) { request.current = undefined; setLoading(false); }
        }
    }, []);
    const refresh = useCallback(() => { void load(true); }, [load]);
    const updateTeam = useCallback((team: AttendanceTeam) => {
        setTeams(previous => previous?.some(item => item.team_uuid === team.team_uuid)
            ? previous.map(item => item.team_uuid === team.team_uuid ? team : item) : [...(previous || []), team]);
        // The save updated the server snapshot. Read it without another Sheets refresh.
        void load(false, true);
    }, [load]);
    useEffect(() => {
        void load();
        function updateWhenVisible() {
            if (document.visibilityState === "visible" && Date.now() - lastAttempt.current >= 60_000) void load();
        }
        const timer = window.setInterval(updateWhenVisible, 60_000);
        window.addEventListener("focus", updateWhenVisible);
        document.addEventListener("visibilitychange", updateWhenVisible);
        return () => {
            window.clearInterval(timer);
            window.removeEventListener("focus", updateWhenVisible);
            document.removeEventListener("visibilitychange", updateWhenVisible);
            request.current?.abort();
        };
    }, [load]);
    const value = useMemo(() => ({ teams, error, loading, syncedAt, refresh, updateTeam }), [teams, error, loading, syncedAt, refresh, updateTeam]);
    return createElement(RosterContext.Provider, { value }, children);
}

export function useRoster() {
    const state = useContext(RosterContext);
    if (!state) throw new Error("useRoster needs RosterProvider.");
    return state;
}
