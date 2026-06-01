import { parse } from "yaml";

/**
 * Leitor puro dos **check-run contexts** que um workflow do GitHub Actions
 * pode produzir. Vive sob o boundary YAML (`src/infrastructure/yaml/`) — único
 * lugar onde `yaml@2` é importável (cf. `livingDocsSerializer.ts`).
 *
 * Regras de nome de check-run do GitHub Actions:
 * - cada `job` produz um check-run cujo **context** = `job.name` (se presente),
 *   senão o **id** do job;
 * - jobs com `strategy.matrix` produzem **um context por combinação**, com o
 *   nome renderizado a partir do template (`${{ matrix.x }}`). Esses nomes são
 *   **instáveis**: mudam quando a matriz muda — exatamente o vetor de drift que
 *   o Checkpoint 2.2 combate. Por isso são classificados à parte (`matrix`) e
 *   **não** entram no conjunto de produtores estáveis.
 *
 * Consumidor: `src/cli/rulesetCheck.ts` (invariante de producibilidade).
 */

/** Produtor estável: 1 job → 1 context fixo (sem matriz). */
export interface StableProducer {
  readonly context: string;
  readonly workflow: string;
  readonly job: string;
}

/** Produtor de matriz: nome instável (depende de expansão). */
export interface MatrixProducer {
  readonly nameTemplate: string;
  /** Prefixo literal até o 1º `${{` — usado só para diagnósticos. */
  readonly staticPrefix: string;
  readonly workflow: string;
  readonly job: string;
}

export interface WorkflowChecks {
  readonly stable: readonly StableProducer[];
  readonly matrix: readonly MatrixProducer[];
}

function staticPrefixOf(template: string): string {
  const idx = template.indexOf("${{");
  return idx === -1 ? template : template.slice(0, idx);
}

function isMatrixJob(job: Record<string, unknown>): boolean {
  const strategy = job.strategy;
  if (!strategy || typeof strategy !== "object") return false;
  const matrix = (strategy as Record<string, unknown>).matrix;
  return Boolean(matrix && typeof matrix === "object");
}

/**
 * Parseia o conteúdo de um workflow e classifica os contexts que ele produz.
 * Não lança em workflow malformado — retorna o que conseguir extrair (o
 * enforcement de producibilidade é responsabilidade do chamador).
 */
export function parseWorkflowChecks(yamlContent: string, workflowFile: string): WorkflowChecks {
  const stable: StableProducer[] = [];
  const matrix: MatrixProducer[] = [];

  let doc: unknown;
  try {
    doc = parse(yamlContent);
  } catch {
    return { stable, matrix };
  }
  if (!doc || typeof doc !== "object") return { stable, matrix };

  const jobs = (doc as Record<string, unknown>).jobs;
  if (!jobs || typeof jobs !== "object") return { stable, matrix };

  for (const [jobId, rawJob] of Object.entries(jobs as Record<string, unknown>)) {
    if (!rawJob || typeof rawJob !== "object") continue;
    const job = rawJob as Record<string, unknown>;
    const context = typeof job.name === "string" && job.name.length > 0 ? job.name : jobId;
    if (isMatrixJob(job)) {
      matrix.push({
        nameTemplate: context,
        staticPrefix: staticPrefixOf(context),
        workflow: workflowFile,
        job: jobId,
      });
    } else {
      stable.push({ context, workflow: workflowFile, job: jobId });
    }
  }

  return { stable, matrix };
}
