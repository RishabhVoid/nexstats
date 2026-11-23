export type InternetAccess = { username: string; password: string };

export type TeamMemberType = {
    email: string;
    name: string;
    phone?: string;
    college?: string;
    is_leader: boolean;
};

export type TeamType = {
    id: string;
    internet_access?: InternetAccess;
    emails: string[];
    name: string;
    members_count: number;
    members_data: TeamMemberType[];
    assigned_block?: string;
    assigned_floor?: string;
    assigned_room_no?: string;
    room_status?: "assigned" | "unassigned" | "ambiguous";
    attendance?: "" | "Present" | "Absent";
    assigned_desk?: string;
    college_id: boolean,
    aadhar_id: boolean,
    kit_distribution: boolean,
    emergency_contact: string,
    status: {
        state: string;
        note: string;
    };
    notes?: string;
    createdAt: Date | string;
    updatedAt: Date | string;
};