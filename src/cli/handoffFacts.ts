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
 * Sub-checkpoint (CO-x.y) aninhado sob o checkpoint do cursor em tasks.md. A
 * granularidade real de TRABALHO de um checkpoint composto vive aqui: o
 * checkpoint-pai é container, os sub-checkpoints é que carregam o objeto
 * executável. Três estados (espelham os marcadores do tasks.md):
 * `pending` (`[ ]`), `in-progress` (`[/]`), `done` (`[x]`).
 */
export interface HandoffSubCheckpoint {
  readonly id: string;
  readonly title: string;
  readonly state: "pending" | "in-progress" | "done";
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
  /** Sub-checkpoints (CO-x.y) aninhados sob o checkpoint do cursor em tasks.md. */
  readonly subCheckpoints: ReadonlyArray<HandoffSubCheckpoint>;
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

/**
 * Extrai os sub-checkpoints (CO-x.y) aninhados sob o checkpoint do cursor. Lê a
 * fonte CANÔNICA (tasks.md): ancora na linha `**Checkpoint <normalizado>**` e
 * coleta os itens de checkbox subsequentes até o próximo checkpoint de topo.
 * Reconhece os três estados — `[ ]` pending, `[/]` in-progress, `[x]` done — e
 * SÓ sub-checkpoints `CO-N.M` (o checkpoint-pai `CO-N` não entra). Conservador:
 * mencionar um sub-checkpoint em prosa de outro bloco NÃO cria pertencimento.
 */
export function parseSubCheckpoints(tasksMd: string, checkpoint: string): HandoffSubCheckpoint[] {
  const normalized = checkpoint.replace(/^checkpoint-/, "");
  const lines = tasksMd.split(/\r?\n/);
  const anchor = lines.findIndex((l) => l.includes(`**Checkpoint ${normalized}**`));
  if (anchor < 0) return [];
  const out: HandoffSubCheckpoint[] = [];
  for (let i = anchor + 1; i < lines.length; i++) {
    if (/\*\*Checkpoint /.test(lines[i])) break; // próximo checkpoint de topo
    const m = /^\s*-\s*\[([ xX/])\]\s*\*\*(CO-\d+\.\d+)\b\s*[—-]?\s*(.*?)\*\*/.exec(lines[i]);
    if (!m) continue;
    const mark = m[1];
    const state = mark === " " ? "pending" : mark === "/" ? "in-progress" : "done";
    out.push({ id: m[2], title: m[3].trim(), state, line: i + 1 });
  }
  return out;
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
          `tasks do checkpoint concluídas (${facts.tasks.length}/${facts.tasks.length})`,
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
          ...lateralRecommendations(lifecycle).map(
            (s) => `advisory ao gate (não bloqueia): ${s.typeId} ${s.state}`
          ),
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
