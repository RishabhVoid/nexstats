import { archiveOnly } from "@/lib/archiveAccess";
import { GET as get, POST as post } from "@/app/api/teams/route";

export const dynamic = "force-dynamic";
export const GET = archiveOnly(get);
export const POST = archiveOnly(post);
