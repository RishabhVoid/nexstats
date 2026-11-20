"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Button from "@/components/Button";
import { useAdminStats } from "@/hooks/useAdminStats";
import StatCard from "@/components/StatCard";
import DonutCard from "@/components/DonutCard";
import MiniStat from "@/components/MiniStat";

export default function Admin() {
    const { data, status } = useSession();
    const email = data?.user?.email ?? "Unknown";
    const { totals, donuts, highlights, stats } = useAdminStats();

    return (
        <main className="min-h-dvh bg-[var(--bg)] p-2 sm:p-4">
            <div className="max-w-[1680px] mx-auto space-y-4 sm:space-y-6">
                <header className="flex sm:items-center justify-between gap-3 p-2 sm:p-0">
                    <div>
                        <div className="mc-font relative top-2 text-xl sm:text-2xl lg:text-3xl">NexStats</div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link className="text-sm underline" href="/admin">NexHack 2.0</Link>
                        <button
                            onClick={() => signOut({ callbackUrl: "/archive-nexhack-one" })}
                            className="cursor-pointer rounded bg-[var(--danger)] hover:bg-[var(--danger-hover)] pixel"
                            aria-label="Sign Out"
                            title="Sign Out"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                className="w-6 h-6 text-white"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6A2.25 2.25 0 0 0 5.25 5.25v13.5A2.25 2.25 0
           0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l3 3m0 0-3 3m3-3H3"
                                />
                            </svg>
                        </button>
                    </div>
                </header>

                {status === "loading" && (
                    <section className="mc-card p-6 pixel">
                        <div className="flex items-center gap-3">
                            <span className="w-24 h-3 bg-mc-bar animate-mc-bar pixel" />
                            <span className="text-muted">Loading session…</span>
                        </div>
                    </section>
                )}

                {status === "authenticated" && (
                    <>
                        <section className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-2 sm:gap-3">
                            <StatCard label="Teams" value={totals.totalTeams} />
                            <StatCard label="Members" value={totals.totalMembers} />

                            <StatCard label="Teams RSVP" value={totals.tRSVP} sub={`${stats.teamRsvpPct}% of teams`} percentage={stats.teamRsvpPct} />
                            <StatCard label="Teams Approved" value={totals.tApproved} sub={`${stats.teamApprovedPct}% of teams`} percentage={stats.teamApprovedPct} />
                            <StatCard label="Teams Rejected" value={totals.tReject} sub={`${stats.teamRejectPct}% of teams`} percentage={stats.teamRejectPct} />
                            <StatCard label="Teams Waitlisted" value={totals.tWait} sub={`${stats.teamWaitPct}% of teams`} percentage={stats.teamWaitPct} />

                            <StatCard label="Members RSVP" value={totals.mRSVP} sub={`${stats.memberRsvpPct}% of members`} percentage={stats.memberRsvpPct} />
                            <StatCard label="Members Submitted" value={totals.mSubmit} sub={`${stats.memberSubmitPct}% of members`} percentage={stats.memberSubmitPct} />
                        </section>

                        <section className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
                            <DonutCard {...donuts.teamStatus} />
                            <DonutCard {...donuts.memberStatus} />
                            <DonutCard {...donuts.gender} />
                        </section>

                        <section className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
                            <DonutCard {...donuts.teamSizes} />

                            <div className="mc-card p-6 pixel flex flex-col justify-between">
                                <div>
                                    <div className="mc-font text-base sm:text-lg">Signed in as</div>
                                    <div className="text-muted text-xs sm:text-sm">{email}</div>
                                </div>
                                <div className="mt-6 flex flex-col gap-2">
                                    <Link className="mc-btn" href="/archive-nexhack-one/admin/attendance">Original attendance</Link>
                                    <Link href="/archive-nexhack-one/admin/devfolio">
                                        <Button className="w-full">Manage Devfolio Data</Button>
                                    </Link>
                                    <Link href="/archive-nexhack-one/admin/register-team">
                                        <Button className="w-full">Reg Teams</Button>
                                    </Link>
                                    <Link href="/archive-nexhack-one/admin/preview-team">
                                        <Button className="w-full">Preview Reg Stats</Button>
                                    </Link>
                                </div>
                            </div>

                            <div className="mc-card p-6 pixel">
                                <div className="mc-font text-base sm:text-lg mb-4">Key Statistics</div>
                                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                    <MiniStat label="Avg Team Size" value={stats.avgTeamSize} color="#4a72d9" />
                                    <MiniStat label="Female Ratio" value={highlights.femaleRatio} color="#d96ad9" />
                                    <MiniStat label="Accept Rate (T)" value={stats.teamAcceptRate} color="#9d65ff" />
                                    <MiniStat label="Accept Rate (M)" value={stats.memberAcceptRate} color="#9d65ff" />
                                    <MiniStat label="Conversion Rate" value={stats.conversionRate} color="#3ba55d" />
                                    <MiniStat label="Submission Rate" value={stats.submissionRate} color="#f5c542" />
                                </div>
                            </div>
                        </section>
                    </>
                )}
            </div>
        </main>
    );
};