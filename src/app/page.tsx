"use client";

import HeroPanel from "@/components/HeroPanel";
import LoginForm from "@/components/LoginForm";

export default function Page() {
    return (
        <main className="min-h-dvh grid grid-cols-1 lg:grid-cols-2">
            <section
                className="relative overflow-hidden bg-no-repeat bg-cover hidden lg:block"
                style={{
                    backgroundImage: 'url("/hehe.jpg")'
                }}
            ></section>

            <section className="flex items-center justify-center p-6 lg:p-10">
                <div className="w-full flex flex-col items-center">
                    <div className="block lg:hidden mb-6 text-center">
                        <div className="mc-font text-3xl">NexStats</div>
                        <div className="text-muted text-sm">Minecraft Hackathon Stats</div>
                    </div>
                    <LoginForm />
                </div>
            </section>
        </main>
    );
};

function BackgroundDecor() {
    return (
        <div className="absolute inset-0">
            <div className="absolute inset-0 opacity-30 bg-[radial-gradient(60%_60%_at_20%_20%,#2f8a4c_0%,transparent_60%)]" />
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(50%_50%_at_80%_40%,#3ba55d_0%,transparent_60%)]" />
            <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(#0b0f14, #0f141b)" }} />
        </div>
    );
};