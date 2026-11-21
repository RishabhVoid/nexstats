import { Castle } from "lucide-react";
import LoginForm from "@/components/LoginForm";

export default function Page() {
    return <main className="wizard-gate">
        <section className="wizard-gate-art">
            <div className="wizard-gate-name"><Castle aria-hidden="true"/><h1>NexStats</h1></div>
            <figure className="wizard-cat-photo">
                <img src="/wizard-cat.jpg" alt="A very serious cat wearing round glasses and a Gryffindor scarf" width={1072} height={1340}/>
                <figcaption>Yer a wizard, Hairy.</figcaption>
            </figure>
            <div className="wizard-gate-footer"><p>Geeta University</p><a href="https://www.pinterest.com/pin/862439397366319198/" target="_blank" rel="noreferrer">Gato Miu · Pinterest ↗</a></div>
        </section>
        <section className="wizard-gate-form"><LoginForm/></section>
    </main>;
}
