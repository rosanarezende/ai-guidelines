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
 * Diff mínimo legível, agrupado por bloco `ruleId` (review PR #13).
 *
 * Cada bloco do YAML começa em `  - ruleId: <id>`; tudo entre dois headers
 * de ruleId (e antes do primeiro) pertence ao bloco anterior. O diff emite
 * só os blocos que diferem, na ordem lexicográfica do ruleId, com header
 * `@@ <ruleId>` seguido das linhas `-`/`+` daquele bloco. Drift de cabeçalho
 * (linhas anteriores ao primeiro `- ruleId:`) aparece sob `@@ <header>`.
 *
 * Não substitui `diff -u`; humano consegue bater o olho e achar a regra
 * alterada sem ler todo o YAML.
 */
function buildMinimalDiff(committed: string, generated: string): string {
  const committedBlocks = parseRuleIdBlocks(committed);
  const generatedBlocks = parseRuleIdBlocks(generated);
  const allIds = new Set<string>([...committedBlocks.keys(), ...generatedBlocks.keys()]);

  const ordered = [...allIds].sort((a, b) => {
    if (a === HEADER_KEY) return -1;
    if (b === HEADER_KEY) return 1;
    return a < b ? -1 : a > b ? 1 : 0;
  });

  const out: string[] = [];
  for (const id of ordered) {
    const c = committedBlocks.get(id) ?? [];
    const g = generatedBlocks.get(id) ?? [];
    if (blocksEqual(c, g)) continue;

    const label = id === HEADER_KEY ? "<header>" : id;
    out.push(`@@ ${label}`);

    const cSet = new Set(c);
    const gSet = new Set(g);
    for (const line of c) {
      if (line.trim() === "") continue;
      if (!gSet.has(line)) out.push(`- ${line.trimEnd()}`);
    }
    for (const line of g) {
      if (line.trim() === "") continue;
      if (!cSet.has(line)) out.push(`+ ${line.trimEnd()}`);
    }
  }
  return out.join("\n");
}

const HEADER_KEY = "__header__";
const RULE_ID_LINE = /^\s*-\s+ruleId:\s*(\S+)\s*$/;

function parseRuleIdBlocks(yaml: string): Map<string, string[]> {
  const blocks = new Map<string, string[]>();
  let currentKey = HEADER_KEY;
  let currentBlock: string[] = [];
  blocks.set(currentKey, currentBlock);

  for (const line of yaml.split("\n")) {
    const match = RULE_ID_LINE.exec(line);
    if (match !== null) {
      currentKey = match[1];
      currentBlock = [line];
      blocks.set(currentKey, currentBlock);
    } else {
      currentBlock.push(line);
    }
  }
  return blocks;
}

function blocksEqual(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}
