import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { staffRole } from "@/lib/access";

const archiveBase = "/archive-nexhack-one";
export default withAuth(req => {
    const url = req.nextUrl;
    const original = url.pathname;
    const archiveApi = original.startsWith("/api" + archiveBase + "/");
    const archive = archiveApi || original === archiveBase || original.startsWith(archiveBase + "/");
    const base = archive ? archiveBase : "";
    const path = archiveApi ? "/api" + original.slice(4 + archiveBase.length) : original.slice(base.length) || "/";
    if (!archive && /\.(?:png|jpg|jpeg|gif|webp|svg|ico|avif|ttf|woff2?)$/i.test(path)) return NextResponse.next();
    const api = path.startsWith("/api/");
    const token = req.nextauth.token;
    const role = token?.role === "organizer" ? staffRole(token.email) : token?.role === "participant" ? "participant" : undefined;
    const participantEditionMatches = role !== "participant" || archive === (token?.edition === "one");
    const home = role === "admin" ? "/admin" : role === "registerer" ? "/admin/register-team" : "/participants";
    const redirect = (to: string) => NextResponse.redirect(new URL(base + to, url.origin));
    if (path === "/") return role && participantEditionMatches ? redirect(home) : NextResponse.next();
    if (!role || !participantEditionMatches) {
        return api ? NextResponse.json({ message: "Sign in required" }, { status:401 }) : redirect("/");
    }
    if (role === "admin") return NextResponse.next();
    const allowed = role === "registerer"
        ? path === "/admin/register-team" || (path === "/api/teams" && req.method === "POST") || path.startsWith("/api/admin/register-team/")
        : path === "/participants" || path === "/api/teams/by-email" || path === "/api/getTeamData";
    if (allowed) return NextResponse.next();
    return api ? NextResponse.json({ message: "Access denied" }, { status:403 }) : redirect(home);
}, { callbacks: { authorized: () => true }, pages: { signIn: "/" } });

export const config = {
    matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
