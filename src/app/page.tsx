import { Castle } from "lucide-react";
import LoginForm from "@/components/LoginForm";

export default function Page() {
    return <main className="wizard-gate">
        <section className="wizard-gate-art"><div className="wizard-gate-name"><Castle aria-hidden="true"/><h1>NexStats</h1></div><p>Geeta University</p></section>
        <section className="wizard-gate-form"><LoginForm/></section>
    </main>;
}
