export interface MaintainerBddScenario {
  readonly id: string;
  readonly title: string;
  readonly persona: "maintainer" | "owner" | "reviewer";
  readonly area:
    | "flow"
    | "wizard"
    | "provisioning"
    | "reviews"
    | "consumer-journey"
    | "site-fidelity";
  readonly journey: string;
  readonly given: readonly string[];
  readonly when: readonly string[];
  readonly then: readonly string[];
  readonly artifacts: readonly string[];
  readonly evidence: {
    readonly testFile: string;
    readonly testName: string;
    readonly command?: string;
  };
}

export const MAINTAINER_BDD_SCENARIOS: readonly MaintainerBddScenario[] = [
  {
    id: "flow-dirty-tree-validation",
    title: "Tree suja orienta validação do diff antes de qualquer decisão",
    persona: "maintainer",
    area: "wizard",
    journey: "uso diario",
    given: [
      "repo governado",
      "working tree com mudanças locais",
      "nenhuma mutação governada disponível",
    ],
    when: ["a pessoa abre o wizard com npx ai-guidelines"],
    then: [
      "o wizard recomenda validar as mudanças locais",
      "readiness e avanço não são oferecidos como ação principal",
      "a pessoa vê um caminho de validação sem decorar comandos",
    ],
    artifacts: ["src/cli/flowWizard.ts", "src/cli/experience/wizard/provisioning.ts"],
    evidence: {
      testFile: "src/cli/flowWizard.test.ts",
      testName: "quando há mudanças locais e nenhuma mutação disponível, recomenda validar o diff",
      command: "npx ai-guidelines",
    },
  },
  {
    id: "flow-multiple-specs-focus",
    title: "Múltiplas specs exigem escolha explícita de foco",
    persona: "maintainer",
    area: "wizard",
    journey: "uso diario",
    given: ["repo governado", "índice de specs ativas disponível", "mais de uma spec em andamento"],
    when: ["a pessoa escolhe continuar uma frente de trabalho"],
    then: [
      "o wizard lista specs conhecidas",
      "branch diferente exige checkout explícito",
      "spec sem path local orienta fetch/checkout sem executar continue",
    ],
    artifacts: ["src/cli/experience/wizard/specWork.ts", ".governance/runtime/specs/active.yml"],
    evidence: {
      testFile: "src/cli/flowWizard.test.ts",
      testName: "escolher spec de outra branch orienta checkout e não executa continue",
      command: "npx ai-guidelines",
    },
  },
  {
    id: "flow-readiness-blocked",
    title: "Readiness usa a mesma fonte de verdade de work e decide",
    persona: "owner",
    area: "flow",
    journey: "decisao governada",
    given: ["etapa ativa", "findings ou CI ainda pendentes", "sem readiness declarada"],
    when: ["a pessoa consulta work, decide ou o wizard"],
    then: [
      "todos mostram o mesmo bloqueio",
      "advance-step não aparece como executável",
      "Human Gate permanece proibido antes do momento correto",
    ],
    artifacts: ["src/cli/flow/GovernedFlow.ts", "src/cli/decide/advanceStep.ts"],
    evidence: {
      testFile: "src/cli/flow/GovernedFlow.test.ts",
      testName: "findings abertos e CI pendente bloqueiam readiness pela fonte comum",
      command: "npx ai-guidelines work",
    },
  },
  {
    id: "flow-terminal-step",
    title: "Última etapa pronta não tenta avançar para um item inexistente",
    persona: "owner",
    area: "flow",
    journey: "fechamento de checkpoint",
    given: ["última etapa ativa", "readiness declarada", "nenhuma próxima etapa pendente"],
    when: ["o runtime deriva a próxima ação"],
    then: [
      "o próximo movimento vira fechamento do checkpoint",
      "advance-step não é recomendado indevidamente",
      "Human Gate continua separado de Ready e merge",
    ],
    artifacts: ["src/cli/flow/GovernedFlow.ts", "src/cli/decide/humanGate.ts"],
    evidence: {
      testFile: "src/cli/flow/GovernedFlow.test.ts",
      testName: "última etapa pronta não recomenda advance-step",
      command: "npx ai-guidelines decide --brief-only",
    },
  },
  {
    id: "provisioning-governed-repo-update",
    title: "Repo já governado usa update, não init/adopt",
    persona: "maintainer",
    area: "provisioning",
    journey: "manutencao de repo",
    given: [
      "repo já contém runtime governado",
      "review-policy pode existir",
      "providers/features podem mudar",
    ],
    when: ["a pessoa abre a seção de configuração do wizard"],
    then: [
      "init/adopt não são oferecidos como caminho principal",
      "update guiado permite providers, práticas e colaboração",
      "mudança de colaboração exige confirmação explícita",
    ],
    artifacts: [
      "src/cli/experience/wizard/provisioning.ts",
      "src/cli/copy/locales/pt-BR/provisioning.json",
    ],
    evidence: {
      testFile: "src/cli/flowWizard.test.ts",
      testName:
        "provisioning em repo governado recomenda update e esconde init/adopt do caminho principal",
      command: "npx ai-guidelines",
    },
  },
  {
    id: "consumer-pack-smoke",
    title: "Pacote instalado é validado sem publicar no npm",
    persona: "maintainer",
    area: "consumer-journey",
    journey: "validacao de consumidor",
    given: [
      "mudança no pacote",
      "necessidade de provar instalação real",
      "sem publicar versão npm",
    ],
    when: ["a pessoa executa a jornada pack"],
    then: [
      "o tarball é criado e instalado em consumidor temporário",
      "o bin publicado é exercitado",
      "smoke continua útil coma etapa final de pacote",
    ],
    artifacts: ["src/cli/consumerJourney.ts", "tests/smoke"],
    evidence: {
      testFile: "src/cli/consumerJourney.test.ts",
      testName: "o nivel pack executa os smoke tests de pacote instalado",
      command: "npx ai-guidelines consumer-journey pack",
    },
  },
  {
    id: "site-command-fidelity",
    title: "Site não ensina comando inexistente",
    persona: "reviewer",
    area: "site-fidelity",
    journey: "documentacao viva",
    given: ["site público renderiza comandos", "registry da CLI é a fonte operacional"],
    when: ["o build do site roda os guards"],
    then: [
      "qualquer comando exibido precisa existir no registry",
      "providers não volta como comando separado",
      "copy gerada não pode divergir do runtime",
    ],
    artifacts: ["src/cli/copy/siteCommandSurface.test.ts", "site/src/content/flowData.ts"],
    evidence: {
      testFile: "src/cli/copy/siteCommandSurface.test.ts",
      testName: "não referencia comando inexistente",
      command: "npm run site:build",
    },
  },
];

export function maintainerBddScenariosByJourney(): ReadonlyMap<
  string,
  readonly MaintainerBddScenario[]
> {
  const grouped = new Map<string, MaintainerBddScenario[]>();
  for (const scenario of MAINTAINER_BDD_SCENARIOS) {
    const current = grouped.get(scenario.journey) ?? [];
    grouped.set(scenario.journey, [...current, scenario]);
  }
  return grouped;
}
