"use client";

// ServerStateSection — spike 5: TanStack Query como camada de server state.
import { SectionCard } from "@/app/_ui/shared";
import { CandidatePanel } from "../../_candidates/shared/CandidatePanel";
import { ServerStateSpike } from "../../_candidates/server-state/ServerStateSpike";
import { FindingsFooter } from "./FindingsFooter";
import { findingById } from "./findings";
import copy from "./_locales/pt-br.json";

const m = copy.messages;

export function ServerStateSection({ initialRevision }: { initialRevision: string }) {
  return (
    <SectionCard title={m["spikes.serverstate.title"]} subtitle={m["spikes.serverstate.subtitle"]}>
      <CandidatePanel
        meta={findingById("server-state-tanstack-query")}
        footer={<FindingsFooter finding={findingById("server-state-tanstack-query")} />}
      >
        <ServerStateSpike initialRevision={initialRevision} />
      </CandidatePanel>
    </SectionCard>
  );
}
