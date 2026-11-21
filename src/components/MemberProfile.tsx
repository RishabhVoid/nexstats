import { GraduationCap, Mail, Phone } from "lucide-react";
import type { AttendanceMember } from "@/types/AttendanceProfile";

export default function MemberProfile({ member }: { member: AttendanceMember }) {
    return <div className="member-profile">
        <p className="member-college"><GraduationCap size={15} aria-hidden="true"/><span>{member.college || "College / organisation not available"}</span></p>
        <p><Mail size={14} aria-hidden="true"/>{member.email ? <a href={"mailto:" + member.email}>{member.email}</a> : <span className="profile-unavailable">Email not available</span>}</p>
        <p><Phone size={14} aria-hidden="true"/>{member.phone_number ? <a href={"tel:" + member.phone_number}>{member.phone_number}</a> : <span className="profile-unavailable">Phone not available</span>}</p>
        {member.profile_status === "unmatched" && <small className="profile-unavailable">Not matched to the Unstop export</small>}
    </div>;
}
