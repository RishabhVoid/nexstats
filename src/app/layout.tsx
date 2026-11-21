import type { Metadata } from "next";

import "./globals.css";
import SessionWrapper from "@/components/SessionWrapper";



export const metadata: Metadata = {
    title: "NexStats",
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
