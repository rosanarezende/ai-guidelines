import { GOVERNANCE_ROOT, LegacySource, WorkspaceState } from "./WorkspaceState.js";

/**
 * [DEC-0021-A03] Plano de migração puro.
 *
 * O plano é **determinístico** a partir do estado: serve como contrato entre
 * domínio e infraestrutura. A execução real (IO) acontece em
 * `AdoptWorkspace` via {@link ../../app/ports/WorkspaceProvisioner}.
 *
 * Idempotência: rodar `planAdoption` duas vezes sobre o mesmo estado produz
 * planos equivalentes — e quando o estado já é `governance`, todos os steps
 * são no-ops (dirs e arquivos já existem).
 */
export type MigrationStep =
  | { readonly kind: "ensure-directory"; readonly path: string }
  | { readonly kind: "ensure-file"; readonly path: string; readonly content: string };

export interface MigrationPlan {
  readonly steps: ReadonlyArray<MigrationStep>;
  readonly noticedLegacy: ReadonlyArray<LegacySource>;
}

/**
 * Diretórios canônicos reservados em `.governance/` (vide [DEC-0021-B02]).
 * Mantemos a lista explícita para evitar drift entre docs e runtime.
 */
export const RESERVED_GOVERNANCE_DIRS = ["intake", "handoff", "telemetry"] as const;

/**
 * Estrutura canônica mínima onde o **lifecycle de spec** opera ([DEC-0023-O01]).
 * Provisionada no bootstrap para que um consumidor recém-`init`/`adopt` consiga
 * abrir specs, consolidar pesquisas e arquivar — sem precisar criar pastas à mão.
 *
 * - `specs/` — raiz das specs do consumidor;
 * - `specs/roadmap/` — visão narrativa (`backlog.md` + `historico.md`);
 * - `specs/research-library/` — biblioteca central de pesquisas consolidadas
 *   (nome canônico; corrige o typo legado `researchs/` e desambígua do
 *   `research/` local e efêmero de cada spec).
 *
 * Distinto das reservas (`intake`/`handoff`/`telemetry`) e da topologia de
 * pilares por classe (`specs/experiments/...`, escopo de
 * `boilerplate-system-modernization`).
 */
export const GOVERNANCE_SPECS_SCAFFOLD_DIRS = [
  "specs",
  "specs/roadmap",
  "specs/research-library",
] as const;

/**
 * Índices canônicos do scaffold ([DEC-0023-O01]). Criados com stub mínimo
 * **não-destrutivo** (escreve só se ausente): dão um ponto de partida válido
 * para abrir/fechar specs. O conteúdo rico é responsabilidade do consumidor;
 * aqui só garantimos que o arquivo exista com a forma canônica.
 */
export const GOVERNANCE_SCAFFOLD_FILES: ReadonlyArray<{
  readonly path: string;
  readonly content: string;
}> = [
  {
    path: "specs/roadmap/backlog.md",
    content:
      "# Backlog\n\n> Candidatas e specs em execução. Lifecycle em `.core/process/governance-foundation.md`.\n\n## Em execução\n\n## Now\n\n## Candidatas\n",
  },
  {
    path: "specs/roadmap/historico.md",
    content:
      "# Histórico\n\n> Specs concluídas (arquivo). Ao fechar uma spec, mova a entrada do backlog para cá.\n\n## Concluídas\n",
  },
  {
    path: "specs/research-index.md",
    content:
      "# Research Index\n\n> Base de conhecimento navegável. Pesquisas consolidadas vivem em `research-library/`; ao fechar uma spec, indexe aqui as pesquisas migradas.\n",
  },
];

export function planAdoption(state: WorkspaceState): MigrationPlan {
  const ensure: MigrationStep[] = [
    { kind: "ensure-directory", path: GOVERNANCE_ROOT },
    ...RESERVED_GOVERNANCE_DIRS.map(
      (sub): MigrationStep => ({
        kind: "ensure-directory",
        path: `${GOVERNANCE_ROOT}/${sub}`,
      })
    ),
    ...GOVERNANCE_SPECS_SCAFFOLD_DIRS.map(
      (sub): MigrationStep => ({
        kind: "ensure-directory",
        path: `${GOVERNANCE_ROOT}/${sub}`,
      })
    ),
    ...GOVERNANCE_SCAFFOLD_FILES.map(
      (f): MigrationStep => ({
        kind: "ensure-file",
        path: `${GOVERNANCE_ROOT}/${f.path}`,
        content: f.content,
      })
    ),
  ];

  switch (state.kind) {
    case "governance":
      // Idempotência: já há `.governance/`. Todos os steps são no-ops
      // (ensureDirectory/ensureFile retornam false se já existentes).
      return { steps: Object.freeze(ensure.slice()), noticedLegacy: [] };
    case "pristine":
      return { steps: Object.freeze(ensure.slice()), noticedLegacy: [] };
    case "legacy":
      return {
        steps: Object.freeze(ensure.slice()),
        noticedLegacy: state.sources,
      };
    case "mixed":
      // Estado misto não pode ser migrado silenciosamente — caller deve
      // resolver via `WorkspacePrecedence` antes de pedir plano.
      return {
        steps: Object.freeze(ensure.slice()),
        noticedLegacy: state.legacySources,
      };
  }
}
