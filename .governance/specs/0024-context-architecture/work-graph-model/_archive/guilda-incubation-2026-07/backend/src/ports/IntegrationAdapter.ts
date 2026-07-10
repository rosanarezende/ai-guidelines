// IntegrationAdapter.ts — porta comum dos adapters de integração.
// Contrato do integration-catalog: adapters são evidence providers/importers/
// projections; NUNCA escrevem YAML autoritativo diretamente (só via command
// runtime) e falham FECHADO quando a política de egress não permite.

export type IntegrationStatusKind =
  | "ok" // mecanismo executou e produziu evidência verificável
  | "failed" // mecanismo executou e o resultado é falha real (não maquiada)
  | "not-configured" // honesto: nada configurado; não é erro
  | "unavailable" // dependência local ausente/evidência inválida — fail-closed
  | "egress-blocked"; // política negou saída externa — fail-closed

export type EvidenceRecord = {
  kind: string;
  command?: string;
  source?: string;
  observedAt: string;
  contentHash?: string;
  detail?: Record<string, unknown>;
};

export type IntegrationResult = {
  adapter: string;
  status: IntegrationStatusKind;
  summary: string;
  evidence: EvidenceRecord[];
  // erro honesto quando status != ok; nunca texto de sucesso fabricado
  error?: string;
};

export interface IntegrationAdapter {
  readonly id: string;
  // id do integration-catalog.yml que este adapter materializa
  readonly catalogId: string;
  readonly mayWriteAuthoritativeState: false;
  describe(): { id: string; catalogId: string; mechanism: string };
  test(): Promise<IntegrationResult>;
}

// Provider de evidência por repo (git, CI local, qualidade, observabilidade).
export interface EvidenceProvider extends IntegrationAdapter {
  collect(repoId: string): Promise<IntegrationResult>;
}
