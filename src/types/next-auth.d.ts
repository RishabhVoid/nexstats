import NextAuth from "next-auth";

declare module "next-auth" {
    interface User {
        role?: "organizer" | "participant";
    }

    interface Session {
        user: {
            name?: string | null;
            email?: string | null;
            role?: "organizer" | "participant";
        };
    }
};

declare module "next-auth/jwt" {
    interface JWT {
        role?: "organizer" | "participant";
    }
};