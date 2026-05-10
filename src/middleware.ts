import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

type Role = "admin" | "registerer" | "participant";

function parseList(envVal?: string): Set<string> {
    if (!envVal) return new Set();
    try {
        const parsed = JSON.parse(envVal);
        if (Array.isArray(parsed)) {
            if (parsed.length > 0 && typeof parsed[0] === "object") {
                return new Set(
                    parsed
                        .map((x: any) => (typeof x?.email === "string" ? x.email.toLowerCase().trim() : undefined))
                        .filter(Boolean) as string[]
                );
            }
            return new Set(
                parsed
                    .filter((e: unknown): e is string => typeof e === "string")
                    .map((e) => e.toLowerCase().trim())
            );
        }
    } catch { }
    return new Set(
        envVal
            .split(",")
            .map((s) => s.toLowerCase().trim())
            .filter(Boolean)
    );
}

const ADMIN_EMAILS = parseList(process.env.ADMINS);
const REGISTERER_EMAILS = parseList(process.env.REGISTERERS);

function resolveRole(email?: string): Role | undefined {
    const e = email?.toLowerCase().trim();
    if (!e) return undefined;
    if (ADMIN_EMAILS.has(e)) return "admin";
    if (REGISTERER_EMAILS.has(e)) return "registerer";
    return "participant";
}

function roleHome(role: Role) {
    if (role === "admin") return "/admin";
    if (role === "registerer") return "/admin/register-team";
    return "/participants";
}

export default withAuth(
    function middleware(req) {
        const { nextUrl } = req;
        const path = nextUrl.pathname;

        if (
            path.startsWith("/_next") ||
            path === "/favicon.ico" ||
            path === "/robots.txt" ||
            path === "/sitemap.xml" ||
            /\.(?:png|jpg|jpeg|gif|webp|svg|ico|avif|bmp|tiff|mp4|webm|ogg|mp3|wav|txt|xml|json|css|js|map|woff2?|ttf|otf|eot)$/i.test(path)
        ) {
            return NextResponse.next();
        }

        const email =
            (req.nextauth.token?.email as string | undefined) ??
            (req.nextauth.token as any)?.user?.email;
        const role = resolveRole(email);

        if (path === "/") {
            if (role) return NextResponse.redirect(new URL(roleHome(role), nextUrl.origin));
            return NextResponse.next();
        }

        if (!role) {
            const url = new URL("/", nextUrl.origin);
            url.searchParams.set("from", nextUrl.pathname + nextUrl.search);
            url.searchParams.set("error", "AuthRequired");
            return NextResponse.redirect(url);
        }

        if (role === "admin") return NextResponse.next();

        if (role === "registerer") {
            const allowed =
                path === "/admin/register-team" ||
                path.startsWith("/admin/register-team/") ||
                path === "/api/admin/register-team" ||
                path.startsWith("/api/admin/register-team/");
            if (!allowed) return NextResponse.redirect(new URL("/admin/register-team", nextUrl.origin));
            return NextResponse.next();
        }

        const participantAllowed =
            path === "/participants" ||
            path.startsWith("/participants/") ||
            path === "/api/participants" ||
            path.startsWith("/api/participants/") ||
            path === "/api/teams/by-email";
        if (!participantAllowed) return NextResponse.redirect(new URL("/participants", nextUrl.origin));

        return NextResponse.next();
    },
    {
        callbacks: { authorized: () => true },
        pages: { signIn: "/" },
    }
);

export const config = {
    matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};