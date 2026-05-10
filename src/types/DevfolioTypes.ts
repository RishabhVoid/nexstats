export type DevfolioMemberType = {
    uuid: string;
    email: string;
    username?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    phone_number?: string | null;
    gender?: string | null;
    profile_image?: string | null;
    status: string | null;
};

export type DevfolioTeamMemberType = {
    uuid: string;
    email: string;
    username?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    phone_number?: string | null;
    gender?: string | null;
    profile_image?: string | null;
    status: string | null;
};

export type DevfolioTeamType = {
    team_uuid: string;
    team_name: string;
    team_code?: string | null;
    team_status: string | null;
    members: DevfolioTeamMemberType[];
};