import "./archive.css";
export const metadata = { title: "NexStats · NexHack 1.0 Archive" };

export default function ArchiveLayout({ children }: { children: React.ReactNode }) {
    return <div className="archive-one">{children}</div>;
}
