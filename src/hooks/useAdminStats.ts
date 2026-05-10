"use client";

import { useMemo } from "react";
import type { DevfolioTeamType, DevfolioMemberType } from "@/types/DevfolioTypes";
import rawTeams from "@/data/teams.json";
import rawMembers from "@/data/members.json";

export type Slice = { label: string; value: number; color: string; title?: string };
export type DonutData = { title: string; sum: number; gradient: string; legend: Slice[] };

type Team = DevfolioTeamType;
type Member = DevfolioMemberType;

const toTeams = (d: unknown) => (d as Team[]) ?? [];
const toMembers = (d: unknown) => (d as Member[]) ?? [];
const norm = (v?: string | null) => (v || "").toLowerCase().trim();

function makeGradient(slices: Slice[], total?: number) {
    const sum = total ?? slices.reduce((a, s) => a + s.value, 0);
    let acc = 0;
    const parts: string[] = [];
    for (const s of slices) {
        const pct = sum ? (s.value / sum) * 100 : 0;
        const start = acc;
        const end = acc + pct;
        parts.push(`${s.color} ${start.toFixed(2)}% ${end.toFixed(2)}%`);
        acc = end;
    }
    return { sum, gradient: `conic-gradient(${parts.join(", ")})` };
}

function pct(value: number, total: number, decimals = 1): number {
    return total > 0 ? Number(((value / total) * 100).toFixed(decimals)) : 0;
}
const pctStr = (v: number, t: number, d = 1) => `${pct(v, t, d)}%`;

const mapTeam = (s?: string | null) => {
    const x = norm(s);
    if (x === "accept_sent" || x === "reject" || x === "rsvp" || x === "waitlist") return x;
    return "rsvp";
};
const mapMember = (s?: string | null) => {
    const x = norm(s);
    if (x === "accept" || x === "accept_sent" || x === "reject" || x === "reject_sent" || x === "rsvp" || x === "submit" || x === "waitlist" || x === "withdraw") return x;
    return "submit";
};

export function useAdminStats() {
    const teams = useMemo(() => toTeams(rawTeams), []);
    const members = useMemo(() => toMembers(rawMembers), []);

    const totals = useMemo(() => {
        const totalTeams = teams.length;
        const totalMembers = members.length;

        const teamBuckets = { rsvp: 0, accept_sent: 0, reject: 0, waitlist: 0 };
        teams.forEach((t) => (teamBuckets as any)[mapTeam(t.team_status)]++);

        const memberBuckets = { rsvp: 0, submit: 0, accept: 0, accept_sent: 0, reject: 0, reject_sent: 0, waitlist: 0, withdraw: 0 };
        members.forEach((m) => (memberBuckets as any)[mapMember(m.status)]++);

        const sizes = [1, 2, 3, 4].map((n) => teams.filter((t) => t.members.length === n).length);
        const [teamSize1, teamSize2, teamSize3, teamSize4] = sizes;

        const gMale = members.filter((m) => ["m", "male"].includes(norm(m.gender))).length;
        const gFemale = members.filter((m) => ["f", "female"].includes(norm(m.gender))).length;
        const gOther = members.filter((m) => {
            const g = norm(m.gender);
            return g && !["m", "male", "f", "female"].includes(g);
        }).length;
        const gUnknown = Math.max(0, totalMembers - (gMale + gFemale + gOther));

        return {
            totalTeams,
            totalMembers,
            tRSVP: teamBuckets.rsvp,
            tApproved: teamBuckets.accept_sent,
            tReject: teamBuckets.reject,
            tWait: teamBuckets.waitlist,
            mRSVP: memberBuckets.rsvp,
            mSubmit: memberBuckets.submit,
            mAccept: memberBuckets.accept,
            mAcceptSent: memberBuckets.accept_sent,
            mReject: memberBuckets.reject,
            mRejectSent: memberBuckets.reject_sent,
            mWait: memberBuckets.waitlist,
            mWithdraw: memberBuckets.withdraw,
            teamSize1, teamSize2, teamSize3, teamSize4,
            gMale, gFemale, gOther, gUnknown,
        };
    }, [teams, members]);

    const stats = useMemo(() => {
        const teamAcceptedTotal = totals.tApproved;
        const memberAcceptedTotal = totals.mAccept + totals.mAcceptSent;

        return {
            teamRsvpPct: pct(totals.tRSVP, totals.totalTeams, 0),
            teamApprovedPct: pct(teamAcceptedTotal, totals.totalTeams, 0),
            teamRejectPct: pct(totals.tReject, totals.totalTeams, 0),
            teamWaitPct: pct(totals.tWait, totals.totalTeams, 0),

            memberRsvpPct: pct(totals.mRSVP, totals.totalMembers, 0),
            memberSubmitPct: pct(totals.mSubmit, totals.totalMembers, 0),
            memberAcceptedPct: pct(memberAcceptedTotal, totals.totalMembers, 0),
            memberRejectPct: pct(totals.mReject + totals.mRejectSent, totals.totalMembers, 0),
            memberWaitPct: pct(totals.mWait, totals.totalMembers, 0),
            memberWithdrawPct: pct(totals.mWithdraw, totals.totalMembers, 0),

            avgTeamSize: totals.totalTeams > 0 ? (totals.totalMembers / totals.totalTeams).toFixed(1) : "0",
            teamAcceptRate: totals.tRSVP > 0 ? pctStr(teamAcceptedTotal, totals.tRSVP) : "0%",
            memberAcceptRate: totals.mSubmit > 0 ? pctStr(memberAcceptedTotal, totals.mSubmit) : "0%",
            submissionRate: totals.totalMembers > 0 ? pctStr(totals.mSubmit, totals.totalMembers) : "0%",
            conversionRate: totals.mRSVP > 0 ? pctStr(memberAcceptedTotal, totals.mRSVP) : "0%",
        };
    }, [totals]);

    const donuts = useMemo(() => {
        const teamStatusSlices: Slice[] = [
            { label: "RSVP", value: totals.tRSVP, color: "#3ba55d", title: "Team RSVP’d" },
            { label: "Approved", value: totals.tApproved, color: "#4a72d9", title: "accept_sent (approval email sent)" },
            { label: "Rejected", value: totals.tReject, color: "#d64545", title: "reject" },
            { label: "Waitlisted", value: totals.tWait, color: "#9d65ff", title: "waitlist" },
        ];
        const memberStatusSlices: Slice[] = [
            { label: "RSVP", value: totals.mRSVP, color: "#3ba55d" },
            { label: "Submitted", value: totals.mSubmit, color: "#f5c542" },
            { label: "Accepted", value: totals.mAccept, color: "#2ea6a6" },
            { label: "Approved", value: totals.mAcceptSent, color: "#4a72d9" },
            { label: "Rejected", value: totals.mReject, color: "#d64545" },
            { label: "Reject Sent", value: totals.mRejectSent, color: "#b03b3b" },
            { label: "Waitlisted", value: totals.mWait, color: "#9d65ff" },
            { label: "Withdraw", value: totals.mWithdraw, color: "#7a8594" },
        ];
        const genderSlices: Slice[] = [
            { label: "Female", value: totals.gFemale, color: "#d96ad9" },
            { label: "Male", value: totals.gMale, color: "#4a72d9" },
            { label: "Other", value: totals.gOther, color: "#9d65ff" },
            { label: "Unknown", value: totals.gUnknown, color: "#7a8594" },
        ];
        const teamSizeSlices: Slice[] = [
            { label: "1 Member", value: totals.teamSize1, color: "#2f2b4c" },
            { label: "2 Members", value: totals.teamSize2, color: "#2f8a4c" },
            { label: "3 Members", value: totals.teamSize3, color: "#f59f42" },
            { label: "4 Members", value: totals.teamSize4, color: "#4a72d9" },
        ];

        const teamStatus = (() => {
            const { sum, gradient } = makeGradient(teamStatusSlices, totals.totalTeams);
            return { title: "Team Status", sum, gradient, legend: teamStatusSlices };
        })();
        const memberStatus = (() => {
            const { sum, gradient } = makeGradient(memberStatusSlices, totals.totalMembers);
            return { title: "Member Status", sum, gradient, legend: memberStatusSlices };
        })();
        const gender = (() => {
            const { sum, gradient } = makeGradient(genderSlices, totals.totalMembers);
            return { title: "Gender Breakdown", sum, legend: genderSlices, gradient };
        })();
        const teamSizes = (() => {
            const total = totals.teamSize1 + totals.teamSize2 + totals.teamSize3 + totals.teamSize4;
            const { sum, gradient } = makeGradient(teamSizeSlices, total);
            return { title: "Team Sizes", sum, gradient, legend: teamSizeSlices };
        })();

        return { teamStatus, memberStatus, gender, teamSizes };
    }, [totals]);

    const highlights = useMemo(() => {
        const mostCommon = [
            { k: "1 member", v: totals.teamSize1 },
            { k: "2 members", v: totals.teamSize2 },
            { k: "3 members", v: totals.teamSize3 },
            { k: "4 members", v: totals.teamSize4 },
        ].sort((a, b) => b.v - a.v)[0];
        const femaleRatio = totals.totalMembers ? ((totals.gFemale / totals.totalMembers) * 100).toFixed(1) + "%" : "0%";
        return { mostCommonTeamSize: mostCommon.v === 0 ? "N/A" : mostCommon.k, femaleRatio };
    }, [totals]);

    return { totals, donuts, highlights, stats };
};