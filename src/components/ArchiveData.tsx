"use client";

import { createContext, useContext } from "react";
import type teams from "@/data/teams.json";
import type members from "@/data/members.json";

type ArchiveData = { teams: typeof teams; members: typeof members };
const ArchiveContext = createContext<ArchiveData>({ teams: [], members: [] });

export function ArchiveDataProvider({ data, children }: { data: ArchiveData; children: React.ReactNode }) {
    return <ArchiveContext.Provider value={data}>{children}</ArchiveContext.Provider>;
}

export function useArchiveData() {
    return useContext(ArchiveContext);
}
