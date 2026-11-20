"use client";

import DevfolioHeader from "@/components/DevfolioHeader";
import DevfolioTabs from "@/components/DevfolioTabs";
import MembersSection from "@/components/MembersSection";
import TeamsSection from "@/components/TeamsSection";
import { useDevfolioDataHook } from "@/hooks/useDevfolioDataHook";

export default function DevfolioPage() {
  const {
    tab,
    setTab,
    memberStatuses,
    memberGenders,
    teamStatuses,
    teamSizes,
    mQuery,
    setMQuery,
    mStatus,
    setMStatus,
    mGender,
    setMGender,
    mCountable,
    setMCountable,
    filteredMembers,
    mChecked,
    setMChecked,
    tQuery,
    setTQuery,
    tStatus,
    setTStatus,
    tSize,
    setTSize,
    tCountable,
    setTCountable,
    filteredTeams,
    tChecked,
    setTChecked,
  } = useDevfolioDataHook();

  return (
    <main className="min-h-dvh p-3 sm:p-4 lg:p-6 bg-[var(--bg)]">
      <div className="mx-auto space-y-4">
        <DevfolioHeader />
        <DevfolioTabs tab={tab} setTab={setTab} />
        {tab === "members" && (
          <MembersSection
            memberStatuses={memberStatuses}
            memberGenders={memberGenders}
            mQuery={mQuery}
            setMQuery={setMQuery}
            mStatus={mStatus}
            setMStatus={setMStatus}
            mGender={mGender}
            setMGender={setMGender}
            mCountable={mCountable}
            setMCountable={setMCountable}
            filteredMembers={filteredMembers}
            mChecked={mChecked}
            setMChecked={setMChecked}
          />
        )}
        {tab === "teams" && (
          <TeamsSection
            teamStatuses={teamStatuses}
            teamSizes={teamSizes}
            tQuery={tQuery}
            setTQuery={setTQuery}
            tStatus={tStatus}
            setTStatus={setTStatus}
            tSize={tSize}
            setTSize={setTSize}
            tCountable={tCountable}
            setTCountable={setTCountable}
            filteredTeams={filteredTeams}
            tChecked={tChecked}
            setTChecked={setTChecked}
          />
        )}
      </div>
    </main>
  );
};