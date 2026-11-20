import { getServerSession } from "next-auth";
import { AuthConfig } from "@/config/authConfig";
import { staffRole } from "@/lib/access";

export async function isArchiveAdmin() {
    const session = await getServerSession(AuthConfig);
    return session?.user.role === "organizer" && staffRole(session.user.email) === "admin";
}

export function archiveOnly(handler: (request: Request) => Promise<Response>) {
    return async (request: Request) => {
        if (!await isArchiveAdmin()) return new Response(null, { status: 404, headers: { "Cache-Control": "private, no-store" } });
        return handler(request);
    };
}
