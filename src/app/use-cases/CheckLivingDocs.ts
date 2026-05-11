/**
 * Use case: drift guard do Living Documentation.
 *
 * Regenera o artefato canonicalizado/serializado e compara byte-a-byte
 * com a versão commitada (string YAML passada pelo caller). Retorna
 * `drift: true` em qualquer divergência, junto com a versão gerada (para
 * o caller poder regravar) e um diff legível mínimo.
 *
 * Aplica ADR 0004 (determinismo é contrato — comparação byte-a-byte
 * estável) e ADR 0003 (se algum bypass expirar durante a geração, a
 * exceção do parser é repropagada — drift guard nunca "passa silencioso"
 * sobre bypass vencido).
 *
 * Camada: `app/`. Não toca FS — quem lê/escreve disco é o CLI script.
 */
import { LivingDocsArtifact } from "../../domain/living-docs/LivingDocsArtifact.js";
import type { LivingDocsSerializer } from "../ports/LivingDocsSerializer.js";
import type { RuleExtractor } from "../ports/RuleExtractor.js";
import { GenerateLivingDocs } from "./GenerateLivingDocs.js";

export interface CheckLivingDocsDeps {
  readonly extractor: RuleExtractor;
  readonly serializer: LivingDocsSerializer;
}

export interface CheckLivingDocsInput {
  readonly files: readonly string[];
  /** Conteúdo atual de `.governance/living-docs.yml` (string vazia se ausente). */
  readonly committedYaml: string;
}

export interface CheckLivingDocsResult {
  readonly drift: boolean;
  /** Vazia quando `drift === false`. */
  readonly diff: string;
  /** O YAML que `generate` produziria agora — útil para o caller regravar. */
  readonly generatedYaml: string;
  /** Artefato canonicalizado (objeto), exposto para consumidores estruturados. */
  readonly artifact: LivingDocsArtifact;
}

export class CheckLivingDocs {
  private readonly generate: GenerateLivingDocs;
  private readonly serializer: LivingDocsSerializer;

  constructor(deps: CheckLivingDocsDeps) {
    this.generate = new GenerateLivingDocs({ extractor: deps.extractor });
    this.serializer = deps.serializer;
  }

  execute(input: CheckLivingDocsInput): CheckLivingDocsResult {
    const artifact = this.generate.execute({ files: input.files });
    const generatedYaml = this.serializer(artifact);

    if (generatedYaml === input.committedYaml) {
      return { drift: false, diff: "", generatedYaml, artifact };
    }

    return {
      drift: true,
      diff: buildMinimalDiff(input.committedYaml, generatedYaml),
      generatedYaml,
      artifact,
    };
  }
}

/**
 * Diff mínimo legível: lista linhas presentes em apenas um lado, prefixadas
 * com `-` (commitado) ou `+` (gerado). Não pretende substituir `diff -u`;
 * suficiente para PR review identificar a regra que mudou.
 */
function buildMinimalDiff(committed: string, generated: string): string {
  const committedLines = new Set(committed.split("\n"));
  const generatedLines = new Set(generated.split("\n"));

  const removed: string[] = [];
  for (const line of committedLines) {
    if (line.trim() !== "" && !generatedLines.has(line)) removed.push(`- ${line.trim()}`);
  }
  const added: string[] = [];
  for (const line of generatedLines) {
    if (line.trim() !== "" && !committedLines.has(line)) added.push(`+ ${line.trim()}`);
  }
  return [...removed, ...added].join("\n");
}
