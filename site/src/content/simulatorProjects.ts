export type SimulatorProjectId =
  | "empty"
  | "existing"
  | "conflict"
  | "governed"
  | "daily-resume"
  | "daily-focus"
  | "daily-peer";

type MountFile = { readonly file: { readonly contents: string } };
type MountDirectory = { readonly directory: MountTree };
export type MountEntry = MountFile | MountDirectory;
export type MountTree = Record<string, MountEntry>;

export interface SimulatorProject {
  readonly id: SimulatorProjectId;
  readonly label: string;
  readonly files: MountTree;
  readonly supportsRealMode: boolean;
  readonly unsupportedRealModeReason?: string;
}

function file(contents: string): MountFile {
  return { file: { contents } };
}

function json(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function packageJson(name: string, extra: Record<string, unknown> = {}): MountFile {
  return file(json({ name, version: "0.0.1", private: true, ...extra }));
}

const soloReviewPolicy = `active_profile: solo
profiles:
  solo:
    implementation_pr:
      required_native_approvals: 0
    integration_pr:
      required_native_approvals: 0
    accepted_findings:
      require_resolution: false
      require_verification_event_for_fixed: false
    github:
      minimum_approving_reviews: 1
      require_code_owner_review: true
      dismiss_stale_reviews_on_push: true
      require_last_push_approval: false
  contributor:
    implementation_pr:
      required_native_approvals: 0
    integration_pr:
      required_native_approvals: 1
    accepted_findings:
      require_resolution: true
      require_verification_event_for_fixed: true
    github:
      minimum_approving_reviews: 1
      require_code_owner_review: true
      dismiss_stale_reviews_on_push: true
      require_last_push_approval: false
  team:
    implementation_pr:
      required_native_approvals: 1
    integration_pr:
      required_native_approvals: 2
    accepted_findings:
      require_resolution: true
      require_verification_event_for_fixed: true
    github:
      minimum_approving_reviews: 2
      require_code_owner_review: true
      dismiss_stale_reviews_on_push: true
      require_last_push_approval: true
review_requirements:
  defaults:
    technical_audit: optional
    architectural_review: optional
`;

function aiGuidelinesConfig(name: string): MountEntry {
  return {
    directory: {
      "config.json": file(
        json({
          version: 1,
          project: { name, packageManager: "npm" },
          providers: ["claude"],
          features: [],
          lang: "pt",
        })
      ),
    },
  };
}

function governanceFiles(specs: MountTree, activeSpecs: string): MountEntry {
  return {
    directory: {
      "review-policy.yml": file(soloReviewPolicy),
      runtime: {
        directory: {
          specs: {
            directory: {
              "active.yml": file(activeSpecs),
            },
          },
        },
      },
      specs: {
        directory: specs,
      },
    },
  };
}

function specFiles(title: string, githubPr: number | null, taskPrefix: string): MountEntry {
  const prLine = githubPr === null ? "null" : String(githubPr);
  return {
    directory: {
      "state.yml": file(`stage: implementation
gate:
  status: closed
focus: []
next: []
topology:
  cursor:
    pr: ${taskPrefix.toLowerCase()}
    checkpoint: checkpoint-${taskPrefix.toLowerCase()}
  prs:
    concluded: []
    active:
      - id: ${taskPrefix.toLowerCase()}
        github_pr: ${prLine}
        role: execution
        terminal: false
        sequence: 1
        checkpoints:
          - checkpoint-${taskPrefix.toLowerCase()}
    planned:
      - id: integration-final
        github_pr: null
        role: integration
        terminal: true
        sequence: null
        checkpoints:
          - checkpoint-integration-final
`),
      "plan.md": file(`# ${title}

Plano resumido para o simulador publico.
`),
      "tasks.md": file(`## Execucao

- [/] **Checkpoint ${taskPrefix}** (no \`${taskPrefix.toLowerCase()}\`)
  - [/] **${taskPrefix}-1 — trabalho em andamento**: validar o fluxo diario.
  - [ ] **${taskPrefix}-2 — fechamento**: preparar decisao humana.
`),
    },
  };
}

const oneSpecActive = `version: 1
active_specs:
  - id: "0024"
    slug: demo
    title: Spec Demo
    branch: feat/spec-0024-demo
    stage: implementation
    status: active
    spec_path: .governance/specs/0024-demo
    source_state_path: .governance/specs/0024-demo/state.yml
    updated_at: 2026-06-19T00:00:00-03:00
    updated_by: "@consumer"
`;

const multipleSpecsActive = `version: 1
active_specs:
  - id: "0024"
    slug: co-flow
    title: Co-flow convergence
    branch: feat/spec-0024-co-flow
    stage: implementation
    status: active
    spec_path: .governance/specs/0024-co-flow
    source_state_path: .governance/specs/0024-co-flow/state.yml
    updated_at: 2026-06-19T00:00:00-03:00
    updated_by: "@consumer"
  - id: "0025"
    slug: docs
    title: Documentacao publica
    branch: feat/spec-0025-docs
    stage: implementation
    status: active
    spec_path: .governance/specs/0025-docs
    source_state_path: .governance/specs/0025-docs/state.yml
    updated_at: 2026-06-19T00:00:00-03:00
    updated_by: "@consumer"
  - id: "0026"
    slug: housekeeping
    title: Housekeeping
    branch: feat/spec-0026-housekeeping
    stage: implementation
    status: active
    spec_path: .governance/specs/0026-housekeeping
    source_state_path: .governance/specs/0026-housekeeping/state.yml
    updated_at: 2026-06-19T00:00:00-03:00
    updated_by: "@consumer"
`;

function governedProject(name: string, activeSpecs: string, specs: MountTree): MountTree {
  return {
    "package.json": packageJson(name),
    ".ai-guidelines": aiGuidelinesConfig(name),
    ".governance": governanceFiles(specs, activeSpecs),
  };
}

export const SIMULATOR_PROJECTS: Readonly<Record<SimulatorProjectId, SimulatorProject>> = {
  empty: {
    id: "empty",
    label: "Projeto novo ou pasta vazia",
    files: {},
    supportsRealMode: true,
  },
  existing: {
    id: "existing",
    label: "Projeto em andamento",
    files: {
      "package.json": packageJson("consumer-existing-package"),
      "notes.txt": file("conteudo existente que precisa ser preservado\n"),
    },
    supportsRealMode: true,
  },
  conflict: {
    id: "conflict",
    label: "Projeto com formatter rival",
    files: {
      "package.json": packageJson("consumer-existing-formatter-conflict", {
        devDependencies: { "@biomejs/biome": "^1.0.0" },
        scripts: { format: "biome format ." },
      }),
      "biome.json": file('{\n  "$schema": "https://biomejs.dev/schemas/1.0.0/schema.json"\n}\n'),
    },
    supportsRealMode: true,
  },
  governed: {
    id: "governed",
    label: "Repo governado",
    files: governedProject("consumer-governed-solo", oneSpecActive, {
      "0024-demo": specFiles("Spec Demo", 101, "DEMO"),
    }),
    supportsRealMode: true,
  },
  "daily-resume": {
    id: "daily-resume",
    label: "Retomar trabalho com uma spec ativa",
    files: governedProject("consumer-daily-resume", oneSpecActive, {
      "0024-demo": specFiles("Spec Demo", 101, "DEMO"),
    }),
    supportsRealMode: true,
  },
  "daily-focus": {
    id: "daily-focus",
    label: "Escolher foco com varias specs",
    files: governedProject("consumer-daily-focus", multipleSpecsActive, {
      "0024-co-flow": specFiles("Co-flow convergence", 143, "FLOW"),
      "0025-docs": specFiles("Documentacao publica", 144, "DOCS"),
      "0026-housekeeping": specFiles("Housekeeping", null, "HOUSE"),
    }),
    supportsRealMode: true,
  },
  "daily-peer": {
    id: "daily-peer",
    label: "Revisar PR de colega",
    files: governedProject("consumer-peer-review", oneSpecActive, {
      "0024-demo": specFiles("Spec Demo", 101, "DEMO"),
    }),
    supportsRealMode: false,
    unsupportedRealModeReason:
      "Este cenário depende de um PR real no GitHub. No navegador, use a simulação projetada para entender o fluxo sem tocar no seu repositório.",
  },
};

export function simulatorProjectById(id: string): SimulatorProject {
  return SIMULATOR_PROJECTS[
    (id as SimulatorProjectId) in SIMULATOR_PROJECTS ? (id as SimulatorProjectId) : "empty"
  ];
}
