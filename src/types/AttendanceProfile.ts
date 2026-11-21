export type AttendanceMember = {
    first_name: string;
    slot: number;
    email?: string;
    phone_number?: string;
    college?: string;
    profile_status: "matched" | "unmatched" | "edited";
    profile_version?: string;
};
