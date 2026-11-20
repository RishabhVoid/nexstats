import { archiveOnly } from "@/lib/archiveAccess";
import { GET as get } from "@/app/api/getTeamData/route";

export const dynamic = "force-dynamic";
export const GET = archiveOnly(get);
