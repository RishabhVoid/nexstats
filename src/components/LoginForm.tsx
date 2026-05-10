"use client";

import Button from "@/components/Button";
import Input from "@/components/Input";
import Label from "@/components/Label";
import useAuthHook from "@/hooks/useAuthHook";
import clsx from "clsx";
import { useCallback } from "react";

export default function LoginForm() {
    const { role, email, password, errors, loading, setEmail, setPassword, onChangeRole, submit } = useAuthHook();

    const onSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            await submit();
        },
        [submit]
    );

    return (
        <div className="mc-card p-6 sm:p-8 w-full max-w-[460px]">
            <div className="mb-6">
                <div className="mc-font text-2xl">Welcome to NexHack!</div>
                <div className="text-muted text-sm">Sign in to your NexHack stats</div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-6">
                <button
                    type="button"
                    onClick={() => onChangeRole("participant")}
                    className={clsx("mc-btn w-full", role === "participant" ? "mc-btn--primary" : "mc-btn--ghost")}
                >
                    Participant
                </button>
                <button
                    type="button"
                    onClick={() => onChangeRole("organizer")}
                    className={clsx("mc-btn w-full", role === "organizer" ? "mc-btn--primary" : "mc-btn--ghost")}
                >
                    Organizer
                </button>
            </div>
            <form onSubmit={onSubmit} className="space-y-4">
                <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="alex@blockcraft.dev"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        tone={errors.email ? "error" : "default"}
                        hint={errors.email}
                        leadingIcon={
                            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                                <path d="M2 6.5A2.5 2.5 0 0 1 4.5 4h15A2.5 2.5 0 0 1 22 6.5v11A2.5 2.5 0 0 1 19.5 20h-15A2.5 2.5 0 0 1 2 17.5v-11Zm2.2-.5 7.04 5.28a1 1 0 0 0 1.52 0L19.8 6H4.2Z" />
                            </svg>
                        }
                    />
                </div>
                {role === "organizer" && (
                    <div>
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Your secret"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            tone={errors.password ? "error" : "default"}
                            hint={errors.password}
                            leadingIcon={
                                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                                    <path d="M12 1a5 5 0 0 1 5 5v3h1.5A1.5 1.5 0 0 1 20 10.5v8A1.5 1.5 0 0 1 18.5 20h-13A1.5 1.5 0 0 1 4 18.5v-8A1.5 1.5 0 0 1 5.5 9H7V6a5 5 0 0 1 5-5Zm3 8V6a3 3 0 1 0-6 0v3h6Z" />
                                </svg>
                            }
                            allowPasswordToggle
                        />
                    </div>
                )}
                {errors.root && <div className="text-[var(--error)] text-sm">{errors.root}</div>}
                <Button type="submit" variant="primary" loading={loading} className="w-full">
                    {role === "organizer" ? "Sign in as Organizer" : "Continue"}
                </Button>
            </form>
            <div className="mt-6 text-xs text-muted">By continuing you agree to the internal usage policy.</div>
        </div>
    );
};