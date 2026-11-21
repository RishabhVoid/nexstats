import type { Attendance } from "@/lib/roster";

export default function AttendanceBadge({ value }: { value: Attendance }) {
    return <span className={"attendance-badge " + (value === "Present" ? "is-present" : value === "Absent" ? "is-absent" : "is-pending")}>
        {value === "Present" ? "Checked in" : value === "Absent" ? "Absent" : "Not checked in"}
    </span>;
}
