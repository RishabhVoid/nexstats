"use client";

import LoginForm from "./LoginForm";

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

