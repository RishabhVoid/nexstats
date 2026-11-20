import { notFound } from "next/navigation";
import { ArchiveDataProvider } from "@/components/ArchiveData";
import { isArchiveAdmin } from "@/lib/archiveAccess";
import teams from "@/data/teams.json";
import members from "@/data/members.json";
import "./archive.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "NexStats · NexHack 1.0 Archive", robots: { index: false, follow: false } };

export default async function ArchiveLayout({ children }: { children: React.ReactNode }) {
    if (!await isArchiveAdmin()) notFound();
    return <ArchiveDataProvider data={{ teams, members }}><div className="archive-one">{children}</div></ArchiveDataProvider>;
}
