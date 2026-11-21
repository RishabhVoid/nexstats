import { RosterProvider } from "@/hooks/useRoster";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return <RosterProvider><div className="current-admin">{children}</div></RosterProvider>;
}
