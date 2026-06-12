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

/**
 * Versão do contrato derivação+renderer — entra no selo (mudou contrato ⇒ muda
 * selo) e no recibo (recibo de versão antiga vira `invalid` ⇒ força recarga).
 * v2: cápsula de contrato global (identidade + bootstrap + regras obrigatórias
 * + script-contract) entra no snapshot/fontes.
 */
export const HANDOFF_CONTRACT_VERSION = 2;

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
}

export interface HandoffLifecycleFact {
  readonly reviewDecisions: ReadonlyArray<{ readonly role: string; readonly decision: string }>;
  readonly requiredReviewRoles: ReadonlyArray<string>;
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

export interface HandoffInsightFact {
  readonly id: string;
  readonly excerpt: string;
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

function pendingRequiredReviews(lifecycle: HandoffLifecycleFact): string[] {
  const approved = new Set(
    lifecycle.reviewDecisions.filter((d) => d.decision === "approved").map((d) => d.role)
  );
  return lifecycle.requiredReviewRoles.filter((role) => !approved.has(role));
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
  const implementationConcluded = facts.tasks.length > 0 && openTasks.length === 0;

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

  // 3 — implementação concluída mas lane exigida pela review-policy sem approved.
  if (lifecycle && implementationConcluded) {
    const pending = pendingRequiredReviews(lifecycle);
    if (pending.length > 0) {
      return {
        kind: "run-required-review",
        description: `Executar o(s) review(s) exigido(s) pendente(s): ${pending.join(", ")}.`,
        basis: [
          `tasks do checkpoint concluídas (${facts.tasks.length}/${facts.tasks.length})`,
          `review-policy exige: ${lifecycle.requiredReviewRoles.join(", ")}`,
          `decisões presentes: ${lifecycle.reviewDecisions.map((d) => `${d.role}=${d.decision}`).join(", ") || "(nenhuma)"}`,
        ],
        blocking: true,
      };
    }
  }

  const reviewsConcluded =
    lifecycle !== null &&
    lifecycle.requiredReviewRoles.length > 0 &&
    pendingRequiredReviews(lifecycle).length === 0;
  const prSource = facts.sources.find((s) => s.id === "pull-request");
  const remoteUnavailable = prSource !== undefined && prSource.status !== "fresh";

  if (reviewsConcluded && lifecycle.gateDecision === null) {
    // 4b — a decisão Ready/gate depende do estado remoto; sem ele, reconciliar a fonte.
    if (facts.pullRequest === null && remoteUnavailable) {
      return {
        kind: "reconcile-remote-source",
        description:
          "Restabelecer a fonte remota (PR via gh) para decidir preparação de Ready/Human Gate — não inventar estado remoto.",
        basis: [
          `fonte pull-request: ${prSource.status}${prSource.detail ? ` (${prSource.detail})` : ""}`,
          "reviews exigidos concluídos; próximo passo depende de Draft/Ready do PR",
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
          "reviews exigidos concluídos (todas as lanes approved)",
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
          "reviews exigidos concluídos; gate artifact ausente",
        ],
        blocking: true,
      };
    }
  }

  // 6 — gate do checkpoint aprovado e nó ainda ativo: concluir/abrir o próximo.
  if (lifecycle?.gateDecision === "approved" && facts.activeNode) {
    const next = facts.nextPlannedNode;
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

  // 8 — sem tarefa executável materializada.
  return {
    kind: "investigate-checkpoint",
    description: `Investigar e planejar o checkpoint ${facts.cursor?.checkpoint ?? "(sem cursor)"} — não há tarefa executável materializada em tasks.md.`,
    basis: [
      `tasks.md: ${facts.tasks.length} tarefa(s) associada(s) ao checkpoint, 0 abertas executáveis`,
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
    const readyEligible =
      lifecycle !== null &&
      lifecycle.requiredReviewRoles.length > 0 &&
      pendingRequiredReviews(lifecycle).length === 0 &&
      facts.pullRequest.bodyReadyReasons.length === 0;
    if (!readyEligible) {
      prohibitions.push(
        `NÃO converter o PR #${facts.pullRequest.number} para Ready — precondições pendentes (reviews exigidos/contrato READY do body; valide com pr-ready:check).`
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
