/**
 * Modelo PURO do handoff situado (CO-4 / checkpoint-co-projection — ADR 0022).
 *
 * Separação cravada: `collect` (I/O: fs/git/gh — vive em `handoff.ts`) →
 * `deriveHandoff(facts)` (este módulo; puro, determinístico, serializável) →
 * `render` (apresentação). Nada aqui toca filesystem, rede ou LLM.
 *
 * Autoridades (decisão fechada na missão do nó):
 *   - `state.cursor` + `state.yml § topology` definem nó/checkpoint atuais;
 *   - Git + PR + reviews/findings/resolutions + gate + tasks definem o estado
 *     operacional;
 *   - `state.next[]` é narrativa DERIVADA e validada (reconcile:check) — entra
 *     no modelo apenas para exibição/comparação, NUNCA como entrada da decisão;
 *   - `gate.next` é prova histórica da autorização da transição — não é agenda
 *     do nó atual (o modelo nem o ingere; o gate relevante é o do checkpoint
 *     do cursor).
 *
 * Freshness: cada fonte declara origem/status/fingerprint (dogfood 2026-06-11:
 * fonte situada consumida sem declarar frescor mascarou drift de 2 gerações).
 * O selo de geração é determinístico (sem timestamp): mesmas fontes ⇒ mesmo
 * selo; mudança relevante em qualquer fonte ⇒ selo diferente. O selo é
 * EXIBIDO no stdout, nunca persistido como entidade (ADR 0026).
 */
import { createHash } from "node:crypto";
import { deriveFrenteProgression } from "../workflow/frenteProgression.js";

/**
 * Versão do contrato derivação+renderer — entra no selo (mudou contrato ⇒ muda
 * selo) e no recibo (recibo de versão antiga vira `invalid` ⇒ força recarga).
 * v2: cápsula de contrato global (identidade + bootstrap + regras obrigatórias
 * + script-contract) entra no snapshot/fontes.
 * v3: catálogo×requisito de reviews (CO-4, rodada 8) — lifecycle ganha
 * `reviewStatuses` (aplicabilidade/requisito/estado por tipo) e o PR ganha
 * `labels`; a derivação da próxima ação muda (só required bloqueia).
 */
export const HANDOFF_CONTRACT_VERSION = 3;

/** Regra aplicável projetada na cápsula — id+título+fonte; NUNCA o corpo. */
export interface ApplicableRuleFact {
  readonly id: string;
  readonly title: string;
  /** "global" = sempre injetada (catálogo); "node" = restrição derivada do estado. */
  readonly scope: "global" | "node";
  readonly source: string;
}

/**
 * Cápsula compacta do contrato carregado pela sessão (camada 1+2 do handoff:
 * identidade/contrato global do repositório + seleção aplicável). As regras
 * COMPLETAS seguem governadas nas fontes canônicas — a cápsula projeta
 * ids/títulos e aponta a fonte; o handoff NÃO vira SSOT de regras.
 *
 * Seleção global = metadados JÁ canônicos do catálogo (`rules.json`:
 * `scope: universal` + tag `always_injected`) — nenhuma tabela paralela.
 * Restrições do nó = proibições DERIVADAS de topologia/lifecycle
 * (`deriveProhibitions`) — distinguíveis por construção das regras globais.
 * Fingerprints das fontes do contrato vivem em `sources[]` (e portanto no
 * selo e no recibo), não duplicados aqui.
 */
export interface RepositoryContractFact {
  /** Nome do pacote (package.json) — identidade factual, sem texto inventado. */
  readonly repositoryId: string;
  /** "framework (mantenedor)" no repo do framework; "consumidor do framework" nos demais. */
  readonly repositoryKind: string;
  /** Descrição do package.json. */
  readonly summary: string;
  /** Raiz SSOT estrutural quando existente no repo (fato verificado, não doutrina). */
  readonly ssotPath: string | null;
  readonly bootstrapSource: string;
  readonly rulesSource: string;
  readonly rulesCatalogPointer: string;
  readonly scriptContractSource: string;
  /** Regras globais sempre-injetadas (id+título), na ordem canônica do catálogo. */
  readonly mandatoryRules: ReadonlyArray<ApplicableRuleFact>;
}

export type HandoffSourceStatus = "fresh" | "degraded" | "unavailable";

export interface HandoffSourceFact {
  /** Identificador estável da fonte (ex.: "state.yml", "git", "pull-request"). */
  readonly id: string;
  /** De onde o fato veio (path no repo, "git local", "gh api"). */
  readonly origin: string;
  readonly status: HandoffSourceStatus;
  /** sha256[0:12] do conteúdo/fatos da fonte; "-" quando unavailable. */
  readonly fingerprint: string;
  /** Motivo da degradação/indisponibilidade, quando houver. */
  readonly detail?: string;
}

export interface HandoffGitFact {
  readonly branch: string | null;
  readonly head: string | null;
  readonly workingTreeClean: boolean | null;
  /** Commits à frente/atrás do upstream; null quando upstream não observável. */
  readonly ahead: number | null;
  readonly behind: number | null;
  readonly upstream: string | null;
}

export interface HandoffPrFact {
  readonly number: number;
  readonly state: string;
  readonly isDraft: boolean;
  readonly baseRefName: string;
  readonly headRefName: string;
  readonly headRefOid: string;
  readonly checks: { readonly pass: number; readonly fail: number; readonly pending: number };
  /** Razões de falha do contrato READY do body (governance-pr-check, isDraft=false). */
  readonly bodyReadyReasons: ReadonlyArray<string>;
  /** Labels do PR — entrada de aplicabilidade/requirements de reviews. */
  readonly labels: ReadonlyArray<string>;
}

/**
 * Status EFETIVO de um tipo de review no checkpoint (CO-4, rodada 8): quatro
 * conceitos independentes — catálogo (typeId), aplicabilidade, requisito e
 * estado/freshness. `blocking` é a ÚNICA dimensão que trava o fluxo
 * (requirement=required E não satisfeito); stale de optional/recommended é
 * informação, nunca obrigação.
 */
export interface HandoffReviewStatusFact {
  readonly typeId: string;
  readonly applicability: "yes" | "no" | "unknown";
  readonly requirement: "disabled" | "optional" | "recommended" | "required";
  readonly state: "missing" | "current" | "stale" | "in-progress";
  readonly decision: string | null;
  readonly blocking: boolean;
  /** Origem da decisão de requirement (repo default, rule:<id>, node-override). */
  readonly source: string;
  /** Notas derivadas do plano situado, por exemplo dispensa governada de revalidação. */
  readonly notes?: ReadonlyArray<string>;
}

export interface HandoffLifecycleFact {
  readonly reviewDecisions: ReadonlyArray<{ readonly role: string; readonly decision: string }>;
  readonly requiredReviewRoles: ReadonlyArray<string>;
  /** Statuses efetivos dos tipos aplicáveis do catálogo. */
  readonly reviewStatuses: ReadonlyArray<HandoffReviewStatusFact>;
  readonly openFindings: number;
  readonly openBlocking: number;
  readonly closedFindings: number;
  readonly resolutions: number;
  readonly gateDecision: "approved" | "changes_requested" | null;
}

export interface HandoffTaskFact {
  readonly text: string;
  readonly done: boolean;
  /** Linha (1-based) em tasks.md — base factual citável. */
  readonly line: number;
}

/**
 * Etapa aninhada sob o checkpoint do cursor em tasks.md. A
 * granularidade real de TRABALHO de um checkpoint composto vive aqui: o
 * checkpoint-pai é container, as etapas é que carregam o objeto
 * executável. O id pode ser legado (`CO-x.y`) ou semântico
 * (`artifact-taxonomy-and-model-review-contract`). Três estados (espelham os
 * marcadores do tasks.md):
 * `pending` (`[ ]`), `in-progress` (`[/]`), `done` (`[x]`).
 */
export interface HandoffStep {
  readonly id: string;
  readonly title: string;
  readonly state: "pending" | "in-progress" | "done";
  /** Linha (1-based) em tasks.md — base factual citável. */
  readonly line: number;
  /**
   * Sinal EXPLÍCITO de prontidão para transição: presente (`"ready-for-transition"`)
   * SOMENTE quando a etapa ATIVA declarou seus critérios de saída
   * satisfeitos e aguarda a decisão humana. É a FONTE ÚNICA de "implementação
   * terminada" — substitui a inferência por contagem de findings/resolutions
   * (que pertencem aos reviews ACUMULADOS do checkpoint, não aa etapa
   * atual). Vive INLINE na própria linha do marcador (mesma SSOT; mesmo parser).
   * Ausente/`undefined` ⇒ ainda em implementação.
   */
  readonly readiness?: "ready-for-transition";
  /**
   * Texto BRUTO da linha do marcador (para checagens de coerência
   * estado↔narrativa). Opcional: só presente quando vem de `parseSteps`;
   * fixtures que constroem o objeto à mão podem omiti-lo.
   */
  readonly text?: string;
}

export interface HandoffInsightFact {
  readonly id: string;
  readonly excerpt: string;
  readonly occurrenceCount: number;
  readonly graduationCandidate: boolean;
  readonly currentContext: boolean;
}

export interface HandoffNodeFact {
  readonly id: string;
  readonly githubPr: number | null;
  readonly sequence: number | null;
  readonly terminal: boolean;
}

export interface HandoffFacts {
  readonly spec: { readonly label: string; readonly path: string };
  /** Cápsula do contrato global carregado; null = identidade não derivável. */
  readonly contract: RepositoryContractFact | null;
  readonly stage: string;
  readonly gateStatus: string;
  readonly cursor: { readonly pr: string; readonly checkpoint: string } | null;
  readonly activeNode: HandoffNodeFact | null;
  /** Primeiro nó planejado (menor sequence) — alvo de "abrir o próximo PR". */
  readonly nextPlannedNode: HandoffNodeFact | null;
  /** `state.next[0]` — narrativa derivada; exibição/comparação apenas, NUNCA decisão. */
  readonly narrativeNextHead: string | null;
  readonly git: HandoffGitFact;
  /** null ⟺ fonte remota indisponível (NUNCA inventar estado remoto). */
  readonly pullRequest: HandoffPrFact | null;
  readonly lifecycle: HandoffLifecycleFact | null;
  /** Tarefas de tasks.md pertencentes ao checkpoint do cursor. */
  readonly tasks: ReadonlyArray<HandoffTaskFact>;
  /** Etapas (CO-x.y) aninhados sob o checkpoint do cursor em tasks.md. */
  readonly steps: ReadonlyArray<HandoffStep>;
  readonly insights: ReadonlyArray<HandoffInsightFact>;
  /** Drift de projeção detectado na coleta (specs/active.yml etc.). */
  readonly driftWarnings: ReadonlyArray<string>;
  readonly sources: ReadonlyArray<HandoffSourceFact>;
}

export type NextActionKind =
  | "reconcile-drift"
  | "resolve-findings"
  | "run-required-review"
  | "reconcile-remote-source"
  | "prepare-ready"
  | "exercise-human-gate"
  | "conclude-node-open-next"
  | "execute-task"
  | "implement-step"
  | "advance-step-transition"
  | "investigate-checkpoint";

export interface NextAction {
  readonly kind: NextActionKind;
  readonly description: string;
  /** Base factual citável de CADA decisão — nunca afirmação sem fonte. */
  readonly basis: ReadonlyArray<string>;
  /** true = nada funcional deve avançar antes desta ação. */
  readonly blocking: boolean;
}

export interface HandoffDerived {
  readonly facts: HandoffFacts;
  readonly nextAction: NextAction;
  readonly prohibitions: ReadonlyArray<string>;
  readonly seal: string;
}

/** sha256[0:12] de conteúdo bruto de fonte (serialização canônica JSON). */
export function fingerprintSource(content: string): string {
  return createHash("sha256")
    .update(JSON.stringify([content]))
    .digest("hex")
    .slice(0, 12);
}

/**
 * Selo determinístico de geração: versão do contrato + HEAD + fingerprints
 * ordenados das fontes. SEM timestamp (mesmas fontes ⇒ mesmo selo).
 */
export function computeSeal(facts: HandoffFacts): string {
  const sourceParts = [...facts.sources].map((s) => `${s.id}=${s.status}:${s.fingerprint}`).sort();
  return createHash("sha256")
    .update(JSON.stringify([HANDOFF_CONTRACT_VERSION, facts.git.head ?? "-", sourceParts]))
    .digest("hex")
    .slice(0, 12);
}

/**
 * Extrai de tasks.md as tarefas (`- [ ]`/`- [x]`) pertencentes ao checkpoint do
 * cursor. tasks.md não é schematizado: a associação usa as convenções reais do
 * arquivo — título `**Checkpoint <nome-normalizado>**` ou marcador
 * ``(nó `<id>`` — e é deliberadamente conservadora (mencionar o nó em prosa de
 * OUTRA tarefa não cria pertencimento).
 */
export function parseCheckpointTasks(
  tasksMd: string,
  cursor: { readonly pr: string; readonly checkpoint: string }
): HandoffTaskFact[] {
  const normalized = cursor.checkpoint.replace(/^checkpoint-/, "");
  const markers = [
    `**Checkpoint ${normalized}**`,
    `(nó \`${cursor.pr}\``,
    `\`${cursor.checkpoint}\``,
  ];
  const tasks: HandoffTaskFact[] = [];
  const lines = tasksMd.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const match = /^\s*-\s\[([ xX])\]\s+(.+)$/.exec(lines[i]);
    if (!match) continue;
    const text = match[2].trim();
    if (!markers.some((marker) => text.includes(marker))) continue;
    tasks.push({ text, done: match[1] !== " ", line: i + 1 });
  }
  return tasks;
}

/**
 * Extrai as etapas aninhadas sob o checkpoint do cursor. Lê a fonte
 * CANÔNICA (tasks.md): ancora na linha `**Checkpoint <normalizado>**` e coleta
 * os itens de checkbox subsequentes até o próximo checkpoint de topo.
 * Reconhece os três estados — `[ ]` pending, `[/]` in-progress, `[x]` done — e
 * aceita IDs legados/hierárquicos `CO-N.M[.K...]` e slugs semânticos. Conservador: mencionar um
 * etapa em prosa de outro bloco NÃO cria pertencimento.
 */
/**
 * Valor canônico do sinal de prontidão de transição (ver `HandoffStep.readiness`).
 * Representação INLINE em tasks.md: um code-span `` `readiness: ready-for-transition` ``
 * logo após o título em negrito da etapa — humano-legível (renderiza como
 * código), machine-readable e parseado pelo MESMO parser (sem 2ª SSOT).
 */
export const STEP_READINESS = "ready-for-transition" as const;

/** Token de readiness na linha do marcador; captura o valor para validação de coerência. */
export const READINESS_TOKEN_RE = /`readiness:\s*([A-Za-z0-9-]+)`/;

const CHECKBOX_CHECKPOINT_RE = /^(\s*)-\s*\[[ xX/]\]\s+\*\*Checkpoint\s+/;

function indentation(line: string): number {
  return /^\s*/.exec(line)?.[0].length ?? 0;
}

function findCheckpointSectionAnchor(lines: readonly string[], checkpointIndex: number): number {
  const checkpointLine = lines[checkpointIndex] ?? "";
  const checkpointIndent = indentation(checkpointLine);
  if (!CHECKBOX_CHECKPOINT_RE.test(checkpointLine) || checkpointIndent === 0)
    return checkpointIndex;

  for (let i = checkpointIndex - 1; i >= 0; i--) {
    const candidate = lines[i] ?? "";
    if (indentation(candidate) < checkpointIndent && CHECKBOX_CHECKPOINT_RE.test(candidate))
      return i;
  }
  return checkpointIndex;
}

function stepTitle(inlineTitle: string | undefined, tail: string | undefined): string {
  const inline = inlineTitle?.trim();
  if (inline) return inline;

  const cleanedTail = (tail ?? "")
    .replace(/^[:—\-\s]+/, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.]$/, "");
  if (!cleanedTail) return "";

  const firstClause = cleanedTail.split(/[:.]\s+/)[0]?.trim();
  return firstClause || cleanedTail;
}

export function findCheckpointTaskLine(tasksMd: string, checkpoint: string): number | null {
  const normalized = checkpoint.replace(/^checkpoint-/, "");
  const lines = tasksMd.split(/\r?\n/);
  const anchor = lines.findIndex((l) => l.includes(`**Checkpoint ${normalized}**`));
  return anchor < 0 ? null : anchor + 1;
}

export function parseSteps(tasksMd: string, checkpoint: string): HandoffStep[] {
  const lines = tasksMd.split(/\r?\n/);
  const checkpointLine = findCheckpointTaskLine(tasksMd, checkpoint);
  if (checkpointLine === null) return [];
  const anchor = findCheckpointSectionAnchor(lines, checkpointLine - 1);
  const anchorIndent = indentation(lines[anchor] ?? "");
  const out: HandoffStep[] = [];
  for (let i = anchor + 1; i < lines.length; i++) {
    if (CHECKBOX_CHECKPOINT_RE.test(lines[i]) && indentation(lines[i]) <= anchorIndent) break;
    const m =
      /^\s*-\s*\[([ xX/])\]\s*\*\*(?:Checkpoint\s+)?((?:CO-\d+(?:\.\d+)+)|(?:[a-z][a-z0-9]*(?:-[a-z0-9]+)+))\b(?:\s*[—-]\s*([^*]+?))?\*\*(?:\s*(.*?))?$/.exec(
        lines[i]
      );
    if (!m) continue;
    const mark = m[1];
    const state = mark === " " ? "pending" : mark === "/" ? "in-progress" : "done";
    const rm = READINESS_TOKEN_RE.exec(lines[i]);
    const readiness = rm && rm[1] === STEP_READINESS ? STEP_READINESS : undefined;
    out.push({
      id: m[2],
      title: stepTitle(m[3], m[4]),
      state,
      line: i + 1,
      ...(readiness ? { readiness } : {}),
      text: lines[i].trim(),
    });
  }
  return out;
}

// ── Resolução compartilhada do OBJETO de etapa (handoff ↔ work) ───────
// Fonte ÚNICA da derivação de etapas: o `handoff` (deriveNextAction) e o
// `work` (deriveWorkBrief) consomem a MESMA função, garantindo que nomeiem o
// mesmo objeto factual e que nenhum declare "zero tarefas" havendo um `[/]` ativo.

/** Referência mínima a uma etapa (sem estado/narrativa). */
export interface StepRef {
  readonly id: string;
  readonly title: string;
  readonly line: number;
}

export type StepResolution =
  | { kind: "implement"; step: StepRef; basis: string[] }
  | { kind: "terminal-ready"; step: StepRef; basis: string[] }
  | {
      kind: "transition";
      transition: { conclude: StepRef | null; activate: StepRef };
      basis: string[];
    }
  | { kind: "none"; basis: string[] };

/**
 * Resolve o OBJETO de trabalho a partir das etapas (CO-x.y) quando não há
 * tarefa de topo executável. Fail-closed: nunca devolve `implement` sem um
 * etapa ATIVA concreto.
 *
 * Conclusão = READINESS EXPLÍCITA. Um `[/]` ativo só vira `transition` quando ELE
 * MESMO declarou `readiness: ready-for-transition` em tasks.md (critérios de saída
 * satisfeitos) E há um pendente adiante. Se não há próximo pendente, a readiness é
 * terminal: fecha a implementação interna e projeta o checkpoint para Ready/Gate,
 * sem inventar `advance-step`. SEM readiness ⇒ ainda em implementação —
 * independe de findings/resolutions ACUMULADOS do checkpoint (que pertencem aos
 * reviews — p.ex. o audit do CO-3.1 — e NÃO provam que a etapa atual
 * terminou). Concluir/ativar é ATO VISÍVEL em tasks.md, decisão governada da owner.
 */
export function resolveStepWork(facts: HandoffFacts): StepResolution {
  const subs = facts.steps;
  if (subs.length === 0) return { kind: "none", basis: [] };
  const ref = (s: { id: string; title: string; line: number }): StepRef => ({
    id: s.id,
    title: s.title,
    line: s.line,
  });
  // Derivação CANÔNICA (LENS-F2): mesma fonte posicional do advance/humanGate.
  const progression = deriveFrenteProgression({
    steps: subs,
    nextPlannedNode: null,
    gateApproved: false,
  });
  const pending = progression.pendingSteps;
  if (progression.activeStep) {
    const active = progression.activeStep;
    const pendingAfter = progression.pendingAfterActive;
    if (active.readiness === STEP_READINESS && pendingAfter.length >= 1) {
      return {
        kind: "transition",
        transition: { conclude: ref(active), activate: ref(pendingAfter[0]) },
        basis: [
          `${active.id} declarou readiness "${STEP_READINESS}" (critérios de saída satisfeitos) mas segue [/] em tasks.md;`,
          `próximo pendente: ${pendingAfter[0].id} — ${pendingAfter[0].title}.`,
          "concluir e ativar é ato VISÍVEL em tasks.md (decisão governada da owner).",
        ],
      };
    }
    if (active.readiness === STEP_READINESS && pendingAfter.length === 0) {
      return {
        kind: "terminal-ready",
        step: ref(active),
        basis: [
          `${active.id} declarou readiness "${STEP_READINESS}" e não há próxima etapa pendente.`,
          "o próximo movimento governado é preparar fechamento do checkpoint/Ready/Human Gate; avanço de etapa não se aplica.",
        ],
      };
    }
    return {
      kind: "implement",
      step: ref(active),
      basis: [
        `etapa ativa: ${active.id} — ${active.title} (tasks.md linha ${active.line})` +
          (active.readiness ? "." : "; sem readiness declarada (ainda em implementação)."),
      ],
    };
  }
  if (pending.length >= 1) {
    return {
      kind: "transition",
      transition: { conclude: null, activate: ref(pending[0]) },
      basis: [
        `nenhuma etapa ativa; ative a próxima etapa pendente: ${pending[0].id} — ${pending[0].title} (ato visível em tasks.md).`,
      ],
    };
  }
  return { kind: "none", basis: [] };
}

/**
 * Coerência ESTADO↔NARRATIVA das etapas (invariante de estado contínuo).
 * Reusa o resultado de {@link parseSteps} (sem parser paralelo). Regras:
 *   - no máximo um `[/]` (in-progress) — exatamente um pode estar ativo;
 *   - `[x]` (done) não pode narrar "em execução/progresso";
 *   - `[ ]` (pending) não pode narrar "concluído/implementado".
 * O `[/]` ativo PODE narrar "implementado" (foi implementado mas ainda não
 * concluído/avançado) — por isso a narrativa "done" só é proibida em `[ ]`.
 */
const IN_PROGRESS_NARRATIVE = /\bEM\s+EXECU[ÇC][ÃA]O\b|\bEM\s+PROGRESSO\b/i;
const DONE_NARRATIVE = /\bCONCLU[ÍI]D[OA]\b|\bIMPLEMENTAD[OA]\b/i;

export function checkStepCoherence(subs: ReadonlyArray<HandoffStep>): string[] {
  const violations: string[] = [];
  const inProgress = subs.filter((s) => s.state === "in-progress");
  if (inProgress.length > 1) {
    violations.push(
      `mais de uma etapa [/] ativa (${inProgress
        .map((s) => `${s.id} (linha ${s.line})`)
        .join(", ")}); exatamente um pode estar em progresso.`
    );
  }
  for (const s of subs) {
    const text = s.text ?? "";
    if (s.state === "done" && IN_PROGRESS_NARRATIVE.test(text)) {
      violations.push(
        `${s.id} está [x] (concluído) mas a narrativa diz "em execução/progresso" (tasks.md linha ${s.line}).`
      );
    }
    if (s.state === "pending" && DONE_NARRATIVE.test(text)) {
      violations.push(
        `${s.id} está [ ] (pendente) mas a narrativa diz "concluído/implementado" (tasks.md linha ${s.line}).`
      );
    }
    // Invariantes do sinal de readiness (fonte única de "implementação terminada").
    const rm = READINESS_TOKEN_RE.exec(text);
    if (rm) {
      if (rm[1] !== STEP_READINESS) {
        violations.push(
          `${s.id}: marcador de readiness inválido "${rm[1]}" — único valor aceito é "${STEP_READINESS}" (tasks.md linha ${s.line}).`
        );
      } else if (s.state !== "in-progress") {
        violations.push(
          `${s.id} carrega readiness "${STEP_READINESS}" mas está ${
            s.state === "pending" ? "[ ] (pendente)" : "[x] (concluído)"
          } — readiness só vale para a etapa [/] ATIVA (tasks.md linha ${s.line}).`
        );
      }
    }
  }
  return violations;
}

/** Título legível de uma tarefa: primeiro span em negrito, senão prefixo do texto. */
function taskTitle(task: HandoffTaskFact): string {
  const bold = /\*\*(.+?)\*\*/.exec(task.text);
  return bold ? bold[1] : task.text.slice(0, 80);
}

/** Recorte do escopo declarado na tarefa (texto após "Escopo:"), para a descrição. */
function taskScopeExcerpt(task: HandoffTaskFact): string | null {
  const match = /Escopo:\s*(.+)$/.exec(task.text);
  if (!match) return null;
  const excerpt = match[1].slice(0, 220).trim();
  return excerpt.length < match[1].trim().length ? `${excerpt}…` : excerpt;
}

/**
 * Reviews que BLOQUEIAM o fluxo: somente requirement=required não satisfeito
 * (missing, stale ou decisão ≠ approved). Optional/recommended NUNCA entram
 * aqui — freshness não cria obrigação.
 */
function blockingReviews(lifecycle: HandoffLifecycleFact): HandoffReviewStatusFact[] {
  return lifecycle.reviewStatuses.filter((s) => s.blocking);
}

/** Recomendações laterais: recommended não-current — informam, não bloqueiam. */
function lateralRecommendations(lifecycle: HandoffLifecycleFact): HandoffReviewStatusFact[] {
  return lifecycle.reviewStatuses.filter(
    (s) => s.requirement === "recommended" && s.applicability !== "no" && s.state !== "current"
  );
}

/**
 * Deriva a PRÓXIMA AÇÃO ÚNICA por precedência fixa. Regras:
 *   1. drift de fonte/projeção → reconciliar (precede trabalho funcional);
 *   2. findings abertos → resolver;
 *   3. implementação concluída + review exigido pendente → executar o review;
 *   4. reviews concluídos + PR Draft + body incompleto → preparar Ready
 *      (4b: fonte remota indisponível quando necessária → reconciliá-la);
 *   5. PR Ready + Human Gate ausente → exercer o Human Gate (humano decide);
 *   6. gate aprovado + nó ainda ativo → concluir o nó / abrir o próximo;
 *   7. tarefa aberta do checkpoint → primeira tarefa aberta;
 *   8. sem tarefas materializadas → investigar/planejar o checkpoint.
 *
 * Ausência de dado NUNCA vira afirmação: regra cujo input está indisponível é
 * pulada e a indisponibilidade aparece na base factual da ação escolhida.
 */
export function deriveNextAction(facts: HandoffFacts): NextAction {
  // 1 — drift de projeção/fonte tem precedência sobre QUALQUER trabalho funcional.
  if (facts.driftWarnings.length > 0) {
    return {
      kind: "reconcile-drift",
      description:
        "Reconciliar a(s) projeção(ões) divergente(s)/degradada(s) antes de qualquer " +
        "trabalho funcional (projeção stale mascarada é a classe de erro do dogfood CO-4).",
      basis: facts.driftWarnings,
      blocking: true,
    };
  }

  const lifecycle = facts.lifecycle;
  const openTasks = facts.tasks.filter((t) => !t.done);
  const subResolution = resolveStepWork(facts);
  const terminalStepReady = subResolution.kind === "terminal-ready";
  const implementationConcluded =
    (facts.tasks.length > 0 && openTasks.length === 0) || terminalStepReady;

  // 2 — findings abertos bloqueiam avanço do nó.
  if (lifecycle && lifecycle.openFindings > 0) {
    return {
      kind: "resolve-findings",
      description: `Resolver os ${lifecycle.openFindings} finding(s) com disposition open do checkpoint (${lifecycle.openBlocking} bloqueante(s)).`,
      basis: [
        `reviews do checkpoint ${facts.cursor?.checkpoint ?? "?"}: ${lifecycle.openFindings} open / ${lifecycle.closedFindings} closed`,
        "gate approved exige zero bloqueante open (review:check)",
      ],
      blocking: true,
    };
  }

  // 3 — implementação concluída mas review REQUIRED não satisfeito (missing/
  // stale/decisão ≠ approved). Optional/recommended NUNCA viram próxima ação
  // por freshness — só requirement=required obriga (CO-4, rodada 8).
  if (lifecycle && implementationConcluded) {
    const blocking = blockingReviews(lifecycle);
    if (blocking.length > 0) {
      return {
        kind: "run-required-review",
        description: `Executar/revalidar o(s) review(s) OBRIGATÓRIO(s) pendente(s): ${blocking
          .map((s) => `${s.typeId} (${s.state})`)
          .join(", ")}.`,
        basis: [
          terminalStepReady
            ? `etapa terminal pronta: ${subResolution.step.id} — ${subResolution.step.title}`
            : `tasks do checkpoint concluídas (${facts.tasks.length}/${facts.tasks.length})`,
          ...(terminalStepReady ? subResolution.basis : []),
          ...blocking.map((s) => `${s.typeId}: required (${s.source}) · ${s.state}`),
          `decisões presentes: ${lifecycle.reviewDecisions.map((d) => `${d.role}=${d.decision}`).join(", ") || "(nenhuma)"}`,
        ],
        blocking: true,
      };
    }
  }

  // Reviews exigidos satisfeitos — VACUAMENTE verdade quando nenhum tipo é
  // required (zero review semântico obrigatório é o default do framework).
  // As regras de fechamento (4/5) também exigem implementação concluída:
  // sem required reviews, "nada pendente de review" não antecipa o Ready.
  const reviewsConcluded = lifecycle !== null && blockingReviews(lifecycle).length === 0;
  const prSource = facts.sources.find((s) => s.id === "pull-request");
  const remoteUnavailable = prSource !== undefined && prSource.status !== "fresh";

  if (reviewsConcluded && implementationConcluded && lifecycle.gateDecision === null) {
    // 4b — a decisão Ready/gate depende do estado remoto; sem ele, reconciliar a fonte.
    if (facts.pullRequest === null && remoteUnavailable) {
      return {
        kind: "reconcile-remote-source",
        description:
          "Restabelecer a fonte remota (PR via gh) para decidir preparação de Ready/Human Gate — não inventar estado remoto.",
        basis: [
          `fonte pull-request: ${prSource.status}${prSource.detail ? ` (${prSource.detail})` : ""}`,
          "nenhum review obrigatório pendente; próximo passo depende de Draft/Ready do PR",
        ],
        blocking: false,
      };
    }
    // 4 — Draft com body ainda fora do contrato READY.
    if (facts.pullRequest?.isDraft && facts.pullRequest.bodyReadyReasons.length > 0) {
      return {
        kind: "prepare-ready",
        description: `Preparar o PR #${facts.pullRequest.number} para Ready: completar o body (contrato READY) e validar com pr-ready:check.`,
        basis: [
          "nenhum review obrigatório pendente (required satisfeitos ou inexistentes)",
          ...(terminalStepReady ? subResolution.basis : []),
          ...lateralRecommendations(lifecycle).map(
            (s) => `recomendação (não bloqueia): ${s.typeId} ${s.state}`
          ),
          ...facts.pullRequest.bodyReadyReasons.map((r) => `body: ${r}`),
        ],
        blocking: false,
      };
    }
    // 5 — Ready sem gate: decisão humana.
    if (facts.pullRequest && !facts.pullRequest.isDraft) {
      return {
        kind: "exercise-human-gate",
        description: `Exercer o Human Gate do checkpoint ${facts.cursor?.checkpoint ?? "?"} (decisão da owner; o gate artifact nasce DEPOIS da decisão).`,
        basis: [
          `PR #${facts.pullRequest.number} Ready (não-Draft) no estado ${facts.pullRequest.state}`,
          "nenhum review obrigatório pendente; gate artifact ausente",
          ...(terminalStepReady ? subResolution.basis : []),
          ...lateralRecommendations(lifecycle).map(
            (s) => `advisory ao gate (não bloqueia): ${s.typeId} ${s.state}`
          ),
        ],
        blocking: true,
      };
    }
  }

  // 6 — gate do checkpoint aprovado e nó ainda ativo: concluir/abrir o próximo.
  // Derivação CANÔNICA da progressão da Frente (fonte única; superfícies só rendem).
  if (lifecycle?.gateDecision === "approved" && facts.activeNode) {
    const progression = deriveFrenteProgression({
      steps: facts.steps,
      nextPlannedNode: facts.nextPlannedNode,
      gateApproved: true,
    });
    const next = progression.nextTopologyNode;

    if (!progression.frenteComplete) {
      const first = progression.unfinishedSteps[0];
      const pendingStepIds = progression.unfinishedSteps.map((s) => s.id).join(", ");
      return {
        kind: "conclude-node-open-next",
        description: next
          ? `Human Gate aprovado para ${facts.cursor?.checkpoint ?? "?"}, mas a Frente ainda tem checkpoint(s) pendente(s): ${pendingStepIds}. Abra o próximo PR governado da continuação antes de abrir o nó topológico ${next.id} (seq ${next.sequence ?? "?"}).`
          : `Human Gate aprovado para ${facts.cursor?.checkpoint ?? "?"}, mas a Frente ainda tem checkpoint(s) pendente(s): ${pendingStepIds}. Abra o próximo PR governado da continuação antes de concluir a topologia.`,
        basis: [
          `gate do checkpoint ${facts.cursor?.checkpoint ?? "?"} = approved`,
          `nó ${facts.activeNode.id} ainda em topology.prs.active`,
          `checkpoint pendente em tasks.md linha ${first.line}: ${first.id} — ${first.title}`,
          ...(next
            ? [
                `próximo nó topológico bloqueado enquanto a Frente não fecha: ${next.id} (seq ${next.sequence ?? "?"})`,
              ]
            : []),
        ],
        blocking: true,
      };
    }

    return {
      kind: "conclude-node-open-next",
      description: next
        ? `Concluir o nó ${facts.activeNode.id} na topologia e abrir o próximo PR autorizado: ${next.id} (seq ${next.sequence ?? "?"}).`
        : `Concluir o nó ${facts.activeNode.id} na topologia (não há nó planejado seguinte).`,
      basis: [
        `gate do checkpoint ${facts.cursor?.checkpoint ?? "?"} = approved`,
        `nó ${facts.activeNode.id} ainda em topology.prs.active`,
      ],
      blocking: false,
    };
  }

  // 7 — primeira tarefa aberta pertencente ao checkpoint do cursor.
  const firstOpen = openTasks[0];
  if (firstOpen) {
    const scope = taskScopeExcerpt(firstOpen);
    return {
      kind: "execute-task",
      description: `Implementar a primeira tarefa aberta do checkpoint ${facts.cursor?.checkpoint ?? "?"}: ${taskTitle(firstOpen)}${scope ? ` — Escopo: ${scope}` : ""}`,
      basis: [
        `tasks.md linha ${firstOpen.line} (tarefa aberta do checkpoint)`,
        `cursor: ${facts.cursor ? `${facts.cursor.pr} · ${facts.cursor.checkpoint}` : "(sem topology)"}`,
      ],
      blocking: false,
    };
  }

  // 7.5 — etapas (antigos CO-x.y) são as unidades executáveis quando o checkpoint
  // está fatiado. REUSA a MESMA resolução que o `work` consome para o objeto de
  // trabalho (invariante handoff↔work): se há um `[/]` ativo, o handoff o NOMEIA e
  // NÃO declara "zero tarefas"; se há transição pendente, aponta o ato humano.
  if (subResolution.kind === "implement") {
    const sc = subResolution.step;
    return {
      kind: "implement-step",
      description: `Implementar a etapa ativa ${sc.id} — ${sc.title} (tasks.md linha ${sc.line}).`,
      basis: [
        ...subResolution.basis,
        `cursor: ${facts.cursor ? `${facts.cursor.pr} · ${facts.cursor.checkpoint}` : "(sem topology)"}`,
      ],
      blocking: false,
    };
  }
  if (subResolution.kind === "transition") {
    const { conclude, activate } = subResolution.transition;
    return {
      kind: "advance-step-transition",
      description: conclude
        ? `Concluir a etapa ${conclude.id} e ativar ${activate.id} — ${activate.title} (decisão humana \`advance-step\`; ato visível em tasks.md).`
        : `Ativar a etapa pendente ${activate.id} — ${activate.title} (decisão humana \`advance-step\`; ato visível em tasks.md).`,
      basis: subResolution.basis,
      blocking: false,
    };
  }
  if (subResolution.kind === "terminal-ready") {
    const sc = subResolution.step;
    return {
      kind: "prepare-ready",
      description: `Preparar o fechamento do checkpoint ${facts.cursor?.checkpoint ?? "?"}: ${sc.id} está pronto e não há próxima etapa pendente.`,
      basis: subResolution.basis,
      blocking: false,
    };
  }

  // 8 — sem tarefa executável materializada (nem tarefa de topo nem etapa).
  return {
    kind: "investigate-checkpoint",
    description: `Investigar e planejar o checkpoint ${facts.cursor?.checkpoint ?? "(sem cursor)"} — não há tarefa executável materializada em tasks.md.`,
    basis: [
      `tasks.md: ${facts.tasks.length} tarefa(s) de topo associada(s) ao checkpoint, 0 abertas; 0 etapa ativa`,
      `cursor: ${facts.cursor ? `${facts.cursor.pr} · ${facts.cursor.checkpoint}` : "(sem topology)"}`,
    ],
    blocking: false,
  };
}

/** Proibições DERIVADAS do estado (não texto fixo) — o que este estado NÃO autoriza. */
export function deriveProhibitions(facts: HandoffFacts): string[] {
  const prohibitions: string[] = [];
  const lifecycle = facts.lifecycle;
  const gateApproved = lifecycle?.gateDecision === "approved";

  if (facts.activeNode && !facts.activeNode.terminal) {
    prohibitions.push(
      `NÃO mergear o PR${facts.activeNode.githubPr ? ` #${facts.activeNode.githubPr}` : ""} isolado em main — nó não-terminal em stack modo unit (merge é evento único no nó terminal).`
    );
  }
  if (facts.pullRequest?.isDraft) {
    // Reviews optional/recommended (mesmo stale) NÃO entram aqui — somente
    // required não satisfeito e o contrato READY do body condicionam o Ready.
    const readyEligible =
      lifecycle !== null &&
      blockingReviews(lifecycle).length === 0 &&
      facts.pullRequest.bodyReadyReasons.length === 0;
    if (!readyEligible) {
      prohibitions.push(
        `NÃO converter o PR #${facts.pullRequest.number} para Ready — precondições pendentes (reviews OBRIGATÓRIOS/contrato READY do body; valide com pr-ready:check).`
      );
    }
  }
  if (!gateApproved) {
    prohibitions.push(
      "NÃO registrar gate artifact antes da decisão humana do Human Gate (o arquivo nasce DEPOIS da decisão)."
    );
    if (facts.nextPlannedNode) {
      prohibitions.push(
        `NÃO abrir o próximo nó planejado (${facts.nextPlannedNode.id}, seq ${facts.nextPlannedNode.sequence ?? "?"}) — transição não autorizada por gate.`
      );
    }
  }
  if (facts.cursor) {
    prohibitions.push(
      `NÃO implementar fora do checkpoint ${facts.cursor.checkpoint} (1 checkpoint atômico por vez).`
    );
  }
  return prohibitions;
}

/** Puro: fatos → derivado completo (próxima ação + proibições + selo). */
export function deriveHandoff(facts: HandoffFacts): HandoffDerived {
  return {
    facts,
    nextAction: deriveNextAction(facts),
    prohibitions: deriveProhibitions(facts),
    seal: computeSeal(facts),
  };
}
