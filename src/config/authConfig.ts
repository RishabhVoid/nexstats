import type { AuthOptions, Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import { connectMongo } from "@/lib/mongo";
import { TeamModel } from "@/models/TeamModel";
import crypto from "crypto";

type Role = "organizer" | "participant";
type Creds = { email: string; password: string; role: Role | string };
type OrganizerEntry = { email: string; password: string };

function parseOrganizers(): OrganizerEntry[] {
    const raw = process.env.NEXSTATS_ORGANIZERS || process.env.ORGANIZER_CREDENTIALS || "[]";
    try {
        const arr = JSON.parse(raw);
        if (!Array.isArray(arr)) return [];
        const norm = arr
            .map((x) => ({
                email: typeof x?.email === "string" ? x.email.toLowerCase().trim() : "",
                password: typeof x?.password === "string" ? x.password : "",
            }))
            .filter((x) => x.email && x.password);
        const seen = new Set<string>();
        const dedup: OrganizerEntry[] = [];
        for (const e of norm) {
            if (!seen.has(e.email)) {
                seen.add(e.email);
                dedup.push(e);
            }
        }
        return dedup;
    } catch {
        return [];
    }
}

function safeEq(a: string, b: string) {
    const ah = crypto.createHash("sha256").update(a).digest();
    const bh = crypto.createHash("sha256").update(b).digest();
    if (ah.length !== bh.length) return false;
    return crypto.timingSafeEqual(ah, bh);
}

async function verifyUser(email: string, password: string, role: Role) {
    if (role === "organizer") {
        const list = parseOrganizers();
        const found = list.find((o) => o.email === email && safeEq(o.password, password));
        if (!found) return null;
        return { id: "org_" + crypto.createHash("sha1").update(email).digest("hex").slice(0, 12), name: "Organizer", email, role: "organizer" as Role };
    } else {
        await connectMongo();
        const team = await TeamModel.findOne({ emails: email }).lean();
        if (!team) return null;
        return { id: "usr_" + crypto.createHash("sha1").update(email).digest("hex").slice(0, 12), name: email.split("@")[0], email, role: "participant" as Role };
    }
}

export const AuthConfig: AuthOptions = {
    providers: [
        Credentials({
            name: "Credentials",
            credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" }, role: { label: "Role", type: "text" } },
            async authorize(credentials: Creds | undefined) {
                const email = (credentials?.email ?? "").trim().toLowerCase();
                const role: Role = credentials?.role === "organizer" ? "organizer" : "participant";
                const password = role === "organizer" ? credentials?.password ?? "" : "";
                if (!email) return null;
                const user = await verifyUser(email, password, role);
                if (!user) return null;
                return { id: user.id, name: user.name, email: user.email, role: user.role } as User;
            },
        }),
    ],
    pages: { signIn: "/" },
    session: { strategy: "jwt" },
    callbacks: {
        async jwt({ token, user }) {
            if (user) token.role = (user as any).role;
            return token;
        },
        async session({ session, token }) {
            if (session.user) (session.user as any).role = token.role;
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};