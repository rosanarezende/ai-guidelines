import type { CatalogScenario } from "./types";

/**
 * Catálogo dos 12 cenários obrigatórios do simulador.
 *
 * O array abaixo é JSON válido (chaves entre aspas, sem vírgula final) para que o
 * guard de texto (`scenarioCatalog.test.ts`) consiga `regex + JSON.parse` — mesmo
 * padrão do arquivo gerado. NÃO inserir comentários dentro do array.
 *
 * Regra dura de procedência:
 *  - `real` (1–4): TODAS as outputs dos passos são `transcript:<id>` (sem lines);
 *  - `simulado`/`gap`: passos autorais usam `source:"simulado"|"gap"` + `lines`.
 */
// prettier-ignore
export const SCENARIO_CATALOG = [
  {
    "id": "empty-project",
    "name": "Projeto vazio",
    "audience": "iniciante",
    "provenance": "real",
    "realAnchors": ["consumer-empty-entry", "new-project"],
    "entryCommand": "npx ai-guidelines",
    "context": "Pasta vazia: sem package.json e sem diretórios governados.",
    "steps": [
      {
        "id": "guide",
        "prompt": "A CLI percebe o contexto e recomenda o caminho principal.",
        "options": ["Iniciar ai-guidelines neste repositório"],
        "outputs": [{ "source": "transcript:consumer-empty-entry" }],
        "why": "Pasta vazia detectada: init vira o caminho principal; adopt e update não aparecem como ação principal."
      },
      {
        "id": "dry-run",
        "prompt": "Ver o plano antes de escrever qualquer arquivo.",
        "options": ["npx ai-guidelines init --dry-run"],
        "outputs": [{ "source": "transcript:new-project" }],
        "why": "Dry-run mostra exatamente o que seria criado; nada é escrito antes da confirmação humana."
      }
    ],
    "effects": [
      { "label": "Baseline governado (AGENTS.md, templates, config)", "status": "available", "detail": "linhas [dry-run] write do transcript real" }
    ],
    "blocks": [],
    "shortcuts": ["npx ai-guidelines init --dry-run"],
    "gaps": []
  },
  {
    "id": "existing-repo",
    "name": "Repositório existente simples",
    "audience": "iniciante",
    "provenance": "real",
    "realAnchors": ["consumer-existing-entry", "existing-repo"],
    "entryCommand": "npx ai-guidelines",
    "context": "Repo Node existente (package.json) ainda sem ai-guidelines.",
    "steps": [
      {
        "id": "guide",
        "prompt": "A CLI detecta um repo existente e sugere adoção conservadora.",
        "options": ["Adotar ai-guidelines neste repositório"],
        "outputs": [{ "source": "transcript:consumer-existing-entry" }],
        "why": "Com package.json presente, adopt é mais seguro que init; o conteúdo existente é preservado."
      },
      {
        "id": "dry-run",
        "prompt": "Ver o plano de adoção sem sobrescrever arquivos.",
        "options": ["npx ai-guidelines adopt --dry-run"],
        "outputs": [{ "source": "transcript:existing-repo" }],
        "why": "Adopt conservador adiciona blocos gerenciados e aborta ao achar conflito sem --force."
      }
    ],
    "effects": [
      { "label": "Adotar preservando conteúdo existente", "status": "available", "detail": "merge conservador em dry-run" }
    ],
    "blocks": [],
    "shortcuts": ["npx ai-guidelines adopt --dry-run"],
    "gaps": []
  },
  {
    "id": "formatter-conflict",
    "name": "Repositório com conflito (formatter rival)",
    "audience": "iniciante",
    "provenance": "real",
    "realAnchors": ["consumer-formatter-conflict-entry"],
    "entryCommand": "npx ai-guidelines",
    "context": "Repo existente com formatter rival (ex.: Biome) já configurado.",
    "steps": [
      {
        "id": "guide",
        "prompt": "A CLI explica o conflito em linguagem humana, sem sobrescrever nada.",
        "options": ["Adotar ai-guidelines neste repositório"],
        "outputs": [{ "source": "transcript:consumer-formatter-conflict-entry" }],
        "why": "Formatter rival vira decisão explícita: sem --force-prettier, o Prettier não é imposto por cima do Biome."
      }
    ],
    "effects": [
      { "label": "Adotar baseline preservando arquivos", "status": "available", "detail": "merge conservador" },
      { "label": "Sobrescrever o formatter rival com Prettier", "status": "blocked", "detail": "exige --force-prettier como decisão explícita" }
    ],
    "blocks": ["Formatter rival detectado: sobrescrever exige --force-prettier; sem decisão, nada é aplicado."],
    "shortcuts": ["npx ai-guidelines adopt --dry-run"],
    "gaps": []
  },
  {
    "id": "governed-solo",
    "name": "Repositório já governado (solo)",
    "audience": "iniciante",
    "provenance": "real",
    "realAnchors": ["consumer-governed-solo-entry", "governed-repo"],
    "entryCommand": "npx ai-guidelines",
    "context": "Repo que já usa ai-guidelines, perfil solo.",
    "steps": [
      {
        "id": "guide",
        "prompt": "A CLI reconhece o repo governado e orienta o uso diário.",
        "options": ["Atualizar runtime, templates, providers, práticas ou política"],
        "outputs": [{ "source": "transcript:consumer-governed-solo-entry" }],
        "why": "Com config presente, init/adopt deixam de ser principais; update e trabalho diário assumem."
      },
      {
        "id": "dry-run",
        "prompt": "Ver o que o update reaplicaria, sem escrever.",
        "options": ["npx ai-guidelines update --dry-run"],
        "outputs": [{ "source": "transcript:governed-repo" }],
        "why": "Update reaplica runtime/templates via managed blocks; conteúdo fora do bloco fica intocado."
      }
    ],
    "effects": [
      { "label": "Reaplicar runtime, templates e config", "status": "available", "detail": "managed blocks em dry-run" }
    ],
    "blocks": [],
    "shortcuts": ["npx ai-guidelines update --dry-run"],
    "gaps": []
  },
  {
    "id": "governed-team",
    "name": "Repositório governado em time",
    "audience": "avancado",
    "provenance": "simulado",
    "realAnchors": ["consumer-governed-team-entry"],
    "entryCommand": "npx ai-guidelines",
    "context": "Repo governado com política de colaboração de time detectada.",
    "steps": [
      {
        "id": "guide",
        "prompt": "A CLI detecta o perfil de colaboração e o torna visível.",
        "options": ["Atualizar runtime, templates, providers ou práticas"],
        "outputs": [{ "source": "transcript:consumer-governed-team-entry" }],
        "why": "O perfil team aparece no resumo (parte real). A leitura do perfil vem de review-policy.yml."
      },
      {
        "id": "authority",
        "prompt": "Modelo alvo: diferenciar update comum de mudança de política.",
        "outputs": [{ "source": "simulado", "lines": [
          "$ npx ai-guidelines update --dry-run",
          "[modelo alvo] update comum: runtime/templates/providers — sem mudar autoridade",
          "[modelo alvo] mudança de política: exigiria autorização de maintainer/owner",
          "[modelo alvo] ação sensível seria bloqueada com aviso de autoridade"
        ] }],
        "why": "Em time, mudar política não pode ser igual a um update comum. Hoje a CLI mostra o perfil, mas ainda não diferencia autoridade."
      }
    ],
    "effects": [
      { "label": "Atualizar baseline (update comum)", "status": "available" },
      { "label": "Mudar política de colaboração", "status": "blocked", "detail": "modelo alvo: exigiria autorização de maintainer/owner" }
    ],
    "blocks": ["Modelo alvo: mudança de política exige autoridade explícita de maintainer/owner."],
    "shortcuts": ["npx ai-guidelines update --dry-run"],
    "gaps": ["A distinção update×mudança-de-política e o alerta de autoridade ainda não existem na CLI."]
  },
  {
    "id": "five-specs",
    "name": "Cinco specs abertas ao mesmo tempo",
    "audience": "avancado",
    "provenance": "simulado",
    "realAnchors": ["consumer-multiple-specs-entry"],
    "entryCommand": "npx ai-guidelines",
    "context": "Repo governado com várias specs ativas no índice — o foco precisa ser escolhido.",
    "steps": [
      {
        "id": "guide",
        "prompt": "A CLI não escolhe foco sozinha: pede escolha explícita.",
        "options": ["Escolher a spec foco antes de continuar"],
        "outputs": [{ "source": "transcript:consumer-multiple-specs-entry" }],
        "why": "Sem foco claro, decisões ficam bloqueadas. A CLI lista specs ativas e exige escolha (parte real)."
      },
      {
        "id": "panel",
        "prompt": "Modelo alvo: painel unificado por spec.",
        "options": ["Escolher entre as 5 specs"],
        "outputs": [{ "source": "simulado", "lines": [
          "[modelo alvo] 5 specs ativas — escolha o foco:",
          "1) 0024 · feat/spec-0024 · PR #43 · Draft · próxima: validar",
          "2) 0025 · feat/spec-0025 · PR #51 · Ready · próxima: aguardando gate",
          "3) 0026 · feat/spec-0026 · sem PR · próxima: abrir Draft",
          "4) 0027 · feat/spec-0027 · PR #60 · CI falhou · próxima: corrigir",
          "5) 0028 · feat/spec-0028 · PR #61 · review aberto · próxima: revisar",
          "[bloqueado] nenhuma decisão antes de escolher o foco"
        ] }],
        "why": "Hoje a CLI lista id/branch/disponibilidade; o painel unificado com PR/estado/próxima ação por spec é modelo alvo."
      }
    ],
    "effects": [
      { "label": "Escolher a spec foco", "status": "available" },
      { "label": "Decidir/avançar sem foco escolhido", "status": "blocked", "detail": "sem escolha explícita, nada avança" }
    ],
    "blocks": ["Decisões ficam bloqueadas até a pessoa escolher explicitamente a spec foco."],
    "shortcuts": ["npx ai-guidelines specs", "npx ai-guidelines handoff <id-da-spec>"],
    "gaps": ["O painel unificado por spec (branch/PR/estado/próxima ação numa tela) é modelo alvo; a contagem 5 é ilustrativa."]
  },
  {
    "id": "resume-handoff",
    "name": "Retomada após interrupção",
    "audience": "iniciante",
    "provenance": "simulado",
    "realAnchors": [],
    "entryCommand": "npx ai-guidelines",
    "context": "A pessoa volta dias depois e precisa reentender o estado.",
    "steps": [
      {
        "id": "handoff",
        "prompt": "A CLI resume o contexto em linguagem humana.",
        "options": ["npx ai-guidelines handoff <id-da-spec>"],
        "outputs": [{ "source": "simulado", "lines": [
          "$ npx ai-guidelines handoff",
          "[modelo alvo] Pronto: baseline aplicado, CI verde",
          "[modelo alvo] Pendente: validar diff atual",
          "[modelo alvo] Bloqueado: Ready depende de review aberto",
          "[modelo alvo] Proibido agora: Human Gate, merge"
        ] }],
        "why": "handoff existe na CLI (read-only, fatos + próxima ação + selo), mas ainda não há captura controlada projetada para o site."
      }
    ],
    "effects": [
      { "label": "Ler handoff situado (read-only)", "status": "available" },
      { "label": "Avançar sem reentender o estado", "status": "blocked" }
    ],
    "blocks": ["Sem reentender o estado, decisões sensíveis permanecem bloqueadas."],
    "shortcuts": ["npx ai-guidelines handoff <id-da-spec>"],
    "gaps": ["handoff existe na CLI, mas falta captura controlada no pipeline do site; persistência em arquivo não existe."]
  },
  {
    "id": "review-finding",
    "name": "Finding em review",
    "audience": "avancado",
    "provenance": "gap",
    "realAnchors": [],
    "entryCommand": "npx ai-guidelines",
    "context": "Há um finding aberto em um review e o ciclo precisa fechar antes de avançar.",
    "steps": [
      {
        "id": "finding",
        "prompt": "Modelo alvo: orientar resolução do finding antes de avançar.",
        "outputs": [{ "source": "gap", "lines": [
          "[em evolução] Finding aberto: <descrição>",
          "[em evolução] Disposition do revisor: pendente",
          "[em evolução] Resolution do implementador: pendente",
          "[bloqueado] não avança antes de fechar o ciclo finding→disposition→resolution"
        ] }],
        "why": "review/triage/decide existem na CLI, mas o fluxo público guiado de finding→disposition→resolution ainda não existe como experiência única."
      }
    ],
    "effects": [
      { "label": "Registrar resolution/disposition", "status": "available", "detail": "modelo alvo" },
      { "label": "Avançar com finding aberto", "status": "blocked" }
    ],
    "blocks": ["Não é possível avançar com finding aberto: o ciclo precisa fechar primeiro."],
    "shortcuts": ["npx ai-guidelines review types", "npx ai-guidelines triage <pr>"],
    "gaps": ["O fluxo público guiado finding→disposition→resolution ainda não existe na CLI."]
  },
  {
    "id": "readiness",
    "name": "Readiness",
    "audience": "avancado",
    "provenance": "simulado",
    "realAnchors": [],
    "entryCommand": "npx ai-guidelines",
    "context": "Os critérios da fatia estão satisfeitos e a pessoa pode declarar readiness.",
    "steps": [
      {
        "id": "preview",
        "prompt": "A CLI oferece declarar readiness — como preview, sem avançar.",
        "options": ["npx ai-guidelines decide --type mark-readiness --brief-only"],
        "outputs": [{ "source": "simulado", "lines": [
          "$ npx ai-guidelines decide --type mark-readiness --brief-only",
          "[modelo alvo] Critérios satisfeitos: CI verde, findings fechados",
          "[modelo alvo] Prévia da alteração permitida",
          "[importante] declarar readiness NÃO avança automaticamente"
        ] }],
        "why": "decide --type mark-readiness --brief-only existe na CLI como preview reservado ao humano; ainda não há captura projetada para o site."
      }
    ],
    "effects": [
      { "label": "Ver o briefing/preview de readiness", "status": "available" },
      { "label": "Avançar automaticamente ao declarar readiness", "status": "forbidden", "detail": "readiness não avança sozinho" }
    ],
    "blocks": ["Declarar readiness não avança o fluxo: é uma decisão humana, mostrada só como preview."],
    "shortcuts": ["npx ai-guidelines decide --brief-only"],
    "gaps": ["decide mark-readiness existe como preview; falta captura controlada no pipeline do site."]
  },
  {
    "id": "pr-ready-human-gate",
    "name": "PR Ready / Human Gate",
    "audience": "avancado",
    "provenance": "simulado",
    "realAnchors": [],
    "entryCommand": "npx ai-guidelines",
    "context": "Preparar PR Ready e Human Gate — sem executar nenhuma decisão.",
    "steps": [
      {
        "id": "brief",
        "prompt": "A CLI prepara o briefing do gate, sem executar.",
        "options": ["npx ai-guidelines decide --type human-gate --brief-only"],
        "outputs": [{ "source": "simulado", "lines": [
          "$ npx ai-guidelines decide --type human-gate --brief-only",
          "[modelo alvo] Decisão humana obrigatória — apenas briefing",
          "[bloqueio] PR ainda em Draft",
          "[bloqueio] CI pendente",
          "[bloqueio] review stale",
          "[bloqueio] working tree suja"
        ] }],
        "why": "decide --type human-gate --brief-only e pr-ready:check existem na CLI; o site mostra só o briefing. A decisão é sempre humana."
      }
    ],
    "effects": [
      { "label": "Ver briefing do gate (brief-only)", "status": "available" },
      { "label": "Executar o Human Gate pelo site", "status": "forbidden", "detail": "decisão humana obrigatória; o site nunca executa o gate" }
    ],
    "blocks": ["PR Draft, CI pendente, review stale ou tree suja bloqueiam Ready/Human Gate."],
    "shortcuts": ["npx ai-guidelines decide --brief-only"],
    "gaps": ["decide human-gate/pr-ready existem; falta captura controlada projetada para o site."]
  },
  {
    "id": "peer-review",
    "name": "Review de PR de colega",
    "audience": "avancado",
    "provenance": "simulado",
    "realAnchors": [],
    "entryCommand": "npx ai-guidelines",
    "context": "A pessoa está na própria branch e precisa revisar o PR de outra pessoa.",
    "steps": [
      {
        "id": "brief",
        "prompt": "A CLI orienta worktree/checkout seguro, preservando o trabalho atual.",
        "options": ["npx ai-guidelines peer-review <pr> --brief-only"],
        "outputs": [{ "source": "simulado", "lines": [
          "$ npx ai-guidelines peer-review <pr> --brief-only",
          "[modelo alvo] Briefing do PR: título, branch, base, working tree",
          "[modelo alvo] Worktree separado preserva a sua branch atual",
          "[modelo alvo] Ao terminar, retorno ao contexto original",
          "[brief-only] nada é alterado"
        ] }],
        "why": "peer-review existe na CLI (modos worktree/checkout). A captura real do fluxo completo depende de gh; aqui é modelo alvo."
      }
    ],
    "effects": [
      { "label": "Criar worktree isolado para revisar", "status": "available", "detail": "preserva a branch atual" },
      { "label": "Trocar de branch com tree suja", "status": "blocked", "detail": "checkout guiado bloqueia para não misturar contexto" }
    ],
    "blocks": ["Checkout guiado bloqueia com working tree suja; o trabalho atual é preservado."],
    "shortcuts": ["npx ai-guidelines peer-review <pr> --brief-only"],
    "gaps": ["A captura real do fluxo de peer-review depende de gh; hoje é modelo alvo."]
  },
  {
    "id": "offline-degraded",
    "name": "Offline / degradado",
    "audience": "avancado",
    "provenance": "simulado",
    "realAnchors": [],
    "entryCommand": "npx ai-guidelines",
    "context": "GitHub/CI indisponível: a CLI sabe menos sobre o estado remoto.",
    "steps": [
      {
        "id": "degraded",
        "prompt": "A CLI explica o que sabe e o que não sabe, e bloqueia decisões inseguras.",
        "options": ["npx ai-guidelines work --no-remote"],
        "outputs": [{ "source": "simulado", "lines": [
          "$ npx ai-guidelines work --no-remote",
          "[modelo alvo] Fontes remotas indisponíveis (GitHub/CI)",
          "[modelo alvo] Conhecido: estado local, branch, working tree",
          "[modelo alvo] Desconhecido: CI, reviews, estado do PR",
          "[bloqueio] decisões que dependem do remoto ficam indisponíveis",
          "[permitido] apenas ações locais seguras"
        ] }],
        "why": "--no-remote e a detecção de fontes degradadas existem na CLI; o rendering de bloqueios/advisory aqui é modelo alvo, não captura."
      }
    ],
    "effects": [
      { "label": "Ações locais seguras (ler estado, validar diff)", "status": "available" },
      { "label": "Decidir com base em CI/PR remoto", "status": "forbidden", "detail": "remoto indisponível: decisão insegura é bloqueada" }
    ],
    "blocks": ["Sem GitHub/CI, decisões que dependem do remoto não são liberadas."],
    "shortcuts": ["npx ai-guidelines work --no-remote"],
    "gaps": ["--no-remote/degradado existem; falta captura controlada projetada para o site."]
  }
] as const;

export const scenarioCatalog: readonly CatalogScenario[] =
  SCENARIO_CATALOG as readonly CatalogScenario[];

/** Ids obrigatórios — os 12 cenários do escopo. */
export const MANDATORY_SCENARIO_IDS: readonly string[] = [
  "empty-project",
  "existing-repo",
  "formatter-conflict",
  "governed-solo",
  "governed-team",
  "five-specs",
  "resume-handoff",
  "review-finding",
  "readiness",
  "pr-ready-human-gate",
  "peer-review",
  "offline-degraded",
];

export function catalogScenarioById(id: string): CatalogScenario | undefined {
  return scenarioCatalog.find((scenario) => scenario.id === id);
}
