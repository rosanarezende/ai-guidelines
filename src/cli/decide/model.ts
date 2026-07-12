/**
 * Modelo PURO das DECISÕES RESERVADAS AO HUMANO (`guidelines decide`, CO-3 / PR #42).
 *
 * Separação cravada (espelha handoff/work/review):
 *   `collectDecisionSnapshot` (I/O: fs/git/gh — `snapshot.ts`)
 *   → `HumanDecisionDefinition.{detect,buildBrief,choices,plan}` (puros)
 *   → render (`render.ts`) / wizard (`decide.ts`)
 *   → `HumanDecisionDefinition.apply` (efeito governado, sob confirmação).
 *
 * Tudo aqui é serializável e determinístico — nenhum LLM, nenhuma rede (ADR 0018).
 * O briefing HUMANO precede a decisão: o `summary` nunca começa por SHA/ID/
 * fingerprint; IDs/refs/paths vivem só em `technicalDetails`.
 */
import type { DecisionSnapshot } from "./snapshot.js";
import type { StackOps } from "../../app/ports/StackOps.js";

export interface Logger {
  info: (msg: string) => void;
  error: (msg: string) => void;
}

export type DecisionStatus = "available" | "blocked" | "not-applicable";

/** Disponibilidade derivada de uma decisão no estado atual. */
export interface DecisionAvailability {
  readonly status: DecisionStatus;
  /** Motivos legíveis (pt-BR) — explicam blocked/not-applicable em linguagem humana. */
  readonly reasons: readonly string[];
  /** Nota positiva curta quando `available` (ex.: "CO-3.1 concluível; CO-3.2 é o próximo"). */
  readonly hint?: string;
}

/** Uma seção humana do briefing (heading + corpo em frases curtas). */
export interface HumanDecisionSection {
  readonly key: string;
  readonly heading: string;
  readonly body: readonly string[];
}

/** Uma escolha apresentável; `mutating` = aplica efeito governado (escrita). */
export interface HumanDecisionChoice {
  readonly id: string;
  readonly label: string;
  readonly mutating: boolean;
  /** false quando a escolha existe na policy mas não é elegível no estado atual. */
  readonly available: boolean;
}

export interface HumanDecisionTechnicalDetail {
  readonly label: string;
  readonly value: string;
}

/** Fonte governada citável (path/id) — base factual do briefing. */
export interface HumanDecisionSource {
  readonly label: string;
  readonly ref: string;
}

/**
 * Briefing humano determinístico de UMA decisão. Modelo puro/serializável: o
 * renderer e o wizard consomem este objeto sem voltar ao snapshot.
 */
export interface HumanDecisionBrief {
  readonly id: string;
  readonly type: string;
  readonly status: DecisionStatus;
  readonly title: string;
  /** "O que está sendo decidido" — linguagem humana; NUNCA começa por SHA/ID/fingerprint. */
  readonly summary: string;
  readonly whyNow: string;
  readonly sections: readonly HumanDecisionSection[];
  readonly consequences: readonly string[];
  readonly notAuthorized: readonly string[];
  readonly choices: readonly HumanDecisionChoice[];
  /** Detalhes técnicos OPCIONAIS — omitidos por default, exibidos só com --technical. */
  readonly technicalDetails: readonly HumanDecisionTechnicalDetail[];
  readonly sources: readonly HumanDecisionSource[];
  /** Quando blocked/not-applicable: o que falta, em linguagem humana. */
  readonly blockedReasons: readonly string[];
}

export interface DecisionFileChange {
  /** Path relativo ao repoRoot. */
  readonly path: string;
  /** Descrição humana da alteração (Tela 4 — prévia). */
  readonly description: string;
}

export interface DecisionPlanPrecondition {
  readonly label: string;
  readonly expected: string;
}

/** Parâmetros de uma escolha (ex.: subconjunto de findings em review-individually). */
export interface DecisionChoiceParams {
  readonly findings?: readonly string[];
}

/**
 * Plano de alteração derivado de (briefing elegível + escolha). Contém o que
 * será escrito, o que será preservado e preconditions anti-TOCTOU suficientes
 * para detectar mudança entre o briefing e a confirmação (regra 11).
 */
export interface DecisionPlan {
  readonly type: string;
  readonly choiceId: string;
  /** true = há escrita a publicar; false = read-only (request-explanation/changes/cancel). */
  readonly mutating: boolean;
  /** Alterações propostas (prévia). */
  readonly changes: readonly DecisionFileChange[];
  /** O que NÃO será alterado (prévia). */
  readonly preserved: readonly string[];
  /** Mensagem de commit DERIVADA (null quando read-only). */
  readonly commitMessage: string | null;
  /** Selo do snapshot na geração do plano (anti-TOCTOU). */
  readonly seal: string;
  /** git HEAD na geração do plano (anti-TOCTOU). */
  readonly gitHead: string | null;
  readonly preconditions: readonly DecisionPlanPrecondition[];
  /** Próxima operação humana autorizada após o registro (mensagem final). */
  readonly nextHuman: readonly string[];
  /** Mensagem quando read-only (o que falta / o que manter). */
  readonly note: readonly string[];
  /**
   * Carga OPACA específica da definição, suficiente para `apply` executar SEM o
   * snapshot (o plano é o contrato completo da aplicação). Cada definição faz
   * cast para o próprio tipo.
   */
  readonly payload: unknown;
}

export interface ResolvedActor {
  readonly name: string | null;
  readonly email: string | null;
  /** Handle derivado/normalizado (ex.: "@rosanarezende"). */
  readonly handle: string | null;
}

/** Operações git injetáveis (testabilidade do efeito; sem force/--no-verify). */
export interface DecisionGitOps {
  /** Path canônico do arquivo do efeito; falha se a working tree não for exatamente ele. */
  porcelainPaths(): readonly string[] | null;
  revParseShortHead(): string | null;
  /** Cria/switcha para branch local a partir de um start point factual. */
  createBranch?(branchName: string, startPoint: string): void;
  /** Publica a branch recém-criada antes de abrir PR; necessário para `gh pr create`. */
  pushBranch?(branchName: string): void;
  add(relFile: string): void;
  commit(message: string): void;
  push(): void;
}

export interface DecisionApplyContext {
  readonly repoRoot: string;
  readonly logger: Logger;
  readonly actor: ResolvedActor;
  readonly git: DecisionGitOps;
  readonly stack?: StackOps;
  /** Confirmação humana = autorização (interativo) OU explicit-human-decision (direto). */
  readonly authorization: "explicit-human-decision";
}

export interface DecisionApplyResult {
  readonly ok: boolean;
  readonly committed: string | null;
  readonly pushed: boolean;
  readonly messages: readonly string[];
}

/**
 * Definição EXTENSÍVEL de um tipo de decisão. Adicionar um tipo novo = uma
 * definição + registro em ponto único (`registry.ts`) — sem cadeia central
 * `if (type === ...)`. Cada definição combina o contrato estático da policy
 * (títulos/seções/escolhas/limites) com fatos derivados do snapshot.
 */
export interface HumanDecisionDefinition {
  readonly id: string;
  readonly title: string;
  /** Disponibilidade no estado atual (available | blocked | not-applicable). */
  detect(snapshot: DecisionSnapshot): DecisionAvailability;
  /** Briefing humano determinístico (detalhes técnicos só quando `technical`). */
  buildBrief(snapshot: DecisionSnapshot, opts: { readonly technical: boolean }): HumanDecisionBrief;
  /** Escolhas apresentáveis (label da policy; availability derivada). */
  choices(snapshot: DecisionSnapshot): readonly HumanDecisionChoice[];
  /** Plano de alteração para uma escolha válida. Lança Error em escolha desconhecida. */
  plan(snapshot: DecisionSnapshot, choiceId: string, params?: DecisionChoiceParams): DecisionPlan;
  /** Aplica SOMENTE o efeito confirmado (escrita + validação + commit + push). */
  apply(plan: DecisionPlan, ctx: DecisionApplyContext): Promise<DecisionApplyResult>;
}
