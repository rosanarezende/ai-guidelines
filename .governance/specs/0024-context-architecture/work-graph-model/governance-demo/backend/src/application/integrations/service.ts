// service.ts — use cases de integração: listar adapters mecanizados, testar um
// adapter e coletar evidência por repo. O catálogo (integration-catalog.yml)
// continua sendo o inventário; aqui só aparece o que TEM mecanismo executável.
import { OllamaAssistantProvider } from "../../adapters/integrations/assistant/ollama.ts";
import { CiLocalAdapter } from "../../adapters/integrations/ci/local.ts";
import { CodeQualityAdapter } from "../../adapters/integrations/code-quality/local-report.ts";
import { GitLocalAdapter } from "../../adapters/integrations/git/local.ts";
import { ObservabilityAdapter } from "../../adapters/integrations/observability/local-report.ts";
import type { EvidenceProvider, IntegrationResult } from "../../ports/IntegrationAdapter.ts";

const assistant = new OllamaAssistantProvider();

const evidenceProviders: EvidenceProvider[] = [
  new GitLocalAdapter(),
  new CiLocalAdapter(),
  new CodeQualityAdapter(),
  new ObservabilityAdapter(),
];

export type MechanizedIntegration = {
  id: string;
  catalogId: string;
  mechanism: string;
  kind: "assistant-provider" | "evidence-provider";
};

export function listMechanizedIntegrations(): MechanizedIntegration[] {
  return [
    {
      id: assistant.id,
      catalogId: "assistant-runtime-local-cloud",
      mechanism: "health/models via /api/tags loopback; advisory local com egress + redação",
      kind: "assistant-provider" as const,
    },
    ...evidenceProviders.map((provider) => ({
      ...provider.describe(),
      kind: "evidence-provider" as const,
    })),
  ];
}

export function assistantProvider(): OllamaAssistantProvider {
  return assistant;
}

export async function testIntegration(id: string): Promise<IntegrationResult> {
  if (id === assistant.id) return assistant.test();
  const provider = evidenceProviders.find((item) => item.id === id);
  if (!provider) {
    return {
      adapter: id,
      status: "failed",
      summary: `adapter "${id}" não existe — fail-closed`,
      evidence: [],
      error: "adapter desconhecido",
    };
  }
  return provider.test();
}

export async function collectRepoEvidence(id: string, repoId: string): Promise<IntegrationResult> {
  const provider = evidenceProviders.find((item) => item.id === id);
  if (!provider) {
    return {
      adapter: id,
      status: "failed",
      summary: `adapter "${id}" não existe — fail-closed`,
      evidence: [],
      error: "adapter desconhecido",
    };
  }
  return provider.collect(repoId);
}

export async function integrationStatusReport(): Promise<IntegrationResult[]> {
  const results: IntegrationResult[] = [];
  for (const integration of listMechanizedIntegrations()) {
    results.push(await testIntegration(integration.id));
  }
  return results;
}
