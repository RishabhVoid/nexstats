"use client";

import { useEdition } from "@/hooks/useEdition";

import { useEffect, useMemo, useState, useCallback } from "react";
import type { TeamType } from "@/types/TeamType";

const NUM_KEYS = 16;
const SALT = "NexStats:v1";

function toHex(buf: ArrayBuffer) {
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}
async function sha256(input: string) {
    const data = new TextEncoder().encode(input);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return toHex(hash);
}
async function sha1(input: string) {
    const data = new TextEncoder().encode(input);
    const hash = await crypto.subtle.digest("SHA-1", data);
    return toHex(hash);
}
function b64encode(s: string) {
    return btoa(unescape(encodeURIComponent(s)));
}
function b64decode(s: string) {
    return decodeURIComponent(escape(atob(s)));
}

export function useTeamCache(email: string | null | undefined) {
    const { api } = useEdition();
    const [team, setTeam] = useState<TeamType | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const normalizedEmail = useMemo(() => (email || "").toLowerCase().trim(), [email]);

    const deriveKeys = useCallback(async () => {
        if (!normalizedEmail) return [];
        const keys: string[] = [];
        for (let i = 0; i < NUM_KEYS; i++) {
            const h = await sha256(`${SALT}:${api}:${i}:${normalizedEmail}`);
            keys.push(`nx:${h.slice(0, 24)}`);
        }
        return keys;
    }, [normalizedEmail, api]);

    const encodePayload = useCallback(async (data: TeamType) => {
        const raw = JSON.stringify(data);
        const sig = await sha1(raw);
        return `${sig}.${b64encode(raw)}`;
    }, []);

    const decodePayload = useCallback(async (payload: string) => {
        const [sig, b64] = payload.split(".", 2);
        if (!sig || !b64) return null;
        const raw = b64decode(b64);
        const check = await sha1(raw);
        if (check !== sig) return null;
        try {
            return JSON.parse(raw) as TeamType;
        } catch {
            return null;
        }
    }, []);

    const readAny = useCallback(async (keys: string[]) => {
        for (const k of keys) {
            const v = typeof window !== "undefined" ? localStorage.getItem(k) : null;
            if (!v) continue;
            const parsed = await decodePayload(v);
            if (parsed) return parsed;
        }
        return null;
    }, [decodePayload]);

    const writeAll = useCallback(async (keys: string[], data: TeamType) => {
        const payload = await encodePayload(data);
        for (const k of keys) localStorage.setItem(k, payload);
    }, [encodePayload]);

    const clearAll = useCallback(async () => {
        const keys = await deriveKeys();
        for (const k of keys) localStorage.removeItem(k);
    }, [deriveKeys]);

    const refresh = useCallback(async () => {
        if (!normalizedEmail) return;
        setLoading(true);
        setError(null);
        try {
            const keys = await deriveKeys();
            const cached = await readAny(keys);
            if (cached) {
                setTeam(cached);
                setLoading(false);
            }
            const res = await fetch(api + "/teams/by-email", { cache: "no-store" });
            if (!res.ok) throw new Error("Could not load team");
            const j = await res.json();
            await writeAll(keys, j.team);
            setTeam(j.team);
        } catch (e: any) {
            setError(e.message || "Error");
        } finally {
            setLoading(false);
        }
    }, [deriveKeys, readAny, writeAll, normalizedEmail, api]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return { team, loading, error, refresh, clearAll };
};