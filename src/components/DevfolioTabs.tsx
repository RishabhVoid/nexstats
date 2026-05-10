"use client";

import Chip from "@/components/Chip";
import type { Tab } from "@/hooks/useDevfolioDataHook";

export default function DevfolioTabs({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
    return (
        <section className="mc-card p-3 sm:p-4">
            <div className="flex items-center gap-2">
                <Chip active={tab === "members"} onClick={() => setTab("members")}>
                    Members
                </Chip>
                <Chip active={tab === "teams"} onClick={() => setTab("teams")}>
                    Teams
                </Chip>
            </div>
        </section>
    );
};