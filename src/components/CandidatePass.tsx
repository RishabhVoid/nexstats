"use client";

import { useEffect, useRef } from "react";
import { signOut, useSession } from "next-auth/react";
import { Castle, Check, Clock3, DoorOpen, GraduationCap, Loader2, LogOut, Mail, Phone } from "lucide-react";
import { useTeamCache } from "@/hooks/useTeamCache";

const normalize = (value?: string | null) => value?.trim().toLowerCase() || "";
function initials(name: string) { return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join(""); }

export default function CandidatePass() {
    const { data: session } = useSession();
    const email = session?.user.email;
    const { team, loading, error, refresh } = useTeamCache(email);
    const lastAttempt = useRef(Date.now());
    useEffect(() => {
        if (!email) return;
        function update() {
            if (document.visibilityState !== "visible" || Date.now() - lastAttempt.current < 60_000) return;
            lastAttempt.current = Date.now();
            void refresh(true);
        }
        const timer = window.setInterval(update, 60_000);
        window.addEventListener("focus", update);
        document.addEventListener("visibilitychange", update);
        return () => { window.clearInterval(timer); window.removeEventListener("focus", update); document.removeEventListener("visibilitychange", update); };
    }, [email, refresh]);
    const checkedIn = team?.attendance === "Present";
    const statusRows = [
        { label: "Check-in", complete: checkedIn, value: checkedIn ? "Checked in" : "Pending" },
        { label: "College ID", complete: !!team?.college_id, value: team?.college_id ? "Verified" : "To verify" },
        { label: "Event kit", complete: !!team?.kit_distribution, value: team?.kit_distribution ? "Collected" : "To collect" },
    ];
    return <main className="candidate-pass" aria-busy={loading && !team}>
        <header className="candidate-header"><div className="candidate-header-inner">
            <div className="candidate-brand"><Castle aria-hidden="true"/><span>NexStats</span></div>
            <div className="candidate-header-actions"><span>NexHack 2.0</span><button className="candidate-button" onClick={() => signOut({ callbackUrl: "/" })}><LogOut size={15} aria-hidden="true"/>Sign out</button></div>
        </div></header>
        {!team && error ? <section className="candidate-load-error" role="alert"><h1>Your pass couldn’t load.</h1><p>{error}</p>
            <button className="candidate-button" disabled={loading} onClick={() => void refresh()}>{loading && <Loader2 className="save-spinner" size={16} aria-hidden="true"/>}{loading ? "Loading…" : "Try again"}</button></section>
        : <div className="candidate-layout">
            <section className="candidate-room" aria-label="Your arrival pass">
                <div className="candidate-room-hero"><p className="candidate-eyebrow"><DoorOpen size={17} aria-hidden="true"/>Your room</p>
                    <h1 className={"candidate-room-number" + (!team?.assigned_room_no ? " room-pending" : "")}>{team ? team.assigned_room_no || "Pending" : "—"}</h1>
                    <p className="candidate-room-caption">{!team ? "Loading your assignment…" : team.room_status === "ambiguous" ? "Your organizer is confirming the assignment." : team.assigned_room_no ? "Your space for the hackathon." : "Your room will appear once assigned."}</p>
                </div>
                <ul className="candidate-progress" aria-label="Registration progress">{statusRows.map(item => <li key={item.label}>
                    <span>{item.label}</span><strong data-complete={item.complete}>{item.complete ? <Check size={14} aria-hidden="true"/> : <Clock3 size={13} aria-hidden="true"/>}{team ? item.value : "—"}</strong>
                </li>)}</ul>
                <p className="candidate-room-note">{checkedIn ? "You’re all checked in. Happy hacking." : "Have your college ID ready at registration."}</p>
            </section>
            <section className="candidate-manifest" aria-labelledby="candidate-team-name">
                <div className="candidate-team-heading"><div><p className="candidate-eyebrow">Your team</p><h2 id="candidate-team-name">{team?.name || "Loading your pass…"}</h2></div>
                    {team && <span className="candidate-member-count">{team.members_count}<span>{team.members_count === 1 ? "member" : "members"}</span></span>}</div>
                {error && <p className="candidate-notice" role="alert">Couldn’t update your pass. Showing the last loaded details.</p>}
                {team?.status?.state && team.status.state !== "active" && <p className="candidate-notice" role="alert">{team.status.state}{team.status.note && ": " + team.status.note}</p>}
                <div className="candidate-column-labels" aria-hidden="true"><span>Member</span><span>Contact</span><span>College / organisation</span></div>
                <ul className="candidate-member-list" tabIndex={0} aria-label="Team members">{team ? team.members_data.map((member, index) => {
                    const me = normalize(member.email) === normalize(email) && !!email;
                    return <li className={"candidate-member" + (me ? " is-you" : "")} key={index + ":" + member.email}>
                        <div className="candidate-member-identity"><span className="candidate-avatar" aria-hidden="true">{initials(member.name)}</span><div><h3>{member.name}</h3>
                            <p>{me && <span className="candidate-you">You</span>}{member.is_leader ? "Team lead" : "Member"}</p></div></div>
                        <div className="candidate-member-contact">{member.email ? <a href={"mailto:" + member.email}><Mail size={13} aria-hidden="true"/>{member.email}</a> : <span>Email not added</span>}
                            {member.phone ? <a href={"tel:" + member.phone}><Phone size={13} aria-hidden="true"/>{member.phone}</a> : <span>Phone not added</span>}</div>
                        <p className={"candidate-member-college" + (!member.college ? " is-missing" : "")}><GraduationCap size={15} aria-hidden="true"/>{member.college || "College not added"}</p>
                    </li>;
                }) : Array.from({ length: 3 }, (_, i) => <li key={i} className="candidate-member-skeleton" aria-hidden="true"><i/><span/><span/></li>)}</ul>
                {team?.notes?.trim() && <aside className="candidate-organizer-note"><h3>From the organizers</h3><p>{team.notes}</p></aside>}
                <footer className="candidate-manifest-footer"><span>Need a correction? Ask the registration desk.</span><span>Updates automatically</span></footer>
            </section>
        </div>}
    </main>;
}
