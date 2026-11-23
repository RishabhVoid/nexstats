"use client";

import { useState } from "react";
import { ChevronDown, Eye, EyeOff, Wifi } from "lucide-react";
import type { InternetAccess as Access } from "@/types/TeamType";

export default function InternetAccess({ access }: { access?: Access }) {
    const [open, setOpen] = useState(false);
    const [visible, setVisible] = useState(false);
    if (!access?.username || !access.password) return null;
    return <section className="team-internet" aria-label="Internet access">
        <button type="button" className="internet-heading" aria-expanded={open} onClick={() => { setOpen(!open); setVisible(false); }}>
            <Wifi size={16} aria-hidden="true"/><span>Internet access</span><ChevronDown size={15} aria-hidden="true"/>
        </button>
        {open && <div className="internet-fields">
            <label><span>Username</span><input aria-label="Internet username" readOnly value={access.username} autoComplete="off" spellCheck={false}/></label>
            <label><span>Password</span><div className="internet-password"><input aria-label="Internet password" type={visible ? "text" : "password"}
                readOnly value={access.password} autoComplete="off" spellCheck={false}/><button type="button" aria-label={visible ? "Hide internet password" : "Show internet password"}
                onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div></label>
        </div>}
    </section>;
}
