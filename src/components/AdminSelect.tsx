"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

type Option = { value: string; label: string; tone?: "green" | "red" | "gold" };
type Props = { label: string; value: string; options: Option[]; onChange: (value: string) => void; disabled?: boolean };

export const attendanceOptions: Option[] = [
    { value: "", label: "Not marked", tone: "gold" },
    { value: "Present", label: "Present", tone: "green" },
    { value: "Absent", label: "Absent", tone: "red" },
];

export default function AdminSelect({ label, value, options, onChange, disabled }: Props) {
    const id = useId();
    const trigger = useRef<HTMLButtonElement>(null);
    const menu = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(0);
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0, maxHeight: 240 });
    const typed = useRef({ text: "", time: 0 });
    const selected = options.find(option => option.value === value) || options[0];

    function show() {
        setActive(Math.max(0, options.findIndex(option => option.value === value)));
        setOpen(true);
    }
    function choose(index: number) {
        const option = options[index];
        if (option) onChange(option.value);
        setOpen(false);
        trigger.current?.focus();
    }
    useLayoutEffect(() => {
        if (!open) return;
        function place() {
            const rect = trigger.current?.getBoundingClientRect();
            if (!rect) return;
            const below = window.innerHeight - rect.bottom - 12;
            const above = rect.top - 12;
            const up = below < Math.min(240, options.length * 40 + 12) && above > below;
            const maxHeight = Math.min(240, Math.max(80, up ? above : below));
            const height = Math.min(maxHeight, options.length * 40 + 12);
            setPosition({ left: Math.max(8, Math.min(rect.left, window.innerWidth - Math.max(180, rect.width) - 8)),
                top: up ? rect.top - height - 6 : rect.bottom + 6, width: Math.max(180, rect.width), maxHeight });
        }
        place();
        window.addEventListener("resize", place);
        window.addEventListener("scroll", place, true);
        return () => { window.removeEventListener("resize", place); window.removeEventListener("scroll", place, true); };
    }, [open, options.length]);
    useEffect(() => {
        if (!open) return;
        function outside(event: PointerEvent) {
            if (!trigger.current?.contains(event.target as Node) && !menu.current?.contains(event.target as Node)) setOpen(false);
        }
        document.addEventListener("pointerdown", outside);
        return () => document.removeEventListener("pointerdown", outside);
    }, [open]);
    useEffect(() => {
        if (open) document.getElementById(id + "-" + active)?.scrollIntoView({ block: "nearest" });
    }, [active, open, id]);
    useEffect(() => { if (disabled) setOpen(false); }, [disabled]);

    return <div className="admin-select">
        <button ref={trigger} type="button" className="select-trigger" role="combobox" aria-label={label}
            aria-expanded={open} aria-haspopup="listbox" aria-controls={open ? id : undefined}
            aria-activedescendant={open ? id + "-" + active : undefined} data-tone={selected?.tone} disabled={disabled}
            onBlur={event => { if (!menu.current?.contains(event.relatedTarget)) setOpen(false); }}
            onClick={() => open ? setOpen(false) : show()}
            onKeyDown={event => {
                if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
                    event.preventDefault();
                    if (!open) show();
                    else setActive(index => event.key === "Home" ? 0 : event.key === "End" ? options.length - 1
                        : (index + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length);
                } else if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault(); if (open) choose(active); else show();
                } else if (event.key === "Escape" || event.key === "Tab") setOpen(false);
                else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
                    const now = Date.now();
                    typed.current = { text: (now - typed.current.time < 700 ? typed.current.text : "") + event.key.toLowerCase(), time: now };
                    const match = options.findIndex(option => option.label.toLowerCase().startsWith(typed.current.text));
                    if (match !== -1) { event.preventDefault(); setActive(match); setOpen(true); }
                }
            }}>
            <span>{selected?.tone && <i aria-hidden="true"/>}{selected?.label}</span><ChevronDown size={15} aria-hidden="true"/>
        </button>
        {open && createPortal(<div ref={menu} id={id} role="listbox" aria-label={label} className="admin-select-menu" style={position}>
            {options.map((option, index) => <div key={option.value} id={id + "-" + index} role="option"
                aria-selected={option.value === value} data-active={active === index} data-tone={option.tone}
                onPointerMove={() => setActive(index)} onMouseDown={event => event.preventDefault()} onClick={() => choose(index)}>
                <span>{option.tone && <i aria-hidden="true"/>}{option.label}</span>{option.value === value && <Check size={15} aria-hidden="true"/>}
            </div>)}
        </div>, document.body)}
    </div>;
}
