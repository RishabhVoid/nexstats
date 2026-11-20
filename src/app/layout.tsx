import type { Metadata } from "next";

import "./globals.css";
import SessionWrapper from "@/components/SessionWrapper";



export const metadata: Metadata = {
    title: "NexStats · NexHack 2.0",
    description: "NexHack event operations at Geeta University",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body >
                <SessionWrapper>
                    {children}
                </SessionWrapper>
            </body>
        </html>
    );
}
