"use client";

import { useEdition } from "@/hooks/useEdition";
import ArchiveParticipants from "@/components/ArchiveParticipants";
import CandidatePass from "@/components/CandidatePass";

export default function Participants() {
    const { archive } = useEdition();
    return archive ? <ArchiveParticipants/> : <CandidatePass/>;
}
