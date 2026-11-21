import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { staffRole } from "@/lib/access";

const archiveBase = "/archive-nexhack-one";
export default withAuth(req => {
    const url = req.nextUrl;
    const path = url.pathname;
    const archive = [archiveBase, "/api" + archiveBase, "/admin/archive"].some(prefix =>
        path === prefix || path.startsWith(prefix + "/"));
    const token = req.nextauth.token;
    const role = token?.role === "organizer" ? staffRole(token.email) : token?.role === "participant" ? "participant" : undefined;
    if (archive) {
        const headers = { "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "private, no-store" };
        if (role !== "admin") return new NextResponse(null, { status: 404, headers });
        return NextResponse.next({ headers });
    }
    if (/\.(?:png|jpg|jpeg|gif|webp|svg|ico|avif|ttf|woff2?)$/i.test(path)) return NextResponse.next();
    const api = path.startsWith("/api/");
    const participantEditionMatches = role !== "participant" || token?.edition !== "one";
    const home = role === "admin" ? "/admin" : role === "registerer" ? "/admin/register-team" : "/participants";
    const redirect = (to: string) => NextResponse.redirect(new URL(to, url.origin));
    if (path === "/") return role && participantEditionMatches ? redirect(home) : NextResponse.next();
    if (!role || !participantEditionMatches) {
        return api ? NextResponse.json({ message: "Sign in required" }, { status:401 }) : redirect("/");
    }
    if (role === "admin") return NextResponse.next();
    const allowed = role === "registerer"
        ? path === "/admin/register-team" || (path === "/api/teams" && req.method === "POST") || path.startsWith("/api/admin/register-team/") || path === "/api/admin/member-profiles"
        : path === "/participants" || path === "/api/teams/by-email" || path === "/api/getTeamData";
    if (allowed) return NextResponse.next();
    return api ? NextResponse.json({ message: "Access denied" }, { status:403 }) : redirect(home);
}, { callbacks: { authorized: () => true }, pages: { signIn: "/" } });

export const config = {
    matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
