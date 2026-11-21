"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { BookOpen, Castle, ClipboardCheck, LayoutDashboard, LogOut, Users } from "lucide-react";

const pages = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/devfolio", label: "Roster", icon: Users },
    { href: "/admin/register-team", label: "Team check-in", icon: ClipboardCheck },
    { href: "/admin/preview-team", label: "Registration stats", icon: BookOpen },
];

export default function AdminHeader({ title }: { title: string }) {
    const path = usePathname();
    return <header className="hall-header">
        <div className="hall-navigation">
            <Link className="hall-brand" href="/admin"><Castle aria-hidden="true"/><span>NexStats</span></Link>
            <nav aria-label="Organizer navigation">{pages.map(({ href, label, icon: Icon }) =>
                <Link href={href} key={href} aria-current={path === href ? "page" : undefined}><Icon size={16} aria-hidden="true"/>{label}</Link>)}</nav>
            <button className="hall-signout" onClick={() => signOut({ callbackUrl: "/" })}><LogOut size={16} aria-hidden="true"/>Sign out</button>
        </div>
        {title && <div className="hall-title"><h1>{title}</h1></div>}
    </header>;
}
