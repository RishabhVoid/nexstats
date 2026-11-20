import { useArchiveData } from "@/components/ArchiveData";
import { useMemo, useState } from "react";
import type { DevfolioTeamType, DevfolioMemberType } from "@/types/DevfolioTypes";

export type Tab = "members" | "teams";

export function useDevfolioDataHook() {
    const { teams: rawTeams, members: rawMembers } = useArchiveData();
    const [tab, setTab] = useState<Tab>("members");

    const teams = useMemo(() => (rawTeams as DevfolioTeamType[]) ?? [], [rawTeams]);
    const members = useMemo(() => (rawMembers as DevfolioMemberType[]) ?? [], [rawMembers]);

    const [mQuery, setMQuery] = useState("");
    const [mStatus, setMStatus] = useState<string[]>([]);
    const [mGender, setMGender] = useState<string[]>([]);
    const [mCountable, setMCountable] = useState(false);
    const [mChecked, setMChecked] = useState<Set<string>>(new Set());

    const [tQuery, setTQuery] = useState("");
    const [tStatus, setTStatus] = useState<string[]>([]);
    const [tSize, setTSize] = useState<number[]>([]);
    const [tCountable, setTCountable] = useState(false);
    const [tChecked, setTChecked] = useState<Set<string>>(new Set());

    const norm = (v?: string | null) => (v || "").toLowerCase().trim();

    const memberStatuses = useMemo(() => {
        const s = new Set<string>();
        members.forEach((m) => s.add(norm(m.status)));
        return Array.from(s).filter(Boolean).sort();
    }, [members]);

    const memberGenders = useMemo(() => {
        const s = new Set<string>();
        members.forEach((m) => s.add(norm(m.gender)));
        return Array.from(s).filter(Boolean).sort();
    }, [members]);

    const teamStatuses = useMemo(() => {
        const s = new Set<string>();
        teams.forEach((t) => s.add(norm(t.team_status)));
        return Array.from(s).filter(Boolean).sort();
    }, [teams]);

    const teamSizes = useMemo(() => [1, 2, 3, 4], []);

    const filteredMembers = useMemo(() => {
        const q = norm(mQuery);
        return members.filter((m) => {
            const inQ =
                !q ||
                m.email.toLowerCase().includes(q) ||
                (m.username || "").toLowerCase().includes(q) ||
                (m.first_name || "").toLowerCase().includes(q) ||
                (m.last_name || "").toLowerCase().includes(q);
            const inS = !mStatus.length || mStatus.includes(norm(m.status));
            const inG = !mGender.length || mGender.includes(norm(m.gender));
            return inQ && inS && inG;
        });
    }, [members, mQuery, mStatus, mGender]);

    const filteredTeams = useMemo(() => {
        const q = norm(tQuery);
        return teams.filter((t) => {
            const inQ =
                !q ||
                t.team_name.toLowerCase().includes(q) ||
                (t.team_code || "").toLowerCase().includes(q) ||
                t.members.some(
                    (m) =>
                        m.email.toLowerCase().includes(q) ||
                        (m.first_name || "").toLowerCase().includes(q) ||
                        (m.last_name || "").toLowerCase().includes(q)
                );
            const inS = !tStatus.length || tStatus.includes(norm(t.team_status));
            const inSize = !tSize.length || tSize.includes(t.members.length);
            return inQ && inS && inSize;
        });
    }, [teams, tQuery, tStatus, tSize]);

    return {
        tab, setTab,
        teams, members,
        mQuery, setMQuery,
        mStatus, setMStatus,
        mGender, setMGender,
        mCountable, setMCountable,
        mChecked, setMChecked,
        tQuery, setTQuery,
        tStatus, setTStatus,
        tSize, setTSize,
        tCountable, setTCountable,
        tChecked, setTChecked,
        memberStatuses, memberGenders,
        teamStatuses, teamSizes,
        filteredMembers, filteredTeams,
    };
};