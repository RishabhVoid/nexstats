import { archiveOnly } from "@/lib/archiveAccess";
import { POST as post } from "@/app/api/teams/change-status/route";

export const dynamic = "force-dynamic";
export const POST = archiveOnly(post);
