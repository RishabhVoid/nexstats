import { Castle } from "lucide-react";
import Link from "next/link";
import LoginForm from "@/components/LoginForm";
export default function Page() {
    return <main className="gate">
        <section className="gate-art" aria-label="NexHack castle">
            <div className="wordmark"><Castle aria-hidden="true"/> NexStats</div>
            <div className="gate-caption"><p className="eyebrow">Geeta University</p><h1>NexHack <i>2.0</i></h1></div>
        </section>
        <section className="gate-form"><div className="w-full max-w-[460px]"><LoginForm/><Link className="archive-link" href="/archive-nexhack-one">NexHack 1.0 archive</Link></div></section>
    </main>;
}
