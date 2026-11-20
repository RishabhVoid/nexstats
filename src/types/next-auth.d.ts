import NextAuth from "next-auth";

declare module "next-auth" {
    interface User {
        role?: "organizer" | "participant";
        edition?: "one" | "two";
    }

    interface Session {
        user: {
            name?: string | null;
            email?: string | null;
            role?: "organizer" | "participant";
        edition?: "one" | "two";
        };
    }
};

declare module "next-auth/jwt" {
    interface JWT {
        role?: "organizer" | "participant";
        edition?: "one" | "two";
    }
};